import { describe, expect, it } from 'vitest'
import type { SessionRecipeId } from '../../data/sessionRecipes.v1'
import { createProfile } from './testHelpers'
import { resolveProgramFeatureFlags } from './policies/featureFlags'
import { resolvePopulationContext } from './policies/populationRules'
import { applySafetyContracts } from './policies/safetyContracts'

const BASE_RECIPES: SessionRecipeId[] = ['UPPER_V1', 'LOWER_V1', 'FULL_V1']

describe('safetyContracts', () => {
  it('ignores rehabInjury — rehab routing disabled', () => {
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
      acwrZone: 'optimal',
      hasSufficientACWRData: false,
      ignoreAcwrOverload: false,
      featureFlags: resolveProgramFeatureFlags(),
    })

    // Rehab routing is disabled — recipes should pass through unchanged
    expect(result.recipeIds).toEqual(BASE_RECIPES)
  })
})
