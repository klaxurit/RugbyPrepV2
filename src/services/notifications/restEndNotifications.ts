import { supabase } from '../supabase/client'
import {
  hasNotificationPermission,
  postToServiceWorker,
} from './postToServiceWorker'

const MAX_REST_MS = 5 * 60 * 1000
const DEFAULT_RETURN_URL = '/week'

/** Route à ouvrir au tap sur la notif fin de repos. */
export function getSessionReturnUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_RETURN_URL
  const { pathname, search } = window.location
  if (pathname.startsWith('/session/')) return `${pathname}${search}`
  return DEFAULT_RETURN_URL
}

export interface RestTimerScheduleInput {
  endsAt: number
  label?: string
  returnUrl?: string
}

/** Programme la notif locale via le service worker (permission navigateur requise). */
export async function scheduleRestEndServiceWorker({
  endsAt,
  label,
  returnUrl,
}: RestTimerScheduleInput): Promise<void> {
  if (!hasNotificationPermission()) return
  const remainingSec = Math.max(0, Math.round((endsAt - Date.now()) / 1000))
  if (remainingSec <= 0) return

  await postToServiceWorker({
    type: 'SCHEDULE_REST_END',
    seconds: remainingSec,
    label: label ?? 'Repos terminé',
    url: returnUrl ?? DEFAULT_RETURN_URL,
  })
}

export async function cancelRestEndServiceWorker(): Promise<void> {
  await postToServiceWorker({ type: 'CANCEL_REST_END' })
}

/**
 * Push serveur différé — fiable en TWA/Android quand l'app est en arrière-plan.
 * Nécessite un abonnement push actif (rappels séance activés dans Profil).
 */
export async function scheduleRestEndPush({
  endsAt,
  label,
  returnUrl,
}: RestTimerScheduleInput): Promise<void> {
  const delay = endsAt - Date.now()
  if (delay <= 0 || delay > MAX_REST_MS) return

  await supabase.functions.invoke('schedule-rest-end', {
    body: {
      endsAtISO: new Date(endsAt).toISOString(),
      label: label ?? 'Repos terminé',
      returnUrl: returnUrl ?? DEFAULT_RETURN_URL,
    },
  })
}

export async function cancelRestEndPush(): Promise<void> {
  await supabase.functions.invoke('cancel-rest-end', { body: {} })
}

/**
 * Sync les canaux de notif fin de repos selon la visibilité de l'app.
 * - Arrière-plan : SW + push serveur
 * - Premier plan : annulation (bip in-app dans RestTimerCard)
 */
export async function syncRestEndNotifications(
  timer: RestTimerScheduleInput | null,
  isBackground: boolean,
): Promise<void> {
  if (!timer) {
    await Promise.all([cancelRestEndServiceWorker(), cancelRestEndPush()])
    return
  }

  if (isBackground) {
    await Promise.all([
      scheduleRestEndServiceWorker(timer),
      scheduleRestEndPush(timer),
    ])
    return
  }

  await Promise.all([cancelRestEndServiceWorker(), cancelRestEndPush()])
}
