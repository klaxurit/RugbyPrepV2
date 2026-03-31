import { describe, it, expect } from 'vitest'
import { checkBetaEligibility, BETA_ELIGIBILITY_MESSAGES } from './betaEligibility'
import { createProfile, LIMITED_GYM, FULL_GYM, BW_ONLY } from './program/testHelpers'
import type { RehabInjury } from '../types/training'

const REHAB_UPPER: RehabInjury = {
  zone: 'upper',
  phase: 1,
  startDate: '2026-03-01',
  phaseStartDate: '2026-03-01',
}

const REHAB_LOWER: RehabInjury = {
  zone: 'lower',
  phase: 1,
  startDate: '2026-03-01',
  phaseStartDate: '2026-03-01',
}

describe('checkBetaEligibility', () => {
  // ── Profil éligible nominal ──────────────────────────────────────────────────

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

  it('retourne isEligible=true pour senior F in_season sans blessure', () => {
    const profile = createProfile({
      injuries: [],
      equipment: FULL_GYM,
      seasonMode: 'in_season',
      ageBand: 'adult',
      populationSegment: 'female_senior',
    })
    expect(checkBetaEligibility(profile).isEligible).toBe(true)
  })

  it('isEligible si BW_ONLY sans blessure — equipment vide n\'implique pas d\'exclusion', () => {
    const profile = createProfile({
      injuries: [],
      equipment: BW_ONLY,
      seasonMode: 'in_season',
      ageBand: 'adult',
    })
    expect(checkBetaEligibility(profile).isEligible).toBe(true)
  })

  it('retourne isEligible=true pour un profil LIMITED_GYM sans blessure', () => {
    const profile = createProfile({
      injuries: [],
      equipment: LIMITED_GYM,
      seasonMode: 'in_season',
      ageBand: 'adult',
    })
    expect(checkBetaEligibility(profile).isEligible).toBe(true)
  })

  // ── Zones sensibles ne bloquent plus l'accès ──────────────────────────────

  it('injuries do not block eligibility — exercises adapted instead', () => {
    const profile = createProfile({
      injuries: ['shoulder_pain', 'knee_pain', 'low_back_pain'],
      equipment: FULL_GYM,
      ageBand: 'adult',
    })
    const result = checkBetaEligibility(profile)
    expect(result.isEligible).toBe(true)
    expect(result.reasons).not.toContain('SHOULDER_PAIN')
    expect(result.reasons).not.toContain('SHOULDER_PAIN_LIMITED_GYM')
    expect(result.reasons).not.toContain('MULTI_INJURIES')
  })

  // ── OFF_SEASON ────────────────────────────────────────────────────────────────

  it('OFF_SEASON_NOT_SUPPORTED si seasonMode undefined — règle conservative (cohérente avec ageBand)', () => {
    const profile = createProfile({
      seasonMode: undefined,
      injuries: [],
      equipment: FULL_GYM,
      ageBand: 'adult',
    })
    const result = checkBetaEligibility(profile)
    expect(result.isEligible).toBe(false)
    expect(result.reasons).toContain('OFF_SEASON_NOT_SUPPORTED')
  })

  it('OFF_SEASON_NOT_SUPPORTED si seasonMode off_season', () => {
    const profile = createProfile({
      seasonMode: 'off_season',
      injuries: [],
      equipment: FULL_GYM,
      ageBand: 'adult',
    })
    const result = checkBetaEligibility(profile)
    expect(result.isEligible).toBe(false)
    expect(result.reasons).toContain('OFF_SEASON_NOT_SUPPORTED')
  })

  it('OFF_SEASON_NOT_SUPPORTED si seasonMode pre_season', () => {
    const profile = createProfile({
      seasonMode: 'pre_season',
      injuries: [],
      equipment: FULL_GYM,
      ageBand: 'adult',
    })
    expect(checkBetaEligibility(profile).reasons).toContain('OFF_SEASON_NOT_SUPPORTED')
  })

  it('isEligible si seasonMode in_season', () => {
    const profile = createProfile({
      seasonMode: 'in_season',
      injuries: [],
      equipment: FULL_GYM,
      ageBand: 'adult',
    })
    expect(checkBetaEligibility(profile).isEligible).toBe(true)
  })

  // ── U18 / ageBand ─────────────────────────────────────────────────────────────

  it('U18_NO_CONSENT si ageBand u18 sans consentement (false)', () => {
    const profile = createProfile({
      ageBand: 'u18',
      parentalConsentHealthData: false,
      injuries: [],
      equipment: FULL_GYM,
      seasonMode: 'in_season',
    })
    const result = checkBetaEligibility(profile)
    expect(result.isEligible).toBe(false)
    expect(result.reasons).toContain('U18_NO_CONSENT')
  })

  it('U18_NO_CONSENT si ageBand undefined — règle conservative', () => {
    const profile = createProfile({
      ageBand: undefined,
      parentalConsentHealthData: undefined,
      injuries: [],
      equipment: FULL_GYM,
      seasonMode: 'in_season',
    })
    const result = checkBetaEligibility(profile)
    expect(result.isEligible).toBe(false)
    expect(result.reasons).toContain('U18_NO_CONSENT')
  })

  it('U18_NO_CONSENT si parentalConsentHealthData undefined (pas false, juste absent)', () => {
    const profile = createProfile({
      ageBand: 'u18',
      parentalConsentHealthData: undefined,
      injuries: [],
      equipment: FULL_GYM,
    })
    const result = checkBetaEligibility(profile)
    expect(result.reasons).toContain('U18_NO_CONSENT')
  })

  it('isEligible si ageBand u18 avec consentement (true)', () => {
    const profile = createProfile({
      ageBand: 'u18',
      parentalConsentHealthData: true,
      injuries: [],
      equipment: FULL_GYM,
      seasonMode: 'in_season',
    })
    expect(checkBetaEligibility(profile).reasons).not.toContain('U18_NO_CONSENT')
  })

  it('isEligible si ageBand adult — consentement parental non requis', () => {
    const profile = createProfile({
      ageBand: 'adult',
      parentalConsentHealthData: false,
      injuries: [],
      equipment: FULL_GYM,
      seasonMode: 'in_season',
    })
    expect(checkBetaEligibility(profile).isEligible).toBe(true)
  })

  // ── Combinaisons ─────────────────────────────────────────────────────────────

  // rehab + off_season combo test removed — rehab feature disabled (V2)

  // SHOULDER_PAIN_LIMITED_GYM priority test removed — injury blocks disabled

  // ── BETA_PAUSED (kill switch) ───────────────────────────────────────────────

  it('BETA_PAUSED est un type valide avec message UX dédié', () => {
    expect(BETA_ELIGIBILITY_MESSAGES.BETA_PAUSED).toBeDefined()
    expect(BETA_ELIGIBILITY_MESSAGES.BETA_PAUSED.reason).toContain('indisponible')
    expect(BETA_ELIGIBILITY_MESSAGES.BETA_PAUSED.detail).toContain('maintenance')
  })
})
