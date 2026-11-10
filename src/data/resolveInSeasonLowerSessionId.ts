/**
 * Rotation Lower in-season — pools par famille de contenu (6) × lanes cluster.
 */

import type { PositionGroup } from './weeklyTemplates'
import {
  contentFamilyCluster,
  contentFamilyToken,
  type ContentFamily,
} from './contentFamily'
import {
  inSeasonVarietyLane,
  type InSeasonVarietyLane,
  type InSeasonVarietyTrainingLevel,
} from './inSeasonVarietyLane'

export const IN_SEASON_LOWER_BASE_IDS = {
  front_row: 'LOWER_IN_SEASON_FRONT_ROW_V1',
  back_three: 'LOWER_IN_SEASON_BACK_THREE_V1',
} as const

const PACK_LANES: Record<InSeasonVarietyLane, string> = {
  0: '',
  1: 'FRONTSQUAT',
  2: 'TBRDL',
  3: 'PAUSEJUMP',
}

const BACKS_LANES: Record<InSeasonVarietyLane, string> = {
  0: '',
  1: 'RDL',
  2: 'SLHIP',
  3: 'SHRUG',
}

function lowerId(family: ContentFamily, laneSuffix: string): string {
  const token = contentFamilyToken(family)
  return laneSuffix
    ? `LOWER_IN_SEASON_${token}_${laneSuffix}_V1`
    : `LOWER_IN_SEASON_${token}_V1`
}

export const IN_SEASON_LOWER_SESSION_IDS = [
  'LOWER_IN_SEASON_FRONT_ROW_V1',
  'LOWER_IN_SEASON_FRONT_ROW_FRONTSQUAT_V1',
  'LOWER_IN_SEASON_FRONT_ROW_TBRDL_V1',
  'LOWER_IN_SEASON_FRONT_ROW_PAUSEJUMP_V1',
  'LOWER_IN_SEASON_SECOND_ROW_V1',
  'LOWER_IN_SEASON_SECOND_ROW_FRONTSQUAT_V1',
  'LOWER_IN_SEASON_SECOND_ROW_TBRDL_V1',
  'LOWER_IN_SEASON_SECOND_ROW_PAUSEJUMP_V1',
  'LOWER_IN_SEASON_BACK_ROW_V1',
  'LOWER_IN_SEASON_BACK_ROW_FRONTSQUAT_V1',
  'LOWER_IN_SEASON_BACK_ROW_TBRDL_V1',
  'LOWER_IN_SEASON_BACK_ROW_PAUSEJUMP_V1',
  'LOWER_IN_SEASON_BACK_THREE_V1',
  'LOWER_IN_SEASON_BACK_THREE_RDL_V1',
  'LOWER_IN_SEASON_BACK_THREE_SLHIP_V1',
  'LOWER_IN_SEASON_BACK_THREE_SHRUG_V1',
  'LOWER_IN_SEASON_HALF_BACKS_V1',
  'LOWER_IN_SEASON_HALF_BACKS_RDL_V1',
  'LOWER_IN_SEASON_HALF_BACKS_SLHIP_V1',
  'LOWER_IN_SEASON_HALF_BACKS_SHRUG_V1',
  'LOWER_IN_SEASON_CENTERS_V1',
  'LOWER_IN_SEASON_CENTERS_RDL_V1',
  'LOWER_IN_SEASON_CENTERS_SLHIP_V1',
  'LOWER_IN_SEASON_CENTERS_SHRUG_V1',
] as const

function resolveFamily(
  contentFamily: ContentFamily | null | undefined,
  positionGroup: PositionGroup,
): ContentFamily {
  if (contentFamily) return contentFamily
  return positionGroup === 'front_row' ? 'front_row' : 'back_three'
}

export function resolveInSeasonLowerSessionId(params: {
  positionGroup: PositionGroup
  contentFamily?: ContentFamily | null
  mesocycleBlock: number
  mesocycleWeek?: 1 | 2 | 3 | 4
  trainingLevel?: InSeasonVarietyTrainingLevel | null
}): string {
  const family = resolveFamily(params.contentFamily, params.positionGroup)
  const cluster = contentFamilyCluster(family)
  const lane = inSeasonVarietyLane(params)
  const suffix = cluster === 'pack' ? PACK_LANES[lane] : BACKS_LANES[lane]
  return lowerId(family, suffix)
}

export function isInSeasonLowerSessionId(sessionId: string): boolean {
  return /^LOWER_IN_SEASON_(FRONT_ROW|SECOND_ROW|BACK_ROW|HALF_BACKS|CENTERS|BACK_THREE)(_[A-Z]+)?_V1$/i.test(
    sessionId,
  )
}
