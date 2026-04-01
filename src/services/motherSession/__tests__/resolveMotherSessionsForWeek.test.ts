import { describe, expect, it } from 'vitest'
import { MOTHER_SESSIONS_BY_ID } from '../../../data/motherSessions.generated'
import type { MotherSession } from '../../../types/motherSession'
import type { CalendarEvent } from '../../../types/training'
import { resolveMotherSessionsForWeek } from '../resolveMotherSessionsForWeek'

type Input = Pick<CalendarEvent, 'date' | 'type'>

/** Aligné sur detectAnnualPlanningContext (premier match 2025-03-15). */
const FIRST_MATCH = '2025-03-15'

function match(date: string): Input {
  return { date, type: 'match' }
}

function minimalMotherSession(id: string, sessionType: MotherSession['metadata']['sessionType']): MotherSession {
  return {
    metadata: {
      id,
      status: 'ready_for_mapping',
      version: 'V1',
      cycle: 'off_season',
      sessionType,
      targetLevel: 'builder',
      targetPositionGroup: 'common',
      equipment: 'full_gym',
      targetDuration: '50 min',
    },
    goal: [],
    sessionIdentity: [],
    warmUp: { exercises: [], notes: [] },
    blocks: [],
    progressionRules: [],
    positionAccent: [],
    injurySubstitutions: [],
    coachingWarnings: [],
    sourceReferences: [],
  }
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
    expect(r.planningContext.weekLabel).toBe('Pre-season Phase 1 - S1')
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
    expect(r.planningContext.weekLabel).toBe('Pre-season Phase 3 - S12')
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
    expect(r.companionRecommendations?.join(' ')).toMatch(/zone 2/i)
    expect(r.status).toBe('resolved_with_warnings')
    expect(r.warnings.length).toBeGreaterThan(0)
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

  it('playoffs 2x → 2 sessions light + maxBlocks 2 + taper warning', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH)],
      today: '2025-06-01',
      weeklyFrequency: 2,
      positionGroup: 'front_row',
      planningAnchors: { manualCycleOverride: 'playoffs' },
    })
    expect(r.planningContext.cycle).toBe('playoffs')
    expect(r.status).toBe('resolved_with_warnings')
    expect(r.warnings.some((w) => /taper|playoffs/i.test(w))).toBe(true)
    expect(r.sessions).toHaveLength(2)
    for (const s of r.sessions) {
      expect(s.variant).toBe('light')
      expect(s.maxBlocks).toBe(2)
    }
    expect(r.templateContext?.playoffsTaper).toBe(true)
  })

  it('playoffs 3x → capped at 2 sessions light + maxBlocks 2', () => {
    const r = resolveMotherSessionsForWeek({
      events: [match(FIRST_MATCH)],
      today: '2025-06-01',
      weeklyFrequency: 3,
      positionGroup: 'front_row',
      planningAnchors: { manualPlayoffs: true },
    })
    expect(r.planningContext.cycle).toBe('playoffs')
    expect(r.sessions).toHaveLength(2) // capped from 3 to 2
    for (const s of r.sessions) {
      expect(s.variant).toBe('light')
      expect(s.maxBlocks).toBe(2)
    }
    expect(r.templateContext?.playoffsTaper).toBe(true)
    expect(r.templateContext?.effectiveFrequency).toBe(2)
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
    expect(r.planningContext.weekLabel).toBe('Pre-season Phase 1 - S1')
    expect(r.planningContext.cycle).toBe('pre_season')
    expect(r.templateContext?.cycle).toBe('pre_season')
    expect(r.warnings.length).toBeGreaterThanOrEqual(0)
    expect(r.message).toMatch(/absentes du dataset/)
  })
})
