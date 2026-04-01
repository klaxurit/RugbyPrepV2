/**
 * Logique de hard-block global partagée par ProgramPage, WeekPage, SessionDetailPage.
 *
 * Seul BETA_PAUSED bloque TOUT affichage programme (kill switch opérationnel).
 * App réservée aux adultes — pas de guard U18.
 * Le moteur annuel gère tous les cycles — pas de guard off_season.
 */
import type { UserProfile } from '../../types/training'
import {
  checkBetaEligibility,
  type BetaEligibilityReason,
} from '../betaEligibility'

const HARD_BLOCK_REASONS: ReadonlySet<BetaEligibilityReason> = new Set([
  'BETA_PAUSED',
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
