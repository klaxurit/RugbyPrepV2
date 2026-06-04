import { describe, expect, it } from 'vitest'
import { shouldShowProfileSeasonActions } from '../shouldShowProfileSeasonActions'

describe('shouldShowProfileSeasonActions', () => {
  it('shows actions when no Home transition', () => {
    expect(shouldShowProfileSeasonActions({ seasonTransition: null, cycle: 'in_season' })).toBe(true)
  })

  it('hides in-season manual buttons when Home shows season_ended', () => {
    expect(
      shouldShowProfileSeasonActions({
        seasonTransition: { type: 'season_ended', lastMatchDate: '2026-03-01', daysSinceLastMatch: 14 },
        cycle: 'in_season',
      })
    ).toBe(false)
  })

  it('still shows actions for treve banner (informational only)', () => {
    expect(
      shouldShowProfileSeasonActions({
        seasonTransition: { type: 'treve_detected', nextMatchDate: '2026-05-01', gapWeeks: 4 },
        cycle: 'in_season',
      })
    ).toBe(true)
  })

  it('shows actions in off_season even if transition is set', () => {
    expect(
      shouldShowProfileSeasonActions({
        seasonTransition: { type: 'season_ended', lastMatchDate: '2026-03-01', daysSinceLastMatch: 14 },
        cycle: 'off_season',
      })
    ).toBe(true)
  })
})
