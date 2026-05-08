// WS9 — Cookies consent gate for analytics (PostHog).
//
// CNIL recommandation 2020 : pas d'init PostHog tant que l'utilisateur n'a
// pas explicitement accepté. Refus = aucun cookie analytique posé. Choix
// révocable depuis /legal.

import { initPostHog, posthog } from './posthog'

const STORAGE_KEY = 'rugbyprep.cookies.consent'

export type CookieConsent = 'accepted' | 'declined'

export function readCookieConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'accepted' || raw === 'declined') return raw
    return null
  } catch {
    return null
  }
}

export function writeCookieConsent(value: CookieConsent): void {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    /* ignore quota / SSR */
  }
}

export function clearCookieConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Boots analytics only if the user has consented. Safe to call on every app
 * boot — no-op when consent is null or 'declined'.
 */
export function initAnalyticsIfConsented(): void {
  if (readCookieConsent() === 'accepted') {
    initPostHog()
  }
}

/**
 * Called from the banner when the user clicks "Accepter". Persists the
 * decision and boots PostHog immediately so the rest of the session is
 * tracked without requiring a reload.
 */
export function acceptCookies(): void {
  writeCookieConsent('accepted')
  initPostHog()
}

/**
 * Called from the banner when the user clicks "Refuser" or from the
 * LegalPage settings to revoke. Persists the decision and opts out of
 * already-running capture if PostHog happened to boot.
 */
export function declineCookies(): void {
  writeCookieConsent('declined')
  try {
    posthog.opt_out_capturing?.()
  } catch {
    /* posthog might not be initialised yet */
  }
}
