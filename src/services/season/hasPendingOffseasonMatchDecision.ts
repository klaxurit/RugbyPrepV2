import type { CalendarEvent, UserProfile } from '../../types/training'

/**
 * Vrai tant qu’un match futur non-amical en intersaison attend une décision
 * sur la bannière Home (`match_detected_in_offseason`) — pas encore ack ni déféré.
 */
export function hasPendingOffseasonMatchDecision(
  profile: UserProfile,
  visibleEvents: CalendarEvent[],
  today: string,
): boolean {
  if (profile.seasonMode !== 'off_season') return false
  const futureMatches = visibleEvents
    .filter((e) => e.type === 'match' && e.date >= today && !e.user_hidden)
    .sort((a, b) => a.date.localeCompare(b.date))
  const futureMatch = futureMatches.find((e) => e.match_kind !== 'friendly')
  if (!futureMatch?.id) return false
  const st = profile.seasonTransitionState
  if (st?.offseasonMatchResumeAckEventId === futureMatch.id) return false
  if (st?.activeDeferral?.eventId === futureMatch.id) return false
  return true
}
