import type { AnnualPlanningContext } from '../../types/annualPlanning'

export type SeasonTransition =
  | { type: 'season_ended'; lastMatchDate: string; daysSinceLastMatch: number }
  | { type: 'treve_detected'; nextMatchDate: string; gapWeeks: number }
  | { type: 'playoffs_suggested' }

const SEASON_END_THRESHOLD_DAYS = 7
const TREVE_THRESHOLD_DAYS = 21
const PLAYOFFS_MONTHS = new Set([4, 5]) // April, May

/**
 * Detects season lifecycle transitions from the current planning context.
 * Returns the highest-priority transition, or null.
 *
 * - season_ended: no future match + last match > 7 days ago
 * - treve_detected: next match > 3 weeks away (informational)
 * - playoffs_suggested: April/May + in_season + future matches
 */
export function detectSeasonTransitions(params: {
  planningContext: AnnualPlanningContext
  today: string
  dismissedUntil?: Record<string, string>
}): SeasonTransition | null {
  const { planningContext: ctx, today, dismissedUntil } = params

  const isDismissed = (type: string): boolean => {
    const until = dismissedUntil?.[type]
    if (!until) return false
    return today <= until
  }

  // UC1: Season ended — in_season, no future match, last match > 7 days ago
  if (
    ctx.cycle === 'in_season' &&
    ctx.daysUntilNextMatch == null &&
    ctx.daysSinceLastMatch != null &&
    ctx.daysSinceLastMatch >= SEASON_END_THRESHOLD_DAYS &&
    ctx.lastMatchDate != null &&
    !isDismissed('season_ended')
  ) {
    return {
      type: 'season_ended',
      lastMatchDate: ctx.lastMatchDate,
      daysSinceLastMatch: ctx.daysSinceLastMatch,
    }
  }

  // UC2: Treve — in_season, next match > 3 weeks away
  if (
    ctx.cycle === 'in_season' &&
    ctx.daysUntilNextMatch != null &&
    ctx.daysUntilNextMatch > TREVE_THRESHOLD_DAYS
  ) {
    const nextMatch = ctx.firstMatchDate // approximate — the actual next match date
    return {
      type: 'treve_detected',
      nextMatchDate: nextMatch ?? '',
      gapWeeks: Math.floor(ctx.daysUntilNextMatch / 7),
    }
  }

  // UC7: Playoffs suggested — April/May + in_season + future matches
  const month = new Date(`${today}T12:00:00`).getMonth() + 1
  if (
    PLAYOFFS_MONTHS.has(month) &&
    ctx.cycle === 'in_season' &&
    ctx.daysUntilNextMatch != null &&
    !isDismissed('playoffs_suggested')
  ) {
    return { type: 'playoffs_suggested' }
  }

  return null
}
