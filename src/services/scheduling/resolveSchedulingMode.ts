import type { ResolveSchedulingModeParams, SchedulingModeResult } from '../../types/scheduling'
import { parseLocalDate } from './parseLocalDate'

/**
 * Determines whether the week should be presented in calendar mode
 * (date-driven, anchored to matches) or sequential mode (block progression).
 *
 * Pure, synchronous, no side effects.
 *
 * Resolution hierarchy (6 levels):
 *  1. Future match within 42 days           → calendar, high
 *  2. Recent past match within 28 days      → calendar, medium
 *  3. planningAnchors.seasonEndedAt set     → sequential, high
 *  4. onboardingCycleHint = 'off_season'    → sequential, high
 *  5. onboardingCycleHint = in/pre_season   → sequential, medium
 *  6. No data at all                        → sequential, low
 */
export function resolveSchedulingMode(params: ResolveSchedulingModeParams): SchedulingModeResult {
  const { events, today, planningAnchors } = params
  const todayMs = parseLocalDate(today).getTime()

  // Resolve onboardingCycleHint: explicit param takes precedence, then anchors
  const onboardingCycleHint =
    params.onboardingCycleHint ?? planningAnchors?.onboardingCycleHint

  // Filter: only visible match events
  const matchEvents = events.filter(
    (e) => e.type === 'match' && e.user_hidden !== true,
  )

  // Level 1: future matches within 42 days
  const horizonMs = 42 * 24 * 60 * 60 * 1000
  const futureMatches = matchEvents.filter((e) => {
    const eventMs = parseLocalDate(e.date).getTime()
    const delta = eventMs - todayMs
    return delta >= 0 && delta <= horizonMs
  })

  // Level 1: future matches within 42 days — only force calendar if NOT in off-season.
  // In off-season, future matches are handled via the match_detected_in_offseason banner.
  if (futureMatches.length > 0 && params.resolvedCycle !== 'off_season') {
    return {
      mode: 'calendar',
      confidence: 'high',
      reason: 'future_matches_detected',
      calendarSignalStrength: Math.min(futureMatches.length, 100),
    }
  }

  // Level 2: season ended explicitly — takes priority over recent past matches.
  // If the user has club training days configured, keep calendar mode (they still
  // have a weekly rhythm even in off-season). Sequential only for users without
  // any weekly structure.
  if (planningAnchors?.seasonEndedAt) {
    return {
      mode: params.hasClubDays ? 'calendar' : 'sequential',
      confidence: 'high',
      reason: 'season_ended',
      calendarSignalStrength: params.hasClubDays ? 1 : 0,
    }
  }

  // Level 3: recent past match within 28 days (only if season NOT explicitly ended)
  const recentMs = 28 * 24 * 60 * 60 * 1000
  const recentPastMatch = matchEvents.some((e) => {
    const eventMs = parseLocalDate(e.date).getTime()
    const delta = todayMs - eventMs
    return delta > 0 && delta <= recentMs
  })

  if (recentPastMatch) {
    return {
      mode: 'calendar',
      confidence: 'medium',
      reason: 'recent_match_detected',
      calendarSignalStrength: 0,
    }
  }

  // Level 4: onboarding hint = off_season
  if (onboardingCycleHint === 'off_season') {
    return {
      mode: 'sequential',
      confidence: 'high',
      reason: 'onboarding_off_season',
      calendarSignalStrength: 0,
    }
  }

  // Level 5: onboarding hint = in_season or pre_season
  if (onboardingCycleHint === 'in_season' || onboardingCycleHint === 'pre_season') {
    return {
      mode: 'sequential',
      confidence: 'medium',
      reason: 'onboarding_season_hint',
      calendarSignalStrength: 0,
    }
  }

  // Level 6: no data at all
  return {
    mode: 'sequential',
    confidence: 'low',
    reason: 'no_data',
    calendarSignalStrength: 0,
  }
}
