import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BlockLog, ExerciseLogEntry } from '../types/training'
import type { ExerciseMetricType } from '../types/training'
import { getExerciseMetricType } from '../services/ui/exerciseMetrics'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { DEMO_MODE_KEY } from '../data/fakeDataForProgress'

const STORAGE_KEY = 'rugbyprep.blocklogs.v1'

const sortNewestFirst = (logs: BlockLog[]) =>
  [...logs].sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime())

const readFromStorage = (): BlockLog[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as BlockLog[]) : []
  } catch {
    return []
  }
}

const saveToStorage = (logs: BlockLog[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
  } catch { /* ignore */ }
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

  const [logs, setLogs] = useState<BlockLog[]>(readFromStorage)

  // Sync from Supabase on auth (skip if demo mode — keep localStorage data)
  useEffect(() => {
    if (!userId) return
    if (typeof window !== 'undefined' && window.localStorage.getItem(DEMO_MODE_KEY) === '1') return
    supabase
      .from('block_logs')
      .select('id, date_iso, week, session_type, block_id, block_name, entries, mother_session_id, program_source')
      .eq('user_id', userId)
      .order('date_iso', { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) return
        const loaded = sortNewestFirst((data as BlockLogRow[]).map(rowToLog))
        setLogs(loaded)
        saveToStorage(loaded)
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
      const demoMode = typeof window !== 'undefined' && window.localStorage.getItem(DEMO_MODE_KEY) === '1'

      if (userId && !demoMode) {
        const { data, error } = await supabase
          .from('block_logs')
          .insert(logToRow(next, userId))
          .select('id, date_iso, week, session_type, block_id, block_name, entries, mother_session_id, program_source')
          .single()
        if (!error && data) {
          const saved = rowToLog(data as BlockLogRow)
          setLogs((current) => {
            const updated = sortNewestFirst([saved, ...current])
            saveToStorage(updated)
            return updated
          })
          return
        }
      }

      // Offline fallback
      setLogs((current) => {
        const updated = sortNewestFirst([next, ...current])
        saveToStorage(updated)
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

          if (entry.loadKg !== undefined && entry.reps !== undefined) {
            const score = entry.loadKg * entry.reps
            if (bestLoadRepsScore === undefined || score > bestLoadRepsScore) {
              bestLoadRepsScore = score
              bestLabel = `${entry.loadKg}kg × ${entry.reps}`
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
            if (entry.loadKg === undefined || entry.reps === undefined) continue
            const score = entry.loadKg * entry.reps
            if (bestScore === undefined || score > bestScore) {
              bestScore = score
              bestLabel = `${entry.loadKg}kg × ${entry.reps}`
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
  const allPRsWithDates = useMemo(() => {
    const bests = new Map<string, { value: number; label: string; dateISO: string; metricType: ExerciseMetricType }>()

    // Iterate oldest → newest so the last update wins as the PR date
    const chronological = [...logs].reverse()
    for (const log of chronological) {
      for (const entry of log.entries) {
        const { exerciseId } = entry
        const metricType = getExerciseMetricType({ exerciseId })
        let value: number | undefined
        let label: string | undefined

        // Detect best metric from actual data
        let actualMetric: ExerciseMetricType = metricType
        if (entry.loadKg != null && entry.reps != null) {
          value = entry.loadKg * entry.reps
          label = `${entry.loadKg}kg x ${entry.reps}`
          actualMetric = 'load_reps'
        } else if (entry.meters != null) {
          value = entry.meters
          label = `${entry.meters}m`
          actualMetric = 'meters'
        } else if (entry.seconds != null) {
          value = -entry.seconds
          label = `${entry.seconds}s`
          actualMetric = 'seconds'
        } else if (entry.reps != null) {
          value = entry.reps
          label = `${entry.reps} reps`
          actualMetric = 'reps'
        }

        if (value == null || label == null) continue

        const existing = bests.get(exerciseId)
        if (!existing || value > existing.value) {
          bests.set(exerciseId, { value, label, dateISO: log.dateISO.slice(0, 10), metricType: actualMetric })
        }
      }
    }

    const fourteenDays = 14 * 86_400_000

    return Array.from(bests.entries())
      .map(([exerciseId, data]) => ({
        exerciseId,
        metricType: data.metricType,
        bestValue: data.metricType === 'seconds' ? -data.value : data.value,
        bestLabel: data.label,
        dateISO: data.dateISO,
        isRecent: nowRef.current - new Date(data.dateISO).getTime() < fourteenDays,
      }))
      .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
  }, [logs])

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
