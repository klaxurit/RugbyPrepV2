import { describe, expect, it } from 'vitest'
import { DEFAULT_PROFILE } from '../../../hooks/useProfile'
import type { CalendarEvent, UserProfile } from '../../../types/training'
import { buildSquadWeeklyOverview } from '../buildSquadWeeklyOverview'

const FIRST_MATCH = '2025-03-15'

function match(date: string): CalendarEvent {
  return { id: `m-${date}`, date, type: 'match' }
}

function baseProfile(p: Partial<UserProfile>): UserProfile {
  return { ...DEFAULT_PROFILE, ...p }
}

describe('buildSquadWeeklyOverview', () => {
  it('agrège plusieurs joueurs, byCycle, fatigue, match week, missing sessions, ordre stable', () => {
    const d = new Date(2025, 2, 18, 12, 0, 0)
    const overview = buildSquadWeeklyOverview({
      today: d,
      clubId: 'CLUB1',
      squadId: 'SQ1',
      athletes: [
        {
          athleteId: 'x1',
          profile: baseProfile({ rugbyPosition: 'FRONT_ROW', weeklySessions: 3 }),
          events: [match(FIRST_MATCH), match('2025-03-22')],
          logs: [],
          fatigue: 'OK',
          acwrZone: 'caution',
        },
        {
          athleteId: 'x2',
          profile: baseProfile({ rugbyPosition: 'BACK_THREE' }),
          events: [match(FIRST_MATCH)],
          logs: [],
          fatigue: 'OK',
          planningAnchors: { manualCycleOverride: 'off_season', manualOffSeasonWeekOverride: 3 },
        },
        {
          athleteId: 'x3',
          profile: baseProfile({ rugbyPosition: 'FRONT_ROW' }),
          events: [match(FIRST_MATCH)],
          logs: [],
          fatigue: 'OK',
          planningAnchors: { manualPlayoffs: true },
        },
        {
          athleteId: 'x4',
          profile: baseProfile({ rugbyPosition: 'FRONT_ROW', weeklySessions: 3 }),
          events: [match(FIRST_MATCH)],
          logs: [],
          fatigue: 'OK',
          motherSessionResolverOptions: { sessionsById: {} },
        },
      ],
    })

    expect(overview.generatedForDate).toBe('2025-03-18')
    expect(overview.clubId).toBe('CLUB1')
    expect(overview.squadId).toBe('SQ1')
    expect(overview.athletes.map((a) => a.identity.athleteId)).toEqual(['x1', 'x2', 'x3', 'x4'])

    const s = overview.summary
    expect(s.totalAthletes).toBe(4)
    expect(s.byCycle.in_season).toBeGreaterThanOrEqual(1)
    expect(s.byCycle.off_season).toBeGreaterThanOrEqual(1)
    expect(s.byCycle.playoffs).toBeGreaterThanOrEqual(1)
    expect(s.matchWeekCount).toBeGreaterThanOrEqual(1)
    expect(s.highFatigueCount).toBeGreaterThanOrEqual(1)
    expect(s.missingSessionDataCount).toBe(1)
  })

  it('very_high_fatigue comptée sur le groupe', () => {
    const overview = buildSquadWeeklyOverview({
      today: '2024-12-16',
      athletes: [
        {
          athleteId: 'v1',
          profile: baseProfile({ rugbyPosition: 'FRONT_ROW' }),
          events: [match(FIRST_MATCH)],
          logs: [],
          fatigue: 'OK',
          acwrZone: 'critical',
        },
        {
          athleteId: 'v2',
          profile: baseProfile({ rugbyPosition: 'FRONT_ROW' }),
          events: [match(FIRST_MATCH)],
          logs: [],
          fatigue: 'OK',
          acwrZone: 'optimal',
        },
      ],
    })
    expect(overview.summary.veryHighFatigueCount).toBe(1)
  })

  it('low_adherence agrégée', () => {
    const overview = buildSquadWeeklyOverview({
      today: '2024-12-16',
      athletes: [
        {
          athleteId: 'l1',
          profile: baseProfile({ rugbyPosition: 'FRONT_ROW', weeklySessions: 3 }),
          events: [match(FIRST_MATCH)],
          logs: [],
          fatigue: 'OK',
        },
        {
          athleteId: 'l2',
          profile: baseProfile({ rugbyPosition: 'FRONT_ROW', weeklySessions: 2 }),
          events: [match(FIRST_MATCH)],
          logs: [],
          fatigue: 'OK',
        },
      ],
    })
    expect(overview.summary.lowAdherenceCount).toBeGreaterThanOrEqual(1)
  })
})
