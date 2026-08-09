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

  it('upgrade archer push-up en développé haltères si home gym', () => {
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

  it('UPPER power + barre : contraste Dip+Plyo (pas Dip×2), B2 sans push', () => {
    const raw = MOTHER_SESSIONS_BY_ID.UPPER_BW_PRESEASON_POWER_V1
    const adapted = adaptMotherSessionForBodyweightEquipment(raw, ['pullup_bar', 'band'])
    const b1Ids = adapted.blocks[0]?.exercises.map((e) => e.exerciseId) ?? []
    const b2Ids = adapted.blocks[1]?.exercises.map((e) => e.exerciseId) ?? []
    expect(b1Ids.filter((id) => id?.includes('dip')).length).toBe(1)
    expect(b1Ids.some((id) => id?.includes('plyo'))).toBe(true)
    expect(b2Ids.some((id) => id?.includes('dip') || id?.includes('decline'))).toBe(false)
    expect(b2Ids).toContain('pull_vertical__pull_up__neutral')
    expect(b2Ids).toContain('prehab_shoulder__face_pull__band')
  })

  it('FULL power + barre : archer reste archer (pas de dips)', () => {
    const raw = MOTHER_SESSIONS_BY_ID.FULL_BW_PRESEASON_POWER_V1
    const adapted = adaptMotherSessionForBodyweightEquipment(raw, ['pullup_bar', 'band'])
    const b2Ids = adapted.blocks[1]?.exercises.map((e) => e.exerciseId) ?? []
    expect(b2Ids[0]).toBe('push_horizontal__archer_push_up__bodyweight')
    expect(b2Ids.some((id) => id?.includes('dip'))).toBe(false)
  })
})
