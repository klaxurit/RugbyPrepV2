import { useCallback, useEffect, useState } from 'react'
import type { BlockLog, ExerciseLogEntry } from '../types/training'
import type { ExerciseMetricType } from '../types/training'

const STORAGE_KEY = 'rugbyprep.blocklogs.v1'

const sortNewestFirst = (logs: BlockLog[]) =>
  [...logs].sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime())

const isBlockLog = (value: unknown): value is BlockLog => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<BlockLog>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.dateISO === 'string' &&
    typeof candidate.blockId === 'string' &&
    typeof candidate.blockName === 'string' &&
    (candidate.week === 'W1' ||
      candidate.week === 'W2' ||
      candidate.week === 'W3' ||
      candidate.week === 'W4' ||
      candidate.week === 'W5' ||
      candidate.week === 'W6' ||
      candidate.week === 'W7' ||
      candidate.week === 'W8' ||
      candidate.week === 'DELOAD') &&
    (candidate.sessionType === 'UPPER' ||
      candidate.sessionType === 'LOWER' ||
      candidate.sessionType === 'FULL') &&
    Array.isArray(candidate.entries)
  )
}

const readLogs = (): BlockLog[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return sortNewestFirst(parsed.filter(isBlockLog))
  } catch {
    return []
  }
}

export const useBlockLogs = () => {
  const [logs, setLogs] = useState<BlockLog[]>(readLogs)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
  }, [logs])

  const addBlockLog = useCallback((log: Omit<BlockLog, 'id'>) => {
    const next: BlockLog = {
      ...log,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    }
    setLogs((current) => sortNewestFirst([next, ...current]))
  }, [])

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

  return {
    logs,
    addBlockLog,
    getLastLogForBlock,
    getLastEntryForExercise,
    getBestForExercise,
    getBestForExerciseByMetric
  }
}
