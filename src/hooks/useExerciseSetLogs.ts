import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ExerciseSetLog } from '../types/training'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { readUserScoped, writeUserScoped } from '../services/storage/userScopedStorage'

const STORAGE_BASE = 'rugbyprep.setlogs'

type Row = {
  id: string
  slot_signature: string
  mother_session_id: string | null
  week_label: string
  session_index: number
  block_number: number
  exercise_id: string
  tour_index: number
  session_log_id: string | null
  load_kg: number | null
  reps: number | null
  seconds: number | null
  meters: number | null
  rir: number | null
  completed: boolean | null
  created_at?: string
  updated_at?: string
}

const rowToLog = (row: Row): ExerciseSetLog => ({
  id: row.id,
  slotSignature: row.slot_signature,
  motherSessionId: row.mother_session_id ?? undefined,
  weekLabel: row.week_label,
  sessionIndex: row.session_index,
  blockNumber: row.block_number,
  exerciseId: row.exercise_id,
  tourIndex: row.tour_index,
  sessionLogId: row.session_log_id ?? undefined,
  loadKg: row.load_kg ?? undefined,
  reps: row.reps ?? undefined,
  seconds: row.seconds ?? undefined,
  meters: row.meters ?? undefined,
  rir: row.rir ?? undefined,
  completed: row.completed ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const logToRow = (log: Omit<ExerciseSetLog, 'id' | 'createdAt' | 'updatedAt'>, userId: string) => ({
  user_id: userId,
  slot_signature: log.slotSignature,
  mother_session_id: log.motherSessionId ?? null,
  week_label: log.weekLabel,
  session_index: log.sessionIndex,
  block_number: log.blockNumber,
  exercise_id: log.exerciseId,
  tour_index: log.tourIndex,
  session_log_id: log.sessionLogId ?? null,
  load_kg: log.loadKg ?? null,
  reps: log.reps ?? null,
  seconds: log.seconds ?? null,
  meters: log.meters ?? null,
  rir: log.rir ?? null,
  completed: log.completed ?? true,
  updated_at: new Date().toISOString(),
})

const readFromStorage = (userId: string | null): ExerciseSetLog[] => {
  if (typeof window === 'undefined') return []
  const parsed = readUserScoped<ExerciseSetLog[]>(STORAGE_BASE, userId)
  return Array.isArray(parsed) ? parsed : []
}

const saveToStorage = (logs: ExerciseSetLog[], userId: string | null) => {
  writeUserScoped(STORAGE_BASE, userId, logs)
}

const dedupeKey = (l: Pick<ExerciseSetLog, 'slotSignature' | 'blockNumber' | 'exerciseId' | 'tourIndex'>) =>
  `${l.slotSignature}__${l.blockNumber}__${l.exerciseId}__${l.tourIndex}`

const upsertLocal = (current: ExerciseSetLog[], next: ExerciseSetLog): ExerciseSetLog[] => {
  const k = dedupeKey(next)
  const idx = current.findIndex((l) => dedupeKey(l) === k)
  if (idx === -1) return [...current, next]
  const copy = [...current]
  copy[idx] = next
  return copy
}

export const useExerciseSetLogs = () => {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [logs, setLogs] = useState<ExerciseSetLog[]>(() => readFromStorage(userId))

  // Refresh from Supabase on auth.
  useEffect(() => {
    setLogs(readFromStorage(userId))
    if (!userId) return
    supabase
      .from('exercise_set_logs')
      .select('id, slot_signature, mother_session_id, week_label, session_index, block_number, exercise_id, tour_index, session_log_id, load_kg, reps, seconds, meters, rir, completed, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) return
        const loaded = (data as Row[]).map(rowToLog)
        setLogs(loaded)
        saveToStorage(loaded, userId)
      })
  }, [userId])

  const upsertSet = useCallback(
    async (input: Omit<ExerciseSetLog, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Optimistic local update first
      setLogs((current) => {
        const optimistic: ExerciseSetLog = { ...input, id: `local-${Date.now()}` }
        const next = upsertLocal(current, optimistic)
        saveToStorage(next, userId)
        return next
      })

      if (!userId) return

      const { data, error } = await supabase
        .from('exercise_set_logs')
        .upsert(logToRow(input, userId), {
          onConflict: 'user_id,slot_signature,block_number,exercise_id,tour_index',
        })
        .select('id, slot_signature, mother_session_id, week_label, session_index, block_number, exercise_id, tour_index, session_log_id, load_kg, reps, seconds, meters, rir, completed, created_at, updated_at')
        .single()

      if (error || !data) {
        console.error('[useExerciseSetLogs] upsert failed:', error?.message)
        return
      }

      const saved = rowToLog(data as Row)
      setLogs((current) => {
        const next = upsertLocal(current, saved)
        saveToStorage(next, userId)
        return next
      })
    },
    [userId],
  )

  const linkToSessionLog = useCallback(
    async (slotSignature: string, sessionLogId: string) => {
      if (!userId) return
      await supabase
        .from('exercise_set_logs')
        .update({ session_log_id: sessionLogId })
        .eq('user_id', userId)
        .eq('slot_signature', slotSignature)

      setLogs((current) => {
        const next = current.map((l) =>
          l.slotSignature === slotSignature ? { ...l, sessionLogId } : l,
        )
        saveToStorage(next, userId)
        return next
      })
    },
    [userId],
  )

  /** Toutes les séries pour un slot donné, triées par bloc puis tour. */
  const getSetsForSlot = useCallback(
    (slotSignature: string): ExerciseSetLog[] =>
      logs
        .filter((l) => l.slotSignature === slotSignature)
        .sort((a, b) => a.blockNumber - b.blockNumber || a.tourIndex - b.tourIndex),
    [logs],
  )

  /** Dernière entrée loggée pour un exerciseId (toutes séances confondues). */
  const getLastSetForExercise = useCallback(
    (exerciseId: string): ExerciseSetLog | undefined => {
      const matches = logs.filter((l) => l.exerciseId === exerciseId && l.loadKg != null)
      if (matches.length === 0) return undefined
      // Le tableau est déjà trié par updated_at desc côté serveur.
      return matches[0]
    },
    [logs],
  )

  /**
   * PRs all-time par exerciceId calculés à partir des sets loggés (load × reps),
   * triés par date la plus récente. Source pour l'onglet Records côté ProgressPage.
   */
  // eslint-disable-next-line react-hooks/purity -- Date.now() utilisé uniquement pour le badge "récent", stable au rendu
  const nowRef = useRef(Date.now())
  const allPRsWithDates = useMemo(() => {
    type Best = { value: number; label: string; dateISO: string }
    const bests = new Map<string, Best>()
    // Tri chrono ascendant → la dernière mise à jour gagne pour la date du PR
    const chronological = [...logs].sort((a, b) => {
      const da = a.updatedAt ?? a.createdAt ?? ''
      const db = b.updatedAt ?? b.createdAt ?? ''
      return da.localeCompare(db)
    })
    for (const l of chronological) {
      if (l.loadKg == null || l.reps == null) continue
      const value = l.loadKg * l.reps
      const label = `${l.loadKg}kg x ${l.reps}`
      const ts = (l.updatedAt ?? l.createdAt ?? '').slice(0, 10)
      const existing = bests.get(l.exerciseId)
      if (!existing || value > existing.value) {
        bests.set(l.exerciseId, { value, label, dateISO: ts })
      }
    }
    const fourteenDays = 14 * 86_400_000
    return Array.from(bests.entries())
      .map(([exerciseId, data]) => ({
        exerciseId,
        metricType: 'load_reps' as const,
        bestValue: data.value,
        bestLabel: data.label,
        dateISO: data.dateISO,
        isRecent: data.dateISO ? nowRef.current - new Date(data.dateISO).getTime() < fourteenDays : false,
      }))
      .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
  }, [logs])

  return { logs, upsertSet, linkToSessionLog, getSetsForSlot, getLastSetForExercise, allPRsWithDates }
}
