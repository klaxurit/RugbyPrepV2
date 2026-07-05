import type { ExerciseSetLog } from '../../types/training'

export type ExerciseHistoricalBests = {
  bestLoadRepsScore?: number
  bestLoadKg?: number
  bestReps?: number
  bestMeters?: number
  bestSeconds?: number
}

/**
 * Agrège les records historiques d'un exercice depuis les set logs persistés.
 * Exclut la séance courante (`currentSlotSignature`).
 */
export function buildExerciseBestsFromSetLogs(
  setLogs: readonly ExerciseSetLog[],
  exerciseId: string,
  currentSlotSignature: string,
): ExerciseHistoricalBests {
  const bests: ExerciseHistoricalBests = {}

  for (const set of setLogs) {
    if (set.exerciseId !== exerciseId) continue
    if (set.slotSignature === currentSlotSignature) continue

    if (set.loadKg != null && set.loadKg > 0) {
      bests.bestLoadKg =
        bests.bestLoadKg == null ? set.loadKg : Math.max(bests.bestLoadKg, set.loadKg)
    }
    if (set.reps != null && set.reps > 0) {
      bests.bestReps = bests.bestReps == null ? set.reps : Math.max(bests.bestReps, set.reps)
    }
    if (set.meters != null && set.meters > 0) {
      bests.bestMeters =
        bests.bestMeters == null ? set.meters : Math.max(bests.bestMeters, set.meters)
    }
    if (set.seconds != null && set.seconds > 0) {
      bests.bestSeconds =
        bests.bestSeconds == null ? set.seconds : Math.min(bests.bestSeconds, set.seconds)
    }
    if (set.loadKg != null && set.reps != null && set.loadKg > 0 && set.reps > 0) {
      const score = set.loadKg * set.reps
      bests.bestLoadRepsScore =
        bests.bestLoadRepsScore == null ? score : Math.max(bests.bestLoadRepsScore, score)
    }
  }

  return bests
}
