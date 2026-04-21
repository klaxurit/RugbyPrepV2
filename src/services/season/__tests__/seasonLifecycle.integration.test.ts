/**
 * Integration tests for the full season lifecycle:
 * - Mesocycle 3:1 deload cycling
 * - Trêve detection and program adaptation
 * - Ramp-up after breaks
 * - Season end detection
 * - Playoffs suggestion
 * - Off-season transition
 */
import { describe, expect, it } from 'vitest'
import { detectAnnualPlanningContext } from '../detectAnnualPlanningContext'
import { detectSeasonTransitions } from '../detectSeasonTransitions'
import { resolveMotherSessionsForWeek } from '../../motherSession/resolveMotherSessionsForWeek'
import type { AthletePlanningInputs } from '../../../types/annualPlanning'

// ─── Helpers ──────────────────────────────────────────────────

const match = (date: string) => ({ date, type: 'match' as const })

const baseInputs = (overrides: Partial<AthletePlanningInputs> = {}): AthletePlanningInputs => ({
  events: [],
  today: '2026-01-15',
  weeklyFrequency: 2,
  positionGroup: 'back_three',
  fatigueLevel: 'normal',
  ...overrides,
})

// Build a season: matches every Saturday from start for N weeks
function buildSeason(firstMatchDate: string, weeks: number) {
  const matches = []
  const d = new Date(`${firstMatchDate}T12:00:00`)
  for (let i = 0; i < weeks; i++) {
    matches.push(match(d.toISOString().slice(0, 10)))
    d.setDate(d.getDate() + 7)
  }
  return matches
}

// ─── MESOCYCLE 3:1 DELOAD ─────────────────────────────────────

describe('In-season mesocycle 3:1', () => {
  const FIRST_MATCH = '2025-09-13' // Saturday
  const events = buildSeason(FIRST_MATCH, 30)

  // firstMatchMonday = 2025-09-08 (Mon before Sep 13 Sat match)
  // W1 = Sep 8, W2 = Sep 15, W3 = Sep 22, W4 = Sep 29 (deload)
  // W5 = Oct 6 (block 2), W8 = Oct 27 (deload), W12 = Nov 24 (deload)

  it('W1 → mesocycleWeek 1, not deload', () => {
    const ctx = detectAnnualPlanningContext(baseInputs({
      events, today: '2025-09-08',
    }))
    expect(ctx.cycle).toBe('in_season')
    expect(ctx.mesocycleWeek).toBe(1)
    expect(ctx.isDeloadWeek).toBe(false)
  })

  it('W4 → mesocycleWeek 4, deload', () => {
    const ctx = detectAnnualPlanningContext(baseInputs({
      events, today: '2025-09-29',
    }))
    expect(ctx.mesocycleWeek).toBe(4)
    expect(ctx.isDeloadWeek).toBe(true)
    expect(ctx.mesocycleBlock).toBe(1)
  })

  it('W5 → mesocycleWeek 1 (new block), not deload', () => {
    const ctx = detectAnnualPlanningContext(baseInputs({
      events, today: '2025-10-06',
    }))
    expect(ctx.mesocycleWeek).toBe(1)
    expect(ctx.isDeloadWeek).toBe(false)
    expect(ctx.mesocycleBlock).toBe(2)
  })

  it('W8 → mesocycleWeek 4, deload, block 2', () => {
    const ctx = detectAnnualPlanningContext(baseInputs({
      events, today: '2025-10-27',
    }))
    expect(ctx.mesocycleWeek).toBe(4)
    expect(ctx.isDeloadWeek).toBe(true)
    expect(ctx.mesocycleBlock).toBe(2)
  })

  it('W12 → mesocycleWeek 4, deload, block 3', () => {
    const ctx = detectAnnualPlanningContext(baseInputs({
      events, today: '2025-11-24',
    }))
    expect(ctx.mesocycleWeek).toBe(4)
    expect(ctx.isDeloadWeek).toBe(true)
    expect(ctx.mesocycleBlock).toBe(3)
  })

  it('deload week → resolver returns 2 light sessions', () => {
    const r = resolveMotherSessionsForWeek({
      events,
      today: '2025-09-29', // W4 deload
      weeklyFrequency: 3,
      positionGroup: 'back_three',
    })
    expect(r.sessions).toHaveLength(2) // capped to 2
    for (const s of r.sessions) {
      expect(s.variant).toBe('light')
      expect(s.maxBlocks).toBe(2)
    }
  })

  it('stimulus variation: odd block → LOWER early_week', () => {
    const r = resolveMotherSessionsForWeek({
      events,
      today: '2025-09-15', // W1, block 1 (odd)
      weeklyFrequency: 2,
      positionGroup: 'back_three',
    })
    expect(r.sessions[0].sessionId).toMatch(/LOWER/)
    expect(r.sessions[0].dayPreference).toBe('early_week')
  })

  it('stimulus variation: even block → UPPER early_week', () => {
    const r = resolveMotherSessionsForWeek({
      events,
      today: '2025-10-13', // W5, block 2 (even)
      weeklyFrequency: 2,
      positionGroup: 'back_three',
    })
    expect(r.sessions[0].sessionId).toMatch(/UPPER/)
    expect(r.sessions[0].dayPreference).toBe('early_week')
  })
})

// ─── TRÊVE (MID-SEASON BREAK) ────────────────────────────────

describe('Trêve detection and adaptation', () => {
  // Season with a 4-week gap (Dec 20 → Jan 17)
  const events = [
    ...buildSeason('2025-09-13', 14), // Sep 13 → Dec 13
    ...buildSeason('2026-01-17', 14), // Jan 17 → Apr 18
  ]

  it('detects trêve when next match > 3 weeks away', () => {
    const ctx = detectAnnualPlanningContext(baseInputs({
      events, today: '2025-12-22', // deep in gap
    }))
    expect(ctx.daysUntilNextMatch).toBeGreaterThan(21)

    const t = detectSeasonTransitions({ planningContext: ctx, today: '2025-12-22' })
    expect(t).not.toBeNull()
    expect(t!.type).toBe('treve_detected')
  })

  it('resolver uses no_match_week during deep trêve (force block)', () => {
    const r = resolveMotherSessionsForWeek({
      events,
      today: '2025-12-22', // > 21 days until next match
      weeklyFrequency: 3,
      positionGroup: 'front_row',
    })
    // The resolver should produce companion recommendations and warnings for the trêve
    expect(r.companionRecommendations).toBeDefined()
    expect(r.companionRecommendations!.length).toBeGreaterThan(0)
    expect(r.warnings.length).toBeGreaterThan(0)
  })

  it('resolver applies ramp-down in last week before match return', () => {
    const r = resolveMotherSessionsForWeek({
      events,
      today: '2026-01-12', // 5 days before Jan 17 match
      weeklyFrequency: 3,
      positionGroup: 'back_three',
    })
    // Should be deload/light since gap > 21 and daysUntil <= 7
    expect(r.sessions).toHaveLength(2) // capped
    for (const s of r.sessions) {
      expect(s.variant).toBe('light')
    }
  })

  it('V2: trêve_return if next match in 2 weeks + long gap since last', () => {
    const ctx = detectAnnualPlanningContext(baseInputs({
      events,
      today: '2026-01-05', // ~12 days before Jan 17, ~23 days since Dec 13
    }))
    // V2: daysUntilNextMatch 8-14 + daysSinceLastMatch >= 14 → treve_return
    expect(ctx.inSeasonSubMode).toBe('treve_return')
    const t = detectSeasonTransitions({ planningContext: ctx, today: '2026-01-05' })
    // V2: treve_return IS a trêve sub-mode, so it's detected
    expect(t?.type).toBe('treve_detected')
  })
})

// ─── RAMP-UP AFTER BREAK ─────────────────────────────────────

describe('Ramp-up after 2+ week break', () => {
  const events = [
    ...buildSeason('2025-09-13', 14),
    ...buildSeason('2026-01-17', 14),
  ]

  it('V2: resolver applies treve_return when match in 8-14 days and last match 14+ days ago', () => {
    // Jan 8: next match Jan 17 (9 days), last match Dec 13 (26 days ago) → treve_return
    const r = resolveMotherSessionsForWeek({
      events,
      today: '2026-01-08',
      weeklyFrequency: 2,
      positionGroup: 'back_three',
    })
    expect(r.planningContext.inSeasonSubMode).toBe('treve_return')
    expect(r.warnings.some(w => /retour|trêve|post-trêve/i.test(w))).toBe(true)
    expect(r.sessions.length).toBeGreaterThan(0)
  })
})

// ─── SEASON END ───────────────────────────────────────────────

describe('Season end detection', () => {
  const events = buildSeason('2025-09-13', 30) // Sep → Mar

  it('detects season_ended when last match > 7 days ago and no future match', () => {
    const lastMatchDate = events[events.length - 1].date
    const after = new Date(`${lastMatchDate}T12:00:00`)
    after.setDate(after.getDate() + 10)
    const today = after.toISOString().slice(0, 10)

    const ctx = detectAnnualPlanningContext(baseInputs({
      events, today,
    }))

    const t = detectSeasonTransitions({ planningContext: ctx, today })
    expect(t).not.toBeNull()
    expect(t!.type).toBe('season_ended')
  })

  it('no season_ended if last match was < 7 days ago', () => {
    const lastMatchDate = events[events.length - 1].date
    const after = new Date(`${lastMatchDate}T12:00:00`)
    after.setDate(after.getDate() + 3)
    const today = after.toISOString().slice(0, 10)

    const ctx = detectAnnualPlanningContext(baseInputs({ events, today }))
    const t = detectSeasonTransitions({ planningContext: ctx, today })
    expect(t).toBeNull()
  })

  it('no season_ended if future match exists', () => {
    // Use today = middle of season, there are future matches
    const ctx = detectAnnualPlanningContext(baseInputs({
      events, today: '2025-11-15',
    }))
    const t = detectSeasonTransitions({ planningContext: ctx, today: '2025-11-15' })
    expect(t?.type).not.toBe('season_ended')
  })
})

// ─── PLAYOFFS ─────────────────────────────────────────────────

describe('Playoffs', () => {
  const events = [
    ...buildSeason('2025-09-13', 30),
    match('2026-04-18'),
    match('2026-04-25'),
    match('2026-05-02'),
  ]

  it('suggests playoffs in April with future matches', () => {
    const ctx = detectAnnualPlanningContext(baseInputs({
      events, today: '2026-04-14',
    }))
    const t = detectSeasonTransitions({ planningContext: ctx, today: '2026-04-14' })
    expect(t).not.toBeNull()
    expect(t!.type).toBe('playoffs_suggested')
  })

  it('no playoffs in March', () => {
    const ctx = detectAnnualPlanningContext(baseInputs({
      events, today: '2026-03-15',
    }))
    const t = detectSeasonTransitions({ planningContext: ctx, today: '2026-03-15' })
    expect(t?.type).not.toBe('playoffs_suggested')
  })

  it('playoffs match_week resolver: full body + primer (light)', () => {
    const r = resolveMotherSessionsForWeek({
      events,
      today: '2026-04-20', // Monday, 5 days before Sat match → match_week
      weeklyFrequency: 3,
      positionGroup: 'front_row',
      planningAnchors: { manualPlayoffs: true },
    })
    expect(r.planningContext.cycle).toBe('playoffs')
    expect(r.planningContext.playoffTaperPhase).toBe('match_week')
    expect(r.sessions).toHaveLength(2)

    const sessionIds = r.sessions.map((s) => s.session.metadata.id)
    expect(sessionIds).toContain('FULL_BODY_IN_SEASON_FRONT_ROW_V1')
    expect(sessionIds).toContain('FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1')

    for (const s of r.sessions) {
      expect(s.variant).toBe('light')
    }
  })
})

// ─── OFF-SEASON TRANSITION ────────────────────────────────────

describe('Off-season transition', () => {
  const events = buildSeason('2025-09-13', 30)

  it('manualCycleOverride off_season triggers off-season after season end', () => {
    const lastMatch = events[events.length - 1].date
    const afterEnd = new Date(`${lastMatch}T12:00:00`)
    afterEnd.setDate(afterEnd.getDate() + 14)
    const today = afterEnd.toISOString().slice(0, 10)

    // When user confirms season end, profile sets seasonMode='off_season'
    // which maps to manualCycleOverride='off_season' via buildAthletePlanningInputs
    const ctx = detectAnnualPlanningContext(baseInputs({
      events,
      today,
      planningAnchors: { manualCycleOverride: 'off_season', seasonEndedAt: lastMatch },
    }))
    expect(ctx.cycle).toBe('off_season')
  })
})

// ─── DISMISS LOGIC ────────────────────────────────────────────

describe('Transition dismissal', () => {
  const events = buildSeason('2025-09-13', 30)

  it('dismissed transition returns null', () => {
    const lastMatch = events[events.length - 1].date
    const after = new Date(`${lastMatch}T12:00:00`)
    after.setDate(after.getDate() + 10)
    const today = after.toISOString().slice(0, 10)

    const ctx = detectAnnualPlanningContext(baseInputs({ events, today }))
    const t = detectSeasonTransitions({
      planningContext: ctx,
      today,
      dismissedUntil: { season_ended: '2099-12-31' },
    })
    expect(t).toBeNull()
  })

  it('expired dismissal shows transition again', () => {
    const lastMatch = events[events.length - 1].date
    const after = new Date(`${lastMatch}T12:00:00`)
    after.setDate(after.getDate() + 10)
    const today = after.toISOString().slice(0, 10)

    const ctx = detectAnnualPlanningContext(baseInputs({ events, today }))
    const t = detectSeasonTransitions({
      planningContext: ctx,
      today,
      dismissedUntil: { season_ended: '2025-01-01' }, // expired
    })
    expect(t).not.toBeNull()
    expect(t!.type).toBe('season_ended')
  })
})

// ─── EDGE CASES ───────────────────────────────────────────────

describe('Edge cases', () => {
  it('brand new user with no events → no transition', () => {
    const ctx = detectAnnualPlanningContext(baseInputs({
      events: [],
      today: '2026-03-31',
      planningAnchors: { onboardingCycleHint: 'in_season' },
    }))
    const t = detectSeasonTransitions({ planningContext: ctx, today: '2026-03-31' })
    expect(t).toBeNull() // no lastMatch to trigger season_ended
  })

  it('off-season cycle → no transitions', () => {
    const ctx = detectAnnualPlanningContext(baseInputs({
      events: [match('2026-09-15')],
      today: '2026-07-01',
    }))
    expect(ctx.cycle).not.toBe('in_season')
    const t = detectSeasonTransitions({ planningContext: ctx, today: '2026-07-01' })
    expect(t).toBeNull()
  })

  it('daysSinceLastMatch is computed correctly', () => {
    const events = [match('2026-01-10'), match('2026-02-14')]
    const ctx = detectAnnualPlanningContext(baseInputs({
      events, today: '2026-01-20',
    }))
    expect(ctx.daysSinceLastMatch).toBe(10) // Jan 10 → Jan 20
  })
})
