import { describe, expect, it } from 'vitest'
import { detectAnnualPlanningContext } from '../detectAnnualPlanningContext'
import type { AthletePlanningInputs } from '../../../types/annualPlanning'

function makeInputs(
  overrides: Partial<AthletePlanningInputs> = {}
): AthletePlanningInputs {
  return {
    events: [],
    today: '2026-03-22',
    weeklyFrequency: 2,
    positionGroup: 'back_three',
    ...overrides,
  }
}

describe('onboardingCycleHint bootstrap', () => {
  it('in_season hint + no matches → cycle in_season, resolutionMode onboarding_hint', () => {
    const inputs = makeInputs({
      planningAnchors: { onboardingCycleHint: 'in_season' },
    })
    const ctx = detectAnnualPlanningContext(inputs)
    expect(ctx.cycle).toBe('in_season')
    expect(ctx.planningTrace.resolutionMode).toBe('onboarding_hint')
    expect(ctx.weekNumber).toBe(1)
    expect(ctx.weekLabel).toBe('En saison - S1 (1/4)')
  })

  it('pre_season hint + no matches → cycle pre_season, resolutionMode onboarding_hint', () => {
    const inputs = makeInputs({
      planningAnchors: { onboardingCycleHint: 'pre_season' },
    })
    const ctx = detectAnnualPlanningContext(inputs)
    expect(ctx.cycle).toBe('pre_season')
    expect(ctx.planningTrace.resolutionMode).toBe('onboarding_hint')
    expect(ctx.preSeasonPhase).toBe(1)
    expect(ctx.weekNumber).toBe(1)
  })

  it('off_season hint + no matches → cycle off_season, resolutionMode onboarding_hint', () => {
    const inputs = makeInputs({
      planningAnchors: { onboardingCycleHint: 'off_season' },
    })
    const ctx = detectAnnualPlanningContext(inputs)
    expect(ctx.cycle).toBe('off_season')
    expect(ctx.planningTrace.resolutionMode).toBe('onboarding_hint')
    expect(ctx.weekNumber).toBe(1)
  })

  it('in_season hint + real match calendar → calendar_inferred wins (hint ignored)', () => {
    const inputs = makeInputs({
      events: [{ date: '2026-04-05', type: 'match' }],
      planningAnchors: { onboardingCycleHint: 'in_season' },
    })
    const ctx = detectAnnualPlanningContext(inputs)
    // With a match date, the resolver uses calendar logic, not the hint
    expect(ctx.planningTrace.resolutionMode).not.toBe('onboarding_hint')
  })

  it('no hint + no matches → backfilled (existing behavior unchanged)', () => {
    const inputs = makeInputs()
    const ctx = detectAnnualPlanningContext(inputs)
    expect(ctx.cycle).toBe('off_season')
    expect(ctx.planningTrace.resolutionMode).toBe('backfilled')
    expect(ctx.weekNumber).toBe(1)
  })

  it('in_season hint + non-match events only → onboarding_hint (rest/unavailable ne bloquent pas)', () => {
    const inputs = makeInputs({
      events: [
        { date: '2026-03-20', type: 'rest' },
        { date: '2026-03-21', type: 'unavailable' },
      ],
      planningAnchors: { onboardingCycleHint: 'in_season' },
    })
    const ctx = detectAnnualPlanningContext(inputs)
    expect(ctx.cycle).toBe('in_season')
    expect(ctx.planningTrace.resolutionMode).toBe('onboarding_hint')
  })
})
