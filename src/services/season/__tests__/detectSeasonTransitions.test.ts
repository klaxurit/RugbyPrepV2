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

  it('no playoffs_suggested when FFR calendar already has a future finals journee', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, daysUntilNextMatch: 5, daysSinceLastMatch: 7 },
      today: '2026-04-15',
      visibleEvents: [{ id: 'm1', date: '2026-05-01', type: 'match', journee_name: 'Demi-finale' }],
    })
    expect(r).toBeNull()
  })

  it('no playoffs_suggested when a future cup_final is already classified', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, daysUntilNextMatch: 5, daysSinceLastMatch: 7 },
      today: '2026-04-15',
      visibleEvents: [{ id: 'm1', date: '2026-05-01', type: 'match', match_kind: 'cup_final' }],
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

  // ── UC9: Match detected in off-season ─────────────────────

  it('detects match_detected_in_offseason when off-season + future visible match', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, cycle: 'off_season', weekNumber: 5 },
      today: '2026-06-01',
      visibleEvents: [{ id: 'match-senior', date: '2026-09-12', type: 'match', opponent: 'Rouen' }],
    })
    expect(r).not.toBeNull()
    expect(r!.type).toBe('match_detected_in_offseason')
    if (r!.type === 'match_detected_in_offseason') {
      expect(r!.matchEventId).toBe('match-senior')
      expect(r!.matchDate).toBe('2026-09-12')
      expect(r!.opponent).toBe('Rouen')
    }
  })

  it('no match_detected_in_offseason when future match is classified friendly', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, cycle: 'off_season', weekNumber: 5 },
      today: '2026-06-01',
      visibleEvents: [{ id: 'm-amical', date: '2026-09-12', type: 'match', match_kind: 'friendly' }],
    })
    expect(r?.type).not.toBe('match_detected_in_offseason')
  })

  it('picks the correct match when two matches share the same date', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, cycle: 'off_season', weekNumber: 5 },
      today: '2026-06-01',
      visibleEvents: [
        { id: 'match-reserve', date: '2026-09-12', type: 'match', opponent: 'Réserve' },
        { id: 'match-senior', date: '2026-09-12', type: 'match', opponent: 'Senior' },
      ],
    })
    expect(r).not.toBeNull()
    if (r!.type === 'match_detected_in_offseason') {
      // Returns the first one sorted by date — stable, deterministic
      expect(r!.matchEventId).toBe('match-reserve')
    }
  })

  it('no match_detected_in_offseason if deferral active', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, cycle: 'off_season', weekNumber: 5 },
      today: '2026-06-01',
      visibleEvents: [{ id: 'm1', date: '2026-09-12', type: 'match' }],
      hasActiveDeferral: true,
    })
    // Should fall through to pre_season_suggested or null
    expect(r?.type).not.toBe('match_detected_in_offseason')
  })

  it('no match_detected_in_offseason if returnDate already set', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, cycle: 'off_season', weekNumber: 5 },
      today: '2026-06-01',
      visibleEvents: [{ id: 'm1', date: '2026-09-12', type: 'match' }],
      hasReturnDate: true,
    })
    expect(r?.type).not.toBe('match_detected_in_offseason')
  })

  it('no match_detected_in_offseason if user already acknowledged resume for that match', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, cycle: 'off_season', weekNumber: 5 },
      today: '2026-06-01',
      visibleEvents: [{ id: 'm1', date: '2026-09-12', type: 'match' }],
      offseasonMatchResumeAckEventId: 'm1',
    })
    expect(r?.type).not.toBe('match_detected_in_offseason')
  })

  it('match_detected_in_offseason returns if next match changed after acknowledgment', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, cycle: 'off_season', weekNumber: 5 },
      today: '2026-06-01',
      visibleEvents: [
        { id: 'm-new', date: '2026-09-05', type: 'match' },
        { id: 'm1', date: '2026-09-12', type: 'match' },
      ],
      offseasonMatchResumeAckEventId: 'm1',
    })
    expect(r).not.toBeNull()
    expect(r!.type).toBe('match_detected_in_offseason')
    if (r!.type === 'match_detected_in_offseason') expect(r!.matchEventId).toBe('m-new')
  })

  it('match_detected_in_offseason has priority over pre_season_suggested', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, cycle: 'off_season', weekNumber: 10 },
      today: '2026-07-01', // July → would trigger pre_season_suggested
      visibleEvents: [{ id: 'm1', date: '2026-09-12', type: 'match' }],
    })
    expect(r!.type).toBe('match_detected_in_offseason')
  })

  it('UC9 uses first non-friendly future match when an earlier friendly exists', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, cycle: 'off_season', weekNumber: 5 },
      today: '2026-06-01',
      visibleEvents: [
        { id: 'm-amical', date: '2026-09-05', type: 'match', match_kind: 'friendly' },
        { id: 'm-ligue', date: '2026-09-12', type: 'match', opponent: 'Bayonne' },
      ],
    })
    expect(r!.type).toBe('match_detected_in_offseason')
    if (r!.type === 'match_detected_in_offseason') {
      expect(r!.matchEventId).toBe('m-ligue')
    }
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

  // ── Grace period post-onboarding ────────────────────────────

  it('grace period suppresses pre_season_suggested within 7d after onboarding', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, cycle: 'off_season', weekNumber: 4 },
      today: '2026-07-01',
      onboardingCompletedAt: '2026-06-28', // 3 days ago
    })
    expect(r).toBeNull()
  })

  it('grace period suppresses playoffs_suggested within 7d after onboarding', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, daysUntilNextMatch: 7 },
      today: '2026-04-10',
      onboardingCompletedAt: '2026-04-05',
    })
    expect(r).toBeNull()
  })

  it('grace period suppresses season_ended within 7d after onboarding', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, daysUntilNextMatch: null, daysSinceLastMatch: 10 },
      today: '2026-03-30',
      onboardingCompletedAt: '2026-03-28',
    })
    expect(r).toBeNull()
  })

  it('grace period expires after 7 days', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, cycle: 'off_season', weekNumber: 4 },
      today: '2026-07-10',
      onboardingCompletedAt: '2026-07-01', // 9 days ago
    })
    expect(r).not.toBeNull()
    expect(r!.type).toBe('pre_season_suggested')
  })

  it('grace period does NOT suppress match_detected_in_offseason (external event remains)', () => {
    const r = detectSeasonTransitions({
      planningContext: { ...baseCtx, cycle: 'off_season' },
      today: '2026-07-01',
      onboardingCompletedAt: '2026-06-28',
      visibleEvents: [{ id: 'ev-1', date: '2026-07-15', type: 'match', opponent: 'Villeneuve' }],
    })
    expect(r).not.toBeNull()
    expect(r!.type).toBe('match_detected_in_offseason')
  })
})
