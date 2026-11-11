import type { AnnualPlanningContext } from '../../types/annualPlanning'
import type { ClubContactProxy } from '../../types/annualPlanning'
import type { HomeHeroState } from '../../services/home/detectHomeState'
import type { HeroMood } from './heroMood'

/**
 * Seule porte check-in sur Home : contact club (jour club, in-season/playoffs).
 * La forme vient des scores fin de séance / match + ACWR — pas d’un toggle Home.
 */
export function isClubContactCheckInDay(
  heroState: HomeHeroState,
  cycle: AnnualPlanningContext['cycle'] | undefined,
): boolean {
  return (
    heroState === 'club_day'
    && (cycle === 'in_season' || cycle === 'playoffs')
  )
}

export function clubProxyToHeroMood(proxy: ClubContactProxy): HeroMood {
  return proxy === 'hard' ? 'tired' : 'fit'
}

export function heroMoodToClubProxy(mood: HeroMood): ClubContactProxy {
  return mood === 'tired' ? 'hard' : 'normal'
}
