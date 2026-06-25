import type { Equipment } from '../../types/training'

/** Tier programme : salle complète vs poids de corps / home minimal. */
export type EquipmentProgramTier = 'full_gym' | 'bodyweight_minimal'

const FULL_GYM_MARKERS: Equipment[] = ['barbell', 'machine', 'cable']

/**
 * Détermine quel pipeline de mother sessions utiliser.
 * Home gym (haltères, bandes, barre traction) → bodyweight_minimal (séances BW + variantes doc).
 */
export function resolveEquipmentProgramTier(
  equipment: Equipment[] | undefined,
): EquipmentProgramTier {
  if (equipment === undefined) return 'full_gym'
  if (equipment.length === 0) return 'bodyweight_minimal'
  if (FULL_GYM_MARKERS.some((item) => equipment.includes(item))) return 'full_gym'
  return 'bodyweight_minimal'
}

export function isBodyweightProgramTier(equipment: Equipment[] | undefined): boolean {
  return resolveEquipmentProgramTier(equipment) === 'bodyweight_minimal'
}
