/**
 * Clears all user-scoped localStorage keys on sign-out.
 * Prevents stale data leaking to the next session / user.
 *
 * Keys are centralised here so a new cache only needs one addition.
 */

const USER_STORAGE_KEYS = [
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
  // Demo
  'rugbyprep.demo.active',
] as const

/** Prefixes for per-page upsell dismiss keys (rugbyforge_upsell_dismissed_*). */
const DYNAMIC_PREFIXES = [
  'rugbyforge_upsell_dismissed_',
  'rugbyprep.onboarding.',
  'rugbyprep.weekSnapshot.v1.',
  'rugbyprep.weekSnapshot.v2.',
  'rugbyprep.blockProgression.v1.',
  'rugbyprep.schedulingMode.baseline.',
  'rugbyprep.schedulingTransition.dismissed.',
] as const

export function clearUserStorage(): void {
  // Static keys
  for (const key of USER_STORAGE_KEYS) {
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
