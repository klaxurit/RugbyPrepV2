import { describe, expect, it } from 'vitest'
import type { AnnualPlanningContext } from '../../types/annualPlanning'
import {
  applyClubContactProxyToSessions,
  clubContactLoadTip,
  resolveClubContactProxy,
  shouldApplyHardClubCut,
} from '../clubContactProxy'

describe('resolveClubContactProxy', () => {
  it('défaut normal si rien de stocké ou semaine périmée', () => {
    expect(resolveClubContactProxy(undefined, '2026-08-15')).toBe('normal')
    expect(
      resolveClubContactProxy({ weekStartIso: '2026-08-03', level: 'hard' }, '2026-08-15'),
    ).toBe('normal')
  })

  it('garde le niveau si la semaine ISO match', () => {
    expect(
      resolveClubContactProxy({ weekStartIso: '2026-08-10', level: 'hard' }, '2026-08-15'),
    ).toBe('hard')
    expect(
      resolveClubContactProxy({ weekStartIso: '2026-08-10', level: 'light' }, '2026-08-12'),
    ).toBe('light')
  })
})

describe('applyClubContactProxyToSessions', () => {
  const ctx = (over: Partial<AnnualPlanningContext> = {}): AnnualPlanningContext =>
    ({
      cycle: 'in_season',
      weekLabel: 'S1',
      isDeloadWeek: false,
      isMatchWeek: false,
      firstMatchDate: null,
      lastMatchDate: null,
      offSeasonStartAt: null,
      daysUntilNextMatch: 10,
      daysSinceLastMatch: null,
      fatigueLevel: 'normal',
      clubContactProxy: 'hard',
      weeklyFrequency: 3,
      positionGroup: 'front_row',
      planningTrace: { resolutionMode: 'calendar_inferred', rulesApplied: [], warnings: [] },
      ...over,
    }) as AnnualPlanningContext

  it('club dur : variant light + max 3 blocs', () => {
    const slots = [
      { sessionId: 'a', variant: 'normal' as const },
      { sessionId: 'b', maxBlocks: 4 },
    ]
    const out = applyClubContactProxyToSessions(slots, ctx())
    expect(out.every((s) => s.variant === 'light')).toBe(true)
    expect(out.every((s) => s.maxBlocks === 3)).toBe(true)
  })

  it('ne recoupe pas décharge / recovery / taper playoffs', () => {
    const slots = [{ sessionId: 'a' }]
    expect(applyClubContactProxyToSessions(slots, ctx({ isDeloadWeek: true }))).toBe(slots)
    expect(
      applyClubContactProxyToSessions(slots, ctx({ loadManagementOverride: 'recovery' })),
    ).toBe(slots)
    expect(
      applyClubContactProxyToSessions(slots, ctx({ cycle: 'playoffs', playoffTaperPhase: 'match_week' })),
    ).toBe(slots)
    expect(shouldApplyHardClubCut(ctx({ cycle: 'off_season' }))).toBe(false)
  })

  it('léger / normal : pas de coupe', () => {
    const slots = [{ sessionId: 'a' }]
    expect(applyClubContactProxyToSessions(slots, ctx({ clubContactProxy: 'light' }))).toBe(slots)
    expect(applyClubContactProxyToSessions(slots, ctx({ clubContactProxy: 'normal' }))).toBe(slots)
  })
})

describe('clubContactLoadTip', () => {
  it('dur même hors match ; léger seulement si match ; pas de 15 min', () => {
    expect(
      clubContactLoadTip({
        cycle: 'in_season',
        isMatchWeek: false,
        daysUntilNextMatch: 12,
        clubContactProxy: 'hard',
      }),
    ).toMatch(/Beaucoup de contact/)
    expect(
      clubContactLoadTip({
        cycle: 'in_season',
        isMatchWeek: true,
        daysUntilNextMatch: 3,
        clubContactProxy: 'light',
      }),
    ).toMatch(/Peu de contact/)
    expect(
      clubContactLoadTip({
        cycle: 'in_season',
        isMatchWeek: false,
        daysUntilNextMatch: 12,
        clubContactProxy: 'light',
      }),
    ).toBeUndefined()
    const normalMatch = clubContactLoadTip({
      cycle: 'in_season',
      isMatchWeek: true,
      daysUntilNextMatch: 4,
    })
    expect(normalMatch).toMatch(/contact/)
    expect(normalMatch).not.toMatch(/15/)
  })
})
