import { beforeEach, describe, expect, it, vi } from 'vitest'

const capture = vi.fn()
const setPersonProperties = vi.fn()

vi.mock('../posthog', () => ({
  posthog: {
    capture: (...args: unknown[]) => capture(...args),
    setPersonProperties: (...args: unknown[]) => setPersonProperties(...args),
  },
}))

import {
  equipmentBucketFromProfile,
  syncProductPersonProperties,
  trackFrictionFeedback,
  trackProduct,
} from '../trackProduct'

describe('trackProduct', () => {
  beforeEach(() => {
    capture.mockClear()
    setPersonProperties.mockClear()
  })

  it('ajoute schema_version', () => {
    trackProduct('session_started', { index: 1 })
    expect(capture).toHaveBeenCalledWith('session_started', {
      schema_version: 1,
      index: 1,
    })
  })

  it('trackFrictionFeedback tronque la note', () => {
    trackFrictionFeedback({
      trigger: 'session_abandon',
      reason: 'too_long',
      note: 'x'.repeat(400),
      sessionIndex: 2,
    })
    expect(capture).toHaveBeenCalledWith(
      'friction_feedback',
      expect.objectContaining({
        trigger: 'session_abandon',
        reason: 'too_long',
        index: 2,
        note: 'x'.repeat(280),
      }),
    )
  })

  it('syncProductPersonProperties', () => {
    syncProductPersonProperties({
      onboardingComplete: true,
      trainingLevel: 'intermediate',
      weeklySessions: 3,
      equipmentBucket: 'gym_leaning',
    })
    expect(setPersonProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        onboarding_complete: true,
        training_level: 'intermediate',
        weekly_sessions: 3,
        equipment_bucket: 'gym_leaning',
      }),
    )
  })

  it('equipmentBucketFromProfile', () => {
    expect(equipmentBucketFromProfile(['barbell'])).toBe('gym_leaning')
    expect(equipmentBucketFromProfile([])).toBe('bw_leaning')
    expect(equipmentBucketFromProfile(null)).toBe('unknown')
  })
})
