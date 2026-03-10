/**
 * useNotifications — Gère les permissions et abonnements Web Push
 *
 * Flow :
 *  1. L'utilisateur clique "Activer les rappels"
 *  2. Le navigateur demande la permission Notification
 *  3. On crée un PushSubscription via le Service Worker
 *  4. On enregistre l'abonnement via l'Edge Function sécurisée
 *     register-push-subscription
 *  5. Le backend orchestre les rappels et garde la source de vérité serveur
 */

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase/client'
import type { DayOfWeek, UserProfile } from '../types/training'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

// Training days config mirrors the app (0=Sun, 1=Mon, ..., 6=Sat)
const TRAINING_DAYS_MAP: Record<2 | 3, number[]> = {
  2: [1, 4],     // Mon + Thu
  3: [1, 3, 5],  // Mon + Wed + Fri
}

const resolveTrainingDays = (profile: UserProfile): DayOfWeek[] =>
  profile.scSchedule?.sessions.map((session) => session.day) ??
  (TRAINING_DAYS_MAP[profile.weeklySessions] as DayOfWeek[])

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

const uint8ArrayToBase64Url = (value: Uint8Array): string =>
  btoa(String.fromCharCode(...value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

const uint8ArrayEquals = (left: Uint8Array, right: Uint8Array): boolean => {
  if (left.length !== right.length) return false
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false
  }
  return true
}

const hasMatchingApplicationServerKey = (
  subscription: PushSubscription,
  expectedKey: Uint8Array,
): boolean => {
  const serverKey = subscription.options.applicationServerKey
  if (!serverKey) return false
  return uint8ArrayEquals(new Uint8Array(serverKey), expectedKey)
}

export type NotificationStatus = 'idle' | 'loading' | 'subscribed' | 'denied' | 'unsupported' | 'no_vapid'

export interface NotificationDiagnostics {
  backendPublicKeyPreview: string | null
  backendPublicKeyLength: number
  frontendPublicKeyPreview: string | null
  frontendPublicKeyLength: number
  subscriptionPublicKeyPreview: string | null
  subscriptionPublicKeyLength: number
  frontendMatchesBackend: boolean
  subscriptionMatchesBackend: boolean
  frontendMatchesSubscription: boolean
  endpointPreview: string | null
  origin: string | null
}

export const useNotifications = (profile: UserProfile) => {
  const [status, setStatus] = useState<NotificationStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [diagnostics, setDiagnostics] = useState<NotificationDiagnostics | null>(null)
  const [isDiagnosing, setIsDiagnosing] = useState(false)
  const vapidPublicKeyBytes = VAPID_PUBLIC_KEY ? urlBase64ToUint8Array(VAPID_PUBLIC_KEY) : null

  const syncSubscription = useCallback(
    async (subscription: PushSubscription) => {
      const subJson = subscription.toJSON()
      const trainingDays = resolveTrainingDays(profile)
      const { error } = await supabase.functions.invoke('register-push-subscription', {
        body: {
          endpoint: subJson.endpoint,
          p256dhKey: subJson.keys?.p256dh,
          authKey: subJson.keys?.auth,
          deviceId: subJson.endpoint,
          trainingDays,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          userAgent: navigator.userAgent,
        },
      })

      if (error) {
        throw new Error(error.message ?? 'Push subscription sync failed')
      }
    },
    [profile],
  )

  // Check current state on mount — setState calls are intentional (init from external API)
  useEffect(() => {
    let cancelled = false

    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported')
      return
    }
    if (!VAPID_PUBLIC_KEY) {
      setStatus('no_vapid')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    const syncExistingSubscription = async () => {
      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()

        if (!sub) {
          if (!cancelled) {
            setErrorMessage(null)
            setStatus('idle')
          }
          return
        }

        if (!vapidPublicKeyBytes || !hasMatchingApplicationServerKey(sub, vapidPublicKeyBytes)) {
          await sub.unsubscribe().catch(() => undefined)
          if (!cancelled) {
            setErrorMessage('Les clés de notification ont changé. Réactive les notifications.')
            setStatus('idle')
          }
          return
        }

        await syncSubscription(sub)
        if (!cancelled) {
          setErrorMessage(null)
          setStatus('subscribed')
        }
      } catch (error) {
        console.error('[useNotifications] initial sync error:', error)
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Impossible d’activer les notifications')
          setStatus('idle')
        }
      }
    }

    void syncExistingSubscription()

    return () => {
      cancelled = true
    }
  }, [syncSubscription, vapidPublicKeyBytes])

  const subscribe = useCallback(async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported')
      return
    }
    if (!VAPID_PUBLIC_KEY) {
      setStatus('no_vapid')
      return
    }

    setStatus('loading')
    setErrorMessage(null)

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return
      }

      const reg = await navigator.serviceWorker.ready

      // Si déjà subscribed, on resynchronise les préférences serveur.
      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        if (!vapidPublicKeyBytes || !hasMatchingApplicationServerKey(existing, vapidPublicKeyBytes)) {
          await supabase.functions.invoke('unsubscribe-push', {
            body: { endpoint: existing.endpoint },
          }).catch(() => undefined)
          await existing.unsubscribe()
        } else {
          await syncSubscription(existing)
          setStatus('subscribed')
          return
        }
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applicationServerKey: vapidPublicKeyBytes as any,
      })

      await syncSubscription(subscription)

      setStatus('subscribed')
    } catch (err) {
      console.error('[useNotifications] subscribe error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Impossible d’activer les notifications')
      setStatus('idle')
    }
  }, [syncSubscription, vapidPublicKeyBytes])

  const unsubscribe = useCallback(async () => {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        const { error } = await supabase.functions.invoke('unsubscribe-push', {
          body: { endpoint: sub.endpoint },
        })

        if (error) throw error

        await sub.unsubscribe()
      }
      setStatus('idle')
    } catch (err) {
      console.error('[useNotifications] unsubscribe error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Impossible de désactiver les notifications')
      setStatus('subscribed')
    }
  }, [])

  const runDiagnostics = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return

    setIsDiagnosing(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      const subscriptionPublicKey = sub?.options.applicationServerKey
        ? uint8ArrayToBase64Url(new Uint8Array(sub.options.applicationServerKey))
        : null

      const { data, error } = await supabase.functions.invoke('debug-push-config', {
        body: {
          frontendPublicKey: VAPID_PUBLIC_KEY ?? null,
          subscriptionPublicKey,
          endpoint: sub?.endpoint ?? null,
        },
      })

      if (error) {
        throw new Error(error.message ?? 'Push diagnostics failed')
      }

      setDiagnostics(data as NotificationDiagnostics)
      setErrorMessage(null)
    } catch (error) {
      console.error('[useNotifications] diagnostics error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Impossible de diagnostiquer les notifications')
    } finally {
      setIsDiagnosing(false)
    }
  }, [])

  return { status, errorMessage, diagnostics, isDiagnosing, subscribe, unsubscribe, runDiagnostics }
}
