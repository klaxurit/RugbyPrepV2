import { describe, expect, it } from 'vitest'
import type { BuiltSession } from './buildSessionFromRecipe'
import { validateSession } from './validateSession'

const makeBlock = (blockId: string, intent: string) => ({
  block: {
    blockId,
    name: blockId,
    intent,
    tags: [],
    equipment: ['none'],
    contraindications: [],
    exercises: [],
    versions: [],
    coachingNotes: '',
  },
  version: {
    versionId: 'W1',
    sets: 1,
    scheme: { kind: 'reps', reps: '8' },
    restSeconds: 60,
    rer: 3,
  },
})

describe('validateSession contracts', () => {
  it('allows two finishers for FULL_BUILDER_V1', () => {
    const session = {
      recipeId: 'FULL_BUILDER_V1',
      title: 'Full Builder',
      week: 'W1',
      blocks: [
        makeBlock('ACT', 'activation'),
        makeBlock('MAIN', 'hypertrophy'),
        makeBlock('FIN1', 'core'),
        makeBlock('FIN2', 'carry'),
      ],
      warnings: [],
    } as unknown as BuiltSession

    const validation = validateSession(session)
    expect(validation.warnings.join(' ')).not.toMatch(/max finishers/i)
  })

  it('still rejects two finishers for non-full recipes', () => {
    const session = {
      recipeId: 'UPPER_BUILDER_V1',
      title: 'Upper Builder',
      week: 'W1',
      blocks: [
        makeBlock('ACT', 'activation'),
        makeBlock('MAIN', 'hypertrophy'),
        makeBlock('FIN1', 'core'),
        makeBlock('FIN2', 'carry'),
      ],
      warnings: [],
    } as unknown as BuiltSession

    const validation = validateSession(session)
    expect(validation.warnings.join(' ')).toMatch(/max finishers/i)
  })

  it('rejects imbalanced full-body sessions that miss lower major work', () => {
    const session = {
      recipeId: 'FULL_V1',
      title: 'Full',
      week: 'W1',
      blocks: [
        makeBlock('ACT', 'activation'),
        {
          ...makeBlock('NEURAL_UPPER', 'neural'),
          block: {
            ...makeBlock('NEURAL_UPPER', 'neural').block,
            tags: ['upper', 'neural'],
          },
        },
        {
          ...makeBlock('FORCE_UPPER', 'force'),
          block: {
            ...makeBlock('FORCE_UPPER', 'force').block,
            tags: ['upper', 'force'],
          },
        },
      ],
      warnings: [],
    } as unknown as BuiltSession

    const validation = validateSession(session)
    expect(validation.warnings.join(' ')).toMatch(/Full-body session imbalance/i)
  })
})
