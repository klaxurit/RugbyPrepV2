import { describe, expect, it } from 'vitest'
import blocksData from '../../data/blocks.v1.json'
import exercisesData from '../../data/exercices.v1.json'
import { sessionRecipesV1 } from '../../data/sessionRecipes.v1'
import type { BlockIntent, Equipment, Exercise, TrainingBlock } from '../../types/training'

const blocks = blocksData as TrainingBlock[]
const exercises = exercisesData as Exercise[]

describe('program data integrity', () => {
  it('TID-DAT-001 ensures each block declares every non-bodyweight equipment requirement from its exercises', () => {
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

  it('TID-DAT-002 every recipe slot intent has at least one matching block in the library', () => {
    const blockIntents = new Set(blocks.map((block) => block.intent))

    const missingIntents: Array<{ recipeId: string; slotIndex: number; intent: BlockIntent }> = []

    for (const recipe of Object.values(sessionRecipesV1)) {
      for (let i = 0; i < recipe.sequence.length; i++) {
        const slot = recipe.sequence[i]!
        if (!blockIntents.has(slot.intent)) {
          missingIntents.push({ recipeId: recipe.id, slotIndex: i, intent: slot.intent })
        }
      }
    }

    expect(missingIntents).toEqual([])
  })

  it('TID-DAT-003 every block references only exercises that exist in the exercise library', () => {
    const exerciseIds = new Set<string>()
    for (const exercise of exercises) {
      if (exercise.exerciseId) exerciseIds.add(exercise.exerciseId)
      if (exercise.id) exerciseIds.add(exercise.id)
    }

    const orphans: Array<{ blockId: string; exerciseId: string }> = []

    for (const block of blocks) {
      for (const blockExercise of block.exercises) {
        if (!exerciseIds.has(blockExercise.exerciseId)) {
          orphans.push({ blockId: block.blockId, exerciseId: blockExercise.exerciseId })
        }
      }
    }

    expect(orphans).toEqual([])
  })

  it('TID-DAT-004 no duplicate blockId in the block library', () => {
    const seen = new Set<string>()
    const duplicates: string[] = []

    for (const block of blocks) {
      if (seen.has(block.blockId)) {
        duplicates.push(block.blockId)
      }
      seen.add(block.blockId)
    }

    expect(duplicates).toEqual([])
  })

  it('TID-DAT-005 no duplicate exerciseId in the exercise library', () => {
    const seen = new Set<string>()
    const duplicates: string[] = []

    for (const exercise of exercises) {
      const id = exercise.exerciseId ?? exercise.id
      if (!id) continue
      if (seen.has(id)) {
        duplicates.push(id)
      }
      seen.add(id)
    }

    expect(duplicates).toEqual([])
  })
})
