import type { AnnualCycle } from '../../types/annualPlanning'
import type { SeasonTransition } from '../../services/season/detectSeasonTransitions'

/**
 * Profile manual season-end buttons duplicate Home's season_ended banner.
 * See MaSituationSection and useSeasonTransitions ownership comments.
 */
export function shouldShowProfileSeasonActions(params: {
  seasonTransition: SeasonTransition | null | undefined
  cycle: AnnualCycle
}): boolean {
  const { seasonTransition, cycle } = params
  if (!seasonTransition) return true
  if (
    seasonTransition.type === 'season_ended' &&
    (cycle === 'in_season' || cycle === 'playoffs')
  ) {
    return false
  }
  return true
}
