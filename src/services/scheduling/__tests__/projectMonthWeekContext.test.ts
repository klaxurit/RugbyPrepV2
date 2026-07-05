import { describe, expect, it } from 'vitest'
import type { AnnualPlanningContext } from '../../../types/annualPlanning'
import {
  OFF_SEASON_STRUCTURED_WEEKS,
  projectMonthWeekContext,
  resolvePreSeasonStartMonday,
} from '../projectMonthWeekContext'
import type { UserProfile } from '../../../types/training'
import { DEFAULT_PROFILE } from '../../../hooks/useProfile'

const anchorS7: AnnualPlanningContext = {
  cycle: 'off_season',
  weekNumber: 7,
  offSeasonPhase: 3,
  weekLabel: 'Inter-saison Hypertrophie - S7',
  isDeloadWeek: false,
  offSeasonStartAt: '2026-05-19',
  fatigueLevel: 'normal',
  weeklyFrequency: 3,
  positionGroup: 'back_three',
  firstMatchDate: null,
  lastMatchDate: null,
  daysUntilNextMatch: null,
  daysSinceLastMatch: null,
  isMatchWeek: false,
  planningTrace: {
    resolutionMode: 'explicit_anchors',
    rulesApplied: [],
    warnings: [],
  },
}

describe('projectMonthWeekContext', () => {
  it('progresse S7 → S8 → S9 → S10 avant toute pré-saison', () => {
    const currentMonday = '2026-06-30'
    const preStart = resolvePreSeasonStartMonday({
      ...DEFAULT_PROFILE,
      planningAnchors: { returnToTeamTrainingAt: '2026-09-01' },
    } as UserProfile)

    expect(projectMonthWeekContext(anchorS7, currentMonday, '2026-06-30', preStart)?.weekNumber).toBe(7)
    expect(projectMonthWeekContext(anchorS7, currentMonday, '2026-07-06', preStart)?.weekNumber).toBe(8)
    expect(projectMonthWeekContext(anchorS7, currentMonday, '2026-07-13', preStart)?.weekNumber).toBe(9)
    expect(projectMonthWeekContext(anchorS7, currentMonday, '2026-07-20', preStart)?.weekNumber).toBe(10)
    expect(projectMonthWeekContext(anchorS7, currentMonday, '2026-07-06', preStart)?.cycle).toBe('off_season')
    expect(projectMonthWeekContext(anchorS7, currentMonday, '2026-07-06', preStart)?.offSeasonPhase).toBe(3)
  })

  it('après S10 passe en Entretien puis pré-saison (pas pré-saison en plein juillet)', () => {
    const currentMonday = '2026-06-30'
    const preStart = resolvePreSeasonStartMonday({
      ...DEFAULT_PROFILE,
      planningAnchors: { returnToTeamTrainingAt: '2026-09-01' },
    } as UserProfile)

    const lateJuly = projectMonthWeekContext(anchorS7, currentMonday, '2026-07-27', preStart)
    expect(lateJuly?.cycle).toBe('off_season')
    expect(lateJuly?.offSeasonPhase).toBe(5)
    expect(lateJuly?.weekNumber).toBeGreaterThan(OFF_SEASON_STRUCTURED_WEEKS)

    const midAug = projectMonthWeekContext(anchorS7, currentMonday, '2026-08-17', preStart)
    expect(midAug?.cycle).toBe('pre_season')
    expect(midAug?.weekNumber).toBeGreaterThan(1)
    expect(midAug?.weekNumber).toBeLessThanOrEqual(8)
  })

  it('août fin de pré-saison → en saison (plus Affûtage S8 bloqué)', () => {
    const currentMonday = '2026-06-30'
    const preStart = resolvePreSeasonStartMonday({
      ...DEFAULT_PROFILE,
      planningAnchors: { returnToTeamTrainingAt: '2026-09-01' },
    } as UserProfile)

    const lateAug = projectMonthWeekContext(anchorS7, currentMonday, '2026-08-31', preStart)
    expect(lateAug?.cycle).toBe('pre_season')
    expect(lateAug?.weekNumber).toBeGreaterThanOrEqual(4)
    expect(lateAug?.weekNumber).toBeLessThanOrEqual(8)
  })
})
