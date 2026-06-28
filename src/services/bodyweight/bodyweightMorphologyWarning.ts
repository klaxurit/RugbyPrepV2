import type { UserProfile } from '../../types/training'
import { isBodyweightProgramTier } from '../equipment/resolveEquipmentProgramTier'

export function bodyweightProgramMissingMorphology(profile: Pick<UserProfile, 'equipment' | 'weightKg'>): boolean {
  if (!isBodyweightProgramTier(profile.equipment)) return false
  return profile.weightKg == null || profile.weightKg <= 0
}
