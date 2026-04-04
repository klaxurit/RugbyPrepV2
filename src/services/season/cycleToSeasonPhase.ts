import type { AnnualCycle } from '../../types/annualPlanning'
import type { SeasonPhase } from '../../types/training'

const CYCLE_TO_PHASE: Record<AnnualCycle, SeasonPhase> = {
  off_season: 'off-season',
  pre_season: 'pre-season',
  in_season: 'in-season',
  playoffs: 'playoffs',
}

/** Maps the planning context's AnnualCycle to the UI-facing SeasonPhase. */
export function cycleToSeasonPhase(cycle: AnnualCycle | undefined | null): SeasonPhase {
  return cycle ? CYCLE_TO_PHASE[cycle] : 'in-season'
}
