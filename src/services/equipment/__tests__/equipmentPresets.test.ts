import { describe, expect, it } from 'vitest'
import {
  GYM_PRESET,
  inferEquipmentPreset,
  resolveEquipmentFromPreset,
} from '../equipmentPresets'

describe('equipmentPresets', () => {
  it('resolve presets', () => {
    expect(resolveEquipmentFromPreset('bodyweight')).toEqual([])
    expect(resolveEquipmentFromPreset('bands')).toEqual(['band'])
    expect(resolveEquipmentFromPreset('full_gym')).toEqual(GYM_PRESET)
  })

  it('infer bodyweight from empty equipment', () => {
    expect(inferEquipmentPreset([])).toBe('bodyweight')
  })

  it('infer full_gym from barbell preset', () => {
    expect(inferEquipmentPreset(GYM_PRESET)).toBe('full_gym')
  })

  it('infer home_gym from home preset', () => {
    expect(inferEquipmentPreset(resolveEquipmentFromPreset('home_gym'))).toBe('home_gym')
  })
})
