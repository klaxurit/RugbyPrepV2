import { describe, expect, it } from 'vitest'
import type { SessionRecipeId } from '../../data/sessionRecipes.v1'
import { createProfile } from './testHelpers'
import { resolveProgramFeatureFlags } from './policies/featureFlags'
import { resolvePopulationContext } from './policies/populationRules'
import { applySafetyContracts } from './policies/safetyContracts'

const BASE_RECIPES: SessionRecipeId[] = ['UPPER_V1', 'LOWER_V1', 'FULL_V1']

describe('safetyContracts', () => {
  it('replaces FULL_* with rehab recipe when rehab is active', () => {
    const profile = createProfile({
      rehabInjury: {
        zone: 'lower',
        phase: 3,
        startDate: '2026-03-01',
        phaseStartDate: '2026-03-01',
      },
    })

    const result = applySafetyContracts({
      recipeIds: BASE_RECIPES,
      profile,
      population: resolvePopulationContext(profile),
      fatigueLevel: 'optimal',
      hasSufficientACWRData: false,
      ignoreAcwrOverload: false,
      featureFlags: resolveProgramFeatureFlags(),
    })

    expect(result.recipeIds).toContain('REHAB_LOWER_P3_V1')
    expect(result.recipeIds).not.toContain('FULL_V1')
  })

  it('keeps one rehab-compatible session in critical fatigue', () => {
    const profile = createProfile({
      rehabInjury: {
        zone: 'upper',
        phase: 2,
        startDate: '2026-03-01',
        phaseStartDate: '2026-03-01',
      },
    })

    const result = applySafetyContracts({
      recipeIds: BASE_RECIPES,
      profile,
      population: resolvePopulationContext(profile),
      fatigueLevel: 'critical',
      hasSufficientACWRData: true,
      ignoreAcwrOverload: false,
      featureFlags: resolveProgramFeatureFlags(),
    })

    expect(result.recipeIds).toEqual(['REHAB_UPPER_P2_V1'])
    expect(result.events).toContain('hard:critical-fatigue-rehab-priority')
  })
})
