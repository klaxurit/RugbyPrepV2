/**
 * Decide whether to wipe user-scoped localStorage when auth userId changes.
 *
 * We only clear when switching from a *known* previous user to a different one.
 * When `lastUserId` is null (first visit, storage cleared, PWA reinstall), we
 * must NOT purge the incoming user's cache — that caused profile fields to
 * reset to DEFAULT on every refresh if `rugbyprep.auth.lastUserId` was missing.
 */
export function shouldClearUserStorageOnAuthChange(
  lastUserId: string | null,
  newUserId: string | null,
): boolean {
  if (newUserId === lastUserId) return false
  if (lastUserId === null) return false
  return lastUserId !== newUserId
}
