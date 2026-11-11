import { describe, expect, it } from 'vitest'
import { buildFreeChatContext } from '../buildFreeChatContext'
import type { AnnualPlanningContext } from '../../../types/annualPlanning'
import type { UserProfile } from '../../../types/training'

const planning: AnnualPlanningContext = {
  cycle: 'in_season',
  weekLabel: 'In-season - W12',
  weekNumber: 12,
  isDeloadWeek: false,
  isMatchWeek: true,
  firstMatchDate: '2026-09-05',
  lastMatchDate: null,
  offSeasonStartAt: null,
  daysUntilNextMatch: 2,
  daysSinceLastMatch: 5,
  fatigueLevel: 'normal',
  clubContactProxy: 'normal',
  weeklyFrequency: 3,
  positionGroup: 'back_three',
  planningTrace: {
    resolutionMode: 'calendar_inferred',
    rulesApplied: [],
  },
}

const profile: UserProfile = {
  equipment: ['barbell', 'rack'],
  injuries: ['shoulder'],
  weeklySessions: 3,
  level: 'intermediate',
  position: 'BACK_THREE',
  rugbyPosition: 'BACK_THREE',
  displayName: 'Hugo',
  clubName: 'RC Test',
  clubSchedule: {
    clubDays: [{ day: 2 }, { day: 4 }],
    matchDay: 0,
  },
  scSchedule: {
    sessions: [
      { sessionIndex: 0, day: 1 },
      { sessionIndex: 1, day: 3 },
    ],
  },
  planningAnchors: {
    returnToTeamTrainingAt: '2026-08-01',
  },
}

describe('buildFreeChatContext', () => {
  it('expose semaine, profil et calendrier club/salle', () => {
    const ctx = buildFreeChatContext({
      profile,
      planningContext: planning,
      lang: 'fr',
      today: '2026-11-10',
      fatigue: 'normal',
      acwr: 1.1,
      acwrZone: 'optimal',
      acuteLoad: 400,
      chronicLoad: 360,
      logs: [
        {
          id: '1',
          dateISO: '2026-11-09',
          week: 'W1',
          sessionType: 'LOWER',
          fatigue: 'OK',
          rpe: 7,
          durationMin: 55,
        },
      ],
      events: [
        { id: 'm1', date: '2026-11-12', type: 'match', opponent: 'US Rival' },
        { id: 'r1', date: '2026-11-11', type: 'rest' },
      ],
      nextMatch: { date: '2026-11-12', opponent: 'US Rival' },
      explanationSummary: 'Programme adapté',
    })

    expect(ctx.week).toContain('saison')
    expect(ctx.phase).toBe('FORCE')
    expect(ctx.cycle).toBe('in_season')
    expect(ctx.isMatchWeek).toBe(true)
    expect(ctx.profile?.displayName).toBe('Hugo')
    expect(ctx.profile?.clubDays).toEqual(['mar', 'jeu'])
    expect(ctx.profile?.matchDay).toBe('dim')
    expect(ctx.profile?.gymDays).toEqual(['lun', 'mer'])
    expect(ctx.profile?.injuries).toEqual(['shoulder'])
    expect(ctx.nextMatch?.daysUntil).toBe(2)
    expect(ctx.upcomingWeekEvents?.some((e) => e.type === 'match')).toBe(true)
    expect(ctx.explanationSummary).toBe('Programme adapté')
  })
})
