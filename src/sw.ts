/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// ─── Update lifecycle ───────────────────────────────────────────────────────
//
// En mode `injectManifest` (SW custom), VitePWA n'injecte PAS automatiquement
// `self.skipWaiting()` ni `self.clients.claim()` — il faut les coder ici.
// Sans ça, un nouveau SW reste indéfiniment en `waiting` tant qu'un onglet
// de l'ancienne version reste ouvert. Sur un TWA Android, l'onglet ne se
// ferme jamais → l'utilisateur ne voit jamais les nouvelles versions sauf à
// désinstaller l'app.
//
// Pattern utilisé : "user-prompted update". On n'auto-skip pas (risque de
// casser une séance en cours si le SW bascule pendant un upload de log).
// L'app affiche un toast "Nouvelle version dispo · Recharger" via
// useRegisterSW() ; au tap, elle envoie un message SKIP_WAITING qu'on
// traite ici, puis le SW prend le contrôle des clients via clients.claim().

// ─── Rest-timer notification (local, déclenchée par le client) ─────────────
//
// Quand l'utilisateur lance un temps de repos pendant une séance et qu'il
// quitte l'onglet/l'app, le client envoie un message SCHEDULE_REST_END avec
// la durée restante. Le SW programme un setTimeout — robuste à la mise en
// background sur Chrome Android (TWA) ≥ 1-2 min, suffisant pour un repos
// rugby (60-180s). Si l'utilisateur revient ou skip le timer, on reçoit
// CANCEL_REST_END et on annule.
//
// Limite connue : iOS Safari PWA ne fait pas survivre les setTimeout SW en
// background. On accepte cette limitation pour la V1 — fix futur via push
// serveur différé si besoin.
let restTimerHandle: ReturnType<typeof setTimeout> | null = null

const cancelRestTimer = () => {
  if (restTimerHandle != null) {
    clearTimeout(restTimerHandle)
    restTimerHandle = null
  }
}

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data as
    | { type?: string; seconds?: number; label?: string }
    | undefined
  if (data?.type === 'SKIP_WAITING') {
    void self.skipWaiting()
    return
  }
  if (data?.type === 'SCHEDULE_REST_END') {
    cancelRestTimer()
    const seconds = typeof data.seconds === 'number' ? data.seconds : 0
    if (seconds <= 0) return
    const label = data.label ?? 'Repos terminé'
    restTimerHandle = setTimeout(() => {
      restTimerHandle = null
      void self.registration.showNotification(`${label} 💪`, {
        body: 'Prêt pour le prochain set.',
        tag: 'rugbyforge-rest-end',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200],
        data: { url: '/week' },
      } as NotificationOptions)
    }, seconds * 1000)
    return
  }
  if (data?.type === 'CANCEL_REST_END') {
    cancelRestTimer()
  }
})

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(self.clients.claim())
})

// ─── Push Notifications ────────────────────────────────────────────────────

interface PushPayload {
  title?: string
  body?: string
  url?: string
  tag?: string
}

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return

  let data: PushPayload = {}
  try {
    data = event.data.json() as PushPayload
  } catch {
    data = { title: 'RugbyForge', body: event.data.text() }
  }

  const title = data.title ?? 'RugbyForge'
  const options = {
    body: data.body ?? '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag ?? 'rugbyprep',
    data: { url: data.url ?? '/week' },
    vibrate: [200, 100, 200],
  } as NotificationOptions

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url: string = (event.notification.data as { url?: string })?.url ?? '/week'

  event.waitUntil(
    (self.clients as Clients)
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return (client as WindowClient).focus()
          }
        }
        return (self.clients as Clients).openWindow(url)
      })
  )
})
