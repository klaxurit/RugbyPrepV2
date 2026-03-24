import { describe, expect, it } from 'vitest'
import { getGlobalProgramHardBlock } from '../hasGlobalProgramHardBlock'
import type { UserProfile } from '../../../types/training'

const BASE_PROFILE: UserProfile = {
  level: 'intermediate',
  equipment: ['barbell', 'dumbbell', 'bench'],
  injuries: [],
  weeklySessions: 3,
  seasonMode: 'in_season',
  ageBand: 'adult',
  rugbyPosition: 'BACK_THREE',
  position: 'BACK_THREE',
  trainingLevel: 'performance',
  performanceFocus: 'balanced',
  populationSegment: 'male_senior',
  parentalConsentHealthData: false,
  healthConsentStatus: 'not_required',
  healthDataRetentionState: 'active',
  healthConsentAuditTrail: [],
} as UserProfile

describe('getGlobalProgramHardBlock', () => {
  it('profil nominal → pas de hard-block', () => {
    const result = getGlobalProgramHardBlock(BASE_PROFILE)
    expect(result.hasHardBlock).toBe(false)
    expect(result.hardBlockReasons).toEqual([])
  })

  it('U18 sans consentement → hard-block U18_NO_CONSENT', () => {
    const result = getGlobalProgramHardBlock({
      ...BASE_PROFILE,
      ageBand: 'u18',
      parentalConsentHealthData: false,
    })
    expect(result.hasHardBlock).toBe(true)
    expect(result.hardBlockReasons).toContain('U18_NO_CONSENT')
  })

  it('U18 avec consentement → pas de hard-block', () => {
    const result = getGlobalProgramHardBlock({
      ...BASE_PROFILE,
      ageBand: 'u18',
      parentalConsentHealthData: true,
    })
    expect(result.hasHardBlock).toBe(false)
  })

  it('rehab active → pas de hard-block (fallback mother-session)', () => {
    const result = getGlobalProgramHardBlock({
      ...BASE_PROFILE,
      rehabInjury: { zone: 'lower', phase: 1, startDate: '2025-01-01', phaseStartDate: '2025-01-01' },
    })
    expect(result.hasHardBlock).toBe(false)
  })

  it('off_season → pas de hard-block (orchestrateur gère)', () => {
    const result = getGlobalProgramHardBlock({
      ...BASE_PROFILE,
      seasonMode: 'off_season',
    })
    expect(result.hasHardBlock).toBe(false)
  })

  it('shoulder_pain → pas de hard-block', () => {
    const result = getGlobalProgramHardBlock({
      ...BASE_PROFILE,
      injuries: ['shoulder_pain'],
    })
    expect(result.hasHardBlock).toBe(false)
  })

  it('multi-injuries → pas de hard-block', () => {
    const result = getGlobalProgramHardBlock({
      ...BASE_PROFILE,
      injuries: ['knee_pain', 'lower_back_pain'],
    })
    expect(result.hasHardBlock).toBe(false)
  })
})
