import type { AnnualPlanningContext, InSeasonSubMode } from '../../types/annualPlanning'

export type SeasonTransition =
  | { type: 'season_ended'; lastMatchDate: string; daysSinceLastMatch: number }
  | { type: 'treve_detected'; nextMatchDate: string; gapWeeks: number; subMode?: InSeasonSubMode }
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

  // UC2: Treve — in_season, any trêve subMode active OR next match > 3 weeks away
  if (
    ctx.cycle === 'in_season' &&
    (ctx.inSeasonSubMode === 'treve_deep' ||
     ctx.inSeasonSubMode === 'treve_return' ||
     ctx.inSeasonSubMode === 'treve_rampup' ||
     (ctx.daysUntilNextMatch != null && ctx.daysUntilNextMatch > TREVE_THRESHOLD_DAYS))
  ) {
    // Compute the real next match date from today + daysUntilNextMatch
    let nextMatchDate = ''
    if (ctx.daysUntilNextMatch != null) {
      const d = new Date(`${today}T12:00:00`)
      d.setDate(d.getDate() + ctx.daysUntilNextMatch)
      nextMatchDate = d.toISOString().slice(0, 10)
    }
    return {
      type: 'treve_detected',
      nextMatchDate,
      gapWeeks: Math.floor((ctx.daysUntilNextMatch ?? 0) / 7),
      subMode: ctx.inSeasonSubMode,
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
