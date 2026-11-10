import { describe, expect, it } from 'vitest'
import type { MotherSession } from '../../../types/motherSession'
import { buildExerciseTourKey } from '../../../contexts/SessionRunContext'
import {
  countCompletedLoggableSets,
  countLoggableSessionSets,
  listLoggableSessionSetKeys,
} from '../countLoggableSessionSets'

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

const lowerWithEmom = () =>
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
  ])

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
    expect(countLoggableSessionSets(lowerWithEmom())).toBe(19)
  })

  it('listLoggableSessionSetKeys : EMOM en tour 0 uniquement', () => {
    const keys = listLoggableSessionSetKeys(
      session([
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
    expect(keys).toEqual([
      buildExerciseTourKey(3, 0, 0),
      buildExerciseTourKey(3, 0, 1),
    ])
  })
})

describe('countCompletedLoggableSets', () => {
  it('compte les tours validés + EMOM finalisé', () => {
    const s = lowerWithEmom()
    const completed = new Set(listLoggableSessionSetKeys(s))
    expect(countCompletedLoggableSets(s, completed)).toBe(19)
  })

  it('EMOM abandonné : aucune clé EMOM → pas compté comme fait', () => {
    const s = lowerWithEmom()
    const withoutEmom = listLoggableSessionSetKeys(s).filter(
      (key) => !key.startsWith('3_'),
    )
    expect(withoutEmom).toHaveLength(17)
    expect(countCompletedLoggableSets(s, new Set(withoutEmom))).toBe(17)
  })

  it('ignore des clés hors structure (échauffement fantôme, etc.)', () => {
    const s = lowerWithEmom()
    const completed = new Set([
      'warmup_0_0',
      buildExerciseTourKey(1, 0, 0),
      buildExerciseTourKey(3, 0, 0),
    ])
    expect(countCompletedLoggableSets(s, completed)).toBe(2)
  })
})
