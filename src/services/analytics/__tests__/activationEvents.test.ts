/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { capture, setPersonProperties } = vi.hoisted(() => ({
  capture: vi.fn(),
  setPersonProperties: vi.fn(),
}))

vi.mock('../posthog', () => ({
  posthog: {
    capture,
    setPersonProperties,
  },
}))

import {
  APP_FIRST_OPEN_STORAGE_KEY,
  FIRST_SESSION_COMPLETED_STORAGE_KEY,
  PRICING_VIEWED_STORAGE_KEY,
  resolveAppOpenPlatform,
  trackAppFirstOpen,
  trackFirstSessionCompleted,
  trackLandingCtaClicked,
  trackOnboardingStep,
  trackPricingViewed,
  trackSignupCompletedWithAttribution,
  trackStoreBadgeClicked,
} from '../activationEvents'
import { ATTRIBUTION_STORAGE_KEY } from '../attribution'

describe('activationEvents', () => {
  beforeEach(() => {
    capture.mockClear()
    setPersonProperties.mockClear()
    sessionStorage.clear()
    localStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('resolveAppOpenPlatform distinguishes twa / pwa / web', () => {
    expect(
      resolveAppOpenPlatform({
        standalone: true,
        userAgent: 'Mozilla/5.0 (Linux; Android 14)',
        referrer: '',
      }),
    ).toBe('twa')
    expect(
      resolveAppOpenPlatform({
        standalone: false,
        userAgent: 'Mozilla/5.0 (Linux; Android 14)',
        referrer: 'android-app://com.android.chrome/',
      }),
    ).toBe('twa')
    expect(
      resolveAppOpenPlatform({
        standalone: true,
        userAgent: 'Mozilla/5.0 (iPhone)',
        referrer: '',
      }),
    ).toBe('pwa')
    expect(
      resolveAppOpenPlatform({
        standalone: false,
        userAgent: 'Mozilla/5.0',
        referrer: '',
      }),
    ).toBe('web')
  })

  it('trackLandingCtaClicked emits location + attribution', () => {
    sessionStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify({ utm_source: 'tiktok' }),
    )
    trackLandingCtaClicked('hero')
    expect(capture).toHaveBeenCalledWith(
      'landing_cta_clicked',
      expect.objectContaining({ location: 'hero', utm_source: 'tiktok' }),
    )
  })

  it('trackStoreBadgeClicked emits store', () => {
    trackStoreBadgeClicked('play')
    expect(capture).toHaveBeenCalledWith(
      'store_badge_clicked',
      expect.objectContaining({ store: 'play' }),
    )
  })

  it('trackPricingViewed fires once per session', () => {
    trackPricingViewed()
    trackPricingViewed()
    expect(capture).toHaveBeenCalledTimes(1)
    expect(capture).toHaveBeenCalledWith('pricing_viewed', expect.any(Object))
    expect(sessionStorage.getItem(PRICING_VIEWED_STORAGE_KEY)).toBe('1')
  })

  it('trackAppFirstOpen fires once per install', () => {
    trackAppFirstOpen({
      standalone: false,
      userAgent: 'Mozilla/5.0',
      referrer: '',
    })
    trackAppFirstOpen({
      standalone: false,
      userAgent: 'Mozilla/5.0',
      referrer: '',
    })
    expect(capture).toHaveBeenCalledTimes(1)
    expect(capture).toHaveBeenCalledWith(
      'app_first_open',
      expect.objectContaining({ platform: 'web' }),
    )
    expect(localStorage.getItem(APP_FIRST_OPEN_STORAGE_KEY)).toBe('1')
  })

  it('trackOnboardingStep emits n', () => {
    trackOnboardingStep(2)
    expect(capture).toHaveBeenCalledWith('onboarding_step', { n: 2 })
  })

  it('trackFirstSessionCompleted fires once when first', () => {
    trackFirstSessionCompleted(false)
    expect(capture).not.toHaveBeenCalled()
    trackFirstSessionCompleted(true)
    trackFirstSessionCompleted(true)
    expect(capture).toHaveBeenCalledTimes(1)
    expect(capture).toHaveBeenCalledWith('first_session_completed', expect.any(Object))
    expect(localStorage.getItem(FIRST_SESSION_COMPLETED_STORAGE_KEY)).toBe('1')
  })

  it('trackSignupCompletedWithAttribution sets person props and captures', () => {
    sessionStorage.setItem(
      ATTRIBUTION_STORAGE_KEY,
      JSON.stringify({ utm_source: 'newsletter', referrer: 'https://x' }),
    )
    trackSignupCompletedWithAttribution()
    expect(setPersonProperties).toHaveBeenCalledWith(
      expect.objectContaining({ utm_source: 'newsletter', referrer: 'https://x' }),
    )
    expect(capture).toHaveBeenCalledWith(
      'signup_completed',
      expect.objectContaining({ utm_source: 'newsletter' }),
    )
  })
})
