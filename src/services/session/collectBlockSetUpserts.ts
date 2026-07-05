import type { MotherSession } from '../../types/motherSession'
import { buildExerciseTourKey } from '../../contexts/SessionRunContext'
import type { ExerciseTourLoad } from '../../contexts/SessionRunContext'

export type ExerciseLoadPrefill = { kg?: string; reps?: string }

export type BlockCompletionSnapshot = {
  exerciseTourLoads: Record<string, ExerciseTourLoad>
  completedExercises: Set<string>
}
import { isDirectiveText, resolveExerciseIdForSessionRun } from '../motherSession/motherSessionExerciseMap'
import { parseBlockTourCount } from '../ui/blockPresentation'

export type BlockSetUpsertInput = {
  blockNumber: number
  exerciseId: string
  tourIndex: number
  loadKg?: number
  reps?: number
}

/**
 * Prépare les lignes `exercise_set_logs` à persister pour un bloc terminé.
 * Ne propage jamais silencieusement le tour 1 vers les tours suivants :
 * seules les valeurs explicitement saisies (ou injectées via « Reprendre tour 1 »)
 * sont enregistrées.
 */
export function collectBlockSetUpserts(params: {
  block: MotherSession['blocks'][number]
  blockNumber: number
  exerciseTourLoads: Record<string, ExerciseTourLoad>
  completedExercises: Set<string>
}): BlockSetUpsertInput[] {
  const { block, blockNumber, exerciseTourLoads, completedExercises } = params
  const tourCount = parseBlockTourCount(block)
  const upserts: BlockSetUpsertInput[] = []

  block.exercises.forEach((exercise, exerciseIndex) => {
    if (!exercise || isDirectiveText(exercise.name)) return
    const exerciseId = resolveExerciseIdForSessionRun(exercise.name, exercise.exerciseId)
    if (!exerciseId) return

    for (let tour = 0; tour < tourCount; tour++) {
      const key = buildExerciseTourKey(blockNumber, tour, exerciseIndex)
      if (!completedExercises.has(key)) continue

      const own = exerciseTourLoads[key]
      if (!own || (own.loadKg == null && own.reps == null)) continue

      upserts.push({
        blockNumber,
        exerciseId,
        tourIndex: tour,
        loadKg: own.loadKg,
        reps: own.reps,
      })
    }
  })

  return upserts
}
