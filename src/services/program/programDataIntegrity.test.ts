import { describe, expect, it } from 'vitest'
import blocksData from '../../data/blocks.v1.json'
import exercisesData from '../../data/exercices.v1.json'
import type { Equipment, Exercise, TrainingBlock } from '../../types/training'

describe('program data integrity', () => {
  it('ensures each block declares every non-bodyweight equipment requirement from its exercises', () => {
    const blocks = blocksData as TrainingBlock[]
    const exercises = exercisesData as Exercise[]
    const exercisesById = new Map<string, Exercise>()

    for (const exercise of exercises) {
      const primaryId = exercise.exerciseId ?? exercise.id
      if (primaryId) exercisesById.set(primaryId, exercise)
      if (exercise.id && exercise.exerciseId && exercise.id !== exercise.exerciseId) {
        exercisesById.set(exercise.id, exercise)
      }
    }

    const mismatches = blocks
      .map((block) => {
        const declared = new Set(block.equipment.filter((equipment) => equipment !== 'none'))
        const required = new Set<Exclude<Equipment, 'none'>>()

        for (const blockExercise of block.exercises) {
          const exercise = exercisesById.get(blockExercise.exerciseId)
          if (!exercise) continue
          for (const equipment of exercise.equipment) {
            if (equipment !== 'none') required.add(equipment)
          }
        }

        const missing = [...required].filter((equipment) => !declared.has(equipment))
        return missing.length > 0 ? { blockId: block.blockId, missing } : null
      })
      .filter((entry) => entry !== null)

    expect(mismatches).toEqual([])
  })
})
