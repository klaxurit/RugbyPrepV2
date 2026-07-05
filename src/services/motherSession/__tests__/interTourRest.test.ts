import { describe, expect, it } from 'vitest'
import { buildExerciseTourKey } from '../../../contexts/SessionRunContext'
import type { MotherSession } from '../../../types/motherSession'
import { getInterTourRestAfterMarking } from '../interTourRest'

const session = {
  metadata: { id: 'test' },
  warmUp: { exercises: [], notes: '' },
  blocks: [
    {
      number: 1,
      name: 'Force',
      format: '`3 rounds`, `90s` rest',
      coachingNotes: '',
      exercises: [
        { name: 'Squat', prescription: '4×8', exerciseId: 'squat' },
        { name: 'Row', prescription: '4×10', exerciseId: 'row' },
      ],
    },
    {
      number: 2,
      name: 'Finisher',
      format: '`2 rounds`, `60s` rest',
      coachingNotes: '',
      exercises: [
        { name: 'Burpee', prescription: '2×15', exerciseId: 'burpee' },
      ],
    },
  ],
} as unknown as MotherSession

describe('getInterTourRestAfterMarking', () => {
  it('démarre le repos quand le dernier exo du tour est validé', () => {
    const completed = new Set<string>([
      buildExerciseTourKey(1, 0, 0),
      buildExerciseTourKey(1, 0, 1),
    ])

    const rest = getInterTourRestAfterMarking(session, 1, 0, 1, completed)
    expect(rest).toEqual({ restSeconds: 90, kind: 'inter_tour', tourOneBased: 1 })
  })

  it('pas de repos si le tour n’est pas complet', () => {
    const completed = new Set<string>([buildExerciseTourKey(1, 0, 1)])

    expect(getInterTourRestAfterMarking(session, 1, 0, 1, completed)).toBeNull()
  })

  it('pas de repos si ce n’est pas le dernier exo du tour', () => {
    const completed = new Set<string>([buildExerciseTourKey(1, 0, 0)])

    expect(getInterTourRestAfterMarking(session, 1, 0, 0, completed)).toBeNull()
  })

  it('pas de repos après le dernier tour du dernier bloc', () => {
    const completed = new Set<string>([buildExerciseTourKey(2, 1, 0)])

    expect(getInterTourRestAfterMarking(session, 2, 1, 0, completed)).toBeNull()
  })
})
