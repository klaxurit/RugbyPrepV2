/**
 * Rotation du contraste Upper in-season (intention de cycle — corpus, pas runtime).
 *
 * 4 lanes sur mesocycleBlock (1→lane0 … 4→lane3, puis 5→0…).
 * Bench reste l’exo A ; seul le B change.
 *
 * Collisions Primer (semaine de match, fréquence 3) :
 * - avants lane 3 : éviter Supine (déjà au Primer) → Landmine
 * - arrières lane 0 : éviter Landmine (déjà au Primer) → Push Press
 *
 * Fallbacks matos (med ball → cable → landmine → plyo) restent
 * `gymVariantChains` — hors de ce module.
 */

import type { MatchContext, PositionGroup } from './weeklyTemplates'

export type InSeasonUpperContrastLane = 0 | 1 | 2 | 3

export const IN_SEASON_UPPER_BASE_IDS = {
  front_row: 'UPPER_IN_SEASON_FRONT_ROW_V1',
  back_three: 'UPPER_IN_SEASON_BACK_THREE_V1',
} as const

/** Toutes les mothers Upper in-season gym (base + lanes). */
export const IN_SEASON_UPPER_SESSION_IDS = [
  'UPPER_IN_SEASON_FRONT_ROW_V1',
  'UPPER_IN_SEASON_FRONT_ROW_CHESTPASS_V1',
  'UPPER_IN_SEASON_FRONT_ROW_LANDMINE_V1',
  'UPPER_IN_SEASON_FRONT_ROW_SUPINE_V1',
  'UPPER_IN_SEASON_BACK_THREE_V1',
  'UPPER_IN_SEASON_BACK_THREE_LANDMINE_V1',
  'UPPER_IN_SEASON_BACK_THREE_PLYO_V1',
  'UPPER_IN_SEASON_BACK_THREE_ROTATIONAL_V1',
  'UPPER_IN_SEASON_BACK_THREE_PUSHPRESS_V1',
] as const

export function inSeasonUpperContrastLane(mesocycleBlock: number): InSeasonUpperContrastLane {
  const block =
    Number.isFinite(mesocycleBlock) && mesocycleBlock >= 1 ? Math.floor(mesocycleBlock) : 1
  return ((block - 1) % 4) as InSeasonUpperContrastLane
}

export function resolveInSeasonUpperSessionId(params: {
  positionGroup: PositionGroup
  mesocycleBlock: number
  /** Absent en fréquence 2 (deload) → pas de collision Primer. */
  matchContext?: MatchContext
}): string {
  const lane = inSeasonUpperContrastLane(params.mesocycleBlock)
  const matchWeek = params.matchContext === 'match_week'

  if (params.positionGroup === 'front_row') {
    switch (lane) {
      case 0:
        return 'UPPER_IN_SEASON_FRONT_ROW_V1' // Bench + Plyo
      case 1:
        return 'UPPER_IN_SEASON_FRONT_ROW_CHESTPASS_V1'
      case 2:
        return 'UPPER_IN_SEASON_FRONT_ROW_LANDMINE_V1'
      case 3:
        // Primer avants = Dip + Supine — éviter double Supine en semaine de match
        return matchWeek
          ? 'UPPER_IN_SEASON_FRONT_ROW_LANDMINE_V1'
          : 'UPPER_IN_SEASON_FRONT_ROW_SUPINE_V1'
    }
  }

  switch (lane) {
    case 0:
      // Primer 3/4 = Landmine + Plyo — Push Press hors Primer
      return matchWeek
        ? 'UPPER_IN_SEASON_BACK_THREE_PUSHPRESS_V1'
        : 'UPPER_IN_SEASON_BACK_THREE_LANDMINE_V1'
    case 1:
      return 'UPPER_IN_SEASON_BACK_THREE_PLYO_V1'
    case 2:
      return 'UPPER_IN_SEASON_BACK_THREE_V1' // Bench + Med Ball Chest Pass
    case 3:
      return 'UPPER_IN_SEASON_BACK_THREE_ROTATIONAL_V1'
  }
}

export function isInSeasonUpperSessionId(sessionId: string): boolean {
  return (
    sessionId === IN_SEASON_UPPER_BASE_IDS.front_row ||
    sessionId === IN_SEASON_UPPER_BASE_IDS.back_three ||
    sessionId.startsWith('UPPER_IN_SEASON_FRONT_ROW_') ||
    sessionId.startsWith('UPPER_IN_SEASON_BACK_THREE_')
  )
}
