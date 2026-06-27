import { describe, expect, it } from 'vitest'
import {
  mapMotherSessionIdForEquipment,
  mapWeeklySlotsForEquipment,
} from '../motherSessionEquipmentMap'
import { isBodyweightProgramTier, resolveEquipmentProgramTier } from '../resolveEquipmentProgramTier'
import { GYM_PRESET } from '../equipmentPresets'

describe('resolveEquipmentProgramTier', () => {
  it('equipment vide → bodyweight_minimal', () => {
    expect(resolveEquipmentProgramTier([])).toBe('bodyweight_minimal')
    expect(isBodyweightProgramTier([])).toBe(true)
  })

  it('equipment undefined → full_gym (legacy)', () => {
    expect(resolveEquipmentProgramTier(undefined)).toBe('full_gym')
    expect(isBodyweightProgramTier(undefined)).toBe(false)
  })

  it('barbell seul reste bodyweight_minimal (variantes, pas séances salle)', () => {
    expect(resolveEquipmentProgramTier(['dumbbell', 'barbell'])).toBe('bodyweight_minimal')
    expect(resolveEquipmentProgramTier(['barbell', 'squat_rack'])).toBe('bodyweight_minimal')
  })

  it('machine ou câble → full_gym', () => {
    expect(resolveEquipmentProgramTier(['dumbbell', 'machine'])).toBe('full_gym')
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
      mapMotherSessionIdForEquipment('FULL_OFFSEASON_RECOVERY_A_V1', GYM_PRESET),
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

  it('mappe Force-Bridge off-season pour profil BW', () => {
    expect(mapMotherSessionIdForEquipment('LOWER_OFFSEASON_FORCE_BRIDGE_V1', [])).toBe(
      'LOWER_BW_OFFSEASON_FORCE_BRIDGE_V1',
    )
    expect(mapMotherSessionIdForEquipment('FULL_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1', ['band'])).toBe(
      'FULL_BW_OFFSEASON_FORCE_BRIDGE_V1',
    )
  })

  it('mappe In-Season Lower/Upper pour profil BW', () => {
    expect(mapMotherSessionIdForEquipment('LOWER_IN_SEASON_FRONT_ROW_V1', [])).toBe(
      'LOWER_BW_IN_SEASON_V1',
    )
    expect(mapMotherSessionIdForEquipment('LOWER_IN_SEASON_BACK_THREE_V1', ['band'])).toBe(
      'LOWER_BW_IN_SEASON_V1',
    )
    expect(mapMotherSessionIdForEquipment('UPPER_IN_SEASON_FRONT_ROW_V1', [])).toBe(
      'UPPER_BW_IN_SEASON_V1',
    )
  })

  it('mappe Pré-saison force et power pour profil BW', () => {
    expect(mapMotherSessionIdForEquipment('LOWER_PRESEASON_FORCE_V1', [])).toBe(
      'LOWER_BW_PRESEASON_FORCE_V1',
    )
    expect(mapMotherSessionIdForEquipment('SPEED_POWER_PRESEASON_INTRO_V1', ['band'])).toBe(
      'SPEED_BW_POWER_PRESEASON_INTRO_V1',
    )
    expect(mapMotherSessionIdForEquipment('LOWER_PRESEASON_FORCE_POWER_V1', [])).toBe(
      'LOWER_BW_PRESEASON_FORCE_POWER_V1',
    )
    expect(mapMotherSessionIdForEquipment('LOWER_PRESEASON_POWER_FRONT_ROW_V1', [])).toBe(
      'LOWER_BW_PRESEASON_POWER_V1',
    )
    expect(mapMotherSessionIdForEquipment('FULL_PRESEASON_POWER_BACK_THREE_V1', ['pullup_bar'])).toBe(
      'FULL_BW_PRESEASON_POWER_V1',
    )
  })

  it('mappe in-season full body et primer pour profil BW', () => {
    expect(mapMotherSessionIdForEquipment('FULL_BODY_IN_SEASON_FRONT_ROW_V1', [])).toBe(
      'FULL_BW_BODY_IN_SEASON_V1',
    )
    expect(mapMotherSessionIdForEquipment('FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_V1', ['band'])).toBe(
      'FULL_BW_LIGHT_PRIMER_IN_SEASON_V1',
    )
  })
})
