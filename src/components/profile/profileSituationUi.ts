import type { AnnualPlanningContext, InSeasonSubMode } from '../../types/annualPlanning'
import type { UserProfile } from '../../types/training'

const TREVE_SUB_MODES: ReadonlySet<InSeasonSubMode> = new Set([
  'treve_deep',
  'treve_return',
  'treve_rampup',
])

export function isTreveInSeasonSubMode(
  subMode: InSeasonSubMode | null | undefined,
): boolean {
  return subMode != null && TREVE_SUB_MODES.has(subMode)
}

/** Fenêtre 14–27j sans match futur : décompression détectée, confirmation explicite attendue. */
export function shouldShowAutoEndOfSeasonConfirm(
  ctx: AnnualPlanningContext | null | undefined,
  profile: UserProfile,
): boolean {
  if (!ctx || ctx.cycle !== 'in_season') return false
  if (ctx.inSeasonSubMode !== 'end_of_season') return false
  if (profile.planningAnchors?.seasonEndedAt) return false
  return true
}

export function treveGapWeeks(daysUntilNextMatch: number | null | undefined): number | null {
  if (daysUntilNextMatch == null || daysUntilNextMatch <= 0) return null
  return Math.max(1, Math.ceil(daysUntilNextMatch / 7))
}
