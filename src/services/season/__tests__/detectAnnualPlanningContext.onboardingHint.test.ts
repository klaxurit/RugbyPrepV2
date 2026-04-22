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

describe('trainingBaseline override', () => {
  it('peak + off_season hint → démarre semaine 5 (phase 3 Hypertrophie)', () => {
    const inputs = makeInputs({
      trainingBaseline: 'peak',
      planningAnchors: { onboardingCycleHint: 'off_season' },
    })
    const ctx = detectAnnualPlanningContext(inputs)
    expect(ctx.cycle).toBe('off_season')
    expect(ctx.weekNumber).toBe(5)
    expect(ctx.offSeasonPhase).toBe(3)
    expect(ctx.planningTrace.rulesApplied).toContain('rule:training_baseline_peak')
  })

  it('peak + pre_season hint → démarre phase 2 (force)', () => {
    const inputs = makeInputs({
      trainingBaseline: 'peak',
      planningAnchors: { onboardingCycleHint: 'pre_season' },
    })
    const ctx = detectAnnualPlanningContext(inputs)
    expect(ctx.cycle).toBe('pre_season')
    expect(ctx.preSeasonPhase).toBe(2)
    expect(ctx.weekNumber).toBe(1)
  })

  it('active + off_season hint → comportement standard (semaine 1)', () => {
    const inputs = makeInputs({
      trainingBaseline: 'active',
      planningAnchors: { onboardingCycleHint: 'off_season' },
    })
    const ctx = detectAnnualPlanningContext(inputs)
    expect(ctx.weekNumber).toBe(1)
    expect(ctx.offSeasonPhase).toBe(1)
  })

  it('restart + pre_season hint → phase 1 standard, rule tracée', () => {
    const inputs = makeInputs({
      trainingBaseline: 'restart',
      planningAnchors: { onboardingCycleHint: 'pre_season' },
    })
    const ctx = detectAnnualPlanningContext(inputs)
    expect(ctx.preSeasonPhase).toBe(1)
    expect(ctx.planningTrace.rulesApplied).toContain('rule:training_baseline_restart')
  })

  it('peak + in_season hint → pas de changement (W1 standard)', () => {
    const inputs = makeInputs({
      trainingBaseline: 'peak',
      planningAnchors: { onboardingCycleHint: 'in_season' },
    })
    const ctx = detectAnnualPlanningContext(inputs)
    expect(ctx.weekNumber).toBe(1)
  })
})
