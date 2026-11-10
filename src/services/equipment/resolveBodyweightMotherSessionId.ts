/**
 * Résolution full_gym → bodyweight (enveloppe B).
 * Famille + parité A/B dérivées de l’ID gym (lanes par cluster) — pas de nouveau compteur.
 */

import {
  contentFamilyCluster,
  contentFamilyToken,
  type ContentFamily,
} from '../../data/contentFamily'
import { inSeasonAbVariant, type InSeasonVarietyLane } from '../../data/inSeasonVarietyLane'

const FAMILY_FROM_TOKEN: Record<string, ContentFamily> = {
  FRONT_ROW: 'front_row',
  SECOND_ROW: 'second_row',
  BACK_ROW: 'back_row',
  HALF_BACKS: 'half_backs',
  CENTERS: 'centers',
  BACK_THREE: 'back_three',
}

/** Pack Upper : BASE / CHESTPASS / LANDMINE / SUPINE → lanes 0–3 */
const PACK_UPPER_LANE: Record<string, InSeasonVarietyLane> = {
  BASE: 0,
  CHESTPASS: 1,
  LANDMINE: 2,
  SUPINE: 3,
}

/** Backs Upper : LANDMINE / PLYO / BASE / ROTATIONAL (+ PUSHPRESS collision → treat as ROTATIONAL parity) */
const BACKS_UPPER_LANE: Record<string, InSeasonVarietyLane> = {
  LANDMINE: 0,
  PLYO: 1,
  BASE: 2,
  ROTATIONAL: 3,
  PUSHPRESS: 3,
}

/** Pack Lower */
const PACK_LOWER_LANE: Record<string, InSeasonVarietyLane> = {
  BASE: 0,
  FRONTSQUAT: 1,
  TBRDL: 2,
  PAUSEJUMP: 3,
}

/** Backs Lower */
const BACKS_LOWER_LANE: Record<string, InSeasonVarietyLane> = {
  BASE: 0,
  RDL: 1,
  SLHIP: 2,
  SHRUG: 3,
}

const IN_SEASON_RE =
  /^(UPPER|LOWER)_IN_SEASON_(FRONT_ROW|SECOND_ROW|BACK_ROW|HALF_BACKS|CENTERS|BACK_THREE)(?:_([A-Z]+))?_V1$/i

const FULL_IN_SEASON_RE =
  /^FULL_BODY_IN_SEASON_(FRONT_ROW|BACK_THREE)(_B)?_V1$/i

const PRESEASON_POWER_RE =
  /^UPPER_PRESEASON_POWER_(FRONT_ROW|BACK_THREE)_V1$/i

export type BwAbVariant = 'A' | 'B'

export function parseGymInSeasonFamilyAndLane(sessionId: string): {
  kind: 'upper' | 'lower'
  family: ContentFamily
  laneToken: string
  lane: InSeasonVarietyLane
  ab: BwAbVariant
} | null {
  const m = sessionId.match(IN_SEASON_RE)
  if (!m) return null
  const kind = m[1].toUpperCase() === 'UPPER' ? 'upper' : 'lower'
  const family = FAMILY_FROM_TOKEN[m[2].toUpperCase()]
  if (!family) return null
  const laneToken = (m[3] ? m[3].toUpperCase() : 'BASE') as string
  const cluster = contentFamilyCluster(family)
  const table =
    kind === 'upper'
      ? cluster === 'pack'
        ? PACK_UPPER_LANE
        : BACKS_UPPER_LANE
      : cluster === 'pack'
        ? PACK_LOWER_LANE
        : BACKS_LOWER_LANE
  const lane = table[laneToken]
  if (lane == null) {
    // Token inconnu → parité A par défaut (lane 0)
    return { kind, family, laneToken, lane: 0, ab: 'A' }
  }
  return { kind, family, laneToken, lane, ab: inSeasonAbVariant(lane) }
}

function bwInSeasonId(
  kind: 'upper' | 'lower',
  family: ContentFamily,
  ab: BwAbVariant,
): string {
  const token = contentFamilyToken(family)
  const prefix = kind === 'upper' ? 'UPPER' : 'LOWER'
  return `${prefix}_BW_IN_SEASON_${token}_${ab}_V1`
}

/**
 * Mappe un ID mother gym (ou déjà BW) vers l’ID BW cible.
 * Fallback sûr : mothers V1 historiques, sinon ID inchangé.
 */
export function resolveBodyweightMotherSessionId(
  gymId: string,
  opts?: { contentFamily?: ContentFamily | null },
): string {
  if (!gymId) return gymId
  if (/_BW_/i.test(gymId)) return gymId

  const parsed = parseGymInSeasonFamilyAndLane(gymId)
  if (parsed) {
    const family = opts?.contentFamily ?? parsed.family
    return bwInSeasonId(parsed.kind, family, parsed.ab)
  }

  const full = gymId.match(FULL_IN_SEASON_RE)
  if (full) {
    return full[2] ? 'FULL_BW_BODY_IN_SEASON_B_V1' : 'FULL_BW_BODY_IN_SEASON_V1'
  }

  const power = gymId.match(PRESEASON_POWER_RE)
  if (power) {
    const group = power[1].toUpperCase()
    if (group === 'BACK_THREE') {
      const family = opts?.contentFamily
      if (family === 'half_backs') return 'UPPER_BW_PRESEASON_POWER_HALF_BACKS_V1'
      if (family === 'centers') return 'UPPER_BW_PRESEASON_POWER_CENTERS_V1'
      return 'UPPER_BW_PRESEASON_POWER_BACK_THREE_V1'
    }
    return 'UPPER_BW_PRESEASON_POWER_V1'
  }

  // Fallback legacy map keys handled by caller static map; here only pattern leftovers
  if (/^UPPER_IN_SEASON_/i.test(gymId)) return 'UPPER_BW_IN_SEASON_V1'
  if (/^LOWER_IN_SEASON_/i.test(gymId)) return 'LOWER_BW_IN_SEASON_V1'

  return gymId
}

/** True si finisher Upper BW défaut ne doit pas imposer neck (familles backs). */
export function isBacksContentFamily(family: ContentFamily | null | undefined): boolean {
  if (!family) return false
  return contentFamilyCluster(family) === 'backs'
}
