import { describe, expect, it } from 'vitest'
import { matchFfrDisplayScore } from '../matchFfrDisplayScore'
import type { CalendarEvent } from '../../../types/training'

function base(over: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: 'm1',
    date: '2026-10-04',
    type: 'match',
    ...over,
  }
}

describe('matchFfrDisplayScore', () => {
  it('retourne undefined si score non validé FFR', () => {
    expect(
      matchFfrDisplayScore(
        base({
          ffr_score_valid: false,
          ffr_score_locale: 50,
          ffr_score_visiteur: 12,
          is_home: true,
        }),
      ),
    ).toBeUndefined()
  })

  it('domicile : nous = locale', () => {
    expect(
      matchFfrDisplayScore(
        base({
          ffr_score_valid: true,
          ffr_score_locale: 50,
          ffr_score_visiteur: 12,
          is_home: true,
        }),
      ),
    ).toEqual({ home: 50, away: 12 })
  })

  it('extérieur : nous = visiteur', () => {
    expect(
      matchFfrDisplayScore(
        base({
          ffr_score_valid: true,
          ffr_score_locale: 50,
          ffr_score_visiteur: 12,
          is_home: false,
        }),
      ),
    ).toEqual({ home: 12, away: 50 })
  })
})
