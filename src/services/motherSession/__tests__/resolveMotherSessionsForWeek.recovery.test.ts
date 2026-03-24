import { describe, expect, it } from 'vitest'
import { resolveMotherSessionsForWeek } from '../resolveMotherSessionsForWeek'
import type { AthletePlanningInputs } from '../../../types/annualPlanning'

function makeInputs(
  overrides: Partial<AthletePlanningInputs> = {}
): AthletePlanningInputs {
  return {
    events: [{ date: '2026-04-05', type: 'match' }],
    today: '2026-04-10',
    weeklyFrequency: 2,
    positionGroup: 'back_three',
    ...overrides,
  }
}

describe('in-season recovery override', () => {
  it('in_season + very_high → loadManagementOverride = recovery, cycle reste in_season', () => {
    const inputs = makeInputs({ fatigueLevel: 'very_high' })
    const result = resolveMotherSessionsForWeek(inputs)

    expect(result.planningContext.cycle).toBe('in_season')
    expect(result.planningContext.loadManagementOverride).toBe('recovery')
    expect(result.sessions.length).toBe(2)
    expect(result.warnings.join(' ')).not.toMatch(/recovery override/i)
    expect(result.companionRecommendations?.join(' ')).toMatch(/zone 2/i)
    // Sessions are recovery templates
    expect(result.sessions[0].sessionId).toBe('FULL_OFFSEASON_RECOVERY_A_V1')
    expect(result.sessions[1].sessionId).toBe('FULL_OFFSEASON_RECOVERY_B_V1')
  })

  it('in_season + high → pas de recovery override', () => {
    const inputs = makeInputs({ fatigueLevel: 'high' })
    const result = resolveMotherSessionsForWeek(inputs)

    expect(result.planningContext.cycle).toBe('in_season')
    expect(result.planningContext.loadManagementOverride).toBeUndefined()
  })

  it('in_season + normal → pas de recovery override', () => {
    const inputs = makeInputs({ fatigueLevel: 'normal' })
    const result = resolveMotherSessionsForWeek(inputs)

    expect(result.planningContext.cycle).toBe('in_season')
    expect(result.planningContext.loadManagementOverride).toBeUndefined()
  })

  it('off_season + very_high → pas de recovery override (off-season a ses propres phases)', () => {
    const inputs = makeInputs({
      events: [],
      fatigueLevel: 'very_high',
      planningAnchors: { onboardingCycleHint: 'off_season' },
    })
    const result = resolveMotherSessionsForWeek(inputs)

    expect(result.planningContext.cycle).toBe('off_season')
    // Off-season handles fatigue via its own phase system, not recovery override
    expect(result.planningContext.loadManagementOverride).toBeUndefined()
  })
})
