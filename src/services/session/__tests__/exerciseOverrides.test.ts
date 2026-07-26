import { describe, expect, it } from 'vitest'
import type { MotherSession } from '../../../types/motherSession'
import {
  applyExerciseOverridesToSession,
  buildExerciseOverrideKey,
  makeExerciseOverride,
  stripOverridesForSlot,
} from '../exerciseOverrides'

function makeSession(): MotherSession {
  return {
    metadata: {
      id: 'test_session',
      status: 'validated',
      version: 'V1',
      cycle: 'off_season',
      sessionType: 'lower',
      targetLevel: 'builder',
      targetPositionGroup: 'front_row',
      equipment: 'bodyweight_minimal',
      targetDuration: '45 min',
    },
    goal: [],
    sessionIdentity: [],
    warmUp: { exercises: [], notes: [] },
    blocks: [
      {
        number: 1,
        name: 'Main',
        format: '3 rounds',
        coachingNotes: [],
        exercises: [
          {
            name: 'Bulgarian Split Squat',
            exerciseId: 'lower_squat__bulgarian_split_squat__bodyweight',
            prescription: '3×8/côté',
          },
          {
            name: 'Reverse Lunge',
            exerciseId: 'lower_lunge__reverse_lunge__bodyweight',
            prescription: '3×10/côté',
          },
        ],
      },
    ],
    progressionRules: [],
    positionAccent: [],
    injurySubstitutions: [],
    coachingWarnings: [],
    sourceReferences: [],
  }
}

describe('exerciseOverrides', () => {
  it('buildExerciseOverrideKey suit slotSignature:block:index', () => {
    expect(buildExerciseOverrideKey('ms|W1|0', 2, 1)).toBe('ms|W1|0:2:1')
  })

  it('applique l’override sur le bon slot (nom + exerciseId)', () => {
    const session = makeSession()
    const slot = 'off|W10|0'
    const key = buildExerciseOverrideKey(slot, 1, 0)
    const override = makeExerciseOverride('lower_lunge__cossack_squat__bodyweight', 'fr')
    const next = applyExerciseOverridesToSession(session, slot, { [key]: override })

    expect(next.blocks[0].exercises[0].exerciseId).toBe(
      'lower_lunge__cossack_squat__bodyweight',
    )
    expect(next.blocks[0].exercises[0].name).toBe(override.name)
    expect(next.blocks[0].exercises[1].exerciseId).toBe(
      'lower_lunge__reverse_lunge__bodyweight',
    )
  })

  it('sans override, la session reste inchangée', () => {
    const session = makeSession()
    const next = applyExerciseOverridesToSession(session, 'slot', {})
    expect(next).toBe(session)
  })

  it('stripOverridesForSlot retire uniquement le slot ciblé', () => {
    const overrides = {
      'a:1:0': makeExerciseOverride('lower_lunge__cossack_squat__bodyweight'),
      'b:1:0': makeExerciseOverride('push_horizontal__archer_push_up__bodyweight'),
    }
    const next = stripOverridesForSlot(overrides, 'a')
    expect(next['a:1:0']).toBeUndefined()
    expect(next['b:1:0']).toBeDefined()
  })
})
