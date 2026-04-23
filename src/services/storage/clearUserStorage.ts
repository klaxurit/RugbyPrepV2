/**
 * Clears all user-scoped localStorage keys on sign-out OR userId change.
 * Prevents stale data from leaking to the next session / user.
 *
 * Two classes of keys are purged:
 *   1. Legacy static keys (`rugbyprep.profile.v1`, etc.) — still present on
 *      upgraded installs that haven't been wiped yet.
 *   2. User-scoped keys (`rugbyprep.<base>.v2.<userId>`) — the new per-user
 *      scheme. All prefixes are enumerated centrally in `userScopedStorage.ts`.
 */

import { userScopedPrefixes } from './userScopedStorage'

/** Legacy static keys from before user-scoping. Kept only for migration cleanup. */
const LEGACY_STATIC_KEYS = [
  // Profile & program
  'rugbyprep.profile.v1',
  'rugbyprep.week.v1',
  'rugbyprep.week.lastnon.v1',
  'rugbyprep.fatigue.v1',
  'rugbyprep.calendar.v1',
  'rugbyprep.history.v1',
  'rugbyprep.blocklogs.v1',
  'rugbyprep.athletictests.v1',
  // UI state
  'rugbyprep.viewmode.v1',
  'rugbyprep.acwrOverride.v1',
  'rugbyprep.acwrBlockCollapsed.v1',
  // Season & banners
  'rugbyforge.season_transition_dismissed',
  'rugbyforge_injury_alert_dismissed',
  'rugbyforge_week_viewed',
  'rugbyprep.onboarding.completedAt',
  // Demo
  'rugbyprep.demo.active',
] as const

/** Per-user key prefixes that clearUserStorage should purge. */
const DYNAMIC_PREFIXES = [
  'rugbyforge_upsell_dismissed_',
  'rugbyprep.onboarding.',
  'rugbyprep.weekSnapshot.v1.',
  'rugbyprep.weekSnapshot.v2.',
  'rugbyprep.blockProgression.v1.',
  'rugbyprep.schedulingMode.baseline.',
  'rugbyprep.schedulingTransition.dismissed.',
  // New user-scoped prefixes from userScopedStorage.ts
  ...userScopedPrefixes(),
] as const

export function clearUserStorage(): void {
  // Legacy static keys (pre-migration installs)
  for (const key of LEGACY_STATIC_KEYS) {
    localStorage.removeItem(key)
  }

  // Dynamic keys (per-page, per-user)
  const toRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && DYNAMIC_PREFIXES.some((p) => key.startsWith(p))) {
      toRemove.push(key)
    }
  }
  for (const key of toRemove) {
    localStorage.removeItem(key)
  }
}
