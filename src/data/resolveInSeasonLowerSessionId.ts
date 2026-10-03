/**
 * Rotation Lower in-season — pools validés (variété planifiée, ancres stables).
 */

import type { PositionGroup } from './weeklyTemplates'
import {
  inSeasonVarietyLane,
  type InSeasonVarietyLane,
  type InSeasonVarietyTrainingLevel,
} from './inSeasonVarietyLane'

export const IN_SEASON_LOWER_BASE_IDS = {
  front_row: 'LOWER_IN_SEASON_FRONT_ROW_V1',
  back_three: 'LOWER_IN_SEASON_BACK_THREE_V1',
} as const

export const IN_SEASON_LOWER_SESSION_IDS = [
  'LOWER_IN_SEASON_FRONT_ROW_V1',
  'LOWER_IN_SEASON_FRONT_ROW_FRONTSQUAT_V1',
  'LOWER_IN_SEASON_FRONT_ROW_TBRDL_V1',
  'LOWER_IN_SEASON_FRONT_ROW_PAUSEJUMP_V1',
  'LOWER_IN_SEASON_BACK_THREE_V1',
  'LOWER_IN_SEASON_BACK_THREE_RDL_V1',
  'LOWER_IN_SEASON_BACK_THREE_SLHIP_V1',
  'LOWER_IN_SEASON_BACK_THREE_SHRUG_V1',
] as const

const FRONT_ROW_BY_LANE: Record<InSeasonVarietyLane, string> = {
  0: 'LOWER_IN_SEASON_FRONT_ROW_V1',
  1: 'LOWER_IN_SEASON_FRONT_ROW_FRONTSQUAT_V1',
  2: 'LOWER_IN_SEASON_FRONT_ROW_TBRDL_V1',
  3: 'LOWER_IN_SEASON_FRONT_ROW_PAUSEJUMP_V1',
}

const BACK_THREE_BY_LANE: Record<InSeasonVarietyLane, string> = {
  0: 'LOWER_IN_SEASON_BACK_THREE_V1',
  1: 'LOWER_IN_SEASON_BACK_THREE_RDL_V1',
  2: 'LOWER_IN_SEASON_BACK_THREE_SLHIP_V1',
  3: 'LOWER_IN_SEASON_BACK_THREE_SHRUG_V1',
}

export function resolveInSeasonLowerSessionId(params: {
  positionGroup: PositionGroup
  mesocycleBlock: number
  mesocycleWeek?: 1 | 2 | 3 | 4
  trainingLevel?: InSeasonVarietyTrainingLevel | null
}): string {
  const lane = inSeasonVarietyLane(params)
  return params.positionGroup === 'front_row'
    ? FRONT_ROW_BY_LANE[lane]
    : BACK_THREE_BY_LANE[lane]
}

export function isInSeasonLowerSessionId(sessionId: string): boolean {
  return (
    sessionId === IN_SEASON_LOWER_BASE_IDS.front_row ||
    sessionId === IN_SEASON_LOWER_BASE_IDS.back_three ||
    sessionId.startsWith('LOWER_IN_SEASON_FRONT_ROW_') ||
    sessionId.startsWith('LOWER_IN_SEASON_BACK_THREE_')
  )
}
