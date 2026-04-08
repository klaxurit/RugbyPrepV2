import type { AnnualPlanningContext, InSeasonSubMode } from '../../types/annualPlanning'

export type SeasonTransition =
  | { type: 'season_ended'; lastMatchDate: string; daysSinceLastMatch: number }
  | { type: 'treve_detected'; nextMatchDate: string; gapWeeks: number; subMode?: InSeasonSubMode }
  | { type: 'playoffs_suggested' }
  | { type: 'pre_season_suggested'; reason: 'calendar_date' | 'off_season_late' }
  | { type: 'match_detected_in_offseason'; matchEventId: string; matchDate: string; opponent?: string }

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
  /** Visible (non-hidden) events — needed for match_detected_in_offseason. */
  visibleEvents?: Array<{ id?: string; date: string; type: string; opponent?: string }>
  /** Active deferral — if set, suppresses match_detected_in_offseason. */
  hasActiveDeferral?: boolean
  /** If returnToTeamTrainingAt is already set, no need to suggest. */
  hasReturnDate?: boolean
  /** User already confirmed season resume for this calendar event — suppress UC9 repeat. */
  offseasonMatchResumeAckEventId?: string
}): SeasonTransition | null {
  const { planningContext: ctx, today, dismissedUntil } = params

  const isDismissed = (type: string): boolean => {
    const until = dismissedUntil?.[type]
    if (!until) return false
    return today <= until
  }

  // UC1: Season ended — in_season, no future match, last match > 7 days ago
  // Guard: only trigger if the athlete has a meaningful calendar (firstMatchDate !== lastMatchDate
  // means at least 2 distinct match dates — a single match is likely a manual test, not a real season).
  const hasMultipleMatches = ctx.firstMatchDate != null && ctx.lastMatchDate != null && ctx.firstMatchDate !== ctx.lastMatchDate
  if (
    ctx.cycle === 'in_season' &&
    ctx.daysUntilNextMatch == null &&
    ctx.daysSinceLastMatch != null &&
    ctx.daysSinceLastMatch >= SEASON_END_THRESHOLD_DAYS &&
    ctx.lastMatchDate != null &&
    hasMultipleMatches &&
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

  // UC9: Match detected in off-season — visible future match while in off-season
  // Higher priority than pre_season_suggested (this is the active trigger, not just a suggestion)
  if (
    ctx.cycle === 'off_season' &&
    !params.hasActiveDeferral &&
    !params.hasReturnDate
  ) {
    const futureMatches = (params.visibleEvents ?? [])
      .filter((e) => e.type === 'match' && e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
    const first = futureMatches[0]
    const ackId = params.offseasonMatchResumeAckEventId
    if (first?.id && ackId === first.id) {
      // Bannière déjà confirmée pour ce match — ne pas boucler UC9
    } else if (first?.id) {
      return {
        type: 'match_detected_in_offseason',
        matchEventId: first.id,
        matchDate: first.date,
        opponent: first.opponent,
      }
    }
  }

  // UC8: Pre-season suggested — off-season athlete approaching typical pre-season window
  // Two triggers: (a) calendar date July+ or (b) off-season week >= 8
  // Only when no future match exists (FFR sync would auto-trigger pre-season otherwise)
  if (
    ctx.cycle === 'off_season' &&
    ctx.daysUntilNextMatch == null &&
    !isDismissed('pre_season_suggested')
  ) {
    const monthNow = new Date(`${today}T12:00:00`).getMonth() + 1
    const offWeek = ctx.weekNumber ?? 0

    if (monthNow >= 7) {
      return { type: 'pre_season_suggested', reason: 'calendar_date' }
    }
    if (offWeek >= 8) {
      return { type: 'pre_season_suggested', reason: 'off_season_late' }
    }
  }

  return null
}
