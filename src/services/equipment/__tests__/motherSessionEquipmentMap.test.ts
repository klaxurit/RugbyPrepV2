import { describe, expect, it } from 'vitest'
import {
  mapMotherSessionIdForEquipment,
  mapWeeklySlotsForEquipment,
} from '../motherSessionEquipmentMap'
import { isBodyweightProgramTier, resolveEquipmentProgramTier } from '../resolveEquipmentProgramTier'

describe('resolveEquipmentProgramTier', () => {
  it('equipment vide → bodyweight_minimal', () => {
    expect(resolveEquipmentProgramTier([])).toBe('bodyweight_minimal')
    expect(isBodyweightProgramTier([])).toBe(true)
  })

  it('equipment undefined → full_gym (legacy)', () => {
    expect(resolveEquipmentProgramTier(undefined)).toBe('full_gym')
    expect(isBodyweightProgramTier(undefined)).toBe(false)
  })

  it('barbell → full_gym', () => {
    expect(resolveEquipmentProgramTier(['dumbbell', 'barbell'])).toBe('full_gym')
  })

  it('home gym sans barre → bodyweight_minimal', () => {
    expect(resolveEquipmentProgramTier(['band', 'dumbbell', 'pullup_bar'])).toBe('bodyweight_minimal')
  })
})

describe('motherSessionEquipmentMap', () => {
  it('remplace Recovery A/B pour profil BW', () => {
    expect(mapMotherSessionIdForEquipment('FULL_OFFSEASON_RECOVERY_A_V1', [])).toBe(
      'FULL_BW_OFFSEASON_RECOVERY_A_V1',
    )
    expect(mapMotherSessionIdForEquipment('FULL_OFFSEASON_RECOVERY_B_V1', ['band'])).toBe(
      'FULL_BW_OFFSEASON_RECOVERY_B_V1',
    )
  })

  it('conserve les IDs salle pour full_gym', () => {
    expect(
      mapMotherSessionIdForEquipment('FULL_OFFSEASON_RECOVERY_A_V1', ['barbell', 'dumbbell']),
    ).toBe('FULL_OFFSEASON_RECOVERY_A_V1')
  })

  it('mappe Recovery off-season pour profil BW', () => {
    const mapped = mapWeeklySlotsForEquipment(
      [
        { sessionId: 'FULL_OFFSEASON_RECOVERY_A_V1', role: 'primary' },
        { sessionId: 'FULL_OFFSEASON_RECOVERY_B_V1', role: 'primary' },
      ],
      [],
    )
    expect(mapped[0].sessionId).toBe('FULL_BW_OFFSEASON_RECOVERY_A_V1')
    expect(mapped[1].sessionId).toBe('FULL_BW_OFFSEASON_RECOVERY_B_V1')
  })

  it('mappe Transition off-season pour profil BW', () => {
    const mapped = mapWeeklySlotsForEquipment(
      [
        { sessionId: 'LOWER_OFFSEASON_TRANSITION_V1', role: 'primary' },
        { sessionId: 'UPPER_OFFSEASON_TRANSITION_V1', role: 'primary' },
      ],
      [],
    )
    expect(mapped[0].sessionId).toBe('LOWER_BW_OFFSEASON_TRANSITION_V1')
    expect(mapped[1].sessionId).toBe('UPPER_BW_OFFSEASON_TRANSITION_V1')
  })
})
