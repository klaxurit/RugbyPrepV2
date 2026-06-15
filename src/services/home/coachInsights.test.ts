import { describe, expect, it } from 'vitest'
import { selectCoachInsight } from './coachInsights'
import type { SessionLog } from '../../types/training'

const TODAY = '2026-06-03'

function log(dateISO: string): SessionLog {
  return {
    id: dateISO,
    dateISO,
    week: 'W1',
    sessionType: 'LOWER',
    fatigue: 'OK',
  }
}

describe('selectCoachInsight', () => {
  it('score sous 50 → lowScore (prioritaire)', () => {
    const insight = selectCoachInsight({
      score: 45,
      acwr: 0.4,
      acwrZone: 'underload',
      todayISO: TODAY,
      matchEvents: [],
      logs: [log('2026-05-20')],
    })
    expect(insight.id).toBe('lowScore')
  })

  it('7+ jours sans séance → prolongedBreak (pas baseline affûté)', () => {
    const insight = selectCoachInsight({
      score: 50,
      acwr: 0.35,
      acwrZone: 'underload',
      todayISO: TODAY,
      matchEvents: [],
      logs: [log('2026-05-20')],
    })
    expect(insight.id).toBe('prolongedBreak')
    expect(insight.eyebrow).toBe('Pause prolongée')
  })

  it('underload récent (< 7 j) → underload', () => {
    const insight = selectCoachInsight({
      score: 62,
      acwr: 0.65,
      acwrZone: 'underload',
      todayISO: TODAY,
      matchEvents: [],
      logs: [log('2026-05-30')],
    })
    expect(insight.id).toBe('underload')
  })

  it('charge optimale et séance récente → baseline', () => {
    const insight = selectCoachInsight({
      score: 78,
      acwr: 1.0,
      acwrZone: 'optimal',
      todayISO: TODAY,
      matchEvents: [],
      logs: [log('2026-06-01')],
    })
    expect(insight.id).toBe('baseline')
  })
})
