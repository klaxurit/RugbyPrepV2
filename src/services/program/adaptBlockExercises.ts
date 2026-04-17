import type { Equipment, TrainingBlock } from '../../types/training'
import { getExerciseById } from '../../data/exercises'
import { exerciseVariants } from '../../data/exerciseVariants.v1'

/**
 * Find a suitable exercise variant that the user can perform with their equipment.
 * Walks the variant chain from the preferred exercise to find the first match.
 * Returns the original exerciseId if the user already has the required equipment.
 */
export const findAccessibleVariant = (
  exerciseId: string,
  userEquipment: Equipment[],
): string => {
  const exercise = getExerciseById(exerciseId)
  if (!exercise) return exerciseId

  // Check if user already has the required equipment
  const requiredEquipment = exercise.equipment.filter((eq) => eq !== 'none')
  if (requiredEquipment.every((eq) => userEquipment.includes(eq))) {
    return exerciseId
  }

  // Look for a variant the user can do
  const variants = exerciseVariants[exerciseId]
  if (!variants) return exerciseId

  for (const variantId of variants) {
    const variant = getExerciseById(variantId)
    if (!variant) continue
    const variantEquipment = variant.equipment.filter((eq) => eq !== 'none')
    if (variantEquipment.every((eq) => userEquipment.includes(eq))) {
      return variantId
    }
  }

  // No variant found — keep original (block-level filter will catch it)
  return exerciseId
}

/**
 * Check if a block can be adapted for the user's equipment.
 * Returns true if every exercise either fits or has an accessible variant.
 */
export const canAdaptBlock = (
  block: TrainingBlock,
  userEquipment: Equipment[],
): boolean => {
  for (const blockExercise of block.exercises) {
    const exercise = getExerciseById(blockExercise.exerciseId)
    if (!exercise) continue

    const required = exercise.equipment.filter((eq) => eq !== 'none')
    const hasEquipment = required.every((eq) => userEquipment.includes(eq))
    if (hasEquipment) continue

    // Check variants
    const variants = exerciseVariants[blockExercise.exerciseId]
    if (!variants) return false

    const hasVariant = variants.some((variantId) => {
      const variant = getExerciseById(variantId)
      if (!variant) return false
      const variantRequired = variant.equipment.filter((eq) => eq !== 'none')
      return variantRequired.every((eq) => userEquipment.includes(eq))
    })
    if (!hasVariant) return false
  }
  return true
}

/**
 * Create a new block with exercises adapted to the user's equipment.
 * The block structure (versions, tags, intent) stays the same — only exerciseIds change.
 */
export const adaptBlockExercises = (
  block: TrainingBlock,
  userEquipment: Equipment[],
): TrainingBlock => {
  let adapted = false

  const exercises = block.exercises.map((blockExercise) => {
    const newId = findAccessibleVariant(blockExercise.exerciseId, userEquipment)
    if (newId !== blockExercise.exerciseId) adapted = true
    return { ...blockExercise, exerciseId: newId }
  })

  if (!adapted) return block

  // Recompute block-level equipment from adapted exercises
  const equipmentSet = new Set<Equipment>()
  for (const ex of exercises) {
    const exercise = getExerciseById(ex.exerciseId)
    if (exercise) {
      for (const eq of exercise.equipment) equipmentSet.add(eq)
    }
  }

  return {
    ...block,
    exercises,
    equipment: [...equipmentSet],
  }
}
