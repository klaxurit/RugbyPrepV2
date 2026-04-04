import type { ACWRZone } from '../../hooks/useACWR'
export interface ActiveRecoveryEligibilityInput {
  isSequential: boolean
  isUnavailable: boolean
  todayHasSession: boolean
  todayHasMatch: boolean
  todayIsClubDay: boolean
  readinessScore: number
  acwrZone: ACWRZone | null
  isRehabP1: boolean
  hasSurface: boolean
}

/**
 * Determines whether the active-recovery card should be shown.
 *
 * `isRecoveryDay` (J+1 after match) changes the card copy but does NOT
 * override eligibility — the same guardrails apply on recovery days.
 */
export function isActiveRecoveryEligible(input: ActiveRecoveryEligibilityInput): boolean {
  return (
    !input.isSequential &&
    !input.isUnavailable &&
    !input.todayHasSession &&
    !input.todayHasMatch &&
    !input.todayIsClubDay &&
    input.readinessScore >= 40 &&
    input.acwrZone !== 'critical' &&
    !input.isRehabP1 &&
    input.hasSurface
  )
}
