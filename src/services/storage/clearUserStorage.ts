/**
 * User-scoped localStorage cleanup on sign-out or account switch.
 *
 * Important: `clearUserStorageForUser` only removes ONE user's keys so other
 * accounts on the same browser keep their offline cache. Full wipe (`clearUserStorage`)
 * is reserved for sign-up on a shared residual session.
 */

import { USER_SCOPED_BASES, removeUserScoped } from './userScopedStorage'

/** Legacy static keys from before user-scoping. */
const LEGACY_STATIC_KEYS = [
  'rugbyprep.profile.v1',
  'rugbyprep.week.v1',
  'rugbyprep.week.lastnon.v1',
  'rugbyprep.fatigue.v1',
  'rugbyprep.calendar.v1',
  'rugbyprep.history.v1',
  'rugbyprep.blocklogs.v1',
  'rugbyprep.athletictests.v1',
  'rugbyprep.viewmode.v1',
  'rugbyprep.acwrOverride.v1',
  'rugbyprep.acwrBlockCollapsed.v1',
  'rugbyforge.season_transition_dismissed',
  'rugbyforge_injury_alert_dismissed',
  'rugbyforge_week_viewed',
  'rugbyprep.onboarding.completedAt',
  'rugbyprep.demo.active',
] as const

/** Prefixes for keys shaped as `<prefix><userId>` or `<prefix><userId>.…` */
function perUserDynamicPrefixes(userId: string): readonly string[] {
  return [
    `rugbyprep.onboarding.${userId}`,
    `rugbyprep.weekSnapshot.v1.${userId}`,
    `rugbyprep.weekSnapshot.v2.${userId}.`,
    `rugbyprep.blockProgression.v1.${userId}`,
    `rugbyprep.schedulingMode.baseline.${userId}`,
    `rugbyprep.schedulingTransition.dismissed.${userId}`,
    `rugbyforge_upsell_dismissed_${userId}`,
  ]
}

function collectKeysForUser(userId: string): string[] {
  const scopedSuffix = `.v2.${userId}`
  const dynamicPrefixes = perUserDynamicPrefixes(userId)
  const toRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue

    if (key.endsWith(scopedSuffix)) {
      toRemove.push(key)
      continue
    }

    if (dynamicPrefixes.some((prefix) => key.startsWith(prefix))) {
      toRemove.push(key)
    }
  }

  return toRemove
}

/** Legacy non-user-scoped keys (pre-migration). */
export function clearLegacyUserStorage(): void {
  for (const key of LEGACY_STATIC_KEYS) {
    localStorage.removeItem(key)
  }
}

/** Removes local cache for a single authenticated user (or `anon` when userId omitted). */
export function clearUserStorageForUser(userId: string | null | undefined): void {
  const scope = userId && userId.length > 0 ? userId : 'anon'

  for (const base of USER_SCOPED_BASES) {
    removeUserScoped(base, scope === 'anon' ? null : scope)
  }

  if (scope !== 'anon') {
    for (const key of collectKeysForUser(scope)) {
      localStorage.removeItem(key)
    }
  }
}

/** Full wipe — sign-up on a device that may still hold another user's keys. */
export function clearUserStorage(): void {
  clearLegacyUserStorage()

  const toRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue

    if (LEGACY_STATIC_KEYS.includes(key as (typeof LEGACY_STATIC_KEYS)[number])) continue

  const isUserScoped =
      USER_SCOPED_BASES.some((base) => key.startsWith(`${base}.v2.`)) ||
      key.startsWith('rugbyprep.onboarding.') ||
      key.startsWith('rugbyprep.weekSnapshot.v1.') ||
      key.startsWith('rugbyprep.weekSnapshot.v2.') ||
      key.startsWith('rugbyprep.blockProgression.v1.') ||
      key.startsWith('rugbyprep.schedulingMode.baseline.') ||
      key.startsWith('rugbyprep.schedulingTransition.dismissed.') ||
      key.startsWith('rugbyforge_upsell_dismissed_')

    if (isUserScoped) toRemove.push(key)
  }

  for (const key of toRemove) {
    localStorage.removeItem(key)
  }
}
