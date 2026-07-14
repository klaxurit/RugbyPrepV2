import { describe, expect, it } from 'vitest'
import {
  hasCalendarOffSeasonAnchor,
  sanitizePlanningAnchorsForProgression,
  shouldFreezeOffSeasonWeek,
} from '../sanitizePlanningAnchors'

describe('sanitizePlanningAnchors', () => {
  it('hasCalendarOffSeasonAnchor détecte seasonEndedAt ou offSeasonStartAt', () => {
    expect(hasCalendarOffSeasonAnchor(undefined)).toBe(false)
    expect(hasCalendarOffSeasonAnchor({ manualOffSeasonWeekOverride: 7 })).toBe(false)
    expect(hasCalendarOffSeasonAnchor({ seasonEndedAt: '2026-04-06' })).toBe(true)
    expect(hasCalendarOffSeasonAnchor({ offSeasonStartAt: '2024-10-07' })).toBe(true)
  })

  it('shouldFreezeOffSeasonWeek seulement sans ancre calendrier', () => {
    expect(shouldFreezeOffSeasonWeek({ manualOffSeasonWeekOverride: 7 })).toBe(true)
    expect(
      shouldFreezeOffSeasonWeek({
        manualOffSeasonWeekOverride: 7,
        seasonEndedAt: '2026-04-06',
      }),
    ).toBe(false)
  })

  it('sanitizePlanningAnchorsForProgression retire les overrides figés si ancre calendrier', () => {
    const input = {
      seasonEndedAt: '2026-04-06',
      manualOffSeasonWeekOverride: 7,
      manualPreSeasonWeekOverride: 2,
      returnToTeamTrainingAt: '2026-09-01',
    }
    expect(sanitizePlanningAnchorsForProgression(input)).toEqual({
      seasonEndedAt: '2026-04-06',
      returnToTeamTrainingAt: '2026-09-01',
    })
  })

  it('sanitizePlanningAnchorsForProgression laisse les overrides en mode QA pur', () => {
    const input = { manualOffSeasonWeekOverride: 7, manualCycleOverride: 'off_season' as const }
    expect(sanitizePlanningAnchorsForProgression(input)).toBe(input)
  })
})
