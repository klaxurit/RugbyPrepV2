import { useEffect } from 'react'
import {
  REST_END_HAPTIC_MESSAGE,
  REST_END_VIBRATE_PATTERN,
} from '../services/notifications/restEndHaptic'
import { vibrate } from '../utils/vibrate'

/** Vibre au tap sur une notif fin de repos si le canal système n'a pas vibré. */
export function useRestEndNotificationHaptic(): void {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string } | null
      if (data?.type === REST_END_HAPTIC_MESSAGE) {
        vibrate([...REST_END_VIBRATE_PATTERN])
      }
    }

    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [])
}
