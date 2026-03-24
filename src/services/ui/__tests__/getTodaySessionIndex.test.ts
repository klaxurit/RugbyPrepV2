import { describe, it, expect } from 'vitest'
import { getTodaySessionIndex } from '../getTodaySessionIndex'
import type { SCSchedule, DayOfWeek } from '../../../types/training'

function sc(...days: number[]): SCSchedule {
  return {
    sessions: days.map((d, i) => ({ sessionIndex: (i % 3) as 0 | 1 | 2, day: d as DayOfWeek })),
  }
}

describe('getTodaySessionIndex', () => {
  it('2x with scSchedule — today matches first session', () => {
    // scSchedule = Tue(2), Thu(4); today = Tuesday(2)
    const result = getTodaySessionIndex(
      [{ dayPreference: 'early_week' }, { dayPreference: 'late_week' }],
      sc(2, 4),
      undefined,
      2, // Tuesday
    )
    expect(result).toBe(0)
  })

  it('2x with scSchedule — today matches second session', () => {
    const result = getTodaySessionIndex(
      [{ dayPreference: 'early_week' }, { dayPreference: 'late_week' }],
      sc(2, 4),
      undefined,
      4, // Thursday
    )
    expect(result).toBe(1)
  })

  it('3x with scSchedule — today matches mid_week', () => {
    const result = getTodaySessionIndex(
      [{ dayPreference: 'early_week' }, { dayPreference: 'mid_week' }, { dayPreference: 'late_week' }],
      sc(1, 3, 5),
      undefined,
      3, // Wednesday
    )
    expect(result).toBe(1)
  })

  it('no session today → returns null', () => {
    const result = getTodaySessionIndex(
      [{ dayPreference: 'early_week' }, { dayPreference: 'late_week' }],
      sc(2, 4),
      undefined,
      0, // Sunday — no session
    )
    expect(result).toBeNull()
  })

  it('without scSchedule — uses defaults', () => {
    // Default 2x = [2, 4]; today = Thu(4)
    const result = getTodaySessionIndex(
      [{ dayPreference: 'early_week' }, { dayPreference: 'late_week' }],
      undefined,
      undefined,
      4,
    )
    expect(result).toBe(1)
  })

  it('empty slots → null', () => {
    expect(getTodaySessionIndex([], undefined, undefined, 2)).toBeNull()
  })

  it('multiple slots on same day → returns first', () => {
    // Both mapped to day 2
    const result = getTodaySessionIndex(
      [{ dayPreference: undefined }, { dayPreference: undefined }],
      sc(2, 2),
      undefined,
      2,
    )
    expect(result).toBe(0)
  })
})
