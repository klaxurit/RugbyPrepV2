import { describe, expect, it } from 'vitest'
import { DEFAULT_PROFILE } from '../../../hooks/useProfile'
import type { CalendarEvent, SessionLog, UserProfile } from '../../../types/training'
import { buildAthleteStaffWeeklyView } from '../buildAthleteStaffWeeklyView'

const FIRST_MATCH = '2025-03-15'

function match(date: string): CalendarEvent {
  return {
    id: `m-${date}`,
    date,
    type: 'match',
  }
}

function baseProfile(p: Partial<UserProfile>): UserProfile {
  return { ...DEFAULT_PROFILE, ...p }
}

describe('buildAthleteStaffWeeklyView', () => {
  it('front_row en saison : annualPlanning + mother sessions, pas de crash', () => {
    // V2: today in-season (after first match) so auto-detection picks in_season
    const v = buildAthleteStaffWeeklyView({
      athleteId: 'a1',
      today: '2025-03-18',
      profile: baseProfile({ rugbyPosition: 'FRONT_ROW', weeklySessions: 3 }),
      events: [match(FIRST_MATCH), match('2025-03-22')],
      logs: [],
      fatigue: 'OK',
    })
    expect(v.identity.athleteId).toBe('a1')
    expect(v.annualPlanning.cycle).toBe('in_season')
    expect(v.motherSessions.status).not.toBe('missing_session')
    expect(v.motherSessions.sessionIds.length).toBeGreaterThan(0)
    expect(v.motherSessions.sessionTitles.length).toBe(v.motherSessions.sessionIds.length)
    expect(v.motherSessions.sessions).toBeDefined()
  })

  it('back_three en match week : alerte match_week', () => {
    const v = buildAthleteStaffWeeklyView({
      athleteId: 'a2',
      today: '2025-03-18',
      profile: baseProfile({ rugbyPosition: 'BACK_THREE', weeklySessions: 3 }),
      events: [match(FIRST_MATCH), match('2025-03-22')],
      logs: [],
      fatigue: 'OK',
    })
    expect(v.annualPlanning.isMatchWeek).toBe(true)
    expect(v.alerts.some((x) => x.code === 'match_week')).toBe(true)
  })

  it('fatigue high / very_high : alertes correspondantes', () => {
    const hi = buildAthleteStaffWeeklyView({
      athleteId: 'a3',
      today: '2024-12-16',
      profile: baseProfile({ rugbyPosition: 'FRONT_ROW' }),
      events: [match(FIRST_MATCH)],
      logs: [],
      fatigue: 'FATIGUE',
      acwrZone: 'optimal',
    })
    expect(hi.load.fatigueLevel).toBe('high')
    expect(hi.alerts.some((x) => x.code === 'high_fatigue')).toBe(true)

    const vh = buildAthleteStaffWeeklyView({
      athleteId: 'a4',
      today: '2024-12-16',
      profile: baseProfile({ rugbyPosition: 'FRONT_ROW' }),
      events: [match(FIRST_MATCH)],
      logs: [],
      fatigue: 'OK',
      acwrZone: 'danger',
    })
    expect(vh.load.fatigueLevel).toBe('very_high')
    expect(vh.alerts.some((x) => x.code === 'very_high_fatigue')).toBe(true)
  })

  it('blessures déclarées : injury_flags_present', () => {
    const v = buildAthleteStaffWeeklyView({
      athleteId: 'a5',
      today: '2024-12-16',
      profile: baseProfile({ rugbyPosition: 'FRONT_ROW', injuries: ['knee_pain'] }),
      events: [match(FIRST_MATCH)],
      logs: [],
      fatigue: 'OK',
    })
    expect(v.load.painFlags).toContain('knee_pain')
    expect(v.alerts.some((x) => x.code === 'injury_flags_present')).toBe(true)
  })

  it('logs vides sur 28j : missing_recent_logs', () => {
    const v = buildAthleteStaffWeeklyView({
      athleteId: 'a6',
      today: '2024-12-16',
      profile: baseProfile({ rugbyPosition: 'FRONT_ROW' }),
      events: [match(FIRST_MATCH)],
      logs: [],
      fatigue: 'OK',
    })
    expect(v.adherence.completedSessionsLast28d).toBe(0)
    expect(v.alerts.some((x) => x.code === 'missing_recent_logs')).toBe(true)
  })

  it('resolver missing_session : missing_session_data + warnings avec IDs', () => {
    const v = buildAthleteStaffWeeklyView({
      athleteId: 'a7',
      today: '2024-12-16',
      profile: baseProfile({ rugbyPosition: 'FRONT_ROW', weeklySessions: 3 }),
      events: [match(FIRST_MATCH)],
      logs: [],
      fatigue: 'OK',
      motherSessionResolverOptions: { sessionsById: {} },
    })
    expect(v.motherSessions.status).toBe('missing_session')
    expect(v.alerts.some((x) => x.code === 'missing_session_data')).toBe(true)
    expect(v.motherSessions.warnings.some((w) => /absente|dataset/i.test(w))).toBe(true)
  })

  it('adhérence < 0.5 : low_adherence', () => {
    const logs: SessionLog[] = []
    const v = buildAthleteStaffWeeklyView({
      athleteId: 'a8',
      today: '2024-12-16',
      profile: baseProfile({ rugbyPosition: 'FRONT_ROW', weeklySessions: 3 }),
      events: [match(FIRST_MATCH)],
      logs,
      fatigue: 'OK',
    })
    expect(v.adherence.plannedSessionsThisWeek).toBeGreaterThan(0)
    expect(v.adherence.completionVsPlanned7d).toBe(0)
    expect(v.alerts.some((x) => x.code === 'low_adherence')).toBe(true)
  })

  it('identité conservée (clubId / squadId / source)', () => {
    const v = buildAthleteStaffWeeklyView({
      athleteId: 'a9',
      today: '2024-12-16',
      profile: baseProfile({ rugbyPosition: 'FRONT_ROW', clubCode: 'CLB' }),
      events: [match(FIRST_MATCH)],
      logs: [],
      fatigue: 'OK',
      identity: { clubId: 'OVERRIDE', squadId: 'S1', source: 'staff' },
    })
    expect(v.identity.athleteId).toBe('a9')
    expect(v.identity.clubId).toBe('OVERRIDE')
    expect(v.identity.squadId).toBe('S1')
    expect(v.identity.source).toBe('staff')
  })

  it('poste absent : missing_position_mapping', () => {
    const v = buildAthleteStaffWeeklyView({
      athleteId: 'a10',
      today: '2024-12-16',
      profile: baseProfile({ rugbyPosition: undefined, position: undefined }),
      events: [match(FIRST_MATCH)],
      logs: [],
      fatigue: 'OK',
    })
    expect(v.alerts.some((x) => x.code === 'missing_position_mapping')).toBe(true)
  })

  it('calendrier sans match : calendar_sparse', () => {
    const v = buildAthleteStaffWeeklyView({
      athleteId: 'a11',
      today: '2024-12-16',
      profile: baseProfile({ rugbyPosition: 'FRONT_ROW' }),
      events: [{ id: 'r1', date: '2024-12-10', type: 'rest' }],
      logs: [],
      fatigue: 'OK',
    })
    expect(v.alerts.some((x) => x.code === 'calendar_sparse')).toBe(true)
  })

  it('playoffs : alerte playoffs_taper', () => {
    const v = buildAthleteStaffWeeklyView({
      athleteId: 'a12',
      today: '2025-05-01', // May — within playoffs window
      profile: baseProfile({ rugbyPosition: 'FRONT_ROW', weeklySessions: 3 }),
      events: [match(FIRST_MATCH)],
      logs: [],
      fatigue: 'OK',
      planningAnchors: { manualPlayoffs: true },
    })
    expect(v.annualPlanning.cycle).toBe('playoffs')
    expect(v.alerts.some((x) => x.code === 'playoffs_taper')).toBe(true)
  })
})
