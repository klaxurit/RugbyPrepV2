import { describe, expect, it } from 'vitest'
import { scoreOnboardingLevelProfile } from './scoreOnboardingLevelProfile'

describe('scoreOnboardingLevelProfile', () => {
  it('derives a mixed profile and keeps the visible label on the lowest scored axis', () => {
    const result = scoreOnboardingLevelProfile(
      {
        trainingAge: 3,
        patternConfidence: 2,
        recentConsistency: 2,
        recoveryCapacity: 2,
        explosiveExposure: 3,
        currentPain: 3,
      },
      '2026-03-21T09:00:00.000Z'
    )

    expect(result.profile.axes.exerciseComplexity.state).toBe('performance')
    expect(result.profile.axes.volumeTolerance.state).toBe('builder')
    expect(result.profile.axes.explosiveReadiness.state).toBe('performance')
    expect(result.profile.axes.intensityTolerance.state).toBe('builder')
    expect(result.visibleLabel).toBe('builder')
  })

  it('applies the pain cap to explosive readiness', () => {
    const result = scoreOnboardingLevelProfile(
      {
        trainingAge: 3,
        patternConfidence: 3,
        recentConsistency: 3,
        recoveryCapacity: 3,
        explosiveExposure: 3,
        currentPain: 1,
      },
      '2026-03-21T09:00:00.000Z'
    )

    expect(result.profile.axes.explosiveReadiness.average).toBe(2)
    expect(result.profile.axes.explosiveReadiness.state).toBe('starter')
    expect(result.profile.safetyCaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'pain_caps_explosive' }),
      ])
    )
    expect(result.visibleLabel).toBe('starter')
  })

  it('applies the true beginner and low recovery caps conservatively', () => {
    const result = scoreOnboardingLevelProfile(
      {
        trainingAge: 1,
        patternConfidence: 1,
        recentConsistency: 1,
        recoveryCapacity: 1,
        explosiveExposure: 2,
        currentPain: 3,
      },
      '2026-03-21T09:00:00.000Z'
    )

    expect(result.profile.axes.exerciseComplexity.state).toBe('starter')
    expect(result.profile.axes.volumeTolerance.state).toBe('starter')
    expect(result.profile.axes.optionalBlockTolerance.state).toBe('starter')
    expect(result.profile.safetyCaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'true_beginner_caps_complexity' }),
        expect.objectContaining({ code: 'inconsistent_recovery_caps_volume' }),
      ])
    )
    expect(result.visibleLabel).toBe('starter')
  })
})
