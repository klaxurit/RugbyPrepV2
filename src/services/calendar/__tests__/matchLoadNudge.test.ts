import { describe, expect, it } from 'vitest'
import {
  findMatchNeedingLoadNudge,
  matchLoadNudgeDates,
  matchNeedsLoadLog,
} from '../matchLoadNudge'
import type { CalendarEvent } from '../../../types/training'

const base = (over: Partial<CalendarEvent>): CalendarEvent => ({
  id: 'm1',
  date: '2026-09-27',
  type: 'match',
  opponent: 'Orléans',
  ...over,
})

describe('matchLoadNudge', () => {
  it('J−1 et J−2 en dates locales', () => {
    expect(matchLoadNudgeDates('2026-09-29')).toEqual(['2026-09-28', '2026-09-27'])
  })

  it('besoin de log si pas de rpe ni absence', () => {
    expect(matchNeedsLoadLog(base({}))).toBe(true)
    expect(matchNeedsLoadLog(base({ rpe: 7, duration_min: 70 }))).toBe(false)
    expect(matchNeedsLoadLog(base({ participation_status: 'not_selected' }))).toBe(false)
  })

  it('priorise J−1 sur J−2', () => {
    const found = findMatchNeedingLoadNudge(
      [
        base({ id: 'a', date: '2026-09-27' }),
        base({ id: 'b', date: '2026-09-28' }),
      ],
      '2026-09-29',
    )
    expect(found?.id).toBe('b')
  })
})
