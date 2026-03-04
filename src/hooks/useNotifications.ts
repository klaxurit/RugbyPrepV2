/**
 * useNotifications — Gère les permissions et abonnements Web Push
 *
 * Flow :
 *  1. L'utilisateur clique "Activer les rappels"
 *  2. Le navigateur demande la permission Notification
 *  3. On crée un PushSubscription via le Service Worker
 *  4. On stocke l'abonnement dans Supabase (table push_subscriptions)
 *  5. Supabase envoie un push chaque jour d'entraînement à 7h (Europe/Paris)
 *
 * Identification sans auth : un device_id (UUID) stocké en localStorage.
 */

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase/client'
import type { UserProfile } from '../types/training'

const DEVICE_ID_KEY = 'rugbyprep.device_id.v1'
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

// Training days config mirrors the app (0=Sun, 1=Mon, ..., 6=Sat)
const TRAINING_DAYS_MAP: Record<2 | 3, number[]> = {
  2: [1, 4],     // Mon + Thu
  3: [1, 3, 5],  // Mon + Wed + Fri
}

const getOrCreateDeviceId = (): string => {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export type NotificationStatus = 'idle' | 'loading' | 'subscribed' | 'denied' | 'unsupported' | 'no_vapid'

export const useNotifications = (profile: UserProfile) => {
  const [status, setStatus] = useState<NotificationStatus>('loading')

  // Check current state on mount — setState calls are intentional (init from external API)
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
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
    /* eslint-enable react-hooks/set-state-in-effect */
    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setStatus(sub ? 'subscribed' : 'idle')
      })
    })
  }, [])

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

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return
      }

      const reg = await navigator.serviceWorker.ready

      // Si déjà subscribed, on met juste à jour l'état UI
      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        setStatus('subscribed')
        return
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
      })

      const subJson = subscription.toJSON()
      const deviceId = getOrCreateDeviceId()
      const trainingDays = TRAINING_DAYS_MAP[profile.weeklySessions]

      await supabase.from('push_subscriptions').upsert(
        {
          device_id: deviceId,
          endpoint: subJson.endpoint!,
          p256dh_key: subJson.keys!['p256dh'],
          auth_key: subJson.keys!['auth'],
          training_days: trainingDays,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        { onConflict: 'endpoint' }
      )

      setStatus('subscribed')
    } catch (err) {
      console.error('[useNotifications] subscribe error:', err)
      setStatus('idle')
    }
  }, [profile.weeklySessions])

  const unsubscribe = useCallback(async () => {
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        // Remove from Supabase
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', sub.endpoint)
      }
      setStatus('idle')
    } catch (err) {
      console.error('[useNotifications] unsubscribe error:', err)
      setStatus('subscribed')
    }
  }, [])

  return { status, subscribe, unsubscribe }
}
