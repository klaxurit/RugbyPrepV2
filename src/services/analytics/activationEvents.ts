import { posthog } from './posthog'
import {
  attributionAsEventProps,
  captureLandingAttributionOnce,
  getAttribution,
} from './attribution'

export type LandingCtaLocation =
  | 'hero'
  | 'final_cta'
  | 'pricing_free'
  | 'pricing_pro_monthly'
  | 'pricing_pro_yearly'
  | 'pricing_founding'

export type StoreBadgeStore = 'ios' | 'play'

export type AppOpenPlatform = 'twa' | 'pwa' | 'web'

export const APP_FIRST_OPEN_STORAGE_KEY = 'rf_app_first_open_v1'
export const PRICING_VIEWED_STORAGE_KEY = 'rf_pricing_viewed_v1'
export const FIRST_SESSION_COMPLETED_STORAGE_KEY = 'rf_first_session_completed_v1'

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLocal(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSession(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* ignore */
  }
}

function capture(event: string, props?: Record<string, string | number | boolean>) {
  try {
    posthog.capture?.(event, props)
  } catch {
    /* posthog may be disabled (no consent / no key) */
  }
}

export function resolveAppOpenPlatform(input: {
  standalone: boolean
  userAgent: string
  referrer: string
}): AppOpenPlatform {
  const isAndroid = /Android/i.test(input.userAgent)
  const isTwaReferrer = input.referrer.includes('android-app://')
  if (isTwaReferrer || (input.standalone && isAndroid)) return 'twa'
  if (input.standalone) return 'pwa'
  return 'web'
}

export function trackLandingCtaClicked(location: LandingCtaLocation): void {
  captureLandingAttributionOnce()
  capture('landing_cta_clicked', {
    location,
    ...attributionAsEventProps(),
  })
}

export function trackStoreBadgeClicked(store: StoreBadgeStore): void {
  captureLandingAttributionOnce()
  capture('store_badge_clicked', {
    store,
    ...attributionAsEventProps(),
  })
}

/** Once per tab session when #pricing enters the viewport. */
export function trackPricingViewed(): void {
  if (readSession(PRICING_VIEWED_STORAGE_KEY) === '1') return
  writeSession(PRICING_VIEWED_STORAGE_KEY, '1')
  captureLandingAttributionOnce()
  capture('pricing_viewed', attributionAsEventProps())
}

/** Once per browser install / origin (localStorage). */
export function trackAppFirstOpen(
  platformInput?: {
    standalone?: boolean
    userAgent?: string
    referrer?: string
  },
): void {
  if (readLocal(APP_FIRST_OPEN_STORAGE_KEY) === '1') return

  const standalone =
    platformInput?.standalone ??
    (typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true))

  const userAgent =
    platformInput?.userAgent ??
    (typeof navigator !== 'undefined' ? navigator.userAgent : '')
  const referrer =
    platformInput?.referrer ??
    (typeof document !== 'undefined' ? document.referrer : '')

  const platform = resolveAppOpenPlatform({
    standalone: Boolean(standalone),
    userAgent,
    referrer,
  })

  writeLocal(APP_FIRST_OPEN_STORAGE_KEY, '1')
  captureLandingAttributionOnce()
  capture('app_first_open', {
    platform,
    ...attributionAsEventProps(),
  })
}

export function trackOnboardingStep(n: number): void {
  capture('onboarding_step', { n })
}

/**
 * Fire once when the user completes their first session log.
 * Prefer `wasFirstSession` from logs.length === 0 before insert.
 */
export function trackFirstSessionCompleted(wasFirstSession: boolean): void {
  if (!wasFirstSession) return
  if (readLocal(FIRST_SESSION_COMPLETED_STORAGE_KEY) === '1') return
  writeLocal(FIRST_SESSION_COMPLETED_STORAGE_KEY, '1')
  capture('first_session_completed', attributionAsEventProps())
}

/** Attach first-touch attribution to signup_completed (+ person props). */
export function trackSignupCompletedWithAttribution(): void {
  captureLandingAttributionOnce()
  const props = attributionAsEventProps(getAttribution())
  try {
    if (Object.keys(props).length > 0) {
      posthog.setPersonProperties?.(props)
    }
  } catch {
    /* ignore */
  }
  capture('signup_completed', props)
}
