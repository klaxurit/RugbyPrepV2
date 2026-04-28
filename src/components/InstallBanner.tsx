import { useEffect, useState } from 'react'
import { X, Share, Plus, Download } from 'lucide-react'

/**
 * Bannière d'installation PWA — détection automatique iOS / Android.
 * - iOS Safari : affiche les étapes (Partager → Sur l'écran d'accueil)
 * - Android Chrome : déclenche le prompt natif `beforeinstallprompt`
 * - Cachée si l'app est déjà installée (display-mode: standalone)
 * - Mémorise le dismiss dans localStorage (clé: rf-install-dismissed)
 */
export function InstallBanner() {
  // Lazy initializers : platform + dismissed déterminés au render plutôt que via
  // un setState dans useEffect (rule react-hooks/set-state-in-effect).
  const [platform, setPlatform] = useState<'ios' | 'android' | null>(() => {
    if (typeof window === 'undefined') return null
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    if (isStandalone) return null
    const ua = navigator.userAgent
    if (/iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream) return 'ios'
    if (/Android/.test(ua)) return 'android'
    return null
  })
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('rf-install-dismissed') === '1'
  })

  useEffect(() => {
    // Capture le prompt natif Android pour un déclenchement manuel.
    // L'event peut arriver après le mount, donc obligé de passer par un listener.
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setPlatform('android')
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleClose = () => {
    setDismissed(true)
    localStorage.setItem('rf-install-dismissed', '1')
  }

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') handleClose()
    setDeferredPrompt(null)
  }

  if (dismissed || !platform) return null

  return (
    <aside
      role="dialog"
      aria-label={platform === 'ios' ? 'Installer RugbyForge sur iOS' : 'Installer RugbyForge sur Android'}
      className="
        fixed left-3 right-3 sm:left-auto sm:right-4 sm:max-w-sm
        bottom-[calc(12px+env(safe-area-inset-bottom))]
        z-[60]
        rounded-2xl border border-shell-border bg-shell-surface
        shadow-[0_-8px_32px_rgb(44_24_16/0.12),0_-2px_8px_rgb(123_13_30/0.06)]
        p-3.5
        animate-[slide-up_0.45s_cubic-bezier(0.22,1,0.36,1)_both]
      "
    >
      <div className="flex items-start gap-3">
        {/* Icône app */}
        <div
          aria-hidden
          className="
            flex-none w-12 h-12 rounded-2xl
            bg-gradient-to-br from-[#7B0D1E] to-[#5E0A17]
            grid place-items-center
            shadow-[0_4px_12px_rgb(123_13_30/0.25)]
            text-white font-bold text-base tracking-tight
          "
        >
          RF
        </div>

        {/* Texte */}
        <div className="flex-1 min-w-0">
          <p className="text-[0.95rem] font-bold leading-tight tracking-tight text-shell-text">
            {platform === 'ios' ? 'Installer sur iOS' : 'Installer sur Android'}
          </p>
          <p className="text-[0.8rem] leading-snug text-shell-text-muted mt-0.5">
            {platform === 'ios'
              ? "Ajoute RugbyForge à ton écran d'accueil pour un accès rapide."
              : 'Une appli plein écran, hors-ligne, et démarrage instantané.'}
          </p>
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fermer"
          className="
            flex-none w-7 h-7 rounded-full grid place-items-center
            text-shell-text-muted hover:text-brand hover:bg-brand/5
            transition-colors
          "
        >
          <X className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Étapes iOS */}
      {platform === 'ios' && (
        <div
          className="
            mt-3 px-3 py-2.5 rounded-xl bg-brand/5
            flex items-center flex-wrap gap-1.5
            text-[0.8rem] text-shell-text-secondary
          "
        >
          <span className="flex-none w-[18px] h-[18px] rounded-full bg-brand text-on-brand text-[0.7rem] font-bold grid place-items-center">
            1
          </span>
          <span className="font-semibold text-shell-text">Touche</span>
          <span
            aria-label="Bouton Partager"
            className="inline-grid place-items-center w-[22px] h-[22px] rounded-md bg-shell-surface border border-shell-border"
          >
            <Share className="w-3 h-3 text-brand" strokeWidth={2} />
          </span>
          <span className="text-shell-text-muted font-bold">→</span>
          <span className="flex-none w-[18px] h-[18px] rounded-full bg-brand text-on-brand text-[0.7rem] font-bold grid place-items-center">
            2
          </span>
          <span
            aria-hidden
            className="inline-grid place-items-center w-[22px] h-[22px] rounded-md bg-shell-surface border border-shell-border"
          >
            <Plus className="w-3 h-3 text-brand" strokeWidth={2.5} />
          </span>
          <span className="font-semibold text-shell-text whitespace-nowrap">
            Sur l'écran d'accueil
          </span>
        </div>
      )}

      {/* CTA Android */}
      {platform === 'android' && (
        <button
          type="button"
          onClick={handleAndroidInstall}
          disabled={!deferredPrompt}
          className="
            mt-3 w-full flex items-center justify-center gap-1.5
            px-4 py-3 rounded-xl
            bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed
            text-on-brand font-bold text-[0.9rem] tracking-wide
            transition-colors active:scale-[0.98]
          "
        >
          <Download className="w-[18px] h-[18px]" strokeWidth={2.2} />
          {deferredPrompt ? "Installer l'application" : 'Installation indisponible'}
        </button>
      )}
    </aside>
  )
}

// ─── Types pour l'event PWA non standardisé ───
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}
