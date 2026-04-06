import { describe, expect, it } from 'vitest'
import { detectSeasonTransitions } from '../detectSeasonTransitions'
import type { AnnualPlanningContext } from '../../../types/annualPlanning'

const baseCtx: AnnualPlanningContext = {
  cycle: 'in_season',
  weekNumber: 10,
  weekLabel: 'En saison - S10 (2/4)',
  isDeloadWeek: false,
  mesocycleWeek: 2,
  mesocycleBlock: 3,
  isMatchWeek: false,
  firstMatchDate: '2025-09-15',
  lastMatchDate: '2026-03-20',
  offSeasonStartAt: null,
  daysUntilNextMatch: null,
  daysSinceLastMatch: null,
  fatigueLevel: 'normal',
  weeklyFrequency: 2,
  positionGroup: 'back_three',
  planningTrace: { resolutionMode: 'calendar_inferred', rulesApplied: [], warnings: [] },
}

describe('detectSeasonTransitions', () => {
  // ── UC1: Season ended ──────────────────────────────────────

  it('detects season_ended when no future match + last match > 7 days ago', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, daysUntilNextMatch: null, daysSinceLastMatch: 10 },
      today: '2026-03-30',
    })
    expect(r).not.toBeNull()
    expect(r!.type).toBe('season_ended')
    if (r!.type === 'season_ended') {
      expect(r!.daysSinceLastMatch).toBe(10)
    }
  })

  it('no season_ended if last match < 7 days ago', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, daysUntilNextMatch: null, daysSinceLastMatch: 5 },
      today: '2026-03-25',
    })
    expect(r).toBeNull()
  })

  it('no season_ended if future match exists', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, daysUntilNextMatch: 3, daysSinceLastMatch: 10 },
      today: '2026-03-30',
    })
    expect(r).toBeNull() // has future match → not ended
  })

  it('no season_ended if dismissed', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, daysUntilNextMatch: null, daysSinceLastMatch: 10 },
      today: '2026-03-30',
      dismissedUntil: { season_ended: '2026-04-06' },
    })
    expect(r).toBeNull()
  })

  // ── UC2: Treve ─────────────────────────────────────────────

  it('detects treve when next match > 3 weeks away', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, daysUntilNextMatch: 28, daysSinceLastMatch: 5 },
      today: '2026-01-05',
    })
    expect(r).not.toBeNull()
    expect(r!.type).toBe('treve_detected')
    if (r!.type === 'treve_detected') {
      expect(r!.gapWeeks).toBe(4)
    }
  })

  it('no treve if next match in 2 weeks', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, daysUntilNextMatch: 14, daysSinceLastMatch: 5 },
      today: '2026-01-05',
    })
    expect(r).toBeNull()
  })

  // ── UC7: Playoffs ──────────────────────────────────────────

  it('suggests playoffs in April with future matches', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, daysUntilNextMatch: 5, daysSinceLastMatch: 7 },
      today: '2026-04-15',
    })
    expect(r).not.toBeNull()
    expect(r!.type).toBe('playoffs_suggested')
  })

  it('no playoffs in March', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, daysUntilNextMatch: 5, daysSinceLastMatch: 7 },
      today: '2026-03-15',
    })
    expect(r).toBeNull()
  })

  it('no playoffs if no future match', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, daysUntilNextMatch: null, daysSinceLastMatch: 3 },
      today: '2026-04-15',
    })
    // season_ended takes priority (daysSinceLastMatch < 7 → null)
    expect(r).toBeNull()
  })

  // ── Priority ───────────────────────────────────────────────

  it('season_ended has priority over playoffs', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, daysUntilNextMatch: null, daysSinceLastMatch: 10 },
      today: '2026-04-15', // April but season ended
    })
    expect(r!.type).toBe('season_ended')
  })

  it('treve has priority over playoffs', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, daysUntilNextMatch: 25, daysSinceLastMatch: 5 },
      today: '2026-04-15', // April but in treve
    })
    expect(r!.type).toBe('treve_detected')
  })

  // ── Off-season / pre-season: no transitions ────────────────

  it('returns null for early off-season (S3, before July)', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, cycle: 'off_season', weekNumber: 3 },
      today: '2026-05-01',
    })
    expect(r).toBeNull()
  })

  it('suggests pre-season when off-season week >= 8', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, cycle: 'off_season', weekNumber: 8 },
      today: '2026-06-01',
    })
    expect(r).not.toBeNull()
    expect(r!.type).toBe('pre_season_suggested')
  })

  it('suggests pre-season when July+ regardless of week', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, cycle: 'off_season', weekNumber: 4 },
      today: '2026-07-01',
    })
    expect(r).not.toBeNull()
    expect(r!.type).toBe('pre_season_suggested')
  })
})
