// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import {
  clearPendingOauthConsent,
  isGoogleAuthUser,
  notePendingOauthConsent,
  readPendingOauthConsent,
  shouldPromptOauthLegalConsent,
} from '../oauthLegalConsent'

describe('pending OAuth consent', () => {
  afterEach(() => {
    clearPendingOauthConsent()
  })

  it('round-trips legal + newsletter choices', () => {
    notePendingOauthConsent({
      medicalConsentAcceptedAt: '2026-10-27T12:00:00.000Z',
      newsletterOptIn: true,
    })
    expect(readPendingOauthConsent()).toEqual({
      medicalConsentAcceptedAt: '2026-10-27T12:00:00.000Z',
      newsletterOptIn: true,
    })
  })

  it('returns null after clear', () => {
    notePendingOauthConsent({
      medicalConsentAcceptedAt: '2026-10-27T12:00:00.000Z',
      newsletterOptIn: false,
    })
    clearPendingOauthConsent()
    expect(readPendingOauthConsent()).toBeNull()
  })
})

describe('isGoogleAuthUser', () => {
  it('détecte Google via identities ou app_metadata', () => {
    expect(isGoogleAuthUser({ identities: [{ provider: 'google' }] })).toBe(true)
    expect(isGoogleAuthUser({ app_metadata: { provider: 'google' } })).toBe(true)
    expect(isGoogleAuthUser({ app_metadata: { providers: ['email', 'google'] } })).toBe(true)
    expect(isGoogleAuthUser({ identities: [{ provider: 'email' }] })).toBe(false)
  })
})

describe('shouldPromptOauthLegalConsent', () => {
  it('blocks onboarding until consent is stored, not on auth/legal routes', () => {
    expect(shouldPromptOauthLegalConsent({
      pathname: '/onboarding',
      consentStatus: 'missing',
    })).toBe(true)
    expect(shouldPromptOauthLegalConsent({
      pathname: '/home',
      consentStatus: 'missing',
    })).toBe(true)
    expect(shouldPromptOauthLegalConsent({
      pathname: '/auth/callback',
      consentStatus: 'missing',
    })).toBe(false)
    expect(shouldPromptOauthLegalConsent({
      pathname: '/legal',
      consentStatus: 'missing',
    })).toBe(false)
    expect(shouldPromptOauthLegalConsent({
      pathname: '/onboarding',
      consentStatus: 'loading',
    })).toBe(false)
    expect(shouldPromptOauthLegalConsent({
      pathname: '/onboarding',
      consentStatus: 'present',
    })).toBe(false)
  })
})
