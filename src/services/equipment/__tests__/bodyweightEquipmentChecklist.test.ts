import { describe, expect, it } from 'vitest'
import {
  BODYWEIGHT_EQUIPMENT_CHECKS,
  isChecklistItemActive,
  isFullGymEquipment,
  toggleBodyweightCheck,
} from '../bodyweightEquipmentChecklist'
import { GYM_PRESET } from '../equipmentPresets'

describe('bodyweightEquipmentChecklist', () => {
  it('cage à squat active rack + barre', () => {
    const def = BODYWEIGHT_EQUIPMENT_CHECKS.find((item) => item.id === 'squat_rack')!
    const next = toggleBodyweightCheck([], 'squat_rack', true)
    expect(isChecklistItemActive(next, def)).toBe(true)
    expect(next).toEqual(['barbell', 'squat_rack'])
  })

  it('décoche cage retire rack et barre', () => {
    const next = toggleBodyweightCheck(['barbell', 'squat_rack', 'band'], 'squat_rack', false)
    expect(next).toEqual(['band'])
  })

  it('toggle depuis salle complète repasse en mode checklist', () => {
    const next = toggleBodyweightCheck(GYM_PRESET, 'band', true)
    expect(isFullGymEquipment(next)).toBe(false)
    expect(next).toContain('band')
    expect(next).not.toContain('machine')
  })

  it('full gym détecté uniquement sur preset complet', () => {
    expect(isFullGymEquipment(GYM_PRESET)).toBe(true)
    expect(isFullGymEquipment(['barbell', 'squat_rack'])).toBe(false)
    expect(isFullGymEquipment([...GYM_PRESET, 'sprint_track'])).toBe(true)
  })
})
