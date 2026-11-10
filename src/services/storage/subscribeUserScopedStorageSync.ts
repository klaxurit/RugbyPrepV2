/**
 * Sync multi-onglets pour les caches user-scoped (profil, calendrier).
 * Pattern existant : WeekProvider (storage) + useEntitlements (visibility).
 */

import { userScopedKey } from './userScopedStorage'

/**
 * Pure (côté test) : la clé StorageEvent concerne-t-elle cette base + user ?
 */
export function isUserScopedStorageEventKey(
  eventKey: string | null,
  base: string,
  userId: string | null | undefined,
): boolean {
  if (!eventKey) return false
  return eventKey === userScopedKey(base, userId)
}

/**
 * Écoute les écritures localStorage d’un autre onglet sur une base user-scoped.
 * Retourne le cleanup.
 */
export function subscribeUserScopedStorageKey(
  base: string,
  userId: string | null | undefined,
  onChange: (event: StorageEvent) => void,
): () => void {
  if (typeof window === 'undefined') return () => {}
  const onStorage = (e: StorageEvent) => {
    if (!isUserScopedStorageEventKey(e.key, base, userId)) return
    onChange(e)
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}

/**
 * Refetch quand l’onglet redevient visible (pas de polling).
 */
export function subscribeRefetchOnDocumentVisible(
  refetch: () => void,
  opts?: { enabled?: boolean },
): () => void {
  if (typeof document === 'undefined') return () => {}
  const enabled = opts?.enabled !== false
  if (!enabled) return () => {}
  const onVisibility = () => {
    if (document.visibilityState !== 'visible') return
    refetch()
  }
  document.addEventListener('visibilitychange', onVisibility)
  return () => document.removeEventListener('visibilitychange', onVisibility)
}
