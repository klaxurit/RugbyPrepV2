const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export type NotificationOptInBlockReason =
  | 'eligible'
  | 'unsupported'
  | 'no_vapid'
  | 'denied'
  | 'already_granted'

/** Éligibilité au soft prompt push (rappels séance) — vérif synchrone, sans attendre le hook. */
export function getTrainingReminderOptInEligibility(): NotificationOptInBlockReason {
  if (typeof window === 'undefined') return 'unsupported'
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported'
  if (!VAPID_PUBLIC_KEY) return 'no_vapid'
  if (Notification.permission === 'denied') return 'denied'
  if (Notification.permission === 'granted') return 'already_granted'
  return 'eligible'
}

/** Éligibilité au soft prompt fin de repos (permission navigateur + push optionnel TWA). */
export function getRestTimerNotificationOptInEligibility(): NotificationOptInBlockReason {
  if (typeof window === 'undefined') return 'unsupported'
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported'
  if (!VAPID_PUBLIC_KEY) return 'no_vapid'
  if (Notification.permission === 'denied') return 'denied'
  if (Notification.permission === 'granted') return 'already_granted'
  return 'eligible'
}

export function canOfferTrainingReminderOptIn(): boolean {
  return getTrainingReminderOptInEligibility() === 'eligible'
}

export function canOfferRestTimerNotificationOptIn(): boolean {
  return getRestTimerNotificationOptInEligibility() === 'eligible'
}
