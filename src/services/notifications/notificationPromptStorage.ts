import { userScopedKey } from '../storage/userScopedStorage'

export type NotificationPromptKind = 'onboarding' | 'rest_timer' | 'combined'

const COOLDOWN_DAYS = 7
const STORAGE_BASE = 'rugbyprep.notif.promptDismissedUntil'
const DEFER_UNTIL_GYM_BASE = 'rugbyprep.notif.deferUntilGymCount'
const SESSION_SKIP_KEY = 'rugbyprep.notif.skipThisBrowserSession'

function storageKey(kind: NotificationPromptKind, userId: string | null | undefined): string {
  return userScopedKey(`${STORAGE_BASE}.${kind}`, userId)
}

function deferGymKey(userId: string | null | undefined): string {
  return userScopedKey(DEFER_UNTIL_GYM_BASE, userId)
}

function addDaysYmd(fromYmd: string, days: number): string {
  const d = new Date(`${fromYmd}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Marque « Plus tard » pour la session navigateur courante (onglet). */
export function markNotificationPromptSkippedThisSession(): void {
  try {
    window.sessionStorage.setItem(SESSION_SKIP_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function isNotificationPromptSkippedThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_SKIP_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Après « Plus tard » à l’onboarding : ne plus redemander avant N séances gym.
 * Couvre rappels + repos (même permission push).
 */
export function deferNotificationPromptsUntilGymCount(
  userId: string | null | undefined,
  minCompletedGymSessions: number,
): void {
  try {
    window.localStorage.setItem(deferGymKey(userId), String(minCompletedGymSessions))
  } catch {
    /* ignore */
  }
}

export function getDeferredNotificationGymCount(
  userId: string | null | undefined,
): number | null {
  try {
    const raw = window.localStorage.getItem(deferGymKey(userId))
    if (raw == null) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

export function clearDeferredNotificationGymCount(userId: string | null | undefined): void {
  try {
    window.localStorage.removeItem(deferGymKey(userId))
  } catch {
    /* ignore */
  }
}

/** Enregistre un refus « Plus tard » — cooldown 7 jours avant re-proposition. */
export function dismissNotificationPrompt(
  userId: string | null | undefined,
  kind: NotificationPromptKind,
  todayYmd = new Date().toISOString().slice(0, 10),
): void {
  const until = addDaysYmd(todayYmd, COOLDOWN_DAYS)
  try {
    window.localStorage.setItem(storageKey(kind, userId), until)
  } catch {
    /* ignore quota errors */
  }
}

/**
 * « Plus tard » onboarding : skip session navigateur + différé jusqu’à 2 séances gym.
 * Ne cooldown pas rest_timer séparément — un seul message combiné plus tard.
 */
export function dismissOnboardingNotificationPrompt(
  userId: string | null | undefined,
  todayYmd = new Date().toISOString().slice(0, 10),
): void {
  markNotificationPromptSkippedThisSession()
  dismissNotificationPrompt(userId, 'onboarding', todayYmd)
  deferNotificationPromptsUntilGymCount(userId, 2)
}

/** L'utilisateur a cliqué « Activer » — ne plus reproposer ce prompt. */
export function acceptNotificationPrompt(
  userId: string | null | undefined,
  kind: NotificationPromptKind,
): void {
  try {
    window.localStorage.setItem(storageKey(kind, userId), 'accepted')
    // Une acceptation couvre rappels + repos.
    if (kind === 'onboarding' || kind === 'combined' || kind === 'rest_timer') {
      window.localStorage.setItem(storageKey('rest_timer', userId), 'accepted')
      window.localStorage.setItem(storageKey('onboarding', userId), 'accepted')
      window.localStorage.setItem(storageKey('combined', userId), 'accepted')
    }
    clearDeferredNotificationGymCount(userId)
  } catch {
    /* ignore quota errors */
  }
}

export function isNotificationPromptSuppressed(
  userId: string | null | undefined,
  kind: NotificationPromptKind,
  todayYmd = new Date().toISOString().slice(0, 10),
): boolean {
  try {
    const stored = window.localStorage.getItem(storageKey(kind, userId))
    if (!stored) return false
    if (stored === 'accepted') return true
    return todayYmd <= stored
  } catch {
    return false
  }
}

export function canShowNotificationPrompt(
  userId: string | null | undefined,
  kind: NotificationPromptKind,
  todayYmd = new Date().toISOString().slice(0, 10),
  opts?: { completedGymSessionCount?: number },
): boolean {
  if (isNotificationPromptSkippedThisSession()) return false
  if (isNotificationPromptSuppressed(userId, kind, todayYmd)) return false
  if (isNotificationPromptSuppressed(userId, 'combined', todayYmd)) return false

  const deferredUntil = getDeferredNotificationGymCount(userId)
  const done = opts?.completedGymSessionCount ?? 0

  if (deferredUntil != null) {
    // Pendant le différé : aucun prompt (repos inclus).
    if (done < deferredUntil) return false
    // Seuil atteint : uniquement le message combiné (plus de rest_timer seul).
    if (kind === 'rest_timer') return false
    if (kind === 'combined') return !isNotificationPromptSuppressed(userId, 'combined', todayYmd)
  }

  // Rest timer : jamais si onboarding encore en cooldown (sans différé = cas rare).
  if (
    kind === 'rest_timer' &&
    isNotificationPromptSuppressed(userId, 'onboarding', todayYmd) &&
    deferredUntil == null
  ) {
    return false
  }

  return true
}
