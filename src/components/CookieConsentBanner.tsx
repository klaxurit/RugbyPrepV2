import { useState } from 'react'
import { Link } from 'react-router-dom'
import { acceptCookies, declineCookies, readCookieConsent } from '../services/analytics/cookieConsent'

/**
 * WS9 — Bandeau cookies (RGPD / CNIL 2020).
 *
 * Affiché au premier visit tant que l'utilisateur n'a fait aucun choix.
 * Cookies essentiels (auth Supabase) toujours actifs. Cookies analytiques
 * (PostHog) gated par "Accepter".
 */
export function CookieConsentBanner() {
  // Lazy init from localStorage : suffit (single source of truth, sync read).
  const [hasChoice, setHasChoice] = useState<boolean>(() => readCookieConsent() !== null)

  if (hasChoice) return null

  const handleAccept = () => {
    acceptCookies()
    setHasChoice(true)
  }

  const handleDecline = () => {
    declineCookies()
    setHasChoice(true)
  }

  return (
    <div
      role="dialog"
      aria-label="Préférences cookies"
      className="fixed bottom-4 left-0 right-0 z-50 px-4 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-md mx-auto bg-layer-5 border border-border-app rounded-[20px] p-4 shadow-2xl space-y-3">
        <p className="text-xs text-fg leading-relaxed">
          Nous utilisons des cookies techniques (toujours actifs) pour faire fonctionner
          l&apos;application. Avec ton accord, nous mesurons aussi son usage via PostHog (UE) pour
          l&apos;améliorer.{' '}
          <Link to="/legal" className="text-brand underline">En savoir plus</Link>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDecline}
            className="flex-1 h-10 rounded-full border border-border-app text-xs font-bold text-fg-secondary hover:bg-layer-4 transition-colors"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 h-10 rounded-full bg-brand hover:bg-brand-hover text-on-brand text-xs font-black tracking-wide transition-colors"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  )
}
