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
    expect(r.weekLabel).toBe('Pré-saison Phase 1 - S1')
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
    expect(r.weekLabel).toBe('Pré-saison Phase 2 - S6')
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
    expect(r.weekLabel).toBe('Pré-saison Phase 3 - S12')
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
    expect(r.weekLabel).toMatch(/^En saison - S\d+/)
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
    expect(r.weekLabel).toBe('Inter-saison Récupération - S1')
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
    expect(r.weekLabel).toBe('Inter-saison Hypertrophie - S6')
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
    expect(r.weekLabel).toBe('Inter-saison Force-Pont - S10')
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

  it('playoffs via manualPlayoffs (V2: taper phase)', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH)],
      today: '2025-05-01', // May — within playoffs window (April-May)
      planningAnchors: { manualPlayoffs: true },
    })
    expect(r.cycle).toBe('playoffs')
    expect(r.weekLabel).toContain('Playoffs')
    expect(r.playoffTaperPhase).toBeDefined()
    expect(r.planningTrace.resolutionMode).toBe('manual_override')
    expect(r.planningTrace.rulesApplied).toContain('rule:manual_playoffs')
    expect(r.offSeasonStartAt).toBeNull()
  })

  it('playoffs via manualCycleOverride (V2: taper phase)', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH)],
      today: '2025-04-15', // April — within playoffs window
      planningAnchors: { manualCycleOverride: 'playoffs' },
    })
    expect(r.cycle).toBe('playoffs')
    expect(r.weekLabel).toContain('Playoffs')
    expect(r.playoffTaperPhase).toBeDefined()
    expect(r.planningTrace.resolutionMode).toBe('manual_override')
  })

  it('manualPlayoffs ignored after May (temporal guard)', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH)],
      today: '2025-06-15', // June — outside playoffs window
      planningAnchors: { manualPlayoffs: true },
    })
    expect(r.cycle).not.toBe('playoffs') // flag is stale, should fall through
  })

  it('auto season-end after 28 days without match', () => {
    // Last match was March 15, today is May 15 — 61 days since last match, no future match
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH)], // only past match
      today: '2025-05-15',
    })
    expect(r.cycle).toBe('off_season')
    expect(r.planningTrace.rulesApplied).toContain('rule:auto_season_ended_28d')
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
    expect(r.weekLabel).toBe('Inter-saison Transition - S4')
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
    expect(r.weekLabel).toBe('Pré-saison Phase 2 - S6')
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
    expect(r.weekLabel).toBe('Pré-saison Phase 1 - S1')
    expect(r.planningTrace.rulesApplied).toContain('anchor:first_match_date_override_validated')
  })

  // ── V2: Ancrage pré-saison flexible ──────────────────────────────
  it('CA-1: pré-saison ancrée sur returnToTeamTrainingAt (7 semaines)', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match('2026-09-15')],
      today: '2026-08-04',
      planningAnchors: { returnToTeamTrainingAt: '2026-08-01' },
    })
    expect(r.cycle).toBe('pre_season')
    expect(r.effectivePreSeasonWeeks).toBe(7)
    expect(r.weekNumber).toBeGreaterThanOrEqual(1)
    expect(r.weekNumber).toBeLessThanOrEqual(7)
    expect(r.planningTrace.rulesApplied).toContain('rule:pre_season_anchored_return_to_team')
  })

  it('CA-1: pré-saison compressée au minimum 6 semaines', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match('2026-09-10')],
      today: '2026-09-01',
      planningAnchors: { returnToTeamTrainingAt: '2026-09-01' },
    })
    expect(r.cycle).toBe('pre_season')
    expect(r.effectivePreSeasonWeeks).toBe(6)
    expect(r.planningTrace.warnings.some((w) => w.includes('compressée'))).toBe(true)
  })

  it('CA-1: fallback V1 sans returnToTeamTrainingAt', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match('2026-09-15')],
      today: '2026-07-01',
    })
    expect(r.cycle).toBe('pre_season')
    expect(r.effectivePreSeasonWeeks).toBe(12)
  })

  // ── V2: Durées élastiques off-season ──────────────────────────────
  it('CA-2: off-season élastique 10 semaines', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match('2026-10-01')],
      today: '2026-06-01',
      planningAnchors: { seasonEndedAt: '2026-05-20' },
    })
    expect(r.cycle).toBe('off_season')
    expect(r.effectiveOffSeasonWeeks).toBeGreaterThanOrEqual(6)
    expect(r.effectiveOffSeasonWeeks).toBeLessThanOrEqual(12)
  })

  // ── V2: Playoffs phasé ──────────────────────────────────────────
  it('CA-3: playoffs taper_1 quand daysUntilNextMatch > 10', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH), match('2025-05-14')],
      today: '2025-05-01',
      planningAnchors: { manualPlayoffs: true },
    })
    expect(r.cycle).toBe('playoffs')
    expect(r.playoffTaperPhase).toBe('taper_1')
    expect(r.planningTrace.rulesApplied).toContain('rule:playoffs_taper_1')
  })

  it('CA-3: playoffs taper_2 quand daysUntilNextMatch 5-10', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH), match('2025-05-08')],
      today: '2025-05-01',
      planningAnchors: { manualPlayoffs: true },
    })
    expect(r.cycle).toBe('playoffs')
    expect(r.playoffTaperPhase).toBe('taper_2')
    expect(r.planningTrace.rulesApplied).toContain('rule:playoffs_taper_2')
  })

  it('CA-3: playoffs match_week quand daysUntilNextMatch <= 5', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH), match('2025-05-04')],
      today: '2025-05-01',
      planningAnchors: { manualPlayoffs: true },
    })
    expect(r.cycle).toBe('playoffs')
    expect(r.playoffTaperPhase).toBe('match_week')
    expect(r.planningTrace.rulesApplied).toContain('rule:playoffs_match_week')
  })

  // ── V2: Trêve formalisée ──────────────────────────────────────────
  it('CA-4: in-season treve_deep quand daysUntilNextMatch > 21', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH), match('2025-04-15'), match('2025-05-15')],
      today: '2025-04-18',
    })
    expect(r.cycle).toBe('in_season')
    expect(r.inSeasonSubMode).toBe('treve_deep')
    expect(r.planningTrace.rulesApplied).toContain('rule:treve_deep_detected')
  })

  it('CA-4: in-season treve_return quand daysUntilNextMatch 8-14 et daysSinceLastMatch >= 14', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH), match('2025-04-01'), match('2025-04-23')],
      today: '2025-04-15', // 14 days since April 1, 8 days until April 23
    })
    expect(r.cycle).toBe('in_season')
    expect(r.inSeasonSubMode).toBe('treve_return')
    expect(r.planningTrace.rulesApplied).toContain('rule:treve_return_detected')
  })

  it('CA-4: in-season treve_rampup quand daysUntilNextMatch <= 7 et daysSinceLastMatch >= 14', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH), match('2025-04-01'), match('2025-04-20')],
      today: '2025-04-16', // 15 days since April 1, 4 days until April 20
    })
    expect(r.cycle).toBe('in_season')
    expect(r.inSeasonSubMode).toBe('treve_rampup')
    expect(r.planningTrace.rulesApplied).toContain('rule:treve_rampup_detected')
  })

  it('CA-4: in-season competition quand matchs réguliers', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH), match('2025-03-22'), match('2025-03-25')],
      today: '2025-03-18',
    })
    expect(r.cycle).toBe('in_season')
    expect(r.inSeasonSubMode).toBe('competition')
  })

  // ── V2: Backward compatibility ──────────────────────────────────
  it('CA-7: profil V1 sans anchors retourne behavior V1', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match(FIRST_MATCH)],
      today: '2024-12-16',
    })
    expect(r.cycle).toBe('pre_season')
    expect(r.effectivePreSeasonWeeks).toBe(12) // fallback V1
  })

  // ── Match-visible-in-week vs off_season contradiction ──────────
  it('manualCycleOverride off_season resolves as off_season (baseline)', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [],
      today: '2025-06-15',
      planningAnchors: {
        manualCycleOverride: 'off_season',
        seasonEndedAt: '2025-05-25',
      },
    })
    expect(r.cycle).toBe('off_season')
  })

  it('manualCycleOverride off_season is respected even with old matches', () => {
    // Old match far in the past, not in the current week
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match('2025-04-01')],
      today: '2025-06-15',
      planningAnchors: {
        manualCycleOverride: 'off_season',
        seasonEndedAt: '2025-05-25',
      },
    })
    expect(r.cycle).toBe('off_season')
  })

  it('seasonEndedAt forces off-season even when last match < 28 days ago', () => {
    // User clicked "La saison est finie" with recent matches in calendar.
    // Without the fix, the code would fall through to in-season because
    // daysSinceLastMatch < 28 and preSeasonStartMonday is in the past.
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [
        match('2025-09-20'),
        match('2025-10-04'),
        match('2026-03-15'),
        match('2026-03-29'),
      ],
      today: '2026-04-06',
      planningAnchors: {
        seasonEndedAt: '2026-03-29',
      },
    })
    expect(r.cycle).toBe('off_season')
    // Off-season starts Mon after 2026-03-29 = 2026-03-30; today 2026-04-06 = week 2
    expect(r.weekNumber).toBe(2)
    expect(r.planningTrace.rulesApplied).toContain('rule:season_ended_force_off_season')
  })

  it('seasonEndedAt computes correct off-season week when set weeks ago', () => {
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match('2025-09-20'), match('2026-02-15')],
      today: '2026-04-06',
      planningAnchors: {
        seasonEndedAt: '2026-02-15',
      },
    })
    expect(r.cycle).toBe('off_season')
    // Off-season starts Monday after 2026-02-15 = 2026-02-23.
    // 2026-04-06 is ~6 weeks later.
    expect(r.weekNumber).toBeGreaterThanOrEqual(5)
  })

  it('returnToTeamTrainingAt triggers pre-season even without match in calendar', () => {
    // Season ended April 6, return to club August 3, today is July 1 (within 8-week window)
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match('2025-09-20'), match('2026-03-29')],
      today: '2026-07-01',
      planningAnchors: {
        seasonEndedAt: '2026-04-06',
        returnToTeamTrainingAt: '2026-08-03',
      },
    })
    expect(r.cycle).toBe('pre_season')
    expect(r.planningTrace.rulesApplied).toContain('rule:pre_season_from_return_date')
  })

  it('returnToTeamTrainingAt stays off-season if today is before pre-season window', () => {
    // Season ended April 6, return to club August 3, today is May 15 (too early for pre-season)
    const r = detectAnnualPlanningContext({
      ...baseParams,
      events: [match('2025-09-20'), match('2026-03-29')],
      today: '2026-05-15',
      planningAnchors: {
        seasonEndedAt: '2026-04-06',
        returnToTeamTrainingAt: '2026-08-03',
      },
    })
    expect(r.cycle).toBe('off_season')
  })
})
