import { describe, expect, it } from 'vitest'
import {
  evaluateFoundingEligibility,
  D2_DELAY_MS,
} from '../useFoundingOfferEligibility'

const NOW = new Date('2026-05-15T12:00:00Z').getTime()

const eligibleInputs = {
  userId: 'u1',
  userCreatedAt: NOW - 2 * D2_DELAY_MS, // 48h ago
  isPremium: false,
  hasSession: true,
  dismissed: false,
  loading: false,
  now: NOW,
}

describe('evaluateFoundingEligibility', () => {
  it('returns true when all conditions are satisfied', () => {
    expect(evaluateFoundingEligibility(eligibleInputs)).toBe(true)
  })

  it('returns false when userId is missing', () => {
    expect(evaluateFoundingEligibility({ ...eligibleInputs, userId: null })).toBe(false)
  })

  it('returns false while loading', () => {
    expect(evaluateFoundingEligibility({ ...eligibleInputs, loading: true })).toBe(false)
  })

  it('returns false when user is already premium', () => {
    expect(evaluateFoundingEligibility({ ...eligibleInputs, isPremium: true })).toBe(false)
  })

  it('returns false when founding cohort is full (unless forceShow)', () => {
    expect(evaluateFoundingEligibility({ ...eligibleInputs, cohortFull: true })).toBe(false)
  })

  it('forceShow still shows when cohort is full (deep link / email recovery)', () => {
    expect(
      evaluateFoundingEligibility({
        ...eligibleInputs,
        dismissed: true,
        hasSession: false,
        cohortFull: true,
        forceShow: true,
      }),
    ).toBe(true)
  })

  it('returns false when user has dismissed the offer', () => {
    expect(evaluateFoundingEligibility({ ...eligibleInputs, dismissed: true })).toBe(false)
  })

  it('returns false when userCreatedAt is null', () => {
    expect(evaluateFoundingEligibility({ ...eligibleInputs, userCreatedAt: null })).toBe(false)
  })

  it('returns false when account is younger than D2 (24h)', () => {
    const oneHourOld = { ...eligibleInputs, userCreatedAt: NOW - 60 * 60 * 1000 }
    expect(evaluateFoundingEligibility(oneHourOld)).toBe(false)
  })

  it('returns true exactly at the D2 boundary', () => {
    const exactly24h = { ...eligibleInputs, userCreatedAt: NOW - D2_DELAY_MS }
    expect(evaluateFoundingEligibility(exactly24h)).toBe(true)
  })

  it('returns false when no session has been logged', () => {
    expect(evaluateFoundingEligibility({ ...eligibleInputs, hasSession: false })).toBe(false)
  })

  it('priority order: dismissed wins over D2 + session', () => {
    expect(
      evaluateFoundingEligibility({ ...eligibleInputs, dismissed: true, hasSession: true }),
    ).toBe(false)
  })

  it('forceShow bypasses dismissed + D2 + session gates (used by /founding route)', () => {
    expect(
      evaluateFoundingEligibility({
        ...eligibleInputs,
        dismissed: true,
        hasSession: false,
        userCreatedAt: NOW,
        forceShow: true,
      }),
    ).toBe(true)
  })

  it('forceShow does NOT bypass isPremium (already paying users never see the offer)', () => {
    expect(
      evaluateFoundingEligibility({ ...eligibleInputs, isPremium: true, forceShow: true }),
    ).toBe(false)
  })

  it('forceShow does NOT bypass loading (UX coherence : wait for upstream signals)', () => {
    expect(
      evaluateFoundingEligibility({ ...eligibleInputs, loading: true, forceShow: true }),
    ).toBe(false)
  })
})
