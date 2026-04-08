import type { ActiveDeferral, CalendarEvent } from '../../types/training'

interface DeferralContext {
  activeDeferral: ActiveDeferral | undefined
  visibleEvents: CalendarEvent[]
  today: string // YYYY-MM-DD
  returnToTeamTrainingAt?: string
}

interface DeferralResult {
  /** Events to use for motor decisions (cycle, scheduling, ACWR). */
  structuralEvents: CalendarEvent[]
  /** If non-null, the deferral should be purged from the profile. */
  shouldPurge: boolean
  /** Reason for purge (for debugging / logging). */
  purgeReason?: string
}

/**
 * Pure function: determines if the active deferral is still valid
 * and produces the structural events view.
 */
export function applyDeferralRules(ctx: DeferralContext): DeferralResult {
  const { activeDeferral, visibleEvents, today, returnToTeamTrainingAt } = ctx

  // No deferral → structural = visible
  if (!activeDeferral) {
    return { structuralEvents: visibleEvents, shouldPurge: false }
  }

  const { eventId, matchDateAtDefer, expiresAt } = activeDeferral

  // Rule 1: expired
  if (today >= expiresAt) {
    return { structuralEvents: visibleEvents, shouldPurge: true, purgeReason: 'expired' }
  }

  // Rule 2: deferred match no longer exists or is hidden
  const deferredMatch = visibleEvents.find((e) => e.id === eventId)
  if (!deferredMatch) {
    return { structuralEvents: visibleEvents, shouldPurge: true, purgeReason: 'match_removed_or_hidden' }
  }

  // Rule 3: match date has passed — use the CURRENT real date of the match,
  // not matchDateAtDefer, so that a match moved slightly earlier still purges on time.
  const realMatchDate = deferredMatch.date
  if (today >= realMatchDate) {
    return { structuralEvents: visibleEvents, shouldPurge: true, purgeReason: 'match_passed' }
  }

  // Rule 4: returnToTeamTrainingAt has been set
  if (returnToTeamTrainingAt) {
    return { structuralEvents: visibleEvents, shouldPurge: true, purgeReason: 'return_date_set' }
  }

  // Rule 5: a closer future match has appeared
  const futureStructuralMatches = visibleEvents.filter(
    (e) => e.type === 'match' && e.date >= today && e.id !== eventId
  )
  const closerMatch = futureStructuralMatches.find((e) => {
    const daysDiff = daysBetween(e.date, matchDateAtDefer)
    return daysDiff > 7 // significantly closer (not just 1-2 days difference)
  })
  if (closerMatch) {
    return { structuralEvents: visibleEvents, shouldPurge: true, purgeReason: 'closer_match_appeared' }
  }

  // Rule 6: match date advanced materially (moved earlier by >14 days)
  if (deferredMatch.date !== matchDateAtDefer) {
    const drift = daysBetween(deferredMatch.date, matchDateAtDefer)
    if (drift > 14) {
      return { structuralEvents: visibleEvents, shouldPurge: true, purgeReason: 'match_date_advanced' }
    }
  }

  // Deferral is valid → filter the deferred match out of structural events
  const structuralEvents = visibleEvents.filter((e) => e.id !== eventId)
  return { structuralEvents, shouldPurge: false }
}

/** Positive days between dateA and dateB where dateA is earlier. */
function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(`${dateA}T12:00:00`)
  const b = new Date(`${dateB}T12:00:00`)
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}
