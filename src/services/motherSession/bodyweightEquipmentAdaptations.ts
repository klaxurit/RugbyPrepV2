import { getExerciseById } from '../../data/exercises'
import type { MotherSession, Exercise as MotherSessionExercise } from '../../types/motherSession'
import type { Equipment } from '../../types/training'
import { resolveExerciseVariantForEquipment } from '../equipment/patternExerciseRegistry'
import { isBodyweightProgramTier } from '../equipment/resolveEquipmentProgramTier'
import { resolveExerciseIdForSessionRun } from './motherSessionExerciseMap'

function adaptExerciseForBodyweightEquipment(
  exercise: MotherSessionExercise,
  equipment: Equipment[] | undefined,
): MotherSessionExercise {
  const baseId = resolveExerciseIdForSessionRun(exercise.name, exercise.exerciseId)
  if (!baseId) return exercise

  const resolvedId = resolveExerciseVariantForEquipment(baseId, equipment)
  if (resolvedId === baseId) {
    return { ...exercise, exerciseId: baseId }
  }

  const catalog = getExerciseById(resolvedId)
  return {
    ...exercise,
    exerciseId: resolvedId,
    name: catalog?.name ?? exercise.name,
  }
}

/**
 * Monte chaque exercice vers la meilleure variante disponible selon le matériel du profil.
 * S'applique uniquement au pipeline bodyweight_minimal (séances *_BW_*).
 */
export function adaptMotherSessionForBodyweightEquipment(
  session: MotherSession,
  equipment: Equipment[] | undefined,
): MotherSession {
  if (!isBodyweightProgramTier(equipment)) return session
  if (session.metadata.equipment !== 'bodyweight') return session

  return {
    ...session,
    blocks: session.blocks.map((block) => ({
      ...block,
      exercises: block.exercises.map((exercise) =>
        adaptExerciseForBodyweightEquipment(exercise, equipment),
      ),
    })),
  }
}
