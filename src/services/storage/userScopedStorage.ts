/**
 * User-scoped localStorage helpers.
 *
 * All user-specific state (profile, calendar, logs, week, fatigue, dismissed
 * banners) must be keyed by userId so a new authenticated session cannot read
 * or render state belonging to a previous user.
 *
 * Usage:
 *   const key = userScopedKey('rugbyprep.calendar', userId)
 *   // → "rugbyprep.calendar.v2.{userId}" when userId present
 *   // → "rugbyprep.calendar.v2.anon"    when anonymous
 *
 * A version suffix (`v2`) is used to differentiate from legacy static keys
 * (`rugbyprep.calendar.v1`). Legacy keys are cleaned up by `clearUserStorage`.
 */

const VERSION = 'v2'
const ANON = 'anon'

/** Build a user-scoped storage key. Stable across renders for a given base + userId. */
export function userScopedKey(base: string, userId: string | null | undefined): string {
  const scope = userId && userId.length > 0 ? userId : ANON
  return `${base}.${VERSION}.${scope}`
}

export function readUserScoped<T>(base: string, userId: string | null | undefined): T | null {
  try {
    const raw = window.localStorage.getItem(userScopedKey(base, userId))
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function writeUserScoped<T>(base: string, userId: string | null | undefined, value: T): void {
  try {
    window.localStorage.setItem(userScopedKey(base, userId), JSON.stringify(value))
  } catch { /* ignore */ }
}

export function removeUserScoped(base: string, userId: string | null | undefined): void {
  try {
    window.localStorage.removeItem(userScopedKey(base, userId))
  } catch { /* ignore */ }
}

/**
 * Base names of user-scoped storage keys. Centralised so `clearUserStorage`
 * can purge all matching `.{VERSION}.*` entries in one pass.
 */
export const USER_SCOPED_BASES = [
  'rugbyprep.profile',
  'rugbyprep.week',
  'rugbyprep.week.lastnon',
  'rugbyprep.fatigue',
  'rugbyprep.calendar',
  'rugbyprep.history',
  'rugbyprep.blocklogs',
  'rugbyprep.athletictests',
  'rugbyprep.viewmode',
  'rugbyprep.acwrOverride',
  'rugbyprep.acwrBlockCollapsed',
  'rugbyprep.onboarding.completedAt',
  'rugbyforge.season_transition_dismissed',
  'rugbyforge_injury_alert_dismissed',
  'rugbyforge_week_viewed',
] as const

/** Returns the storage-key prefixes that clearUserStorage should purge. */
export function userScopedPrefixes(): string[] {
  return USER_SCOPED_BASES.map((base) => `${base}.${VERSION}.`)
}
