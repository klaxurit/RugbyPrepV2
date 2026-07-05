import { describe, expect, it } from 'vitest'
import {
  extractIsoDatePart,
  isValidPlanningIsoDate,
  parseLocalDateOnly,
  sanitizePlanningIsoDate,
} from '../localIsoDate'

describe('localIsoDate', () => {
  it('parse une date ISO valide', () => {
    const d = parseLocalDateOnly('2026-08-10')
    expect(d).not.toBeNull()
    expect(d!.getFullYear()).toBe(2026)
    expect(d!.getMonth()).toBe(7)
    expect(d!.getDate()).toBe(10)
  })

  it('rejette une année trop petite (0002 → JS Date 1902)', () => {
    expect(parseLocalDateOnly('0002-08-10')).toBeNull()
    expect(isValidPlanningIsoDate('0002-08-10')).toBe(false)
    expect(sanitizePlanningIsoDate('0002-08-10')).toBeUndefined()
  })

  it('extrait la partie date depuis un datetime admin', () => {
    expect(extractIsoDatePart('2026-03-15T12:00:00.000Z')).toBe('2026-03-15')
    expect(parseLocalDateOnly('2026-03-15T12:00:00.000Z')).not.toBeNull()
    expect(sanitizePlanningIsoDate('2026-03-15T12:00:00.000Z')).toBe('2026-03-15')
  })
})
