import { describe, it, expect } from 'vitest'

import { detectAnnualPlanningContext } from '../detectAnnualPlanningContext'
import { detectSeasonTransitions } from '../detectSeasonTransitions'

import type { AthletePlanningInputs } from '../../../types/annualPlanning'

// ─── Helpers ──────────────────────────────────────────────────────────

function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function makeMatches(...dates: string[]): AthletePlanningInputs['events'] {
  return dates.map((date, i) => ({ id: `evt-${i}`, date, type: 'match' as const }))
}

const baseInputs = {
  weeklyFrequency: 2 as const,
  positionGroup: 'front_row' as const,
}

// Reference anchor: firstMatch on 2026-09-07 (Mon).
//   preSeasonStartMonday   = 2026-09-07 - 84d = 2026-06-15 (Mon)
//   offSeasonStartMonday   = 2026-06-15 - 70d = 2026-04-06 (Mon, default 10w backfill)
const FIRST_MATCH = '2026-09-07'

// ─── F1-F4 — Off-season phase boundaries ──────────────────────────────

describe('B4 — off-season phase boundaries', () => {
  it('F1 — W2 (phase 1) → W3 (phase 2)', () => {
    const a = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-04-13', // off-season W2
      events: makeMatches(FIRST_MATCH),
    })
    const b = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-04-20', // off-season W3
      events: makeMatches(FIRST_MATCH),
    })
    expect(a.cycle).toBe('off_season')
    expect(a.weekNumber).toBe(2)
    expect(a.offSeasonPhase).toBe(1) // Récupération
    expect(b.cycle).toBe('off_season')
    expect(b.weekNumber).toBe(3)
    expect(b.offSeasonPhase).toBe(2) // Transition
  })

  it('F2 — W4 (phase 2) → W5 (phase 3)', () => {
    const a = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-04-27',
      events: makeMatches(FIRST_MATCH),
    })
    const b = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-05-04',
      events: makeMatches(FIRST_MATCH),
    })
    expect(a.weekNumber).toBe(4)
    expect(a.offSeasonPhase).toBe(2)
    expect(b.weekNumber).toBe(5)
    expect(b.offSeasonPhase).toBe(3) // Hypertrophie
  })

  it('F3 — compressed off-season (N=6) clamps weekNumber and phases at 6', () => {
    // Anchor offSeasonStartAt only 6 weeks before pre-season → minimum effective
    const offStart = addDays('2026-06-15', -6 * 7) // 2026-05-04 (Mon)
    const a = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-06-08', // last week of compressed off-season (W6)
      events: makeMatches(FIRST_MATCH),
      planningAnchors: { offSeasonStartAt: offStart },
    })
    expect(a.cycle).toBe('off_season')
    expect(a.effectiveOffSeasonWeeks).toBe(6)
    expect(a.weekNumber).toBe(6)
    expect(a.offSeasonPhase).toBe(4) // Force-Bridge (last 2 weeks → W5-W6)
  })

  it('F4 — expanded off-season (N=12) extends Hypertrophy phase', () => {
    const offStart = addDays('2026-06-15', -12 * 7) // 2026-03-23 (Mon)
    const a = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-04-13', // W4 of an expanded 12-week off-season
      events: makeMatches(FIRST_MATCH),
      planningAnchors: { offSeasonStartAt: offStart },
    })
    expect(a.cycle).toBe('off_season')
    expect(a.effectiveOffSeasonWeeks).toBe(12)
    expect(a.weekNumber).toBe(4)
    expect(a.offSeasonPhase).toBe(2)
  })
})

// ─── F5-F7 — Pre-season phase boundaries + cycle switch ───────────────

describe('B4 — pre-season phase boundaries', () => {
  it('F5 — W4 (phase 1) → W5 (phase 2)', () => {
    const a = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-07-06',
      events: makeMatches(FIRST_MATCH),
    })
    const b = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-07-13',
      events: makeMatches(FIRST_MATCH),
    })
    expect(a.cycle).toBe('pre_season')
    expect(a.weekNumber).toBe(4)
    expect(a.preSeasonPhase).toBe(1)
    expect(a.isDeloadWeek).toBe(true) // W4 deload (wn % 4 === 0)
    expect(b.weekNumber).toBe(5)
    expect(b.preSeasonPhase).toBe(2)
    expect(b.isDeloadWeek).toBe(false)
  })

  it('F6 — W8 (phase 2) → W9 (phase 3)', () => {
    const a = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-08-03',
      events: makeMatches(FIRST_MATCH),
    })
    const b = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-08-10',
      events: makeMatches(FIRST_MATCH),
    })
    expect(a.weekNumber).toBe(8)
    expect(a.preSeasonPhase).toBe(2)
    expect(a.isDeloadWeek).toBe(true) // W8 deload
    expect(b.weekNumber).toBe(9)
    expect(b.preSeasonPhase).toBe(3)
    expect(b.isDeloadWeek).toBe(false)
  })

  it('F7 — pre-season W12 → in-season W1 (cycle switch)', () => {
    const a = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-08-31', // pre-season W12 (last)
      events: makeMatches(FIRST_MATCH),
    })
    const b = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-09-07', // first match week → in-season W1
      events: makeMatches(FIRST_MATCH, '2026-09-14', '2026-09-21'),
    })
    expect(a.cycle).toBe('pre_season')
    expect(a.weekNumber).toBe(12)
    expect(a.isDeloadWeek).toBe(true) // last week deload
    expect(b.cycle).toBe('in_season')
    expect(b.weekNumber).toBe(1)
    expect(b.mesocycleWeek).toBe(1)
    expect(b.mesocycleBlock).toBe(1)
  })
})

// ─── F8-F9 — In-season mesocycle 3:1 boundaries ───────────────────────

describe('B4 — in-season mesocycle 3:1 boundaries', () => {
  // Weekly matches → keeps DUN/DSL realistic, no auto-season-end
  const weeklyMatches = makeMatches(
    '2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28',
    '2026-10-05', '2026-10-12', '2026-10-19',
  )

  it('F8 — W3 (no deload) → W4 (deload)', () => {
    const a = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-09-21',
      events: weeklyMatches,
    })
    const b = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-09-28',
      events: weeklyMatches,
    })
    expect(a.weekNumber).toBe(3)
    expect(a.mesocycleWeek).toBe(3)
    expect(a.mesocycleBlock).toBe(1)
    expect(a.isDeloadWeek).toBe(false)
    expect(b.weekNumber).toBe(4)
    expect(b.mesocycleWeek).toBe(4)
    expect(b.mesocycleBlock).toBe(1)
    expect(b.isDeloadWeek).toBe(true)
  })

  it('F9 — W4 (deload, block 1) → W5 (start of block 2)', () => {
    const a = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-09-28',
      events: weeklyMatches,
    })
    const b = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-10-05',
      events: weeklyMatches,
    })
    expect(a.mesocycleBlock).toBe(1)
    expect(a.mesocycleWeek).toBe(4)
    expect(b.mesocycleBlock).toBe(2)
    expect(b.mesocycleWeek).toBe(1)
    expect(b.isDeloadWeek).toBe(false)
  })
})

// ─── F10-F12 — In-season subMode boundaries ───────────────────────────

describe('B4 — in-season subMode boundaries', () => {
  it('F10 — DUN=21 → competition, DUN=22 → treve_deep', () => {
    // DUN=21
    const competition = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-09-14',
      events: makeMatches('2026-09-07', '2026-10-05'), // DSL=7, DUN=21
    })
    // DUN=22
    const treveDeep = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-09-14',
      events: makeMatches('2026-09-07', '2026-10-06'), // DSL=7, DUN=22
    })
    expect(competition.cycle).toBe('in_season')
    expect(competition.inSeasonSubMode).toBe('competition')
    expect(treveDeep.cycle).toBe('in_season')
    expect(treveDeep.inSeasonSubMode).toBe('treve_deep')
  })

  it('F11 — DUN=14 + DSL=14 → treve_return ; DUN=15 → competition', () => {
    const treveReturn = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-09-14',
      events: makeMatches('2026-08-31', '2026-09-28'), // DSL=14, DUN=14
    })
    const competition = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-09-14',
      events: makeMatches('2026-08-31', '2026-09-29'), // DSL=14, DUN=15
    })
    expect(treveReturn.inSeasonSubMode).toBe('treve_return')
    expect(competition.inSeasonSubMode).toBe('competition')
  })

  it('F12 — DUN=7 + DSL=14 → treve_rampup ; DUN=8 → treve_return', () => {
    const treveRampup = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-09-14',
      events: makeMatches('2026-08-31', '2026-09-21'), // DSL=14, DUN=7
    })
    const treveReturn = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-09-14',
      events: makeMatches('2026-08-31', '2026-09-22'), // DSL=14, DUN=8
    })
    expect(treveRampup.inSeasonSubMode).toBe('treve_rampup')
    expect(treveReturn.inSeasonSubMode).toBe('treve_return')
  })
})

// ─── F13 — Auto season-end boundary (DSL=27 vs 28) ────────────────────

describe('B4 — auto season-end boundary', () => {
  it('F13 — DSL=27 + DUN=null → in_season ; DSL=28 → off_season', () => {
    // For DSL=27, last match must be 2026-08-18 (Tue), today=2026-09-14 → in_season W5.
    // For DSL=28, last match must be 2026-08-17 (Mon), today=2026-09-14 → auto-end → off_season.
    const stillIn = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-09-14',
      events: makeMatches('2026-08-18'),
    })
    const flipped = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-09-14',
      events: makeMatches('2026-08-17'),
    })
    expect(stillIn.cycle).toBe('in_season')
    expect(stillIn.daysSinceLastMatch).toBe(27)
    expect(flipped.cycle).toBe('off_season')
    expect(flipped.daysSinceLastMatch).toBe(28)
    expect(flipped.planningTrace.rulesApplied).toContain('rule:auto_season_ended_28d')
  })
})

// ─── F14 — Playoffs month guard (May vs June) ─────────────────────────

describe('B4 — playoffs month guard', () => {
  it('F14 — manualPlayoffs honored in May, ignored in June+', () => {
    const inMay = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-05-31',
      events: makeMatches('2026-06-07'), // future match in June
      planningAnchors: { manualPlayoffs: true },
    })
    const inJune = detectAnnualPlanningContext({
      ...baseInputs,
      today: '2026-06-01',
      events: makeMatches('2026-06-07'),
      planningAnchors: { manualPlayoffs: true },
    })
    expect(inMay.cycle).toBe('playoffs')
    expect(inJune.cycle).not.toBe('playoffs')
  })
})

// ─── F15 — Onboarding grace period boundary ───────────────────────────

describe('B4 — onboarding grace period', () => {
  it('F15 — at +7d grace blocks season_ended ; at +8d it fires', () => {
    // Build a scenario that would normally trigger UC1 season_ended:
    //   in_season + DSL ≥ 7 + DUN=null + multiple distinct match dates.
    const events = makeMatches('2026-08-15', '2026-08-22')
    const ctxPlanning = (today: string) =>
      detectAnnualPlanningContext({ ...baseInputs, today, events })
    const onboardingCompletedAt = '2026-09-01'

    // Grace day (+7) — exactly at the boundary → still in grace per `today <= +7`.
    const ctxAtBoundary = ctxPlanning('2026-09-08')
    expect(ctxAtBoundary.cycle).toBe('in_season') // sanity: would trigger UC1 if not grace
    const transitionInGrace = detectSeasonTransitions({
      planningContext: ctxAtBoundary,
      today: '2026-09-08',
      onboardingCompletedAt,
    })
    expect(transitionInGrace).toBeNull()

    // +8d — out of grace, season_ended fires.
    const ctxOutOfGrace = ctxPlanning('2026-09-09')
    const transitionOutOfGrace = detectSeasonTransitions({
      planningContext: ctxOutOfGrace,
      today: '2026-09-09',
      onboardingCompletedAt,
    })
    expect(transitionOutOfGrace?.type).toBe('season_ended')
  })
})
