import { useRegisterSW } from 'virtual:pwa-register/react'
import { messageSW } from 'workbox-window'
import { RefreshCcw, X } from 'lucide-react'
import { resolveSafeReloadTarget } from './updatePromptReload'

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

// Test build #4 — toast attendu sous 5 min app ouverte (poll 5min + visibilitychange).

/**
 * Toast haut-de-page (sous la PageHeader) qui apparaît quand un nouveau
 * Service Worker est en `waiting`. Au tap sur "Recharger", on envoie
 * SKIP_WAITING au SW (que `src/sw.ts` traite en appelant
 * `self.skipWaiting()`) puis la page se recharge avec le nouveau bundle.
 *
 * Position : `top` + safe-area-inset + 4rem (~hauteur PageHeader). Évite
 * de chevaucher avec le bottom CTA des séances en cours et reste visible
 * sans cacher le contenu principal (juste sous la barre de nav).
 *
 * Polling : toutes les heures, on demande au SW de vérifier si une nouvelle
 * version est dispo côté serveur. C'est utile pour les sessions longues
 * (TWA Android laissé ouvert plusieurs jours) — sans ce poll, l'update ne
 * serait détecté qu'à la prochaine ouverture cold de l'app.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.info('[pwa] SW registered', { swUrl, hasRegistration: !!registration })
      if (!registration) return

      // Poll toutes les 5 min : compromis prod-acceptable entre détection
      // rapide pendant une séance ouverte (40-75 min) et bruit réseau.
      // 1h précédemment était trop long : un user qui pousse un commit puis
      // garde l'app ouverte ne voyait jamais le toast pendant sa session.
      const pollMs = 5 * 60 * 1000
      const intervalId = window.setInterval(() => {
        registration.update().catch(() => {
          // ignore — on retentera au prochain tick / au prochain visibilitychange
        })
      }, pollMs)

      // Check immédiat au retour de background (Instagram → app, écran
      // verrouillé → app, etc.). Couvre le cas TWA Android laissé en
      // background plusieurs heures sans cold-start.
      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          registration.update().catch(() => {})
        }
      }
      document.addEventListener('visibilitychange', onVisibilityChange)

      // Pas de cleanup nécessaire — le composant UpdatePrompt vit la durée
      // entière de l'app (monté dans App.tsx, jamais démonté).
      void intervalId
    },
    onNeedRefresh() {
      console.info('[pwa] update available — toast will show')
    },
    onOfflineReady() {
      console.info('[pwa] offline-ready (first install)')
    },
  })

  if (!needRefresh) return null

  return (
    <div
      role="status"
      aria-live="polite"
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

          // false = pas de reload automatique workbox (on contrôle la cible)
          void updateServiceWorker(false)

          // Fallback si controllerchange ne fire pas (TWA / WebView)
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
