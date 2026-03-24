/**
 * Logique de hard-block global partagée par ProgramPage, WeekPage, SessionDetailPage.
 *
 * Seuls BETA_PAUSED et U18_NO_CONSENT bloquent TOUT affichage programme.
 * Les autres raisons beta (rehab, shoulder, off_season…) sont gérées par
 * l'orchestrateur qui peut proposer un fallback mother-session.
 */
import type { UserProfile } from '../../types/training'
import {
  checkBetaEligibility,
  type BetaEligibilityReason,
} from '../betaEligibility'

const HARD_BLOCK_REASONS: ReadonlySet<BetaEligibilityReason> = new Set([
  'BETA_PAUSED',
  'U18_NO_CONSENT',
])

export interface GlobalProgramHardBlockResult {
  hasHardBlock: boolean
  hardBlockReasons: BetaEligibilityReason[]
}

export function getGlobalProgramHardBlock(profile: UserProfile): GlobalProgramHardBlockResult {
  const { reasons } = checkBetaEligibility(profile)
  const hardBlockReasons = reasons.filter((r) => HARD_BLOCK_REASONS.has(r))
  return {
    hasHardBlock: hardBlockReasons.length > 0,
    hardBlockReasons,
  }
}
