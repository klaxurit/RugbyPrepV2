import type { MotherSession } from '../../types/motherSession'
import { getExerciseName } from '../../data/exercises'

export type ExerciseOverride = {
  exerciseId: string
  name: string
}

/** Clé d’override : `slotSignature:blockNumber:exerciseIndex`. */
export function buildExerciseOverrideKey(
  slotSignature: string,
  blockNumber: number,
  exerciseIndex: number,
): string {
  return `${slotSignature}:${blockNumber}:${exerciseIndex}`
}

export function makeExerciseOverride(
  exerciseId: string,
  lang: 'fr' | 'en' = 'fr',
): ExerciseOverride {
  return {
    exerciseId,
    name: getExerciseName(exerciseId, lang),
  }
}

/**
 * Applique les overrides user après `prepareSessionForRender`.
 * Clés : `${slotSignature}:${blockNumber}:${exerciseIndex}`.
 */
export function applyExerciseOverridesToSession(
  session: MotherSession,
  slotSignature: string | null | undefined,
  overrides: Record<string, ExerciseOverride>,
): MotherSession {
  if (!slotSignature || !overrides || Object.keys(overrides).length === 0) {
    return session
  }

  let changed = false
  const blocks = session.blocks.map((block) => {
    let blockChanged = false
    const exercises = block.exercises.map((exo, exerciseIndex) => {
      const key = buildExerciseOverrideKey(slotSignature, block.number, exerciseIndex)
      const override = overrides[key]
      if (!override) return exo
      blockChanged = true
      return {
        ...exo,
        exerciseId: override.exerciseId,
        name: override.name,
      }
    })
    if (!blockChanged) return block
    changed = true
    return { ...block, exercises }
  })

  return changed ? { ...session, blocks } : session
}

/** Filtre les overrides d’un slot (utile après finalisation). */
export function stripOverridesForSlot(
  overrides: Record<string, ExerciseOverride>,
  slotSignature: string,
): Record<string, ExerciseOverride> {
  const prefix = `${slotSignature}:`
  const next: Record<string, ExerciseOverride> = {}
  for (const [key, value] of Object.entries(overrides)) {
    if (!key.startsWith(prefix)) next[key] = value
  }
  return next
}
