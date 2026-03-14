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

  // ── shoulder_pain ─────────────────────────────────────────────────────────────

  it('SHOULDER_PAIN si shoulder_pain + barbell disponible', () => {
    const profile = createProfile({ injuries: ['shoulder_pain'], equipment: FULL_GYM, ageBand: 'adult' })
    const result = checkBetaEligibility(profile)
    expect(result.isEligible).toBe(false)
    expect(result.primaryReason).toBe('SHOULDER_PAIN')
    expect(result.reasons).toEqual(['SHOULDER_PAIN'])
  })

  it('SHOULDER_PAIN_LIMITED_GYM si shoulder_pain + LIMITED_GYM (sans barbell)', () => {
    const profile = createProfile({ injuries: ['shoulder_pain'], equipment: LIMITED_GYM, ageBand: 'adult' })
    const result = checkBetaEligibility(profile)
    expect(result.isEligible).toBe(false)
    expect(result.primaryReason).toBe('SHOULDER_PAIN_LIMITED_GYM')
    expect(result.reasons).not.toContain('SHOULDER_PAIN')
  })

  it('SHOULDER_PAIN_LIMITED_GYM si shoulder_pain + BW_ONLY (equipment vide)', () => {
    const profile = createProfile({ injuries: ['shoulder_pain'], equipment: BW_ONLY, ageBand: 'adult' })
    const result = checkBetaEligibility(profile)
    expect(result.isEligible).toBe(false)
    expect(result.primaryReason).toBe('SHOULDER_PAIN_LIMITED_GYM')
    expect(result.reasons).not.toContain('SHOULDER_PAIN')
  })

  // ── REHAB_ACTIVE ──────────────────────────────────────────────────────────────

  it('REHAB_ACTIVE si rehabInjury défini (upper)', () => {
    const profile = createProfile({
      injuries: [],
      equipment: FULL_GYM,
      rehabInjury: REHAB_UPPER,
      ageBand: 'adult',
    })
    const result = checkBetaEligibility(profile)
    expect(result.isEligible).toBe(false)
    expect(result.primaryReason).toBe('REHAB_ACTIVE')
    expect(result.reasons).toContain('REHAB_ACTIVE')
  })

  it('REHAB_ACTIVE si rehabInjury défini (lower)', () => {
    const profile = createProfile({
      injuries: ['knee_pain'],
      equipment: FULL_GYM,
      rehabInjury: REHAB_LOWER,
      ageBand: 'adult',
    })
    const result = checkBetaEligibility(profile)
    expect(result.reasons).toContain('REHAB_ACTIVE')
  })

  // ── MULTI_INJURIES ────────────────────────────────────────────────────────────

  it('MULTI_INJURIES si 2 blessures non-shoulder', () => {
    const profile = createProfile({
      injuries: ['knee_pain', 'low_back_pain'],
      equipment: FULL_GYM,
      ageBand: 'adult',
    })
    const result = checkBetaEligibility(profile)
    expect(result.isEligible).toBe(false)
    expect(result.primaryReason).toBe('MULTI_INJURIES')
    expect(result.reasons).toContain('MULTI_INJURIES')
  })

  it('MULTI_INJURIES si 3 blessures dont shoulder_pain + 2 autres', () => {
    const profile = createProfile({
      injuries: ['shoulder_pain', 'knee_pain', 'low_back_pain'],
      equipment: FULL_GYM,
      ageBand: 'adult',
    })
    const result = checkBetaEligibility(profile)
    // shoulder_pain capturé comme SHOULDER_PAIN, + 2 non-shoulder → MULTI aussi
    expect(result.reasons).toContain('MULTI_INJURIES')
    expect(result.reasons).toContain('SHOULDER_PAIN')
  })

  it('pas MULTI_INJURIES si shoulder_pain + 1 seule autre blessure', () => {
    const profile = createProfile({
      injuries: ['shoulder_pain', 'knee_pain'],
      equipment: FULL_GYM,
      ageBand: 'adult',
    })
    const result = checkBetaEligibility(profile)
    // knee_pain seul (hors shoulder) = 1 < 2 → pas MULTI
    expect(result.reasons).not.toContain('MULTI_INJURIES')
    expect(result.reasons).toContain('SHOULDER_PAIN')
  })

  it('pas MULTI_INJURIES si 1 blessure seule', () => {
    const profile = createProfile({ injuries: ['knee_pain'], equipment: FULL_GYM, ageBand: 'adult' })
    const result = checkBetaEligibility(profile)
    expect(result.reasons).not.toContain('MULTI_INJURIES')
    expect(result.isEligible).toBe(true) // knee seul = éligible (surveillé mais pas exclu)
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

  it('multiple reasons si rehab + off_season : primaryReason = REHAB_ACTIVE', () => {
    const profile = createProfile({
      seasonMode: 'off_season',
      rehabInjury: REHAB_LOWER,
      injuries: [],
      equipment: FULL_GYM,
      ageBand: 'adult',
    })
    const result = checkBetaEligibility(profile)
    expect(result.reasons).toContain('REHAB_ACTIVE')
    expect(result.reasons).toContain('OFF_SEASON_NOT_SUPPORTED')
    expect(result.primaryReason).toBe('REHAB_ACTIVE') // REHAB avant OFF_SEASON dans l'ordre
  })

  it('SHOULDER_PAIN_LIMITED_GYM prioritaire sur SHOULDER_PAIN', () => {
    const profile = createProfile({
      injuries: ['shoulder_pain'],
      equipment: LIMITED_GYM, // pas de barbell
      ageBand: 'adult',
    })
    const result = checkBetaEligibility(profile)
    expect(result.primaryReason).toBe('SHOULDER_PAIN_LIMITED_GYM')
    expect(result.reasons).not.toContain('SHOULDER_PAIN')
  })

  // ── BETA_PAUSED (kill switch) ───────────────────────────────────────────────

  it('BETA_PAUSED est un type valide avec message UX dédié', () => {
    expect(BETA_ELIGIBILITY_MESSAGES.BETA_PAUSED).toBeDefined()
    expect(BETA_ELIGIBILITY_MESSAGES.BETA_PAUSED.reason).toContain('indisponible')
    expect(BETA_ELIGIBILITY_MESSAGES.BETA_PAUSED.detail).toContain('maintenance')
  })
})
