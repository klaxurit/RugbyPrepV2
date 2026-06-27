/**
 * Decide whether to wipe user-scoped localStorage when auth userId changes.
 *
 * We only clear when switching from a *known* previous user to a *different known* user.
 * When `lastUserId` is null (first visit, storage cleared, PWA reinstall), we
 * must NOT purge the incoming user's cache — that caused profile fields to
 * reset to DEFAULT on every refresh if `rugbyprep.auth.lastUserId` was missing.
 *
 * Transitions to `null` (anonymous) are NOT cleared here: Supabase often emits a
 * transient null session during INITIAL_SESSION hydration before the cookie is
 * read, which previously wiped the profile on every hard refresh. Explicit
 * sign-out already calls `clearUserStorage()` in AuthContext.signOut.
 */
export function shouldClearUserStorageOnAuthChange(
  lastUserId: string | null,
  newUserId: string | null,
): boolean {
  if (newUserId === lastUserId) return false
  if (lastUserId === null || newUserId === null) return false
  return lastUserId !== newUserId
}
