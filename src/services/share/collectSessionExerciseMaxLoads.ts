import type { MotherSession } from '../../types/motherSession'
import type { ExerciseTourLoad } from '../../contexts/SessionRunContext'
import { buildExerciseTourKey } from '../../contexts/SessionRunContext'
import { isDirectiveText, resolveExerciseIdForSessionRun } from '../motherSession/motherSessionExerciseMap'
import { parseBlockTourCount } from '../ui/blockPresentation'
import type { SessionShareExerciseMax } from './sessionShareTypes'

/**
 * Max charge (kg) par exercice pour la séance en cours, depuis les saisies mémoire.
 */
export function collectSessionExerciseMaxLoads(params: {
  session: MotherSession
  exerciseTourLoads: Record<string, ExerciseTourLoad>
  completedExercises: ReadonlySet<string>
  resolveName: (exerciseId: string) => string
  /** Limite d’affichage carte Stories. */
  limit?: number
}): SessionShareExerciseMax[] {
  const { session, exerciseTourLoads, completedExercises, resolveName, limit = 6 } = params
  const maxById = new Map<string, number>()
  const order: string[] = []

  session.blocks.forEach((block, blockIndex) => {
    const blockNumber = blockIndex + 1
    const tourCount = parseBlockTourCount(block)
    block.exercises.forEach((exercise, exerciseIndex) => {
      if (!exercise || isDirectiveText(exercise.name)) return
      const exerciseId = resolveExerciseIdForSessionRun(exercise.name, exercise.exerciseId)
      if (!exerciseId) return

      for (let tour = 0; tour < tourCount; tour++) {
        const key = buildExerciseTourKey(blockNumber, tour, exerciseIndex)
        if (!completedExercises.has(key)) continue
        const loadKg = exerciseTourLoads[key]?.loadKg
        if (loadKg == null || loadKg <= 0) continue
        const prev = maxById.get(exerciseId)
        if (prev == null) {
          maxById.set(exerciseId, loadKg)
          order.push(exerciseId)
        } else if (loadKg > prev) {
          maxById.set(exerciseId, loadKg)
        }
      }
    })
  })

  return order.slice(0, limit).map((exerciseId) => ({
    exerciseId,
    exerciseName: resolveName(exerciseId) || exerciseId,
    maxKg: Math.round(maxById.get(exerciseId)!),
  }))
}
