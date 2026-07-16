import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BlockLog, ExerciseLogEntry } from '../types/training'
import type { ExerciseMetricType } from '../types/training'
import { buildAllTimePRsFromBlockLogs } from '../services/pr/buildAllTimePRs'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { readUserScoped, writeUserScoped } from '../services/storage/userScopedStorage'

const STORAGE_BASE = 'rugbyprep.blocklogs'

const sortNewestFirst = (logs: BlockLog[]) =>
  [...logs].sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime())

const readFromStorage = (userId: string | null): BlockLog[] => {
  if (typeof window === 'undefined') return []
  const parsed = readUserScoped<BlockLog[]>(STORAGE_BASE, userId)
  return Array.isArray(parsed) ? parsed : []
}

const saveToStorage = (logs: BlockLog[], userId: string | null) => {
  writeUserScoped(STORAGE_BASE, userId, logs)
}

// ─── Row ↔ BlockLog mapping ────────────────────────────────────

type BlockLogRow = {
  id: string
  date_iso: string
  week: string
  session_type: string
  block_id: string
  block_name: string
  entries: ExerciseLogEntry[]
  mother_session_id?: string | null
  program_source?: string | null
}

const rowToLog = (row: BlockLogRow): BlockLog => ({
  id: row.id,
  dateISO: row.date_iso,
  week: row.week as BlockLog['week'],
  sessionType: row.session_type as BlockLog['sessionType'],
  blockId: row.block_id,
  blockName: row.block_name,
  entries: row.entries,
  motherSessionId: row.mother_session_id ?? undefined,
  programSource: (row.program_source as BlockLog['programSource']) ?? undefined,
})

const logToRow = (log: BlockLog, userId: string) => ({
  // id omitted — let Supabase generate the UUID
  user_id: userId,
  date_iso: log.dateISO,
  week: log.week,
  session_type: log.sessionType,
  block_id: log.blockId,
  block_name: log.blockName,
  entries: log.entries,
  mother_session_id: log.motherSessionId ?? null,
  program_source: log.programSource ?? 'legacy',
})

// ─── Hook ────────────────────────────────────────────────────

export const useBlockLogs = () => {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [logs, setLogs] = useState<BlockLog[]>(() => readFromStorage(userId))

  // Sync from Supabase on auth. Re-seed from active user's cache on userId change.
  useEffect(() => {
    setLogs(readFromStorage(userId))
    if (!userId) return
    supabase
      .from('block_logs')
      .select('id, date_iso, week, session_type, block_id, block_name, entries, mother_session_id, program_source')
      .eq('user_id', userId)
      .order('date_iso', { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) return
        const loaded = sortNewestFirst((data as BlockLogRow[]).map(rowToLog))
        setLogs(loaded)
        saveToStorage(loaded, userId)
      })
  }, [userId])

  const addBlockLog = useCallback(
    async (log: Omit<BlockLog, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      // Guard: only DB-valid session types — anything else remaps to FULL
      const DB_VALID_SESSION_TYPES = new Set(['UPPER', 'LOWER', 'FULL', 'CONDITIONING'])
      const safeSessionType = DB_VALID_SESSION_TYPES.has(log.sessionType)
        ? log.sessionType
        : 'FULL' as BlockLog['sessionType']
      const next: BlockLog = { ...log, sessionType: safeSessionType, id }
      if (userId) {
        const { data, error } = await supabase
          .from('block_logs')
          .insert(logToRow(next, userId))
          .select('id, date_iso, week, session_type, block_id, block_name, entries, mother_session_id, program_source')
          .single()
        if (!error && data) {
          const saved = rowToLog(data as BlockLogRow)
          setLogs((current) => {
            const updated = sortNewestFirst([saved, ...current])
            saveToStorage(updated, userId)
            return updated
          })
          return
        }
      }

      // Offline fallback
      setLogs((current) => {
        const updated = sortNewestFirst([next, ...current])
        saveToStorage(updated, userId)
        return updated
      })
    },
    [userId]
  )

  const getLastLogForBlock = useCallback(
    (blockId: string): BlockLog | undefined => logs.find((log) => log.blockId === blockId),
    [logs]
  )

  const getBestForExercise = useCallback(
    (exerciseId: string) => {
      let bestLoadRepsScore: number | undefined
      let bestLoadKg: number | undefined
      let bestReps: number | undefined
      let bestMeters: number | undefined
      let bestSeconds: number | undefined
      let bestLabel: string | undefined

      for (const log of logs) {
        for (const entry of log.entries) {
          if (entry.exerciseId !== exerciseId) continue

          if (entry.loadKg !== undefined) {
            bestLoadKg = bestLoadKg === undefined ? entry.loadKg : Math.max(bestLoadKg, entry.loadKg)
          }
          if (entry.reps !== undefined) {
            bestReps = bestReps === undefined ? entry.reps : Math.max(bestReps, entry.reps)
          }
          if (entry.meters !== undefined) {
            bestMeters = bestMeters === undefined ? entry.meters : Math.max(bestMeters, entry.meters)
          }
          if (entry.seconds !== undefined && entry.seconds > 0) {
            bestSeconds = bestSeconds === undefined ? entry.seconds : Math.min(bestSeconds, entry.seconds)
          }

          // Charge max uniquement (pas load×reps) — aligné sur detectPRs / board Records.
          if (entry.loadKg !== undefined && entry.loadKg > 0) {
            const isBetterLoad =
              bestLoadRepsScore === undefined || entry.loadKg > bestLoadRepsScore
            if (isBetterLoad) {
              bestLoadRepsScore = entry.loadKg
              bestLabel =
                entry.reps !== undefined
                  ? `${entry.loadKg}kg × ${entry.reps}`
                  : `${entry.loadKg}kg`
            }
          } else if (entry.meters !== undefined) {
            if (!bestLabel || (bestMeters !== undefined && entry.meters >= bestMeters)) {
              bestLabel = `${entry.meters} m`
            }
          } else if (entry.reps !== undefined) {
            if (!bestLabel || (bestReps !== undefined && entry.reps >= bestReps)) {
              bestLabel = `${entry.reps} reps`
            }
          } else if (entry.seconds !== undefined && bestSeconds !== undefined && entry.seconds <= bestSeconds) {
            bestLabel = `${entry.seconds}s`
          }
        }
      }

      return {
        bestLoadKg,
        bestReps,
        bestMeters,
        bestSeconds,
        bestLabel,
        bestLoadRepsScore
      }
    },
    [logs]
  )

  const getBestForExerciseByMetric = useCallback(
    (exerciseId: string, metricType: ExerciseMetricType) => {
      let bestLabel: string | undefined
      let bestScore: number | undefined

      for (const log of logs) {
        for (const entry of log.entries) {
          if (entry.exerciseId !== exerciseId) continue

          if (metricType === 'load_reps') {
            if (entry.loadKg === undefined || entry.loadKg <= 0) continue
            if (bestScore === undefined || entry.loadKg > bestScore) {
              bestScore = entry.loadKg
              bestLabel =
                entry.reps !== undefined
                  ? `${entry.loadKg}kg × ${entry.reps}`
                  : `${entry.loadKg}kg`
            }
            continue
          }

          if (metricType === 'reps') {
            if (entry.reps === undefined) continue
            if (bestScore === undefined || entry.reps > bestScore) {
              bestScore = entry.reps
              bestLabel = `${entry.reps} reps`
            }
            continue
          }

          if (metricType === 'meters') {
            if (entry.meters === undefined) continue
            if (bestScore === undefined || entry.meters > bestScore) {
              bestScore = entry.meters
              bestLabel = `${entry.meters} m`
            }
            continue
          }

          if (metricType === 'seconds') {
            if (entry.seconds === undefined) continue
            if (bestScore === undefined || entry.seconds < bestScore) {
              bestScore = entry.seconds
              bestLabel = `${entry.seconds}s`
            }
          }
        }
      }

      return bestLabel
    },
    [logs]
  )

  const getLastEntryForExercise = useCallback(
    (exerciseId: string): ExerciseLogEntry | undefined => {
      for (const log of logs) {
        const entry = log.entries.find((candidate) => candidate.exerciseId === exerciseId)
        if (entry) return entry
      }
      return undefined
    },
    [logs]
  )

  /** All-time best per exercise with the date the PR was set, sorted most recent first. */
  // eslint-disable-next-line react-hooks/purity -- Date.now() for "recent PR" badge, stable enough
  const nowRef = useRef(Date.now())
  const allPRsWithDates = useMemo(() => buildAllTimePRsFromBlockLogs(logs, nowRef.current), [logs])

  return {
    logs,
    addBlockLog,
    getLastLogForBlock,
    getLastEntryForExercise,
    getBestForExercise,
    getBestForExerciseByMetric,
    allPRsWithDates,
  }
}
