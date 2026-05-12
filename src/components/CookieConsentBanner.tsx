import { useState } from 'react'
import { Link } from 'react-router-dom'
import { acceptCookies, declineCookies, readCookieConsent } from '../services/analytics/cookieConsent'
import { tr, type Lang } from '../i18n/appLabels'

/**
 * Banner affiché avant que l'utilisateur s'authentifie — le profil
 * (et donc `preferredLanguage`) n'est pas encore disponible. App FR-first :
 * on garde FR par défaut. Le toggle EN/FR (post-onboarding /profile) ne
 * s'applique pas à ce banner pré-auth.
 */
function detectInitialLang(): Lang {
  return 'fr'
}

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
  const [lang] = useState<Lang>(() => detectInitialLang())

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
      aria-label={tr('cookie_aria', lang)}
      className="fixed bottom-4 left-0 right-0 z-50 px-4 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-md mx-auto bg-layer-5 border border-border-app rounded-[20px] p-4 shadow-2xl space-y-3">
        <p className="text-xs text-fg leading-relaxed">
          {tr('cookie_body', lang)}{' '}
          <Link to="/legal" className="text-brand underline">{tr('cookie_learn_more', lang)}</Link>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDecline}
            className="flex-1 h-10 rounded-full border border-border-app text-xs font-bold text-fg-secondary hover:bg-layer-4 transition-colors"
          >
            {tr('cookie_decline', lang)}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 h-10 rounded-full bg-brand hover:bg-brand-hover text-on-brand text-xs font-black tracking-wide transition-colors"
          >
            {tr('cookie_accept', lang)}
          </button>
        </div>
      </div>
    </div>
  )
}
