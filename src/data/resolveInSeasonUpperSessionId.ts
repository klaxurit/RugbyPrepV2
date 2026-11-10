/**
 * Rotation du contraste Upper in-season (intention de cycle — corpus, pas runtime).
 *
 * Bench reste l’exo A ; seul le B change (4 lanes) + finisher famille.
 * Cadence : Fondations = 1 lane / mésocycle ; Performance = 1 lane / 2 semaines.
 *
 * `contentFamily` sélectionne le pool mother ; `positionGroup` reste le fallback legacy.
 */

import type { MatchContext, PositionGroup } from './weeklyTemplates'
import {
  contentFamilyCluster,
  contentFamilyToken,
  contentFamilyToPositionGroup,
  type ContentFamily,
} from './contentFamily'
import {
  inSeasonVarietyLane,
  type InSeasonVarietyLane,
  type InSeasonVarietyTrainingLevel,
} from './inSeasonVarietyLane'

export type InSeasonUpperContrastLane = InSeasonVarietyLane

const PACK_LANES: Record<InSeasonVarietyLane, string> = {
  0: '',
  1: 'CHESTPASS',
  2: 'LANDMINE',
  3: 'SUPINE',
}

const BACKS_LANES: Record<InSeasonVarietyLane, string> = {
  0: 'LANDMINE',
  1: 'PLYO',
  2: '',
  3: 'ROTATIONAL',
}

export const IN_SEASON_UPPER_BASE_IDS = {
  front_row: 'UPPER_IN_SEASON_FRONT_ROW_V1',
  back_three: 'UPPER_IN_SEASON_BACK_THREE_V1',
} as const

function upperId(family: ContentFamily, laneSuffix: string): string {
  const token = contentFamilyToken(family)
  return laneSuffix
    ? `UPPER_IN_SEASON_${token}_${laneSuffix}_V1`
    : `UPPER_IN_SEASON_${token}_V1`
}

/** Toutes les mothers Upper in-season gym (6 familles × lanes + pushpress collision). */
export const IN_SEASON_UPPER_SESSION_IDS = [
  // pack cluster
  'UPPER_IN_SEASON_FRONT_ROW_V1',
  'UPPER_IN_SEASON_FRONT_ROW_CHESTPASS_V1',
  'UPPER_IN_SEASON_FRONT_ROW_LANDMINE_V1',
  'UPPER_IN_SEASON_FRONT_ROW_SUPINE_V1',
  'UPPER_IN_SEASON_SECOND_ROW_V1',
  'UPPER_IN_SEASON_SECOND_ROW_CHESTPASS_V1',
  'UPPER_IN_SEASON_SECOND_ROW_LANDMINE_V1',
  'UPPER_IN_SEASON_SECOND_ROW_SUPINE_V1',
  'UPPER_IN_SEASON_BACK_ROW_V1',
  'UPPER_IN_SEASON_BACK_ROW_CHESTPASS_V1',
  'UPPER_IN_SEASON_BACK_ROW_LANDMINE_V1',
  'UPPER_IN_SEASON_BACK_ROW_SUPINE_V1',
  // backs cluster
  'UPPER_IN_SEASON_BACK_THREE_V1',
  'UPPER_IN_SEASON_BACK_THREE_LANDMINE_V1',
  'UPPER_IN_SEASON_BACK_THREE_PLYO_V1',
  'UPPER_IN_SEASON_BACK_THREE_ROTATIONAL_V1',
  'UPPER_IN_SEASON_BACK_THREE_PUSHPRESS_V1',
  'UPPER_IN_SEASON_HALF_BACKS_V1',
  'UPPER_IN_SEASON_HALF_BACKS_LANDMINE_V1',
  'UPPER_IN_SEASON_HALF_BACKS_PLYO_V1',
  'UPPER_IN_SEASON_HALF_BACKS_ROTATIONAL_V1',
  'UPPER_IN_SEASON_HALF_BACKS_PUSHPRESS_V1',
  'UPPER_IN_SEASON_CENTERS_V1',
  'UPPER_IN_SEASON_CENTERS_LANDMINE_V1',
  'UPPER_IN_SEASON_CENTERS_PLYO_V1',
  'UPPER_IN_SEASON_CENTERS_ROTATIONAL_V1',
  'UPPER_IN_SEASON_CENTERS_PUSHPRESS_V1',
] as const

/** @deprecated Préférer `inSeasonVarietyLane`. */
export function inSeasonUpperContrastLane(mesocycleBlock: number): InSeasonUpperContrastLane {
  return inSeasonVarietyLane({ mesocycleBlock, trainingLevel: 'starter' })
}

function resolveFamily(
  contentFamily: ContentFamily | null | undefined,
  positionGroup: PositionGroup,
): ContentFamily {
  if (contentFamily) return contentFamily
  return positionGroup === 'front_row' ? 'front_row' : 'back_three'
}

export function resolveInSeasonUpperSessionId(params: {
  positionGroup: PositionGroup
  /** Famille mother (6). Absente → dérivée du binôme planning. */
  contentFamily?: ContentFamily | null
  mesocycleBlock: number
  mesocycleWeek?: 1 | 2 | 3 | 4
  trainingLevel?: InSeasonVarietyTrainingLevel | null
  matchContext?: MatchContext
}): string {
  const family = resolveFamily(params.contentFamily, params.positionGroup)
  const cluster = contentFamilyCluster(family)
  const lane = inSeasonVarietyLane({
    mesocycleBlock: params.mesocycleBlock,
    mesocycleWeek: params.mesocycleWeek,
    trainingLevel: params.trainingLevel ?? 'starter',
  })
  const matchWeek = params.matchContext === 'match_week'

  if (cluster === 'pack') {
    let suffix = PACK_LANES[lane]
    // Primer avants A = Dip + Supine — éviter double Supine en semaine de match
    if (lane === 3 && matchWeek) suffix = 'LANDMINE'
    return upperId(family, suffix)
  }

  // backs
  if (lane === 0 && matchWeek) {
    return upperId(family, 'PUSHPRESS')
  }
  return upperId(family, BACKS_LANES[lane])
}

export function isInSeasonUpperSessionId(sessionId: string): boolean {
  return (
    /^UPPER_IN_SEASON_(FRONT_ROW|SECOND_ROW|BACK_ROW|HALF_BACKS|CENTERS|BACK_THREE)(_[A-Z]+)?_V1$/i.test(
      sessionId,
    )
  )
}

export function inSeasonUpperBaseIdForFamily(family: ContentFamily): string {
  return upperId(family, '')
}

export function inSeasonUpperBaseIdForPositionGroup(positionGroup: PositionGroup): string {
  return IN_SEASON_UPPER_BASE_IDS[positionGroup]
}

/** Pour weeklyTemplates : bases à remplacer = toutes les bases famille du cluster. */
export function inSeasonUpperBaseIdsToReplace(positionGroup: PositionGroup): string[] {
  if (positionGroup === 'front_row') {
    return [
      'UPPER_IN_SEASON_FRONT_ROW_V1',
      'UPPER_IN_SEASON_SECOND_ROW_V1',
      'UPPER_IN_SEASON_BACK_ROW_V1',
    ]
  }
  return [
    'UPPER_IN_SEASON_BACK_THREE_V1',
    'UPPER_IN_SEASON_HALF_BACKS_V1',
    'UPPER_IN_SEASON_CENTERS_V1',
  ]
}

export { contentFamilyToPositionGroup }
