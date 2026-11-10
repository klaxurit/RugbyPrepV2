import type { WeeklySessionSlot } from '../../data/weeklyTemplates'
import type { ContentFamily } from '../../data/contentFamily'
import { isBodyweightProgramTier } from './resolveEquipmentProgramTier'
import { resolveBodyweightMotherSessionId } from './resolveBodyweightMotherSessionId'

/**
 * Mapping full_gym → bodyweight pour phases hors in-season Upper/Lower multi-familles.
 * In-season Upper/Lower/Full A/B : `resolveBodyweightMotherSessionId` (famille × A/B).
 * Playoffs match-week BW : émis directement par `resolveMotherSessionsForWeek`.
 */
export const BODYWEIGHT_MOTHER_SESSION_ID_MAP: Readonly<Record<string, string>> = {
  FULL_OFFSEASON_RECOVERY_A_V1: 'FULL_BW_OFFSEASON_RECOVERY_A_V1',
  FULL_OFFSEASON_RECOVERY_B_V1: 'FULL_BW_OFFSEASON_RECOVERY_B_V1',
  LOWER_OFFSEASON_TRANSITION_V1: 'LOWER_BW_OFFSEASON_TRANSITION_V1',
  UPPER_OFFSEASON_TRANSITION_V1: 'UPPER_BW_OFFSEASON_TRANSITION_V1',
  FULL_OFFSEASON_TRANSITION_V1: 'FULL_BW_OFFSEASON_TRANSITION_V1',
  LOWER_OFFSEASON_HYPERTROPHY_V1: 'LOWER_BW_OFFSEASON_HYPERTROPHY_V1',
  UPPER_OFFSEASON_HYPERTROPHY_V1: 'UPPER_BW_OFFSEASON_HYPERTROPHY_V1',
  FULL_OFFSEASON_HYPERTROPHY_V1: 'FULL_BW_OFFSEASON_HYPERTROPHY_V1',
  LOWER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1: 'LOWER_BW_OFFSEASON_HYPERTROPHY_V1',
  UPPER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1: 'UPPER_BW_OFFSEASON_HYPERTROPHY_V1',
  FULL_OFFSEASON_HYPERTROPHY_BACK_THREE_V1: 'FULL_BW_OFFSEASON_HYPERTROPHY_V1',
  LOWER_OFFSEASON_FORCE_BRIDGE_V1: 'LOWER_BW_OFFSEASON_FORCE_BRIDGE_V1',
  UPPER_OFFSEASON_FORCE_BRIDGE_V1: 'UPPER_BW_OFFSEASON_FORCE_BRIDGE_V1',
  FULL_OFFSEASON_FORCE_BRIDGE_V1: 'FULL_BW_OFFSEASON_FORCE_BRIDGE_V1',
  LOWER_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1: 'LOWER_BW_OFFSEASON_FORCE_BRIDGE_V1',
  UPPER_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1: 'UPPER_BW_OFFSEASON_FORCE_BRIDGE_V1',
  FULL_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1: 'FULL_BW_OFFSEASON_FORCE_BRIDGE_V1',
  LOWER_PRESEASON_FORCE_V1: 'LOWER_BW_PRESEASON_FORCE_V1',
  UPPER_PRESEASON_FORCE_V1: 'UPPER_BW_PRESEASON_FORCE_V1',
  FULL_PRESEASON_FORCE_V1: 'FULL_BW_PRESEASON_FORCE_V1',
  SPEED_POWER_PRESEASON_INTRO_V1: 'SPEED_BW_POWER_PRESEASON_INTRO_V1',
  LOWER_PRESEASON_FORCE_POWER_V1: 'LOWER_BW_PRESEASON_FORCE_POWER_V1',
  UPPER_PRESEASON_FORCE_POWER_V1: 'UPPER_BW_PRESEASON_FORCE_POWER_V1',
  FULL_PRESEASON_FORCE_POWER_V1: 'FULL_BW_PRESEASON_FORCE_POWER_V1',
  SPEED_POWER_PRESEASON_V1: 'SPEED_BW_POWER_PRESEASON_V1',
  LOWER_PRESEASON_POWER_FRONT_ROW_V1: 'LOWER_BW_PRESEASON_POWER_V1',
  LOWER_PRESEASON_POWER_BACK_THREE_V1: 'LOWER_BW_PRESEASON_POWER_V1',
  // Upper Power pré : résolu via resolveBodyweightMotherSessionId (backs familles)
  FULL_PRESEASON_POWER_FRONT_ROW_V1: 'FULL_BW_PRESEASON_POWER_V1',
  FULL_PRESEASON_POWER_BACK_THREE_V1: 'FULL_BW_PRESEASON_POWER_V1',
  FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1: 'FULL_BW_LIGHT_PRIMER_IN_SEASON_V1',
  FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_B_V1: 'FULL_BW_LIGHT_PRIMER_IN_SEASON_V1',
  FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_V1: 'FULL_BW_LIGHT_PRIMER_IN_SEASON_V1',
  FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_B_V1: 'FULL_BW_LIGHT_PRIMER_IN_SEASON_V1',
}

export type MapMotherSessionEquipmentOpts = {
  contentFamily?: ContentFamily | null
}

export function mapMotherSessionIdForEquipment(
  sessionId: string,
  equipment: string[] | undefined,
  opts?: MapMotherSessionEquipmentOpts,
): string {
  if (!isBodyweightProgramTier(equipment as never)) return sessionId

  // In-season Upper/Lower/Full + Power pré backs → resolver famille × A/B
  if (
    /^(UPPER|LOWER)_IN_SEASON_/i.test(sessionId) ||
    /^FULL_BODY_IN_SEASON_/i.test(sessionId) ||
    /^UPPER_PRESEASON_POWER_/i.test(sessionId)
  ) {
    return resolveBodyweightMotherSessionId(sessionId, {
      contentFamily: opts?.contentFamily,
    })
  }

  const mapped = BODYWEIGHT_MOTHER_SESSION_ID_MAP[sessionId]
  if (mapped) return mapped

  return resolveBodyweightMotherSessionId(sessionId, {
    contentFamily: opts?.contentFamily,
  })
}

export function mapWeeklySlotsForEquipment(
  slots: WeeklySessionSlot[],
  equipment: string[] | undefined,
  opts?: MapMotherSessionEquipmentOpts,
): WeeklySessionSlot[] {
  return slots.map((slot) => ({
    ...slot,
    sessionId: mapMotherSessionIdForEquipment(slot.sessionId, equipment, opts),
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

export { resolveBodyweightMotherSessionId } from './resolveBodyweightMotherSessionId'
