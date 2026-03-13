import { describe, expect, it } from 'vitest'
import { createProfile } from './testHelpers'
import type { BuiltSession } from './buildSessionFromRecipe'
import type { QualityGateResult } from './qualityGates'
import { buildQualityScorecard } from './qualityScorecard'

const sessionWithIdentity: BuiltSession = {
  recipeId: 'LOWER_V1',
  title: 'Lower',
  week: 'W1',
  intensity: 'heavy',
  identity: {
    archetypeId: 'IN_SEASON_3X_STD',
    sessionRole: 'lower_strength',
    sessionIntensity: 'heavy',
    matchDayOffset: 'MD-4',
    objectiveLabel: 'Lower',
    whyTodayLabel: 'Fenêtre principale',
  },
  blocks: [],
  warnings: [],
}

const emptyGateResult: QualityGateResult = {
  events: [],
  warnings: [],
  invalidSessionIndexes: [],
  requiredSlotsTotal: 4,
  requiredSlotsSatisfied: 4,
  degradedSessions: 0,
}

describe('qualityScorecard', () => {
  it('returns a high score when no violations are present', () => {
    const score = buildQualityScorecard(
      createProfile(),
      [sessionWithIdentity],
      [],
      emptyGateResult
    )

    expect(score.overall).toBeGreaterThanOrEqual(90)
    expect(score.identity).toBe(100)
    expect(score.safety).toBe(100)
  })

  it('reduces score when hard violations and degraded sessions are present', () => {
    const degraded: QualityGateResult = {
      ...emptyGateResult,
      events: ['quality:missing-required-slot:LOWER_V1:0'],
      requiredSlotsSatisfied: 2,
      degradedSessions: 1,
    }

    const score = buildQualityScorecard(
      createProfile({ ageBand: 'u18', parentalConsentHealthData: false }),
      [sessionWithIdentity],
      ['hard:u18-parental-consent-missing'],
      degraded
    )

    expect(score.overall).toBeLessThan(85)
    expect(score.population).toBe(0)
    expect(score.safety).toBeLessThan(100)
  })
})

