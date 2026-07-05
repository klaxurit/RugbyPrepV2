import { describe, expect, it } from 'vitest'
import {
  listIsoWeekMondaysInMonth,
  resolveMonthProgramGrid,
} from '../resolveMonthProgramGrid'
import { resolveWeeklyProgramSurface } from '../../program/resolveWeeklyProgramSurface'
import type { UserProfile } from '../../../types/training'
import { DEFAULT_PROFILE } from '../../../hooks/useProfile'

const baseProfile: UserProfile = {
  ...DEFAULT_PROFILE,
  seasonMode: 'off_season',
  planningAnchors: { seasonEndedAt: '2026-04-06', seasonEndedSource: 'manual' },
}

describe('listIsoWeekMondaysInMonth', () => {
  it('inclut les lundis qui chevauchent juin 2026', () => {
    const mondays = listIsoWeekMondaysInMonth(2026, 5)
    expect(mondays).toContain('2026-06-01')
    expect(mondays).toContain('2026-06-29')
    expect(mondays.length).toBeGreaterThanOrEqual(4)
  })
})

describe('resolveMonthProgramGrid', () => {
  it('resolveWeeklyProgramSurface produit des slots off-season', () => {
    const surface = resolveWeeklyProgramSurface({
      profile: baseProfile,
      events: [],
      logs: [],
      today: '2026-06-15',
      fatigue: 'OK',
      week: 'W1',
      lastNonDeloadWeek: 'W1',
    })
    expect(surface.motherSession?.sessions?.length ?? 0).toBeGreaterThan(0)
  })

  it('projette des séances prévues sur les jours du mois', () => {
    const grid = resolveMonthProgramGrid({
      profile: baseProfile,
      events: [],
      logs: [],
      today: '2026-06-15',
      fatigue: 'OK',
      week: 'W1',
      lastNonDeloadWeek: 'W1',
      year: 2026,
      month: 5,
      lang: 'fr',
    })

    expect(grid.sessionsByDate.size).toBeGreaterThan(0)
    const allDates = [...grid.sessionsByDate.keys()].sort()
    expect(allDates[0] >= '2026-06-01').toBe(true)
    expect(allDates[allDates.length - 1] <= '2026-06-30').toBe(true)

    for (const sessions of grid.sessionsByDate.values()) {
      expect(sessions.length).toBeGreaterThan(0)
      expect(sessions[0].shortLabel.length).toBeGreaterThan(0)
    }
  })

  it('détecte au moins une phase label par lundi avec numéro de semaine', () => {
    const grid = resolveMonthProgramGrid({
      profile: baseProfile,
      events: [],
      logs: [],
      today: '2026-06-15',
      fatigue: 'OK',
      week: 'W1',
      lastNonDeloadWeek: 'W1',
      year: 2026,
      month: 5,
      lang: 'fr',
    })

    expect(grid.phaseLabelByMonday.size).toBeGreaterThan(0)
    for (const label of grid.phaseLabelByMonday.values()) {
      expect(label).toMatch(/S\d+/)
    }
  })

  it('borne inter-saison 10 sem : S8 hypertrophie, S9 force-pont', () => {
    const profile: UserProfile = {
      ...baseProfile,
      planningAnchors: {
        seasonEndedAt: '2026-04-06',
        seasonEndedSource: 'manual',
        returnToTeamTrainingAt: '2026-09-01',
      },
    }
    const grid = resolveMonthProgramGrid({
      profile,
      events: [{ id: 'match-sep', date: '2026-09-15', type: 'match' as const }],
      logs: [],
      today: '2026-06-15',
      fatigue: 'OK',
      week: 'W1',
      lastNonDeloadWeek: 'W1',
      year: 2026,
      month: 5,
      lang: 'fr',
    })

    const labels = [...grid.phaseLabelByMonday.values()]
    expect(labels.some((l) => /Hypertrophie S[5-8]\b/.test(l))).toBe(true)
    const hasForcePont = labels.some((l) => l.includes('Force-Pont'))
    const hasHypertrophyS9 = labels.some((l) => /Hypertrophie S9\b/.test(l))
    if (hasForcePont) {
      expect(hasHypertrophyS9).toBe(false)
    }
  })

  it('juillet 2026 : semaines distinctes S7 S8 S9 (pas S7 partout)', () => {
    const profile: UserProfile = {
      ...baseProfile,
      planningAnchors: {
        seasonEndedAt: '2026-04-06',
        seasonEndedSource: 'manual',
        manualOffSeasonWeekOverride: 7,
      },
    }
    const grid = resolveMonthProgramGrid({
      profile,
      events: [],
      logs: [],
      today: '2026-07-05',
      fatigue: 'OK',
      week: 'W1',
      lastNonDeloadWeek: 'W1',
      year: 2026,
      month: 6,
      lang: 'fr',
    })

    const julyMondays = listIsoWeekMondaysInMonth(2026, 6).filter((m) => m.startsWith('2026-07'))
    expect(julyMondays.length).toBeGreaterThanOrEqual(3)

    const labelsByMonday = Object.fromEntries(
      julyMondays.map((m) => [m, grid.phaseLabelByMonday.get(m)]),
    )

    const weekNumbers = julyMondays
      .map((monday) => grid.phaseLabelByMonday.get(monday))
      .filter((l): l is string => l != null)
      .map((l) => Number(l.match(/S(\d+)/)?.[1]))

    expect(weekNumbers).toEqual([8, 9, 10, 10])
    expect(new Set(weekNumbers).size).toBeGreaterThan(1)

    for (const monday of julyMondays) {
      const band = grid.phaseBandByMonday.get(monday)
      expect(band?.fullLabel).toMatch(/semaine \d+/)
    }

    expect(labelsByMonday['2026-07-06']).toBe('Hypertrophie S8')
    expect(labelsByMonday['2026-07-13']).toBe('Force-Pont S9')
  })
})
