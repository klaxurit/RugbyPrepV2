import { describe, expect, it } from 'vitest'
import { buildScoreBreakdownRows } from '../scoreBreakdownRows'
import type { WeeklyScore, WeeklyScoreBreakdown } from '../../../types/gamification'

const EMPTY: WeeklyScoreBreakdown = {
  plannedSessions: 0,
  offPlanSessions: 0,
  prescribedRest: 0,
  fullPlanBonus: 0,
  deloadCompensation: 0,
  logQualityBonus: 0,
  streakBonus: 0,
}

function score(breakdown: Partial<WeeklyScoreBreakdown>): WeeklyScore {
  return {
    weekStartISO: '2026-09-14',
    points: 0,
    sessionsPlanned: 3,
    sessionsCompleted: 3,
    deloadRespected: false,
    acwrCapped: false,
    breakdown: { ...EMPTY, ...breakdown },
  }
}

describe('buildScoreBreakdownRows', () => {
  it('ne liste que les postes ayant rapporté des points', () => {
    const rows = buildScoreBreakdownRows(
      score({ plannedSessions: 60, streakBonus: 15 }),
      'fr',
    )
    expect(rows.map((row) => row.id)).toEqual(['plannedSessions', 'streakBonus'])
    expect(rows.map((row) => row.points)).toEqual([60, 15])
  })

  it('renvoie une liste vide pour une semaine sans point', () => {
    expect(buildScoreBreakdownRows(score({}), 'fr')).toEqual([])
  })

  it('affiche le repos prescrit avant les séances hors plan', () => {
    const rows = buildScoreBreakdownRows(
      score({ plannedSessions: 40, offPlanSessions: 8, prescribedRest: 20 }),
      'fr',
    )
    expect(rows.map((row) => row.id)).toEqual([
      'plannedSessions',
      'prescribedRest',
      'offPlanSessions',
    ])
  })

  it('nomme explicitement la décharge tenue', () => {
    const rows = buildScoreBreakdownRows(score({ deloadCompensation: 20 }), 'fr')
    expect(rows[0].label).toMatch(/décharge/i)
  })

  it('traduit les libellés', () => {
    const rows = buildScoreBreakdownRows(score({ prescribedRest: 10 }), 'en')
    expect(rows[0].label).toBe('Prescribed rest respected')
  })
})
