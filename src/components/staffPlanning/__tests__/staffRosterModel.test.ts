import { describe, expect, it } from 'vitest'
import type { AthleteStaffWeeklyView } from '../../../types/staffPlanning'
import {
  filterStaffRosterRows,
  sortStaffRosterRows,
  type StaffRosterRowView,
} from '../staffRosterModel'

function mockAthlete(p: Partial<AthleteStaffWeeklyView>): AthleteStaffWeeklyView {
  const base: AthleteStaffWeeklyView = {
    identity: { athleteId: 'a1', clubId: 'c', squadId: 's', source: 'staff' },
    planningInputs: {} as AthleteStaffWeeklyView['planningInputs'],
    annualPlanning: {
      cycle: 'in_season',
      weekLabel: 'S1',
      positionGroup: 'front_row',
      isDeloadWeek: false,
      isMatchWeek: false,
      firstMatchDate: null,
      lastMatchDate: null,
      offSeasonStartAt: null,
      daysUntilNextMatch: null,
      daysSinceLastMatch: null,
      fatigueLevel: 'normal',
      weeklyFrequency: 3,
      planningTrace: {
        resolutionMode: 'backfilled',
        rulesApplied: [],
        warnings: [],
      },
    },
    motherSessions: {
      status: 'resolved',
      sessionIds: [],
      sessionTitles: [],
      companionRecommendations: [],
      warnings: [],
    },
    adherence: {
      completedSessionsLast7d: 2,
      completedSessionsLast28d: 8,
      plannedSessionsThisWeek: 3,
      completionVsPlanned7d: 0.8,
    },
    load: { fatigueLevel: 'normal', latestRpeLoad: null, painFlags: [] },
    alerts: [],
  }
  return { ...base, ...p, identity: { ...base.identity, ...p.identity } }
}

describe('staffRosterModel', () => {
  it('filtre par fatigue', () => {
    const rows: StaffRosterRowView[] = [
      { displayName: 'A', athlete: mockAthlete({ load: { fatigueLevel: 'high', latestRpeLoad: null, painFlags: [] } }) },
      { displayName: 'B', athlete: mockAthlete({ load: { fatigueLevel: 'normal', latestRpeLoad: null, painFlags: [] } }) },
    ]
    const out = filterStaffRosterRows(rows, {
      search: '',
      fatigue: 'high',
      adherence: 'all',
      position: 'all',
      matchWeek: 'all',
    })
    expect(out).toHaveLength(1)
    expect(out[0].displayName).toBe('A')
  })

  it('filtre adhérence faible via alerte low_adherence', () => {
    const rows: StaffRosterRowView[] = [
      {
        displayName: 'Low',
        athlete: mockAthlete({
          alerts: [{ code: 'low_adherence', severity: 'warning', message: 'x' }],
        }),
      },
      { displayName: 'Ok', athlete: mockAthlete({ alerts: [] }) },
    ]
    const out = filterStaffRosterRows(rows, {
      search: '',
      fatigue: 'all',
      adherence: 'low',
      position: 'all',
      matchWeek: 'all',
    })
    expect(out.map((r) => r.displayName)).toEqual(['Low'])
  })

  it('tri par nom (fr)', () => {
    const rows: StaffRosterRowView[] = [
      { displayName: 'Zoé', athlete: mockAthlete({ identity: { athleteId: 'z' } }) },
      { displayName: 'Adam', athlete: mockAthlete({ identity: { athleteId: 'a' } }) },
    ]
    const out = sortStaffRosterRows(rows, 'name', 'asc')
    expect(out.map((r) => r.displayName)).toEqual(['Adam', 'Zoé'])
  })
})
