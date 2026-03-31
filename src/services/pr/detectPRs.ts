import type { ExerciseMetricType } from '../../types/training'

export interface PRDetectionInput {
  exerciseId: string
  metricType: ExerciseMetricType
  draft: {
    loadKg?: number
    reps?: number
    seconds?: number
    meters?: number
  }
  previousBest: {
    bestLoadRepsScore?: number
    bestReps?: number
    bestMeters?: number
    bestSeconds?: number
  }
}

export interface DetectedPR {
  exerciseId: string
  metricType: ExerciseMetricType
  newValue: number
  previousValue: number | undefined
  improvement: string
  label: string
}

function formatLoadReps(loadKg: number, reps: number): string {
  return `${loadKg}kg x ${reps}`
}

/**
 * Detects personal records by comparing draft entries against historical bests.
 * Only returns PRs where the new value strictly exceeds the previous best.
 * First-ever entries (no previousBest) are treated as PRs.
 */
export function detectPRs(inputs: PRDetectionInput[]): DetectedPR[] {
  const results: DetectedPR[] = []

  for (const { exerciseId, metricType, draft, previousBest } of inputs) {
    if (metricType === 'load_reps') {
      const loadKg = draft.loadKg
      const reps = draft.reps
      if (loadKg == null || reps == null || loadKg <= 0) continue
      const score = loadKg * reps
      const prev = previousBest.bestLoadRepsScore

      if (prev == null || score > prev) {
        const prevLoad = prev != null ? Math.round(prev) : undefined
        const delta = prev != null ? Math.round(score - prev) : undefined
        results.push({
          exerciseId,
          metricType,
          newValue: score,
          previousValue: prevLoad,
          improvement: delta != null ? `+${delta} score` : 'Premier record',
          label: formatLoadReps(loadKg, reps),
        })
      }
      continue
    }

    if (metricType === 'reps') {
      const reps = draft.reps
      if (reps == null || reps <= 0) continue
      const prev = previousBest.bestReps

      if (prev == null || reps > prev) {
        const delta = prev != null ? reps - prev : undefined
        results.push({
          exerciseId,
          metricType,
          newValue: reps,
          previousValue: prev,
          improvement: delta != null ? `+${delta} reps` : 'Premier record',
          label: `${reps} reps`,
        })
      }
      continue
    }

    if (metricType === 'meters') {
      const meters = draft.meters
      if (meters == null || meters <= 0) continue
      const prev = previousBest.bestMeters

      if (prev == null || meters > prev) {
        const delta = prev != null ? Math.round(meters - prev) : undefined
        results.push({
          exerciseId,
          metricType,
          newValue: meters,
          previousValue: prev,
          improvement: delta != null ? `+${delta}m` : 'Premier record',
          label: `${meters}m`,
        })
      }
      continue
    }

    if (metricType === 'seconds') {
      const seconds = draft.seconds
      if (seconds == null || seconds <= 0) continue
      const prev = previousBest.bestSeconds

      // Lower is better for time-based exercises
      if (prev == null || seconds < prev) {
        const delta = prev != null ? Math.round((prev - seconds) * 10) / 10 : undefined
        results.push({
          exerciseId,
          metricType,
          newValue: seconds,
          previousValue: prev,
          improvement: delta != null ? `-${delta}s` : 'Premier record',
          label: `${seconds}s`,
        })
      }
    }
  }

  return results
}
