import { describe, expect, it } from 'vitest'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'
import { adaptMotherSessionForBodyweightEquipment } from '../bodyweightEquipmentAdaptations'

describe('adaptMotherSessionForBodyweightEquipment', () => {
  const session = MOTHER_SESSIONS_BY_ID.FULL_BW_OFFSEASON_HYPERTROPHY_V1

  it('ne modifie pas les séances full_gym', () => {
    const gym = MOTHER_SESSIONS_BY_ID.FULL_OFFSEASON_HYPERTROPHY_V1
    const adapted = adaptMotherSessionForBodyweightEquipment(gym, ['barbell', 'dumbbell'])
    expect(adapted).toBe(gym)
  })

  it('upgrade chair dip en développé haltères si home gym', () => {
    const adapted = adaptMotherSessionForBodyweightEquipment(session, [
      'dumbbell',
      'bench',
    ])
    const block2Push = adapted.blocks[1]?.exercises[0]
    expect(block2Push?.exerciseId).toBe('push_horizontal__bench_press__dumbbell')
  })

  it('garde le cœur BW sans matériel', () => {
    const adapted = adaptMotherSessionForBodyweightEquipment(session, [])
    const copenhagen = adapted.blocks[3]?.exercises[1]
    expect(copenhagen?.exerciseId).toBe('groin_adductors__copenhagen_plank__foot_elevated')
  })
})
