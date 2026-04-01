import { describe, it, expect } from 'vitest'
import { checkBetaEligibility, BETA_ELIGIBILITY_MESSAGES } from './betaEligibility'
import { createProfile, FULL_GYM, BW_ONLY } from './program/testHelpers'

describe('checkBetaEligibility', () => {
  // ── Profil éligible — tous les profils passent (moteur annuel) ──────────────

  it('retourne isEligible=true pour un profil standard adulte in_season', () => {
    const profile = createProfile({
      injuries: [],
      equipment: FULL_GYM,
      seasonMode: 'in_season',
      ageBand: 'adult',
    })
    const result = checkBetaEligibility(profile)
    expect(result.isEligible).toBe(true)
    expect(result.primaryReason).toBeNull()
    expect(result.reasons).toHaveLength(0)
  })

  it('isEligible pour off_season — moteur annuel gère tous les cycles', () => {
    const profile = createProfile({
      seasonMode: 'off_season',
      injuries: [],
      equipment: FULL_GYM,
      ageBand: 'adult',
    })
    expect(checkBetaEligibility(profile).isEligible).toBe(true)
  })

  it('isEligible pour pre_season', () => {
    const profile = createProfile({
      seasonMode: 'pre_season',
      injuries: [],
      equipment: FULL_GYM,
      ageBand: 'adult',
    })
    expect(checkBetaEligibility(profile).isEligible).toBe(true)
  })

  it('isEligible si BW_ONLY sans blessure', () => {
    const profile = createProfile({
      injuries: [],
      equipment: BW_ONLY,
      seasonMode: 'in_season',
      ageBand: 'adult',
    })
    expect(checkBetaEligibility(profile).isEligible).toBe(true)
  })

  it('injuries do not block eligibility — exercises adapted instead', () => {
    const profile = createProfile({
      injuries: ['shoulder_pain', 'knee_pain', 'low_back_pain'],
      equipment: FULL_GYM,
      ageBand: 'adult',
    })
    expect(checkBetaEligibility(profile).isEligible).toBe(true)
  })

  it('isEligible même si seasonMode undefined — moteur annuel gère le fallback', () => {
    const profile = createProfile({
      seasonMode: undefined,
      injuries: [],
      equipment: FULL_GYM,
      ageBand: 'adult',
    })
    expect(checkBetaEligibility(profile).isEligible).toBe(true)
  })

  // ── BETA_PAUSED (kill switch) ───────────────────────────────────────────────

  it('BETA_PAUSED est un type valide avec message UX dédié', () => {
    expect(BETA_ELIGIBILITY_MESSAGES.BETA_PAUSED).toBeDefined()
    expect(BETA_ELIGIBILITY_MESSAGES.BETA_PAUSED.reason).toContain('indisponible')
    expect(BETA_ELIGIBILITY_MESSAGES.BETA_PAUSED.detail).toContain('maintenance')
  })
})
