import { describe, expect, it } from 'vitest'
import type { Block, MotherSession } from '../../../types/motherSession'
import { getRestAfterExerciseSet } from '../resolveExerciseRestAfterSet'

function mkSession(blocks: Block[]): MotherSession {
  return { blocks } as unknown as MotherSession
}

describe('getRestAfterExerciseSet', () => {
  it('repos inter-tour après le dernier exo d’un tour (superset)', () => {
    const session = mkSession([
      {
        number: 1,
        name: 'Upper',
        format: '`4 rounds`, `90-120s` rest after the pair',
        coachingNotes: [],
        exercises: [
          { name: 'Incline Press', prescription: '4x8-10', exerciseId: 'bench' },
          { name: 'Row', prescription: '4x8-10', exerciseId: 'row' },
        ],
      },
      {
        number: 2,
        name: 'Finisher',
        format: '`2 rounds`, `60s` rest',
        coachingNotes: [],
        exercises: [{ name: 'Burpee', prescription: '2x15', exerciseId: 'burpee' }],
      },
    ])

    expect(getRestAfterExerciseSet(session, 1, 0, 0)).toEqual({
      restSeconds: 15,
      kind: 'intra_tour',
      tourOneBased: 1,
    })

    expect(getRestAfterExerciseSet(session, 1, 0, 1)).toEqual({
      restSeconds: 120,
      kind: 'inter_tour',
      tourOneBased: 1,
    })
  })

  it('repos inter-tour après chaque série d’un exo unique (trap bar)', () => {
    const session = mkSession([
      {
        number: 1,
        name: 'Hinge',
        format: '`4 work sets`, `2 min` rest between sets',
        coachingNotes: [],
        exercises: [{ name: 'Trap Bar Deadlift', prescription: '4x6-8', exerciseId: 'deadlift' }],
      },
      {
        number: 2,
        name: 'Other',
        format: '`2 rounds`, `60s` rest',
        coachingNotes: [],
        exercises: [{ name: 'Curl', prescription: '2x12', exerciseId: 'curl' }],
      },
    ])

    expect(getRestAfterExerciseSet(session, 1, 0, 0)).toEqual({
      restSeconds: 120,
      kind: 'inter_tour',
      tourOneBased: 1,
    })
  })

  it('restAfterSetSeconds explicite sur l’exo prime le bloc', () => {
    const session = mkSession([
      {
        number: 1,
        name: 'Hinge',
        format: '`4 rounds`, `90s` rest',
        coachingNotes: [],
        exercises: [
          {
            name: 'Trap Bar Deadlift',
            prescription: '4x6-8',
            exerciseId: 'deadlift',
            restAfterSetSeconds: 150,
          },
        ],
      },
      {
        number: 2,
        name: 'Other',
        format: '`2 rounds`, `60s` rest',
        coachingNotes: [],
        exercises: [{ name: 'Curl', prescription: '2x12', exerciseId: 'curl' }],
      },
    ])

    expect(getRestAfterExerciseSet(session, 1, 0, 0)?.restSeconds).toBe(150)
  })

  it('pas de repos après la dernière série de la séance', () => {
    const session = mkSession([
      {
        number: 1,
        name: 'Finisher',
        format: '`2 rounds`, `45s` rest',
        coachingNotes: [],
        exercises: [{ name: 'Carry', prescription: '2x30s', exerciseId: 'carry' }],
      },
    ])

    expect(getRestAfterExerciseSet(session, 1, 1, 0)).toBeNull()
  })
})
