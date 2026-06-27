import type { Equipment } from '../../types/training'
import { GYM_PRESET, sameEquipmentSet } from './equipmentPresets'

/** Une case profil → un ou plusieurs tags `equipment` (ex. cage = rack + barre). */
export type BodyweightEquipmentCheckId =
  | 'band'
  | 'pullup_bar'
  | 'dumbbell'
  | 'kettlebell'
  | 'bench'
  | 'squat_rack'

export type BodyweightEquipmentCheckDef = {
  id: BodyweightEquipmentCheckId
  equipmentKeys: readonly Equipment[]
  labelKey:
    | 'equipment_check_band'
    | 'equipment_check_pullup_bar'
    | 'equipment_check_dumbbell'
    | 'equipment_check_kettlebell'
    | 'equipment_check_bench'
    | 'equipment_check_squat_rack'
  hintKey:
    | 'equipment_check_band_hint'
    | 'equipment_check_pullup_bar_hint'
    | 'equipment_check_dumbbell_hint'
    | 'equipment_check_kettlebell_hint'
    | 'equipment_check_bench_hint'
    | 'equipment_check_squat_rack_hint'
}

export const BODYWEIGHT_EQUIPMENT_CHECKS: readonly BodyweightEquipmentCheckDef[] = [
  {
    id: 'band',
    equipmentKeys: ['band'],
    labelKey: 'equipment_check_band',
    hintKey: 'equipment_check_band_hint',
  },
  {
    id: 'pullup_bar',
    equipmentKeys: ['pullup_bar'],
    labelKey: 'equipment_check_pullup_bar',
    hintKey: 'equipment_check_pullup_bar_hint',
  },
  {
    id: 'dumbbell',
    equipmentKeys: ['dumbbell'],
    labelKey: 'equipment_check_dumbbell',
    hintKey: 'equipment_check_dumbbell_hint',
  },
  {
    id: 'kettlebell',
    equipmentKeys: ['kettlebell'],
    labelKey: 'equipment_check_kettlebell',
    hintKey: 'equipment_check_kettlebell_hint',
  },
  {
    id: 'bench',
    equipmentKeys: ['bench'],
    labelKey: 'equipment_check_bench',
    hintKey: 'equipment_check_bench_hint',
  },
  {
    id: 'squat_rack',
    equipmentKeys: ['squat_rack', 'barbell'],
    labelKey: 'equipment_check_squat_rack',
    hintKey: 'equipment_check_squat_rack_hint',
  },
] as const

const CHECKLIST_EQUIPMENT = new Set<Equipment>(
  BODYWEIGHT_EQUIPMENT_CHECKS.flatMap((item) => [...item.equipmentKeys]),
)

export function isFullGymEquipment(equipment: Equipment[] | undefined): boolean {
  if (!equipment?.length) return false
  return sameEquipmentSet(equipment, GYM_PRESET)
}

/** Profil géré par cases à cocher (programme BW + variantes). */
export function isBodyweightChecklistEquipment(equipment: Equipment[] | undefined): boolean {
  if (!equipment?.length) return true
  if (isFullGymEquipment(equipment)) return false
  return equipment.every((item) => CHECKLIST_EQUIPMENT.has(item))
}

export function isChecklistItemActive(
  equipment: Equipment[] | undefined,
  def: BodyweightEquipmentCheckDef,
): boolean {
  const set = new Set(equipment ?? [])
  return def.equipmentKeys.every((key) => set.has(key))
}

export function toggleBodyweightCheck(
  equipment: Equipment[] | undefined,
  checkId: BodyweightEquipmentCheckId,
  enabled: boolean,
): Equipment[] {
  const def = BODYWEIGHT_EQUIPMENT_CHECKS.find((item) => item.id === checkId)
  if (!def) return [...(equipment ?? [])]

  const next = new Set<Equipment>()
  for (const item of equipment ?? []) {
    if (CHECKLIST_EQUIPMENT.has(item)) next.add(item)
  }

  if (enabled) {
    for (const key of def.equipmentKeys) next.add(key)
  } else {
    for (const key of def.equipmentKeys) next.delete(key)
  }

  return [...next].sort()
}
