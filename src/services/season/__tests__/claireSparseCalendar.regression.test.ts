import { describe, expect, it } from 'vitest'
import { detectAnnualPlanningContext } from '../detectAnnualPlanningContext'
import { buildAthletePlanningInputs } from '../../annualPlanning/buildAthletePlanningInputs'
import { resolveMonthProgramGrid } from '../../scheduling/resolveMonthProgramGrid'
import { DEFAULT_PROFILE } from '../../../hooks/useProfile'
import type { UserProfile } from '../../../types/training'
import type { CalendarEvent } from '../../../types/training'

/**
 * Fixture régression — profil Claire (RC Orléans, Fédérale 2 Féminine).
 * Calendrier creux (2 matchs manuels, pas de sync FFR) ne doit pas basculer
 * octobre / début novembre en inter-saison.
 */
const claireProfile: UserProfile = {
  ...DEFAULT_PROFILE,
  displayName: 'Claire',
  seasonMode: 'in_season',
  trainingBaseline: 'active',
  weeklySessions: 2,
  trainingLevel: 'performance',
  rugbyPosition: 'BACK_THREE',
  clubCode: '5143R',
  clubName: 'R C ORLEANS',
  planningAnchors: {
    clubContactWeek: { level: 'hard', weekStartIso: '2026-09-21' },
    onboardingCycleHint: 'in_season',
    firstMatchDateOverride: '2026-09-27',
  },
  clubSchedule: { clubDays: [2, 5] },
}

const claireEvents: CalendarEvent[] = [
  {
    id: 'claire-m1',
    date: '2026-09-27',
    type: 'match',
    match_kind: 'league',
    user_hidden: false,
  },
  {
    id: 'claire-m2',
    date: '2026-10-04',
    type: 'match',
    match_kind: 'league',
    user_hidden: false,
  },
]

function cycleOn(today: string) {
  const { inputs } = buildAthletePlanningInputs({
    profile: claireProfile,
    events: claireEvents,
    logs: [],
    today,
    fatigue: null,
    acwrZone: null,
    readinessScore: null,
    jumpTrend: null,
  })
  return detectAnnualPlanningContext(inputs)
}

describe('Claire — pas d’inter-saison anticipée (calendrier creux)', () => {
  it.each([
    '2026-09-25',
    '2026-10-12',
    '2026-10-26',
    '2026-11-03',
  ] as const)('%s → in_season', (today) => {
    const ctx = cycleOn(today)
    expect(ctx.cycle).toBe('in_season')
    expect(ctx.planningTrace.rulesApplied).not.toContain('rule:auto_season_ended_28d')
  })

  it('début novembre (J+30 après dernier match) inhibe auto-28j via horloge FFR', () => {
    const ctx = cycleOn('2026-11-03')
    expect(ctx.daysSinceLastMatch).toBeGreaterThanOrEqual(28)
    expect(ctx.daysUntilNextMatch).toBeNull()
    expect(ctx.cycle).toBe('in_season')
    expect(ctx.planningTrace.rulesApplied).toContain('rule:auto_season_end_suppressed_ffr_clock')
    // Sous-mode possible : fin de saison / décompression — mais pas inter-saison.
    expect(ctx.weekLabel).toMatch(/En saison|Fin de saison/i)
  })

  it('vue mois octobre : aucune bande Inter-saison', () => {
    const grid = resolveMonthProgramGrid({
      profile: claireProfile,
      events: claireEvents,
      logs: [],
      today: '2026-09-25',
      fatigue: 'OK',
      week: 'W1',
      lastNonDeloadWeek: 'W1',
      year: 2026,
      month: 9, // October (0-indexed? check — existing tests use month: 5 for June)
      lang: 'fr',
    })

    // Existing tests: month: 5 → juin, month: 6 → juillet → month is 0-indexed? 
    // listIsoWeekMondaysInMonth(2026, 5) includes 2026-06-01 → month is 0-indexed.
    // So October = month 9.
    const bands = [...grid.phaseBandByMonday.values()].map((b) => b.fullLabel)
    expect(bands.length).toBeGreaterThan(0)
    for (const label of bands) {
      expect(label).not.toMatch(/Inter-saison/i)
    }
    expect(bands.some((l) => /En saison|Décharge/i.test(l))).toBe(true)
  })
})
