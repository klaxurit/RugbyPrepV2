import { describe, expect, it } from 'vitest'
import { computeReadinessTrend } from '../computeReadinessTrend'
import type { SessionLog } from '../../../types/training'

const mkLog = (dateISO: string, over: Partial<SessionLog> = {}): SessionLog => ({
  id: `l-${dateISO}`,
  dateISO,
  week: 'W1',
  sessionType: 'UPPER',
  fatigue: 'OK',
  ...over,
})

describe('computeReadinessTrend', () => {
  it('returns 7 values on the 0-10 scale', () => {
    const values = computeReadinessTrend({
      logs: [],
      acwrZone: 'optimal',
      fatigue: 'OK',
      nextMatchDateISO: null,
      todayISO: '2026-04-15',
    })
    expect(values).toHaveLength(7)
    values.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(10)
    })
  })

  it('varies across days when recovery state changes', () => {
    // Session logged 2 days before today → recovery score differs between j-6 and j0
    const values = computeReadinessTrend({
      logs: [mkLog('2026-04-13')],
      acwrZone: 'optimal',
      fatigue: 'OK',
      nextMatchDateISO: null,
      todayISO: '2026-04-15',
    })
    const unique = new Set(values)
    expect(unique.size).toBeGreaterThan(1)
  })

  it('excludes active recovery sessions from "last session" calculation', () => {
    const withActive = computeReadinessTrend({
      logs: [mkLog('2026-04-14', { sessionType: 'ACTIVE_RECOVERY' })],
      acwrZone: 'optimal',
      fatigue: 'OK',
      nextMatchDateISO: null,
      todayISO: '2026-04-15',
    })
    const withoutAny = computeReadinessTrend({
      logs: [],
      acwrZone: 'optimal',
      fatigue: 'OK',
      nextMatchDateISO: null,
      todayISO: '2026-04-15',
    })
    // Active recovery ignored → same result as empty logs
    expect(withActive).toEqual(withoutAny)
  })

  it('reacts to fatigue state', () => {
    const ok = computeReadinessTrend({
      logs: [],
      acwrZone: 'optimal',
      fatigue: 'OK',
      nextMatchDateISO: null,
      todayISO: '2026-04-15',
    })
    const tired = computeReadinessTrend({
      logs: [],
      acwrZone: 'optimal',
      fatigue: 'FATIGUE',
      nextMatchDateISO: null,
      todayISO: '2026-04-15',
    })
    // Tired → lower scores overall
    const sumOk = ok.reduce((a, b) => a + b, 0)
    const sumTired = tired.reduce((a, b) => a + b, 0)
    expect(sumTired).toBeLessThan(sumOk)
  })
})
