import { describe, expect, it } from 'vitest'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'
import type { CalendarEvent } from '../../../types/training'
import { resolveMotherSessionsForWeek } from '../resolveMotherSessionsForWeek'

type Input = Pick<CalendarEvent, 'date' | 'type'>

/** Aligné sur detectAnnualPlanningContext (premier match 2025-03-15). */
const FIRST_MATCH = '2025-03-15'

function match(date: string): Input {
  return { date, type: 'match' }
}



describe('resolveMotherSessionsForWeek', () => {
  it('pré-saison phase 1, fréquence 3, front_row → 3 sessions résolues + planningContext', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH)],
      today: '2024-12-16',
      weeklyFrequency: 3,
      positionGroup: 'front_row',
    })
    expect(r.status).toBe('resolved')
    expect(r.planningContext.weekLabel).toBe('Pré-saison Phase 1 - S1')
    expect(r.planningContext.cycle).toBe('pre_season')
    expect(r.templateContext).toMatchObject({
      cycle: 'pre_season',
      phase: 1,
      requestedFrequency: 3,
      effectiveFrequency: 3,
      positionGroup: 'front_row',
      fatigueLevel: 'normal',
    })
    expect(r.sessions.map((s) => s.sessionId)).toEqual([
      'LOWER_PRESEASON_FORCE_V1',
      'UPPER_PRESEASON_FORCE_V1',
      'FULL_PRESEASON_FORCE_V1',
    ])
    expect(r.warnings).toEqual([])
    expect(r.sessions.every((s) => s.session.metadata.id === s.sessionId)).toBe(true)
  })

  it('pré-saison phase 3, fréquence 4 → repli template 3 séances + effectiveFrequency 3', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH)],
      today: '2025-03-03',
      weeklyFrequency: 4,
      positionGroup: 'front_row',
    })
    expect(r.status).toBe('resolved')
    expect(r.planningContext.preSeasonPhase).toBe(3)
    expect(r.planningContext.weekLabel).toBe('Pré-saison Phase 3 - S12')
    expect(r.templateContext?.requestedFrequency).toBe(4)
    expect(r.templateContext?.effectiveFrequency).toBe(3)
    expect(r.sessions).toHaveLength(3)
    expect(r.sessions.map((s) => s.sessionId)).toEqual([
      'LOWER_PRESEASON_POWER_FRONT_ROW_V1',
      'UPPER_PRESEASON_POWER_FRONT_ROW_V1',
      'FULL_PRESEASON_POWER_FRONT_ROW_V1',
    ])
  })

  it('in-season match week, back_three, 3x → primer résolu', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH), match('2025-03-22')],
      today: '2025-03-18',
      weeklyFrequency: 3,
      positionGroup: 'back_three',
    })
    expect(r.status).toBe('resolved')
    expect(r.planningContext.isMatchWeek).toBe(true)
    expect(r.templateContext).toMatchObject({
      cycle: 'in_season',
      matchContext: 'match_week',
      requestedFrequency: 3,
      positionGroup: 'back_three',
    })
    const ids = r.sessions.map((s) => s.sessionId)
    expect(ids).toContain('FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_V1')
    expect(ids[2]).toBe('FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_V1')
  })

  it('in-season no-match week, front_row, fatigue high → primer light + maxBlocks', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH), match('2025-04-05')],
      today: '2025-03-18',
      weeklyFrequency: 3,
      positionGroup: 'front_row',
      fatigueLevel: 'high',
    })
    expect(r.status).toBe('resolved')
    expect(r.planningContext.isMatchWeek).toBe(false)
    expect(r.templateContext?.matchContext).toBe('no_match_week')
    const primer = r.sessions.find((s) =>
      s.sessionId.includes('FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW')
    )
    expect(primer).toBeDefined()
    expect(primer?.variant).toBe('light')
    expect(primer?.maxBlocks).toBe(2)
    expect(primer?.dayPreference).toBe('pre_match')
  })

  it('off-season Recovery 2x → 2 sessions + planningContext + companions (warnings trace si synthétique)', () => {
    const r = resolveMotherSessionsForWeek({
      events: [],
      today: '2025-01-01',
      weeklyFrequency: 2,
      positionGroup: 'front_row',
    })
    expect(r.planningContext.cycle).toBe('off_season')
    expect(r.planningContext.offSeasonPhase).toBe(1)
    expect(r.templateContext?.cycle).toBe('off_season')
    expect(r.templateContext?.offSeasonPhase).toBe(1)
    expect(r.sessions.map((s) => s.sessionId)).toEqual([
      'FULL_OFFSEASON_RECOVERY_A_V1',
      'FULL_OFFSEASON_RECOVERY_B_V1',
    ])
    expect(r.companionRecommendations?.join(' ')).toMatch(/récupération|activité légère/i)
    expect(r.status).toBe('resolved_with_warnings')
    expect(r.warnings.length).toBeGreaterThan(0)
  })

  it('off-season Recovery 2x + equipment vide → sessions BW Recovery A/B', () => {
    const r = resolveMotherSessionsForWeek({
      events: [],
      today: '2025-01-01',
      weeklyFrequency: 2,
      positionGroup: 'front_row',
      equipment: [],
    })
    expect(r.sessions.map((s) => s.sessionId)).toEqual([
      'FULL_BW_OFFSEASON_RECOVERY_A_V1',
      'FULL_BW_OFFSEASON_RECOVERY_B_V1',
    ])
    expect(r.sessions[0].session.metadata.equipment).toBe('bodyweight')
    expect(r.sessions[0].session.blocks[0].exercises[0].name).toMatch(/bodyweight squat/i)
  })

  it('off-season Hypertrophy 3x → 3 sessions résolues (override semaine)', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH)],
      today: '2025-01-06',
      weeklyFrequency: 3,
      positionGroup: 'front_row',
      planningAnchors: {
        manualCycleOverride: 'off_season',
        manualOffSeasonWeekOverride: 6,
        offSeasonStartAt: '2024-12-30',
      },
    })
    expect(r.planningContext.offSeasonPhase).toBe(3)
    expect(r.status).toBe('resolved_with_warnings')
    expect(r.sessions.map((s) => s.sessionId)).toEqual([
      'LOWER_OFFSEASON_HYPERTROPHY_V1',
      'UPPER_OFFSEASON_HYPERTROPHY_V1',
      'FULL_OFFSEASON_HYPERTROPHY_V1',
    ])
  })

  it('off-season Force-Bridge 3x → 3 sessions resolved (Lower + Upper + Full)', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH)],
      today: '2025-01-06',
      weeklyFrequency: 3,
      positionGroup: 'front_row',
      planningAnchors: {
        manualCycleOverride: 'off_season',
        manualOffSeasonWeekOverride: 10,
        offSeasonStartAt: '2024-12-30',
      },
    })
    expect(r.planningContext.offSeasonPhase).toBe(4)
    expect(r.sessions).toHaveLength(3)
    expect(r.sessions.map((s) => s.sessionId)).toEqual([
      'LOWER_OFFSEASON_FORCE_BRIDGE_V1',
      'UPPER_OFFSEASON_FORCE_BRIDGE_V1',
      'FULL_OFFSEASON_FORCE_BRIDGE_V1',
    ])
  })

  it('playoffs V2 taper_1: normal variant + maxBlocks 3 when dun > 10', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH), match('2025-05-14')],
      today: '2025-05-01', // May — within playoffs window, 13 days to next match
      weeklyFrequency: 3,
      positionGroup: 'front_row',
      planningAnchors: { manualCycleOverride: 'playoffs' },
    })
    expect(r.planningContext.cycle).toBe('playoffs')
    expect(r.planningContext.playoffTaperPhase).toBe('taper_1')
    expect(r.status).toBe('resolved_with_warnings')
    expect(r.warnings.some((w) => /playoffs|taper/i.test(w))).toBe(true)
    expect(r.sessions).toHaveLength(3) // taper_1 preserves frequency up to 3
    for (const s of r.sessions) {
      expect(s.variant).toBe('normal')
      expect(s.maxBlocks).toBe(3)
    }
    expect(r.templateContext?.playoffsTaper).toBe(true)
  })

  it('playoffs V2 taper_2: light + maxBlocks 2 + freq capped at 2', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH), match('2025-05-08')],
      today: '2025-05-01', // 7 days to next match → taper_2
      weeklyFrequency: 3,
      positionGroup: 'front_row',
      planningAnchors: { manualPlayoffs: true },
    })
    expect(r.planningContext.cycle).toBe('playoffs')
    expect(r.planningContext.playoffTaperPhase).toBe('taper_2')
    expect(r.sessions).toHaveLength(2) // capped from 3 to 2
    for (const s of r.sessions) {
      expect(s.variant).toBe('light')
      expect(s.maxBlocks).toBe(2)
    }
    expect(r.templateContext?.playoffsTaper).toBe(true)
    expect(r.templateContext?.effectiveFrequency).toBe(2)
  })

  it('playoffs V2 match_week: full body + primer (light variant)', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH), match('2025-05-04')],
      today: '2025-05-01', // 3 days to next match → match_week
      weeklyFrequency: 2,
      positionGroup: 'front_row',
      planningAnchors: { manualCycleOverride: 'playoffs' },
    })
    expect(r.planningContext.cycle).toBe('playoffs')
    expect(r.planningContext.playoffTaperPhase).toBe('match_week')
    expect(r.sessions).toHaveLength(2)

    // Jones 2017 / Duthie 2006 : en match week, full body + primer plutôt que
    // split LOWER/UPPER — limite la fatigue localisée avant le match.
    const sessionIds = r.sessions.map((s) => s.session.metadata.id)
    expect(sessionIds).toContain('FULL_BODY_IN_SEASON_FRONT_ROW_V1')
    expect(sessionIds).toContain('FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1')

    for (const s of r.sessions) {
      expect(s.variant).toBe('light')
    }
  })

  it('sessionId absente du dataset → missing_session + planningContext + warnings conservés', () => {
    const missingId = 'LOWER_PRESEASON_FORCE_V1'
    const byIdSansUne = { ...MOTHER_SESSIONS_BY_ID }
    delete byIdSansUne[missingId]

    const r = resolveMotherSessionsForWeek(
      {
        events: [match(FIRST_MATCH)],
        today: '2024-12-16',
        weeklyFrequency: 3,
        positionGroup: 'front_row',
      },
      { sessionsById: byIdSansUne }
    )

    expect(r.status).toBe('missing_session')
    expect(r.missingSessionIds).toEqual([missingId])
    expect(r.sessions).toEqual([])
    expect(r.planningContext.weekLabel).toBe('Pré-saison Phase 1 - S1')
    expect(r.planningContext.cycle).toBe('pre_season')
    expect(r.templateContext?.cycle).toBe('pre_season')
    expect(r.warnings.length).toBeGreaterThanOrEqual(0)
    expect(r.message).toMatch(/absentes du dataset/)
  })

  // ── V2: Trêve sub-modes ──────────────────────────────────────────
  it('V2 treve_deep: bloc force opportuniste + no_match_week', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH), match('2025-04-15'), match('2025-05-15')],
      today: '2025-04-18', // 27 days until next match → treve_deep
      weeklyFrequency: 3,
      positionGroup: 'front_row',
    })
    expect(r.planningContext.inSeasonSubMode).toBe('treve_deep')
    expect(r.warnings.some((w) => /trêve/i.test(w) || /force/i.test(w))).toBe(true)
    expect(r.sessions.length).toBeGreaterThan(0)
  })

  it('V2 treve_rampup: freq plafonnée à 2, variant light', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH), match('2025-04-01'), match('2025-04-20')],
      today: '2025-04-16', // 4 days until match, 15 days since last → rampup
      weeklyFrequency: 3,
      positionGroup: 'front_row',
    })
    expect(r.planningContext.inSeasonSubMode).toBe('treve_rampup')
    expect(r.warnings.some((w) => /ramp-up|ré-acclimation/i.test(w))).toBe(true)
    expect(r.sessions).toHaveLength(2) // capped at 2
    for (const s of r.sessions) {
      expect(s.variant).toBe('light')
      expect(s.maxBlocks).toBe(2)
    }
  })

  it('V2 end_of_season: décompression — variant light, maxBlocks 2', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH), match('2025-04-01')],
      today: '2025-04-15', // dernier match il y a 14j, aucun match futur → end_of_season
      weeklyFrequency: 3,
      positionGroup: 'front_row',
    })
    expect(r.planningContext.inSeasonSubMode).toBe('end_of_season')
    expect(r.warnings.some((w) => /fin de saison|décompression/i.test(w))).toBe(true)
    expect(r.sessions).toHaveLength(2) // capped at 2
    for (const s of r.sessions) {
      expect(s.variant).toBe('light')
      expect(s.maxBlocks).toBe(2)
    }
  })

  // ── V2: Monitoring micro-modulation ──────────────────────────────
  it('V2 readinessScore < 50 → maxBlocks réduit + warning', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH), match('2025-03-22')],
      today: '2025-03-18',
      weeklyFrequency: 3,
      positionGroup: 'front_row',
      monitoringSnapshot: {
        completedSessionsLast7d: 2,
        completedSessionsLast28d: 8,
        readinessScore: 35,
      },
    })
    expect(r.planningContext.cycle).toBe('in_season')
    expect(r.warnings.some((w) => /readiness basse/i.test(w))).toBe(true)
    for (const s of r.sessions) {
      expect(s.maxBlocks).toBe(2)
    }
  })

  it('V2 jumpTrend down → warning + maxBlocks réduit', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH), match('2025-03-22')],
      today: '2025-03-18',
      weeklyFrequency: 3,
      positionGroup: 'front_row',
      monitoringSnapshot: {
        completedSessionsLast7d: 2,
        completedSessionsLast28d: 8,
        jumpTrend: 'down',
      },
    })
    expect(r.warnings.some((w) => /CMJ/i.test(w))).toBe(true)
    for (const s of r.sessions) {
      expect(s.maxBlocks).toBe(2)
    }
  })

  // ── Return after long absence (Slice 4 S2) ──

  it('long absence (0 sessions in 28d, historical logs) → sessions become light with reduced maxBlocks', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH)],
      today: '2024-12-16',
      weeklyFrequency: 3,
      positionGroup: 'front_row',
      monitoringSnapshot: {
        completedSessionsLast7d: 0,
        completedSessionsLast28d: 0,
        hasHistoricalLogs: true,
      },
    })

    expect(r.status).not.toBe('missing_session')
    for (const s of r.sessions) {
      expect(s.variant).toBe('light')
      expect(s.maxBlocks).toBeDefined()
    }
    expect(r.warnings.some((w) => w.toLowerCase().includes('reprise'))).toBe(true)
  })

  it('long absence adapted result has status resolved_with_warnings', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH)],
      today: '2024-12-16',
      weeklyFrequency: 3,
      positionGroup: 'front_row',
      monitoringSnapshot: {
        completedSessionsLast7d: 0,
        completedSessionsLast28d: 0,
        hasHistoricalLogs: true,
      },
    })

    expect(r.status).toBe('resolved_with_warnings')
  })

  it('recent activity (completedSessionsLast7d > 0) → sessions are normal', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH)],
      today: '2024-12-16',
      weeklyFrequency: 3,
      positionGroup: 'front_row',
      monitoringSnapshot: {
        completedSessionsLast7d: 2,
        completedSessionsLast28d: 6,
        hasHistoricalLogs: true,
      },
    })

    // Normal sessions — NOT all light
    const hasNonLight = r.sessions.some((s) => s.variant !== 'light')
    expect(hasNonLight).toBe(true)
  })

  it('new user (no historical logs) → sessions are normal even with 0 sessions', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH)],
      today: '2024-12-16',
      weeklyFrequency: 3,
      positionGroup: 'front_row',
      monitoringSnapshot: {
        completedSessionsLast7d: 0,
        completedSessionsLast28d: 0,
        hasHistoricalLogs: false,
      },
    })

    // New user — no false return-after-break
    const hasNonLight = r.sessions.some((s) => s.variant !== 'light')
    expect(hasNonLight).toBe(true)
    expect(r.warnings.some((w) => w.toLowerCase().includes('reprise'))).toBe(false)
  })
})
