/** Envoie un message au service worker actif (fallback registration.active). */
export async function postToServiceWorker(message: unknown): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    const target = reg.active ?? navigator.serviceWorker.controller
    target?.postMessage(message)
  } catch {
    /* SW indisponible — silencieux */
  }
}

export function hasNotificationPermission(): boolean {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted'
}
