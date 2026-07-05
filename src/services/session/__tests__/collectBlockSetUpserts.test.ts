import { describe, expect, it } from 'vitest'
import type { Block } from '../../../types/motherSession'
import { collectBlockSetUpserts } from '../collectBlockSetUpserts'

const block: Block = {
  number: 5,
  name: 'Shoulder Health',
  format: '`3 rounds`, `45-60s` rest',
  exercises: [
    { name: 'Face Pull', prescription: '3x12-15' },
    { name: 'Lateral Raise', prescription: '2x12-15' },
  ],
  coachingNotes: [],
}

describe('collectBlockSetUpserts', () => {
  it('n’hérite pas silencieusement du tour 1 vers les tours suivants', () => {
    const upserts = collectBlockSetUpserts({
      block,
      blockNumber: 5,
      exerciseTourLoads: {
        '5_0_0': { loadKg: 25, reps: 12 },
      },
      completedExercises: new Set(['5_0_0', '5_1_0', '5_2_0']),
    })

    expect(upserts).toHaveLength(1)
    expect(upserts[0]).toMatchObject({ tourIndex: 0, loadKg: 25, reps: 12 })
  })

  it('persiste chaque tour avec ses propres valeurs', () => {
    const upserts = collectBlockSetUpserts({
      block,
      blockNumber: 5,
      exerciseTourLoads: {
        '5_0_0': { loadKg: 25, reps: 15 },
        '5_1_0': { loadKg: 25, reps: 13 },
        '5_2_0': { loadKg: 25, reps: 12 },
      },
      completedExercises: new Set(['5_0_0', '5_1_0', '5_2_0']),
    })

    expect(upserts.map((u) => u.reps)).toEqual([15, 13, 12])
  })
})
