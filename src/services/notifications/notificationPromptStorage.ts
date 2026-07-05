import { userScopedKey } from '../storage/userScopedStorage'

export type NotificationPromptKind = 'onboarding' | 'rest_timer'

const COOLDOWN_DAYS = 7
const STORAGE_BASE = 'rugbyprep.notif.promptDismissedUntil'

function storageKey(kind: NotificationPromptKind, userId: string | null | undefined): string {
  return userScopedKey(`${STORAGE_BASE}.${kind}`, userId)
}

function addDaysYmd(fromYmd: string, days: number): string {
  const d = new Date(`${fromYmd}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
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

/** L'utilisateur a cliqué « Activer » — ne plus reproposer ce prompt. */
export function acceptNotificationPrompt(
  userId: string | null | undefined,
  kind: NotificationPromptKind,
): void {
  try {
    window.localStorage.setItem(storageKey(kind, userId), 'accepted')
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
): boolean {
  return !isNotificationPromptSuppressed(userId, kind, todayYmd)
}
