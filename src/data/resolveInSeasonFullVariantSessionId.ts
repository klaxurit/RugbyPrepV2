/**
 * Rotation Primer / Full Body in-season (A = base, B = variante).
 */

import type { MatchContext, PositionGroup } from './weeklyTemplates'
import {
  inSeasonAbVariant,
  inSeasonVarietyLane,
  type InSeasonVarietyTrainingLevel,
} from './inSeasonVarietyLane'

export const IN_SEASON_PRIMER_BASE_IDS = {
  front_row: 'FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1',
  back_three: 'FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_V1',
} as const

export const IN_SEASON_FULL_BODY_BASE_IDS = {
  front_row: 'FULL_BODY_IN_SEASON_FRONT_ROW_V1',
  back_three: 'FULL_BODY_IN_SEASON_BACK_THREE_V1',
} as const

const PRIMER_B = {
  front_row: 'FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_B_V1',
  back_three: 'FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_B_V1',
} as const

const FULL_B = {
  front_row: 'FULL_BODY_IN_SEASON_FRONT_ROW_B_V1',
  back_three: 'FULL_BODY_IN_SEASON_BACK_THREE_B_V1',
} as const

export function resolveInSeasonPrimerSessionId(params: {
  positionGroup: PositionGroup
  mesocycleBlock: number
  mesocycleWeek?: 1 | 2 | 3 | 4
  trainingLevel?: InSeasonVarietyTrainingLevel | null
}): string {
  const lane = inSeasonVarietyLane(params)
  const ab = inSeasonAbVariant(lane)
  return ab === 'A'
    ? IN_SEASON_PRIMER_BASE_IDS[params.positionGroup]
    : PRIMER_B[params.positionGroup]
}

export function resolveInSeasonFullBodySessionId(params: {
  positionGroup: PositionGroup
  mesocycleBlock: number
  mesocycleWeek?: 1 | 2 | 3 | 4
  trainingLevel?: InSeasonVarietyTrainingLevel | null
}): string {
  const lane = inSeasonVarietyLane(params)
  const ab = inSeasonAbVariant(lane)
  return ab === 'A'
    ? IN_SEASON_FULL_BODY_BASE_IDS[params.positionGroup]
    : FULL_B[params.positionGroup]
}

/**
 * Anti-collision Primer B FR : si Upper du mois est déjà plyo, préférer Chest Pass en B2.
 * Géré dans le corpus Primer B (Dip + Plyo) ; collision Upper plyo → le resolver
 * peut forcer Primer A quand match week + lane Upper plyo. Conservateur V1 :
 * on laisse le corpus B tel quel (Dip/Plyo vs Bench/Plyo = patterns proches
 * mais volumes light) — à surveiller en QA.
 */
export function resolveInSeasonThirdSessionId(params: {
  positionGroup: PositionGroup
  matchContext: MatchContext
  mesocycleBlock: number
  mesocycleWeek?: 1 | 2 | 3 | 4
  trainingLevel?: InSeasonVarietyTrainingLevel | null
}): string {
  if (params.matchContext === 'match_week') {
    return resolveInSeasonPrimerSessionId(params)
  }
  return resolveInSeasonFullBodySessionId(params)
}

export function isInSeasonPrimerSessionId(sessionId: string): boolean {
  return (
    sessionId.startsWith('FULL_LIGHT_PRIMER_IN_SEASON_') &&
    !sessionId.includes('_BW_')
  )
}

export function isInSeasonFullBodySessionId(sessionId: string): boolean {
  return sessionId.startsWith('FULL_BODY_IN_SEASON_') && !sessionId.includes('_BW_')
}
