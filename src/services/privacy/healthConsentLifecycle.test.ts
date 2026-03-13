import { describe, expect, it } from 'vitest'
import type { UserProfile } from '../../types/training'
import { applyHealthConsentLifecycle } from './healthConsentLifecycle'

const BASE_PROFILE: UserProfile = {
  level: 'intermediate',
  trainingLevel: 'builder',
  weeklySessions: 2,
  equipment: ['none'],
  injuries: ['shoulder_pain'],
  populationSegment: 'u18_male',
  ageBand: 'u18',
}

describe('applyHealthConsentLifecycle', () => {
  it('marks granted consent and keeps retention active for U18', () => {
    const next = applyHealthConsentLifecycle({
      current: BASE_PROFILE,
      patch: { parentalConsentHealthData: true },
      source: 'onboarding',
      now: '2026-03-10T10:00:00.000Z',
    })

    expect(next.healthConsentStatus).toBe('granted')
    expect(next.healthConsentGrantedAt).toBe('2026-03-10T10:00:00.000Z')
    expect(next.healthDataRetentionState).toBe('active')
    expect(next.healthConsentAuditTrail?.at(-1)?.action).toBe('granted')
  })

  it('revokes consent and scrubs health-sensitive fields for U18', () => {
    const current: UserProfile = {
      ...BASE_PROFILE,
      parentalConsentHealthData: true,
      cycleTrackingOptIn: true,
      cycleSymptomScoreToday: 2,
      rehabInjury: {
        zone: 'lower',
        phase: 2,
        startDate: '2026-03-01',
        phaseStartDate: '2026-03-08',
      },
      weeklyLoadContext: {
        contactHighMinutesWeek: 10,
      },
      preventionSessionsWeek: 2,
    }

    const next = applyHealthConsentLifecycle({
      current,
      patch: { parentalConsentHealthData: false },
      source: 'profile',
      now: '2026-03-10T11:00:00.000Z',
    })

    expect(next.healthConsentStatus).toBe('revoked')
    expect(next.healthDataRetentionState).toBe('pending_purge')
    expect(next.injuries).toEqual([])
    expect(next.rehabInjury).toBeUndefined()
    expect(next.cycleTrackingOptIn).toBe(false)
    expect(next.weeklyLoadContext).toBeUndefined()
    expect(next.healthConsentAuditTrail?.at(-1)?.action).toBe('revoked')
  })

  it('marks consent as not required for adult profiles', () => {
    const next = applyHealthConsentLifecycle({
      current: {
        ...BASE_PROFILE,
        ageBand: 'adult',
        populationSegment: 'female_senior',
      },
      patch: {},
      source: 'system',
      now: '2026-03-10T12:00:00.000Z',
    })

    expect(next.parentalConsentHealthData).toBe(false)
    expect(next.healthConsentStatus).toBe('not_required')
    expect(next.healthDataRetentionState).toBe('active')
  })
})

