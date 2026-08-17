import { describe, expect, it } from 'vitest'
import { detectAnnualPlanningContext } from '../detectAnnualPlanningContext'
import { resolveDefaultFfrSeasonClock } from '../defaultFfrSeasonClock'
import { parseLocalDateOnly } from '../../dates/localIsoDate'
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

function clockOn(iso: string) {
  return resolveDefaultFfrSeasonClock(parseLocalDateOnly(iso)!)
}

describe('onboardingCycleHint bootstrap', () => {
  it('in_season hint + no matches en mars → horloge FFR (S29), pas S1', () => {
    const inputs = makeInputs({
      planningAnchors: { onboardingCycleHint: 'in_season' },
    })
    const ctx = detectAnnualPlanningContext(inputs)
    const clock = clockOn('2026-03-22')
    expect(ctx.cycle).toBe('in_season')
    expect(ctx.planningTrace.resolutionMode).toBe('onboarding_hint')
    expect(ctx.weekNumber).toBe(clock.weekNumber)
    expect(ctx.isMatchWeek).toBe(false)
    expect(ctx.firstMatchDate).toBeNull()
    expect(ctx.planningTrace.rulesApplied).toContain('rule:ffr_default_clock')
  })

  it('pre_season hint + no matches en mars (mismatch) → S1 pré-saison', () => {
    const inputs = makeInputs({
      planningAnchors: { onboardingCycleHint: 'pre_season' },
    })
    const ctx = detectAnnualPlanningContext(inputs)
    expect(ctx.cycle).toBe('pre_season')
    expect(ctx.planningTrace.resolutionMode).toBe('onboarding_hint')
    expect(ctx.preSeasonPhase).toBe(1)
    expect(ctx.weekNumber).toBe(1)
    expect(ctx.planningTrace.rulesApplied).toContain('rule:ffr_clock_hint_mismatch')
  })

  it('off_season hint + no matches en mars (mismatch) → S1 inter-saison', () => {
    const inputs = makeInputs({
      planningAnchors: { onboardingCycleHint: 'off_season' },
    })
    const ctx = detectAnnualPlanningContext(inputs)
    expect(ctx.cycle).toBe('off_season')
    expect(ctx.planningTrace.resolutionMode).toBe('onboarding_hint')
    expect(ctx.weekNumber).toBe(1)
    expect(ctx.planningTrace.rulesApplied).toContain('rule:ffr_clock_hint_mismatch')
  })

  it('in_season hint + real match calendar → calendar_inferred wins (hint ignored)', () => {
    const inputs = makeInputs({
      events: [{ date: '2026-04-05', type: 'match' }],
      planningAnchors: { onboardingCycleHint: 'in_season' },
    })
    const ctx = detectAnnualPlanningContext(inputs)
    expect(ctx.planningTrace.resolutionMode).not.toBe('onboarding_hint')
    expect(ctx.planningTrace.resolutionMode).not.toBe('default_ffr_clock')
  })

  it('no hint + no matches en mars → horloge FFR en saison, pas backfill S1', () => {
    const inputs = makeInputs()
    const ctx = detectAnnualPlanningContext(inputs)
    const clock = clockOn('2026-03-22')
    expect(ctx.cycle).toBe('in_season')
    expect(ctx.planningTrace.resolutionMode).toBe('default_ffr_clock')
    expect(ctx.weekNumber).toBe(clock.weekNumber)
    expect(ctx.isMatchWeek).toBe(false)
  })

  it('in_season hint + non-match events only → horloge FFR', () => {
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
    expect(ctx.weekNumber).toBe(clockOn('2026-03-22').weekNumber)
  })

  it('juin + hint off_season → transition calendaire (pas S1, pas hypertrophie)', () => {
    const today = '2026-06-15'
    const ctx = detectAnnualPlanningContext(
      makeInputs({
        today,
        planningAnchors: { onboardingCycleHint: 'off_season' },
      }),
    )
    expect(ctx.cycle).toBe('off_season')
    expect(ctx.weekNumber).toBe(clockOn(today).weekNumber)
    expect(ctx.weekNumber).toBeGreaterThan(1)
    expect(ctx.weekNumber).toBeLessThanOrEqual(4)
    expect(ctx.offSeasonPhase).toBeLessThanOrEqual(2)
    expect(ctx.isMatchWeek).toBe(false)
  })

  it('juillet + hint off_season (mismatch horloge pré-saison) → S1 inter-saison', () => {
    const ctx = detectAnnualPlanningContext(
      makeInputs({
        today: '2026-07-10',
        planningAnchors: { onboardingCycleHint: 'off_season' },
      }),
    )
    expect(ctx.cycle).toBe('off_season')
    expect(ctx.weekNumber).toBe(1)
    expect(ctx.planningTrace.rulesApplied).toContain('rule:ffr_clock_hint_mismatch')
  })

  it('juillet + hint pre_season → pré-saison 1 calendaire', () => {
    const today = '2026-07-10'
    const ctx = detectAnnualPlanningContext(
      makeInputs({
        today,
        planningAnchors: { onboardingCycleHint: 'pre_season' },
      }),
    )
    expect(ctx.cycle).toBe('pre_season')
    expect(ctx.preSeasonPhase).toBe(1)
    expect(ctx.weekNumber).toBe(clockOn(today).weekNumber)
    expect(ctx.isMatchWeek).toBe(false)
  })

  it('painFlags ne déplacent pas le cycle (stores)', () => {
    const today = '2026-07-10'
    const without = detectAnnualPlanningContext(makeInputs({ today }))
    const withPain = detectAnnualPlanningContext(
      makeInputs({
        today,
        monitoringSnapshot: { painFlags: ['knee_pain'] },
      }),
    )
    expect(withPain.cycle).toBe(without.cycle)
    expect(withPain.weekNumber).toBe(without.weekNumber)
    expect(withPain.preSeasonPhase).toBe(without.preSeasonPhase)
  })

  it('trêve de Noël sans calendrier → deload, pas de faux match', () => {
    const ctx = detectAnnualPlanningContext(
      makeInputs({
        today: '2025-12-22',
        planningAnchors: { onboardingCycleHint: 'in_season' },
      }),
    )
    expect(ctx.cycle).toBe('in_season')
    expect(ctx.isDeloadWeek).toBe(true)
    expect(ctx.isMatchWeek).toBe(false)
    expect(ctx.inSeasonSubMode).toBe('competition')
    expect(ctx.planningTrace.rulesApplied).toContain('rule:ffr_christmas_deload')
  })

  it('août + hint pre_season → pré-saison calendaire amateur', () => {
    const today = '2026-08-20'
    const ctx = detectAnnualPlanningContext(
      makeInputs({
        today,
        planningAnchors: { onboardingCycleHint: 'pre_season' },
      }),
    )
    expect(ctx.cycle).toBe('pre_season')
    expect(ctx.weekNumber).toBe(clockOn(today).weekNumber)
    expect(ctx.weekNumber).toBeGreaterThan(1)
  })
})

describe('trainingBaseline override', () => {
  it('peak + off_season hint en mars (mismatch) → démarre semaine 5', () => {
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

  it('peak + pre_season hint en mars (mismatch) → démarre phase 2', () => {
    const inputs = makeInputs({
      trainingBaseline: 'peak',
      planningAnchors: { onboardingCycleHint: 'pre_season' },
    })
    const ctx = detectAnnualPlanningContext(inputs)
    expect(ctx.cycle).toBe('pre_season')
    expect(ctx.preSeasonPhase).toBe(2)
    expect(ctx.weekNumber).toBe(1)
  })

  it('active + off_season hint en mars (mismatch) → semaine 1', () => {
    const inputs = makeInputs({
      trainingBaseline: 'active',
      planningAnchors: { onboardingCycleHint: 'off_season' },
    })
    const ctx = detectAnnualPlanningContext(inputs)
    expect(ctx.weekNumber).toBe(1)
    expect(ctx.offSeasonPhase).toBe(1)
  })

  it('restart + pre_season hint en mars (mismatch) → phase 1, rule tracée', () => {
    const inputs = makeInputs({
      trainingBaseline: 'restart',
      planningAnchors: { onboardingCycleHint: 'pre_season' },
    })
    const ctx = detectAnnualPlanningContext(inputs)
    expect(ctx.preSeasonPhase).toBe(1)
    expect(ctx.planningTrace.rulesApplied).toContain('rule:training_baseline_restart')
  })

  it('peak + off_season hint en juin (horloge alignée) → pas d’hypertrophie S5', () => {
    const ctx = detectAnnualPlanningContext(
      makeInputs({
        today: '2026-06-15',
        trainingBaseline: 'peak',
        planningAnchors: { onboardingCycleHint: 'off_season' },
      }),
    )
    expect(ctx.cycle).toBe('off_season')
    expect(ctx.weekNumber).toBeLessThanOrEqual(4)
    expect(ctx.offSeasonPhase).toBeLessThanOrEqual(2)
  })

  it('peak + in_season hint en mars → horloge FFR, pas de reset S1', () => {
    const inputs = makeInputs({
      trainingBaseline: 'peak',
      planningAnchors: { onboardingCycleHint: 'in_season' },
    })
    const ctx = detectAnnualPlanningContext(inputs)
    expect(ctx.weekNumber).toBe(clockOn('2026-03-22').weekNumber)
  })
})
