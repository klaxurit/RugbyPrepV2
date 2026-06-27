import type { Equipment } from '../../types/training'

/** Preset salle complète — aligné onboarding et profil. */
export const GYM_PRESET: Equipment[] = [
  'barbell', 'dumbbell', 'bench', 'pullup_bar', 'band', 'box',
  'machine', 'cable', 'landmine', 'tbar_row', 'ghd', 'med_ball', 'ab_wheel', 'sprint_track',
]

export type EquipmentPreset = 'bodyweight' | 'bands' | 'home_gym' | 'full_gym'

export type EquipmentPresetDef = {
  value: EquipmentPreset
  labelKey:
    | 'equipment_preset_bodyweight'
    | 'equipment_preset_bands'
    | 'equipment_preset_home'
    | 'equipment_preset_full_gym'
  subKey:
    | 'equipment_preset_bodyweight_sub'
    | 'equipment_preset_bands_sub'
    | 'equipment_preset_home_sub'
    | 'equipment_preset_full_gym_sub'
}

export const EQUIPMENT_PRESET_DEFS: EquipmentPresetDef[] = [
  { value: 'bodyweight', labelKey: 'equipment_preset_bodyweight', subKey: 'equipment_preset_bodyweight_sub' },
  { value: 'bands', labelKey: 'equipment_preset_bands', subKey: 'equipment_preset_bands_sub' },
  { value: 'home_gym', labelKey: 'equipment_preset_home', subKey: 'equipment_preset_home_sub' },
  { value: 'full_gym', labelKey: 'equipment_preset_full_gym', subKey: 'equipment_preset_full_gym_sub' },
]

export function resolveEquipmentFromPreset(preset: EquipmentPreset): Equipment[] {
  switch (preset) {
    case 'bodyweight':
      return []
    case 'bands':
      return ['band']
    case 'home_gym':
      return ['band', 'dumbbell', 'bench', 'pullup_bar']
    case 'full_gym':
      return [...GYM_PRESET]
  }
}

function sameEquipmentSet(a: Equipment[], b: Equipment[]): boolean {
  if (a.length !== b.length) return false
  const setA = new Set(a)
  return b.every((item) => setA.has(item))
}

export { sameEquipmentSet }

/** Déduit le preset affiché depuis le tableau `equipment` du profil. */
export function inferEquipmentPreset(equipment: Equipment[] | undefined): EquipmentPreset {
  if (!equipment?.length) return 'bodyweight'

  if (sameEquipmentSet(equipment, GYM_PRESET)) return 'full_gym'
  if (sameEquipmentSet(equipment, resolveEquipmentFromPreset('home_gym'))) return 'home_gym'
  if (sameEquipmentSet(equipment, resolveEquipmentFromPreset('bands'))) return 'bands'

  if (equipment.includes('barbell') || equipment.includes('machine') || equipment.includes('cable')) {
    if (equipment.includes('machine') || equipment.includes('cable')) return 'full_gym'
  }

  const homeItems: Equipment[] = ['band', 'dumbbell', 'bench', 'pullup_bar']
  if (equipment.every((item) => homeItems.includes(item))) return 'home_gym'
  if (equipment.includes('band') && equipment.length === 1) return 'bands'

  return 'bodyweight'
}

export function asksGymTrainingLevelForPreset(preset: EquipmentPreset): boolean {
  return preset === 'full_gym'
}

export function asksGymTrainingLevelForEquipment(equipment: Equipment[] | undefined): boolean {
  return asksGymTrainingLevelForPreset(inferEquipmentPreset(equipment))
}
