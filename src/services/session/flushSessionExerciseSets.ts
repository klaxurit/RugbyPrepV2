import type { MotherSession } from '../../types/motherSession'
import type { ExerciseSetLog } from '../../types/training'
import type { ExerciseTourLoad } from '../../contexts/SessionRunContext'
import { collectBlockSetUpserts } from './collectBlockSetUpserts'

type UpsertSetFn = (input: Omit<ExerciseSetLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>

/**
 * Persiste tous les sets validés de la séance (tous blocs) — filet de sécurité
 * à la fin de séance et garantie que l'historique inter-semaines est alimenté.
 */
export async function flushSessionExerciseSets(params: {
  session: MotherSession
  slotSignature: string
  motherSessionId: string
  weekLabel: string
  sessionIndex: number
  exerciseTourLoads: Record<string, ExerciseTourLoad>
  completedExercises: Set<string>
  upsertSet: UpsertSetFn
}): Promise<void> {
  const {
    session,
    slotSignature,
    motherSessionId,
    weekLabel,
    sessionIndex,
    exerciseTourLoads,
    completedExercises,
    upsertSet,
  } = params

  for (const block of session.blocks) {
    const upserts = collectBlockSetUpserts({
      block,
      blockNumber: block.number,
      exerciseTourLoads,
      completedExercises,
    })

    for (const row of upserts) {
      await upsertSet({
        slotSignature,
        motherSessionId,
        weekLabel,
        sessionIndex,
        blockNumber: row.blockNumber,
        exerciseId: row.exerciseId,
        tourIndex: row.tourIndex,
        loadKg: row.loadKg,
        reps: row.reps,
      })
    }
  }
}
