import { useRegisterSW } from 'virtual:pwa-register/react'
import { messageSW } from 'workbox-window'
import { RefreshCcw, X } from 'lucide-react'
import { resolveSafeReloadTarget } from './updatePromptReload'
import { shouldShowUpdatePrompt } from './updatePromptVisibility'
import { useAuth } from '../hooks/useAuth'

/**
 * Double envoi SKIP_WAITING : workbox-window (via virtual:pwa-register) appelle
 * `registration.waiting.postMessage` depuis l'état interne du Workbox. Sur
 * certains parcours (TWA, retour foreground), cet état peut être vide alors que
 * `navigator.serviceWorker.getRegistration()?.waiting` existe encore — au clic
 * « Recharger », rien ne se passait. On renvoie donc le message depuis l'API
 * navigateur en complément (répétition sans effet pour skipWaiting).
 */
function postSkipWaitingToBrowserWaitingWorker(): void {
  if (!('serviceWorker' in navigator)) return
  void navigator.serviceWorker.getRegistration().then((reg) => {
    const waiting = reg?.waiting
    if (!waiting) return
    // Ne pas await messageSW : le SW ne répond pas sur le MessageChannel pour SKIP_WAITING.
    void messageSW(waiting, { type: 'SKIP_WAITING' })
  })
}

/**
 * Toast haut-de-page (sous la PageHeader) qui apparaît quand un nouveau
 * Service Worker est en `waiting`. Au tap sur "Recharger", on envoie
 * SKIP_WAITING au SW (que `src/sw.ts` traite en appelant
 * `self.skipWaiting()`) puis la page se recharge avec le nouveau bundle.
 *
 * Visible uniquement dans l’app authentifiée — jamais sur la landing marketing
 * ni le funnel login/signup.
 */
export function UpdatePrompt() {
  const { authState } = useAuth()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.info('[pwa] SW registered', { swUrl, hasRegistration: !!registration })
      if (!registration) return

      const pollMs = 5 * 60 * 1000
      const intervalId = window.setInterval(() => {
        registration.update().catch(() => {})
      }, pollMs)

      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {})
        }
      }
      document.addEventListener('visibilitychange', onVisibilityChange)

      void intervalId
    },
    onNeedRefresh() {
      console.info('[pwa] update available — toast will show')
    },
    onOfflineReady() {
      console.info('[pwa] offline-ready (first install)')
    },
  })

  if (!shouldShowUpdatePrompt(needRefresh, authState.status)) return null

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="update-prompt"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 4rem)' }}
      className="fixed left-4 right-4 z-[120] max-w-md mx-auto rounded-2xl border border-brand-border-strong bg-panel shadow-brand-float p-3 flex items-center gap-2"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-fg-muted">
          Nouvelle version
        </p>
        <p className="text-sm font-bold text-fg leading-tight">
          Une mise à jour est disponible.
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          const reloadTarget = resolveSafeReloadTarget()
          postSkipWaitingToBrowserWaitingWorker()

          const reload = () => {
            window.location.assign(reloadTarget)
          }

          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', reload, { once: true })
          }

          void updateServiceWorker(false)

          window.setTimeout(reload, 2500)
        }}
        className="inline-flex items-center gap-1.5 rounded-xl bg-brand text-on-brand px-3 py-2 text-xs font-black uppercase italic tracking-wide rf-focus-ring"
      >
        <RefreshCcw className="w-3.5 h-3.5" strokeWidth={3} />
        Recharger
      </button>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        aria-label="Fermer la notification"
        className="rounded-xl border border-border-app bg-layer-5 text-fg-muted hover:text-fg w-9 h-9 flex items-center justify-center rf-focus-ring"
      >
        <X className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>
    </div>
  )
}
