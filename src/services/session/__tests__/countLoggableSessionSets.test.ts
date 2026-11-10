import { describe, expect, it } from 'vitest'
import type { MotherSession } from '../../../types/motherSession'
import { countLoggableSessionSets } from '../countLoggableSessionSets'

function session(blocks: MotherSession['blocks']): MotherSession {
  return {
    metadata: {
      id: 'TEST',
      status: 'validated',
      version: 'V1',
      cycle: 'in_season',
      sessionType: 'lower',
      targetLevel: 'builder',
      targetPositionGroup: 'front_row',
      equipment: 'full_gym',
      targetDuration: '45 min',
    },
    title: 'Test',
    goal: [],
    sessionIdentity: [],
    warmUp: {
      exercises: [
        { name: 'Ankle Rocks', prescription: '1x8' },
        { name: 'Glute Bridge', prescription: '1x8' },
        { name: 'Bodyweight Squat', prescription: '1x8' },
        { name: 'Prep', prescription: '' },
      ],
      notes: [],
    },
    blocks,
    progressionRules: [],
    positionAccent: [],
    injurySubstitutions: [],
    coachingWarnings: [],
    sourceReferences: [],
  }
}

describe('countLoggableSessionSets', () => {
  it('ignore warmUp même s’il a 4 exos', () => {
    const total = countLoggableSessionSets(
      session([
        {
          number: 1,
          name: 'Main',
          format: '2 tours',
          exercises: [
            { name: 'Goblet Squat', prescription: '2x5' },
            { name: 'Broad Jump', prescription: '3 reps' },
          ],
          coachingNotes: [],
        },
      ]),
    )
    expect(total).toBe(4)
  })

  it('EMOM : 1 set par exo (comme finalizeEmomBlock), pas minutes × exos', () => {
    const total = countLoggableSessionSets(
      session([
        {
          number: 1,
          name: 'Finisher',
          format: '`EMOM 8\'`',
          exercises: [
            { name: 'Sled Push', prescription: '15-20m' },
            { name: 'Copenhagen Plank', prescription: '15-20s/côté' },
          ],
          coachingNotes: [],
        },
      ]),
    )
    expect(total).toBe(2)
  })

  it('séance type Lower : tours × exos + EMOM → 19 (pas 23)', () => {
    const total = countLoggableSessionSets(
      session([
        {
          number: 1,
          name: 'Contraste',
          format: '4 tours',
          exercises: [
            { name: 'Goblet Squat', prescription: '4x3' },
            { name: 'Broad Jump', prescription: '3 reps' },
          ],
          coachingNotes: [],
        },
        {
          number: 2,
          name: 'Triplet',
          format: '3 tours',
          exercises: [
            { name: 'RDL', prescription: '3x5' },
            { name: 'Split Squat', prescription: '3x5/côté' },
            { name: 'Hip Thrust', prescription: '3x6' },
          ],
          coachingNotes: [],
        },
        {
          number: 3,
          name: 'Finisher',
          format: '`EMOM 8\'`',
          exercises: [
            { name: 'Sled Push', prescription: '15-20m' },
            { name: 'Copenhagen', prescription: '15-20s' },
          ],
          coachingNotes: [],
        },
      ]),
    )
    expect(total).toBe(19)
  })
})
