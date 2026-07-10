import type { ExerciseMetricType } from '../../types/training'
import { formatLoadRepsLabel } from './prFormat'
import { isPRTrackableExercise } from './prEligibility'

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
    bestLoadKg?: number
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

/**
 * Détecte les records personnels (charge max sur polyarticulaires load_reps).
 * Compare le draft à la meilleure charge historique — critère unique type Strong/Hevy.
 */
export function detectPRs(inputs: PRDetectionInput[]): DetectedPR[] {
  const results: DetectedPR[] = []

  for (const { exerciseId, metricType, draft, previousBest } of inputs) {
    if (!isPRTrackableExercise(exerciseId)) continue
    if (metricType !== 'load_reps') continue

    const loadKg = draft.loadKg
    if (loadKg == null || loadKg <= 0) continue

    const prevLoad = previousBest.bestLoadKg
    const isFirstRecord = prevLoad == null
    const loadPR = isFirstRecord || loadKg > prevLoad

    if (!loadPR) continue

    const delta = prevLoad != null ? Math.round((loadKg - prevLoad) * 10) / 10 : undefined
    const reps = draft.reps

    results.push({
      exerciseId,
      metricType,
      newValue: loadKg,
      previousValue: prevLoad,
      improvement: delta != null ? `+${delta} kg` : 'Premier record',
      label:
        reps != null && reps > 0 ? formatLoadRepsLabel(loadKg, reps) : formatLoadRepsLabel(loadKg),
    })
  }

  return results
}
