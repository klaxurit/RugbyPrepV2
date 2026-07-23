import { describe, expect, it } from 'vitest'
import {
  hasCalendarOffSeasonAnchor,
  hasProgressionCalendarAnchor,
  sanitizePlanningAnchorsForProgression,
  sanitizePlanningAnchorsForProgressionDetailed,
  shouldFreezeOffSeasonWeek,
} from '../sanitizePlanningAnchors'

describe('sanitizePlanningAnchors', () => {
  it('hasCalendarOffSeasonAnchor détecte seasonEndedAt ou offSeasonStartAt', () => {
    expect(hasCalendarOffSeasonAnchor(undefined)).toBe(false)
    expect(hasCalendarOffSeasonAnchor({ manualOffSeasonWeekOverride: 7 })).toBe(false)
    expect(hasCalendarOffSeasonAnchor({ seasonEndedAt: '2026-04-06' })).toBe(true)
    expect(hasCalendarOffSeasonAnchor({ offSeasonStartAt: '2024-10-07' })).toBe(true)
  })

  it('hasProgressionCalendarAnchor inclut returnToTeamTrainingAt', () => {
    expect(hasProgressionCalendarAnchor({ returnToTeamTrainingAt: '2026-08-10' })).toBe(true)
    expect(hasProgressionCalendarAnchor({ manualOffSeasonWeekOverride: 9 })).toBe(false)
  })

  it('shouldFreezeOffSeasonWeek seulement sans ancre de progression', () => {
    expect(shouldFreezeOffSeasonWeek({ manualOffSeasonWeekOverride: 7 })).toBe(true)
    expect(
      shouldFreezeOffSeasonWeek({
        manualOffSeasonWeekOverride: 7,
        seasonEndedAt: '2026-04-06',
      }),
    ).toBe(false)
    expect(
      shouldFreezeOffSeasonWeek({
        manualOffSeasonWeekOverride: 9,
        returnToTeamTrainingAt: '2026-08-10',
      }),
    ).toBe(false)
  })

  it('sanitize retire les overrides si seasonEndedAt', () => {
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

  it('migre freeze S9 + reprise → offSeasonStartAt pour avancer en S10', () => {
    const { anchors, didMigrateFrozenWeek } = sanitizePlanningAnchorsForProgressionDetailed(
      {
        manualCycleOverride: 'off_season',
        manualOffSeasonWeekOverride: 9,
        returnToTeamTrainingAt: '2026-08-10',
        skipOffSeasonRecoveryIntro: true,
      },
      '2026-07-21',
    )
    expect(didMigrateFrozenWeek).toBe(true)
    expect(anchors?.manualOffSeasonWeekOverride).toBeUndefined()
    // Lundi courant 2026-07-20 − 9×7j = 2026-05-18 → semaine calendaire = S10
    expect(anchors?.offSeasonStartAt).toBe('2026-05-18')
    expect(anchors?.returnToTeamTrainingAt).toBe('2026-08-10')
    expect(anchors?.manualCycleOverride).toBe('off_season')
  })

  it('sanitizePlanningAnchorsForProgression laisse les overrides en mode QA pur', () => {
    const input = { manualOffSeasonWeekOverride: 7, manualCycleOverride: 'off_season' as const }
    expect(sanitizePlanningAnchorsForProgression(input)).toBe(input)
  })
})
