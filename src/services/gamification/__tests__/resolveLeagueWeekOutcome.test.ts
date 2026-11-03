import { describe, expect, it } from 'vitest'
import {
  countPriorConsecutiveInactiveWeeks,
  INACTIVE_WEEKS_BEFORE_FORCE_RELEGATION,
  resolveLeagueWeekOutcome,
} from '../resolveLeagueWeekOutcome'

describe('resolveLeagueWeekOutcome', () => {
  const cutoffs = { promotionCutoff: 5, relegationCutoff: 20 }

  it('protège une pause Blessé contre promo et relég', () => {
    expect(
      resolveLeagueWeekOutcome({
        rank: 1,
        ...cutoffs,
        sessionsCompleted: 0,
        priorConsecutiveInactiveWeeks: 5,
        isPaused: true,
      }),
    ).toBe('stayed')
    expect(
      resolveLeagueWeekOutcome({
        rank: 24,
        ...cutoffs,
        sessionsCompleted: 3,
        priorConsecutiveInactiveWeeks: 0,
        isPaused: true,
      }),
    ).toBe('stayed')
  })

  it('force la relégation après inactivité soutenue', () => {
    expect(INACTIVE_WEEKS_BEFORE_FORCE_RELEGATION).toBe(2)
    expect(
      resolveLeagueWeekOutcome({
        rank: 10,
        ...cutoffs,
        sessionsCompleted: 0,
        priorConsecutiveInactiveWeeks: 1,
        isPaused: false,
      }),
    ).toBe('relegated')
  })

  it('ne force pas dès la première semaine inactive (rang neutre)', () => {
    expect(
      resolveLeagueWeekOutcome({
        rank: 10,
        ...cutoffs,
        sessionsCompleted: 0,
        priorConsecutiveInactiveWeeks: 0,
        isPaused: false,
      }),
    ).toBe('stayed')
  })

  it('applique les cutoffs classiques quand actif', () => {
    expect(
      resolveLeagueWeekOutcome({
        rank: 3,
        ...cutoffs,
        sessionsCompleted: 3,
        priorConsecutiveInactiveWeeks: 0,
        isPaused: false,
      }),
    ).toBe('promoted')
    expect(
      resolveLeagueWeekOutcome({
        rank: 22,
        ...cutoffs,
        sessionsCompleted: 1,
        priorConsecutiveInactiveWeeks: 0,
        isPaused: false,
      }),
    ).toBe('relegated')
  })

  it('reste neutre si cutoffs à 0 (cohorte non viable)', () => {
    expect(
      resolveLeagueWeekOutcome({
        rank: 1,
        promotionCutoff: 0,
        relegationCutoff: 0,
        sessionsCompleted: 0,
        priorConsecutiveInactiveWeeks: 0,
        isPaused: false,
      }),
    ).toBe('stayed')
  })
})

describe('countPriorConsecutiveInactiveWeeks', () => {
  it('compte les semaines à 0 juste avant la clôture', () => {
    expect(
      countPriorConsecutiveInactiveWeeks(
        [
          { weekStartISO: '2026-10-20', sessionsCompleted: 0 },
          { weekStartISO: '2026-10-13', sessionsCompleted: 0 },
          { weekStartISO: '2026-10-06', sessionsCompleted: 2 },
          { weekStartISO: '2026-10-27', sessionsCompleted: 0 },
        ],
        '2026-10-27',
      ),
    ).toBe(2)
  })

  it('s’arrête à la première semaine active', () => {
    expect(
      countPriorConsecutiveInactiveWeeks(
        [
          { weekStartISO: '2026-10-20', sessionsCompleted: 1 },
          { weekStartISO: '2026-10-13', sessionsCompleted: 0 },
        ],
        '2026-10-27',
      ),
    ).toBe(0)
  })
})
