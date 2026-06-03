import { describe, expect, it } from 'vitest'
import { isUserCancelledError, mapCheckoutError } from '../checkoutErrorMessages'

describe('mapCheckoutError', () => {
  it('returns generic fallback for null/undefined', () => {
    expect(mapCheckoutError(null)).toMatch(/réessaie/i)
    expect(mapCheckoutError(undefined)).toMatch(/réessaie/i)
  })

  it('returns empty string for user-cancelled (silent reset)', () => {
    expect(mapCheckoutError(new Error('User cancelled the purchase'))).toBe('')
    expect(mapCheckoutError('AbortError: The operation was aborted')).toBe('')
  })

  it('maps network errors to internet-down message', () => {
    expect(mapCheckoutError(new Error('Failed to fetch'))).toMatch(/connexion impossible/i)
    expect(mapCheckoutError('NetworkError when attempting to fetch')).toMatch(/connexion/i)
  })

  it('maps card declined errors to bank message', () => {
    expect(mapCheckoutError('Your card was declined.')).toMatch(/refusé/i)
    expect(mapCheckoutError('insufficient_funds')).toMatch(/refusé/i)
  })

  it('maps already-subscribed to refresh-app message', () => {
    expect(mapCheckoutError('User already has active subscription')).toMatch(/déjà/i)
  })

  it('maps session expired to recharge-page message', () => {
    expect(mapCheckoutError('Session expired')).toMatch(/expir/i)
  })

  it('maps not-configured to bonjour@rugbyforge contact', () => {
    expect(mapCheckoutError('No Stripe price configured for plan founding_yearly')).toMatch(/bonjour@rugbyforge/i)
    expect(mapCheckoutError('provider_not_configured')).toMatch(/bonjour@rugbyforge/i)
  })

  it('maps founding cohort full to Pro fallback message', () => {
    expect(mapCheckoutError('founding_cohort_full')).toMatch(/complète|100\s+places/i)
    expect(mapCheckoutError('reason founding_cohort_full')).toMatch(/Pro/i)
  })

  it('falls back to generic retry+contact for unknown errors', () => {
    const result = mapCheckoutError('Some random error xyz123')
    expect(result).toMatch(/réessaie/i)
    expect(result).toMatch(/bonjour@rugbyforge/i)
  })
})

describe('isUserCancelledError', () => {
  it('detects user cancellations', () => {
    expect(isUserCancelledError(new Error('User cancelled'))).toBe(true)
    expect(isUserCancelledError('AbortError: aborted')).toBe(true)
    expect(isUserCancelledError('NotAllowedError')).toBe(true)
  })

  it('returns false for non-cancel errors', () => {
    expect(isUserCancelledError(new Error('Card declined'))).toBe(false)
    expect(isUserCancelledError('Network error')).toBe(false)
    expect(isUserCancelledError(null)).toBe(false)
  })
})
