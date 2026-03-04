/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

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
