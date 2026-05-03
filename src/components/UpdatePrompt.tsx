import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCcw, X } from 'lucide-react'

/**
 * Toast bas-de-page qui apparaît quand un nouveau Service Worker est en
 * `waiting`. Au tap sur "Recharger", on envoie SKIP_WAITING au SW (que
 * `src/sw.ts` traite en appelant `self.skipWaiting()`) puis la page se
 * recharge avec le nouveau bundle.
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
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      // Poll horaire pour détecter les nouveaux déploiements sur les
      // sessions ouvertes en continu (cas TWA / pinned tab).
      setInterval(() => {
        registration.update().catch(() => {
          // ignore network errors — on retentera dans 1h
        })
      }, 60 * 60 * 1000)
    },
  })

  if (!needRefresh) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-4 right-4 z-50 max-w-md mx-auto rounded-2xl border border-brand-border-strong bg-panel shadow-brand-float p-3 flex items-center gap-2"
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
        onClick={() => updateServiceWorker(true)}
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
