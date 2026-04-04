import { describe, expect, it } from 'vitest'
import { parseLocalDate } from '../parseLocalDate'

describe('parseLocalDate (F3)', () => {
  it('parses YYYY-MM-DD as local date at noon', () => {
    const d = parseLocalDate('2026-04-06')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(3) // April = 3
    expect(d.getDate()).toBe(6)
    expect(d.getHours()).toBe(12)
  })

  it('getDay returns correct day-of-week (Monday=1 for 2026-04-06)', () => {
    const d = parseLocalDate('2026-04-06')
    expect(d.getDay()).toBe(1) // Monday
  })

  it('never shifts to previous day regardless of timezone', () => {
    // The key invariant: date component matches the input string
    const d = parseLocalDate('2026-01-01')
    expect(d.getDate()).toBe(1)
    expect(d.getMonth()).toBe(0) // January
  })

  it('handles year boundaries', () => {
    const d = parseLocalDate('2026-12-31')
    expect(d.getDate()).toBe(31)
    expect(d.getMonth()).toBe(11) // December
    expect(d.getFullYear()).toBe(2026)
  })
})
