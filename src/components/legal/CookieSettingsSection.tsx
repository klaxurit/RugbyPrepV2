import { useState } from 'react'
import {
  acceptCookies,
  declineCookies,
  readCookieConsent,
  type CookieConsent,
} from '../../services/analytics/cookieConsent'

export function CookieSettingsSection() {
  const [consent, setConsent] = useState<CookieConsent | null>(() => readCookieConsent())

  return (
    <section className="bg-layer-5 border border-border-app rounded-[24px] p-5 space-y-3">
      <h2 className="text-sm font-black text-fg">Cookies &amp; analytique</h2>
      <p className="text-sm text-fg-secondary leading-relaxed">
        PostHog (UE) collecte des données d&apos;usage agrégées pour améliorer l&apos;application.
        Cookies techniques (auth Supabase) toujours actifs — indispensables au service.
      </p>
      <p className="text-xs text-fg-muted">
        Choix actuel : {consent === 'accepted' ? 'analytique acceptée' : consent === 'declined' ? 'analytique refusée' : 'aucun choix enregistré'}
      </p>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            declineCookies()
            setConsent('declined')
          }}
          className="flex-1 h-10 rounded-full border border-border-app text-xs font-bold text-fg-secondary hover:bg-layer-4 transition-colors"
        >
          Refuser
        </button>
        <button
          type="button"
          onClick={() => {
            acceptCookies()
            setConsent('accepted')
          }}
          className="flex-1 h-10 rounded-full bg-brand hover:bg-brand-hover text-on-brand text-xs font-black tracking-wide transition-colors"
        >
          Accepter
        </button>
      </div>
    </section>
  )
}
