import type { WeeklySessionSlot } from '../../data/weeklyTemplates'
import { isBodyweightProgramTier } from './resolveEquipmentProgramTier'

/**
 * Mapping full_gym → bodyweight pour les mother sessions publiées.
 * Étendre au fur et à mesure de la conversion MD (Transition, Hyp, etc.).
 */
export const BODYWEIGHT_MOTHER_SESSION_ID_MAP: Readonly<Record<string, string>> = {
  FULL_OFFSEASON_RECOVERY_A_V1: 'FULL_BW_OFFSEASON_RECOVERY_A_V1',
  FULL_OFFSEASON_RECOVERY_B_V1: 'FULL_BW_OFFSEASON_RECOVERY_B_V1',
}

export function mapMotherSessionIdForEquipment(
  sessionId: string,
  equipment: string[] | undefined,
): string {
  if (!isBodyweightProgramTier(equipment as never)) return sessionId
  return BODYWEIGHT_MOTHER_SESSION_ID_MAP[sessionId] ?? sessionId
}

export function mapWeeklySlotsForEquipment(
  slots: WeeklySessionSlot[],
  equipment: string[] | undefined,
): WeeklySessionSlot[] {
  return slots.map((slot) => ({
    ...slot,
    sessionId: mapMotherSessionIdForEquipment(slot.sessionId, equipment),
  }))
}

export function bodyweightSessionFallbackWarning(
  originalSessionId: string,
  mappedSessionId: string,
  equipment: string[] | undefined,
): string | undefined {
  if (!isBodyweightProgramTier(equipment as never)) return undefined
  if (originalSessionId !== mappedSessionId) return undefined
  if (originalSessionId in BODYWEIGHT_MOTHER_SESSION_ID_MAP) return undefined
  if (originalSessionId.includes('_BW_')) return undefined
  return `Séance ${originalSessionId} : version poids de corps non encore publiée — contenu salle affiché.`
}
