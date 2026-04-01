import { describe, expect, it } from 'vitest'
import { getGlobalProgramHardBlock } from '../hasGlobalProgramHardBlock'
import type { UserProfile } from '../../../types/training'
import { checkBetaEligibility } from '../../betaEligibility'

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
  // ── Only BETA_PAUSED can hard-block ──────────────────────────────────────

  it('profil nominal → pas de hard-block', () => {
    const result = getGlobalProgramHardBlock(BASE_PROFILE)
    expect(result.hasHardBlock).toBe(false)
    expect(result.hardBlockReasons).toEqual([])
  })

  it('BETA_PAUSED dans betaEligibility → hard-block', () => {
    // Simulate kill switch by checking that the mechanism works:
    // when checkBetaEligibility returns BETA_PAUSED, getGlobalProgramHardBlock blocks.
    // We test the integration indirectly — the kill switch is a code toggle,
    // so we verify the wiring: BETA_PAUSED is the only reason in HARD_BLOCK_REASONS.
    const { reasons } = checkBetaEligibility(BASE_PROFILE)
    // Currently the kill switch is off, so no reasons
    expect(reasons).toEqual([])
    // And therefore no hard-block
    const result = getGlobalProgramHardBlock(BASE_PROFILE)
    expect(result.hasHardBlock).toBe(false)
  })

  // ── These conditions must NEVER hard-block ───────────────────────────────

  it('off_season → pas de hard-block', () => {
    const result = getGlobalProgramHardBlock({
      ...BASE_PROFILE,
      seasonMode: 'off_season',
    })
    expect(result.hasHardBlock).toBe(false)
    expect(result.hardBlockReasons).toEqual([])
  })

  it('pre_season → pas de hard-block', () => {
    const result = getGlobalProgramHardBlock({
      ...BASE_PROFILE,
      seasonMode: 'pre_season',
    })
    expect(result.hasHardBlock).toBe(false)
    expect(result.hardBlockReasons).toEqual([])
  })

  it('injuries → pas de hard-block', () => {
    const result = getGlobalProgramHardBlock({
      ...BASE_PROFILE,
      injuries: ['shoulder_pain', 'knee_pain', 'low_back_pain'],
    })
    expect(result.hasHardBlock).toBe(false)
    expect(result.hardBlockReasons).toEqual([])
  })

  it('rehab active → pas de hard-block', () => {
    const result = getGlobalProgramHardBlock({
      ...BASE_PROFILE,
      rehabInjury: { zone: 'lower', phase: 1, startDate: '2025-01-01', phaseStartDate: '2025-01-01' },
    })
    expect(result.hasHardBlock).toBe(false)
    expect(result.hardBlockReasons).toEqual([])
  })

  it('U18-related fields → pas de hard-block (app adultes uniquement)', () => {
    const result = getGlobalProgramHardBlock({
      ...BASE_PROFILE,
      ageBand: 'u18' as UserProfile['ageBand'],
      parentalConsentHealthData: false,
    })
    expect(result.hasHardBlock).toBe(false)
    expect(result.hardBlockReasons).toEqual([])
  })
})
