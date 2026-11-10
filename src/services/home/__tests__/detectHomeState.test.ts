import { describe, expect, it } from 'vitest'
import { detectHomeState } from '../detectHomeState'
import type { CalendarEvent } from '../../../types/training'

function match(partial: Partial<CalendarEvent> & Pick<CalendarEvent, 'date'>): CalendarEvent {
  return {
    id: partial.id ?? `m-${partial.date}`,
    type: 'match',
    date: partial.date,
    opponent: partial.opponent ?? 'Adversaire',
    is_home: partial.is_home ?? true,
    ...partial,
  }
}

describe('detectHomeState', () => {
  it('post_match le lendemain (J+1)', () => {
    const r = detectHomeState({
      todayISO: '2026-11-09',
      hasTrainingToday: true,
      matchEvents: [match({ date: '2026-11-08' })],
    })
    expect(r.state).toBe('post_match')
    expect(r.lastMatch?.date).toBe('2026-11-08')
  })

  it('post_match encore le mardi après un dimanche (J+2 / ≤48h)', () => {
    const r = detectHomeState({
      todayISO: '2026-11-10',
      hasTrainingToday: true,
      matchEvents: [match({ date: '2026-11-08' })],
    })
    expect(r.state).toBe('post_match')
    expect(r.lastMatch?.date).toBe('2026-11-08')
  })

  it('plus post_match à J+3', () => {
    const r = detectHomeState({
      todayISO: '2026-11-11',
      hasTrainingToday: false,
      matchEvents: [match({ date: '2026-11-08' })],
    })
    expect(r.state).toBe('rest_day')
    expect(r.lastMatch).toBeNull()
  })
})
