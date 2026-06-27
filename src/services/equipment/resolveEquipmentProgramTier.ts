import type { Equipment } from '../../types/training'
import { GYM_PRESET, sameEquipmentSet } from './equipmentPresets'

/** Tier programme : salle complète vs poids de corps / home minimal. */
export type EquipmentProgramTier = 'full_gym' | 'bodyweight_minimal'

/**
 * Détermine quel pipeline de mother sessions utiliser.
 * Barre seule ou home gym partiel → bodyweight_minimal (séances BW + variantes).
 * Salle complète = preset gym, ou présence machine / câble.
 */
export function resolveEquipmentProgramTier(
  equipment: Equipment[] | undefined,
): EquipmentProgramTier {
  if (equipment === undefined) return 'full_gym'
  if (equipment.length === 0) return 'bodyweight_minimal'
  if (equipment.includes('machine') || equipment.includes('cable')) return 'full_gym'
  if (sameEquipmentSet(equipment, GYM_PRESET)) return 'full_gym'
  return 'bodyweight_minimal'
}

export function isBodyweightProgramTier(equipment: Equipment[] | undefined): boolean {
  return resolveEquipmentProgramTier(equipment) === 'bodyweight_minimal'
}
