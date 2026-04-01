import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from '../../../types/training'
import { detectAnnualPlanningContext } from '../detectAnnualPlanningContext'

type Input = Pick<CalendarEvent, 'date' | 'type'>

const FIRST_MATCH = '2025-03-15'

function match(date: string): Input {
  return { date, type: 'match' }
}

const baseParams = {
  weeklyFrequency: 3 as const,
  positionGroup: 'front_row' as const,
}

describe('detectAnnualPlanningContext', () => {
  it('pré-saison S1 (calendrier)', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH)],
      today: '2024-12-16',
    })
    expect(r.cycle).toBe('pre_season')
    expect(r.weekLabel).toBe('Pre-season Phase 1 - S1')
    expect(r.preSeasonPhase).toBe(1)
    expect(r.weekNumber).toBe(1)
    expect(r.isDeloadWeek).toBe(false)
    expect(r.planningTrace.resolutionMode).toBe('calendar_inferred')
    expect(r.planningTrace.rulesApplied).toContain('rule:pre_season_from_calendar')
  })

  it('pré-saison S6 phase 2', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH)],
      today: '2025-01-20',
    })
    expect(r.cycle).toBe('pre_season')
    expect(r.weekLabel).toBe('Pre-season Phase 2 - S6')
    expect(r.preSeasonPhase).toBe(2)
    expect(r.weekNumber).toBe(6)
    expect(r.planningTrace.resolutionMode).toBe('calendar_inferred')
  })

  it('pré-saison S12 deload phase 3', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH)],
      today: '2025-03-03',
    })
    expect(r.cycle).toBe('pre_season')
    expect(r.weekLabel).toBe('Pre-season Phase 3 - S12')
    expect(r.isDeloadWeek).toBe(true)
    expect(r.preSeasonPhase).toBe(3)
  })

  it('in-season match week', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH), match('2025-03-22')],
      today: '2025-03-18',
    })
    expect(r.cycle).toBe('in_season')
    expect(r.isMatchWeek).toBe(true)
    expect(r.weekLabel).toMatch(/^In-season - W\d+/)
    expect(r.planningTrace.rulesApplied).toContain('rule:in_season_from_calendar')
  })

  it('in-season semaine sans match', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH), match('2025-04-05')],
      today: '2025-03-18',
    })
    expect(r.cycle).toBe('in_season')
    expect(r.isMatchWeek).toBe(false)
  })

  it('off-season Recovery S1 via offSeasonStartAt', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH)],
      today: '2024-10-08',
      planningAnchors: { offSeasonStartAt: '2024-10-07' },
    })
    expect(r.cycle).toBe('off_season')
    expect(r.weekLabel).toBe('Off-season Recovery - S1')
    expect(r.offSeasonPhase).toBe(1)
    expect(r.weekNumber).toBe(1)
    expect(r.offSeasonStartAt).toBe('2024-10-07')
    expect(r.planningTrace.resolutionMode).toBe('explicit_anchors')
    expect(r.planningTrace.rulesApplied).toContain('rule:off_season_start_at')
  })

  it('off-season Hypertrophy S6 via offSeasonStartAt', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH)],
      today: '2024-11-11',
      planningAnchors: { offSeasonStartAt: '2024-10-07' },
    })
    expect(r.cycle).toBe('off_season')
    expect(r.weekLabel).toBe('Off-season Hypertrophy - S6')
    expect(r.offSeasonPhase).toBe(3)
    expect(r.weekNumber).toBe(6)
  })

  it('off-season Force-Bridge S10', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH)],
      today: '2024-12-09',
      planningAnchors: { offSeasonStartAt: '2024-10-07' },
    })
    expect(r.cycle).toBe('off_season')
    expect(r.weekLabel).toBe('Off-season Force-Bridge - S10')
    expect(r.offSeasonPhase).toBe(4)
    expect(r.weekNumber).toBe(10)
  })

  it('off-season backfill déterministe sans ancre explicite', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH)],
      today: '2024-10-08',
    })
    expect(r.cycle).toBe('off_season')
    expect(r.weekNumber).toBe(1)
    expect(r.planningTrace.resolutionMode).toBe('backfilled')
    expect(r.planningTrace.rulesApplied).toContain('rule:off_season_backfill_pre_season_minus_10w')
    expect(r.planningTrace.warnings.length).toBeGreaterThan(0)
    expect(r.offSeasonStartAt).toBe('2024-10-07')
  })

  it('playoffs via manualPlayoffs', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH)],
      today: '2025-06-01',
      planningAnchors: { manualPlayoffs: true },
    })
    expect(r.cycle).toBe('playoffs')
    expect(r.weekLabel).toBe('Playoffs - W1')
    expect(r.planningTrace.resolutionMode).toBe('manual_override')
    expect(r.planningTrace.rulesApplied).toContain('rule:manual_playoffs')
    expect(r.offSeasonStartAt).toBeNull()
  })

  it('playoffs via manualCycleOverride', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH)],
      today: '2025-06-01',
      planningAnchors: { manualCycleOverride: 'playoffs' },
    })
    expect(r.cycle).toBe('playoffs')
    expect(r.weekLabel).toBe('Playoffs - W1')
    expect(r.planningTrace.resolutionMode).toBe('manual_override')
  })

  it('override manuel off-season (semaine S4)', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [],
      today: '2025-01-01',
      planningAnchors: {
        manualCycleOverride: 'off_season',
        manualOffSeasonWeekOverride: 4,
      },
    })
    expect(r.cycle).toBe('off_season')
    expect(r.weekNumber).toBe(4)
    expect(r.weekLabel).toBe('Off-season Transition - S4')
    expect(r.planningTrace.resolutionMode).toBe('manual_override')
    expect(r.planningTrace.rulesApplied.some((x) => x.startsWith('rule:manual_cycle'))).toBe(true)
  })

  it('override manuel pré-saison S6', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH)],
      today: '2024-12-16',
      planningAnchors: {
        manualCycleOverride: 'pre_season',
        manualPreSeasonWeekOverride: 6,
      },
    })
    expect(r.cycle).toBe('pre_season')
    expect(r.weekNumber).toBe(6)
    expect(r.weekLabel).toBe('Pre-season Phase 2 - S6')
    expect(r.planningTrace.resolutionMode).toBe('manual_override')
  })

  it('today string invalide → erreur explicite déterministe', () => {
    expect(() =>
      detectAnnualPlanningContext({
        ...baseParams,
        events: [],
        today: 'pas-une-date',
      })
    ).toThrow(/detectAnnualPlanningContext: today invalide/)
  })

  it('firstMatchDateOverride prime sur le calendrier', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match('2026-01-01')],
      today: '2024-12-16',
      planningAnchors: { firstMatchDateOverride: FIRST_MATCH },
    })
    expect(r.firstMatchDate).toBe(FIRST_MATCH)
    expect(r.cycle).toBe('pre_season')
    expect(r.weekLabel).toBe('Pre-season Phase 1 - S1')
    expect(r.planningTrace.rulesApplied).toContain('anchor:first_match_date_override_validated')
  })
})
