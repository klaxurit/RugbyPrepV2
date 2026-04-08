import type { TransitionEntry, SeasonTransitionState, UserProfile } from '../../types/training'

const MAX_JOURNAL_ENTRIES = 3

export function appendTransitionEntry(
  state: SeasonTransitionState | undefined,
  entry: TransitionEntry,
): SeasonTransitionState {
  const journal = [...(state?.transitionJournal ?? []), entry]
  // Keep only the last MAX_JOURNAL_ENTRIES
  const trimmed = journal.slice(-MAX_JOURNAL_ENTRIES)
  return {
    ...state,
    transitionJournal: trimmed,
  }
}

export interface RestoreResult {
  restoredAnchors: NonNullable<UserProfile['planningAnchors']>
  updatedTransitionState: SeasonTransitionState
  /** The cycle the user was in before the transition — use to derive compat seasonMode. */
  restoredCycle: TransitionEntry['from']['cycle']
}

/** Maps a cycle to the compat SeasonMode field. Playoffs has no SeasonMode equivalent → in_season. */
export function cycleToSeasonMode(cycle: TransitionEntry['from']['cycle']): 'in_season' | 'off_season' | 'pre_season' {
  if (cycle === 'off_season') return 'off_season'
  if (cycle === 'pre_season') return 'pre_season'
  return 'in_season' // in_season + playoffs → in_season
}

/**
 * Restores planningAnchors from the last journal entry.
 * Removes that entry from the journal and clears activeDeferral.
 * Returns null if no journal entry exists.
 */
export function restoreLastTransition(
  state: SeasonTransitionState | undefined,
): RestoreResult | null {
  const journal = state?.transitionJournal ?? []
  if (journal.length === 0) return null

  const lastEntry = journal[journal.length - 1]
  const remaining = journal.slice(0, -1)

  return {
    restoredAnchors: { ...lastEntry.anchorsSnapshot },
    updatedTransitionState: {
      transitionJournal: remaining.length > 0 ? remaining : undefined,
      activeDeferral: undefined, // always clear deferral on restore
    },
    restoredCycle: lastEntry.from.cycle,
  }
}

/**
 * Computes the deferral expiration date based on match distance.
 * - If match > 70 days away: expires at matchDate - 56 days
 * - Otherwise: today + 14 days
 * - Capped at match date (never past the match)
 */
export function computeDeferralExpiry(matchDate: string, today: string): string {
  const matchMs = new Date(`${matchDate}T12:00:00`).getTime()
  const todayMs = new Date(`${today}T12:00:00`).getTime()
  const distanceDays = Math.round((matchMs - todayMs) / (1000 * 60 * 60 * 24))

  let expiresMs: number
  if (distanceDays > 70) {
    // Expire 56 days before the match (= 8 weeks before, entering pre-season window)
    expiresMs = matchMs - 56 * 24 * 60 * 60 * 1000
  } else {
    // Short deferral: 14 days
    expiresMs = todayMs + 14 * 24 * 60 * 60 * 1000
  }

  // Cap at match date
  expiresMs = Math.min(expiresMs, matchMs)

  const d = new Date(expiresMs)
  return d.toISOString().slice(0, 10)
}
