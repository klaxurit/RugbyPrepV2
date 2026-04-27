import { describe, expect, it } from 'vitest'
import { isRestartRampUpActive, RESTART_RAMP_UP_DAYS } from '../restartRampUp'

const now = new Date('2026-04-27T12:00:00Z')
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString()

describe('isRestartRampUpActive', () => {
  it('returns false when baseline is not restart', () => {
    expect(isRestartRampUpActive({ trainingBaseline: 'active', trainingBaselineSetAt: daysAgo(1) }, now)).toBe(false)
    expect(isRestartRampUpActive({ trainingBaseline: 'peak', trainingBaselineSetAt: daysAgo(1) }, now)).toBe(false)
    expect(isRestartRampUpActive({ trainingBaseline: undefined, trainingBaselineSetAt: daysAgo(1) }, now)).toBe(false)
  })

  it('returns false when restart is set but timestamp is missing (legacy users)', () => {
    expect(isRestartRampUpActive({ trainingBaseline: 'restart', trainingBaselineSetAt: null }, now)).toBe(false)
    expect(isRestartRampUpActive({ trainingBaseline: 'restart', trainingBaselineSetAt: undefined }, now)).toBe(false)
  })

  it('returns true within the ramp-up window', () => {
    expect(isRestartRampUpActive({ trainingBaseline: 'restart', trainingBaselineSetAt: daysAgo(0) }, now)).toBe(true)
    expect(isRestartRampUpActive({ trainingBaseline: 'restart', trainingBaselineSetAt: daysAgo(7) }, now)).toBe(true)
    expect(isRestartRampUpActive({ trainingBaseline: 'restart', trainingBaselineSetAt: daysAgo(RESTART_RAMP_UP_DAYS - 1) }, now)).toBe(true)
  })

  it('returns false once the ramp-up window has expired', () => {
    expect(isRestartRampUpActive({ trainingBaseline: 'restart', trainingBaselineSetAt: daysAgo(RESTART_RAMP_UP_DAYS) }, now)).toBe(false)
    expect(isRestartRampUpActive({ trainingBaseline: 'restart', trainingBaselineSetAt: daysAgo(RESTART_RAMP_UP_DAYS + 5) }, now)).toBe(false)
  })

  it('returns false for malformed timestamps', () => {
    expect(isRestartRampUpActive({ trainingBaseline: 'restart', trainingBaselineSetAt: 'not-a-date' }, now)).toBe(false)
  })

  it('returns false when timestamp is in the future (clock skew safety)', () => {
    const future = new Date(now.getTime() + 86_400_000).toISOString()
    expect(isRestartRampUpActive({ trainingBaseline: 'restart', trainingBaselineSetAt: future }, now)).toBe(false)
  })
})
