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

  it('persiste seconds et meters pour un finisher EMOM', () => {
    const finisher: Block = {
      number: 4,
      name: 'Finisher',
      format: "`EMOM 8'`",
      exercises: [
        { name: 'Sled Push', exerciseId: 'sled__push__standard', prescription: '20m' },
        {
          name: 'Copenhagen',
          exerciseId: 'groin_adductors__copenhagen_plank__long',
          prescription: '20s',
        },
      ],
      coachingNotes: [],
    }
    const upserts = collectBlockSetUpserts({
      block: finisher,
      blockNumber: 4,
      exerciseTourLoads: {
        '4_0_0': { loadKg: 50, meters: 20 },
        '4_0_1': { seconds: 18 },
      },
      completedExercises: new Set(['4_0_0', '4_0_1']),
    })
    expect(upserts).toEqual([
      { blockNumber: 4, exerciseId: 'sled__push__standard', tourIndex: 0, loadKg: 50, meters: 20 },
      {
        blockNumber: 4,
        exerciseId: 'groin_adductors__copenhagen_plank__long',
        tourIndex: 0,
        seconds: 18,
      },
    ])
  })
})
