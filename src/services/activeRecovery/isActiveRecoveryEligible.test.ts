import { describe, expect, it } from 'vitest'
import { isActiveRecoveryEligible, type ActiveRecoveryEligibilityInput } from './isActiveRecoveryEligible'

const ELIGIBLE: ActiveRecoveryEligibilityInput = {
  isSequential: false,
  isUnavailable: false,
  todayHasSession: false,
  todayHasMatch: false,
  todayIsClubDay: false,
  readinessScore: 80,
  acwrZone: 'optimal',
  isRehabP1: false,
  hasSurface: true,
}

describe('isActiveRecoveryEligible', () => {
  it('eligible on a normal rest day with good readiness', () => {
    expect(isActiveRecoveryEligible(ELIGIBLE)).toBe(true)
  })

  // ── Fix 1: isRecoveryDay does NOT bypass suppression rules ──

  it('hides card when readiness < 40 (even on J+1 recovery day)', () => {
    // isRecoveryDay is external — eligibility must still block if readiness is low
    expect(isActiveRecoveryEligible({ ...ELIGIBLE, readinessScore: 35 })).toBe(false)
  })

  it('hides card when ACWR = critical (even on J+1 recovery day)', () => {
    expect(isActiveRecoveryEligible({ ...ELIGIBLE, acwrZone: 'critical' })).toBe(false)
  })

  it('hides card when rehab phase P1 (even on J+1 recovery day)', () => {
    expect(isActiveRecoveryEligible({ ...ELIGIBLE, isRehabP1: true })).toBe(false)
  })

  // ── Fix 2: Club rugby days are not rest days ──

  it('hides card on club rugby training days', () => {
    expect(isActiveRecoveryEligible({ ...ELIGIBLE, todayIsClubDay: true })).toBe(false)
  })

  // ── Other suppression rules ──

  it('hides card on training days', () => {
    expect(isActiveRecoveryEligible({ ...ELIGIBLE, todayHasSession: true })).toBe(false)
  })

  it('hides card on match days', () => {
    expect(isActiveRecoveryEligible({ ...ELIGIBLE, todayHasMatch: true })).toBe(false)
  })

  it('hides card in sequential mode', () => {
    expect(isActiveRecoveryEligible({ ...ELIGIBLE, isSequential: true })).toBe(false)
  })

  it('hides card when surface unavailable', () => {
    expect(isActiveRecoveryEligible({ ...ELIGIBLE, isUnavailable: true })).toBe(false)
    expect(isActiveRecoveryEligible({ ...ELIGIBLE, hasSurface: false })).toBe(false)
  })

  it('eligible on J+1 recovery day when all guardrails pass', () => {
    // This test confirms that a recovery day (J+1) IS eligible when conditions are met.
    // The isRecoveryDay flag is external — it only affects card copy, not this function.
    expect(isActiveRecoveryEligible(ELIGIBLE)).toBe(true)
  })

  // ── Edge: ACWR zones that are NOT critical still allow AR ──

  it('allows card when ACWR = danger (not critical)', () => {
    expect(isActiveRecoveryEligible({ ...ELIGIBLE, acwrZone: 'danger' })).toBe(true)
  })

  it('allows card when ACWR = null (insufficient data)', () => {
    expect(isActiveRecoveryEligible({ ...ELIGIBLE, acwrZone: null })).toBe(true)
  })

  it('hides card at exactly readiness = 39', () => {
    expect(isActiveRecoveryEligible({ ...ELIGIBLE, readinessScore: 39 })).toBe(false)
  })

  it('allows card at exactly readiness = 40', () => {
    expect(isActiveRecoveryEligible({ ...ELIGIBLE, readinessScore: 40 })).toBe(true)
  })
})
