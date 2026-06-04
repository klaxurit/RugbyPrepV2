import { describe, expect, it } from 'vitest'
import { buildAthletePlanningInputs } from '../../annualPlanning/buildAthletePlanningInputs'
import { detectAnnualPlanningContext } from '../detectAnnualPlanningContext'
import { GOLDEN_PLANNING_PROFILES } from './goldenProfiles.fixture'

describe('golden planning profiles (M0 regression)', () => {
  for (const golden of GOLDEN_PLANNING_PROFILES) {
    it(`${golden.id}: ${golden.description}`, () => {
      const built = buildAthletePlanningInputs({
        profile: golden.profile,
        events: golden.events,
        logs: golden.logs,
        today: golden.today,
        fatigue: golden.fatigue,
      })

      const ctx = detectAnnualPlanningContext(built.inputs)

      expect(ctx.cycle, `[${golden.id}] cycle`).toBe(golden.expected.cycle)

      if (golden.expected.resolutionMode !== undefined) {
        expect(ctx.planningTrace.resolutionMode, `[${golden.id}] resolutionMode`).toBe(
          golden.expected.resolutionMode
        )
      }

      if (golden.expected.manualCycleOverride !== undefined) {
        expect(
          built.inputs.planningAnchors?.manualCycleOverride,
          `[${golden.id}] manualCycleOverride`
        ).toBe(golden.expected.manualCycleOverride)
      }

      if (golden.expected.preservedOnboardingHint !== undefined) {
        expect(
          built.inputs.planningAnchors?.onboardingCycleHint,
          `[${golden.id}] onboardingCycleHint`
        ).toBe(golden.expected.preservedOnboardingHint)
      }
    })
  }
})
