import { describe, expect, it } from 'vitest'
import { normalizeLegacyProfile, rowToProfile } from './useProfile'

type ProfileRow = Parameters<typeof rowToProfile>[0]

const makeRow = (overrides: Partial<ProfileRow> = {}): ProfileRow => ({
  level: 'intermediate',
  weekly_sessions: 2,
  equipment: ['band'],
  injuries: [],
  position: null,
  rugby_position: null,
  league_level: null,
  club_code: null,
  club_name: null,
  club_ligue: null,
  club_department_code: null,
  height_cm: null,
  weight_kg: null,
  onboarding_complete: true,
  club_schedule: null,
  sc_schedule: null,
  training_level: 'builder',
  season_mode: null,
  performance_focus: null,
  rehab_injury: null,
  population_segment: null,
  age_band: null,
  parental_consent_health_data: null,
  adult_play_eligibility_approved: null,
  maturity_status: null,
  cycle_tracking_opt_in: null,
  cycle_symptom_score_today: null,
  prevention_sessions_week: null,
  weekly_load_context: null,
  health_consent_status: null,
  health_consent_granted_at: null,
  health_consent_revoked_at: null,
  health_consent_source: null,
  health_consent_audit_trail: null,
  health_data_retention_state: null,
  ...overrides,
})

describe('rowToProfile legacy normalization', () => {
  it('defaults legacy senior rows to adult + in_season instead of blocking them', () => {
    const profile = rowToProfile(makeRow({
      population_segment: 'female_senior',
      season_mode: null,
      age_band: null,
      parental_consent_health_data: null,
    }))

    expect(profile.seasonMode).toBe('in_season')
    expect(profile.ageBand).toBe('adult')
    expect(profile.parentalConsentHealthData).toBe(false)
  })

  it('defaults unknown legacy rows to adult + in_season to match historic product behavior', () => {
    const profile = rowToProfile(makeRow({
      population_segment: 'unknown',
      season_mode: null,
      age_band: null,
    }))

    expect(profile.seasonMode).toBe('in_season')
    expect(profile.ageBand).toBe('adult')
  })

  it('infers u18 from population segment when ageBand is missing', () => {
    const profile = rowToProfile(makeRow({
      population_segment: 'u18_female',
      age_band: null,
      parental_consent_health_data: true,
    }))

    expect(profile.ageBand).toBe('u18')
    expect(profile.parentalConsentHealthData).toBe(true)
  })

  it('preserves explicit off_season values when they exist in the row', () => {
    const profile = rowToProfile(makeRow({
      season_mode: 'off_season',
      age_band: 'adult',
    }))

    expect(profile.seasonMode).toBe('off_season')
    expect(profile.ageBand).toBe('adult')
  })
})

describe('normalizeLegacyProfile', () => {
  it('normalizes legacy localStorage profiles with missing guard fields', () => {
    const profile = normalizeLegacyProfile({
      level: 'intermediate',
      trainingLevel: 'builder',
      performanceFocus: 'balanced',
      weeklySessions: 2,
      equipment: ['band'],
      injuries: [],
      seasonMode: undefined,
      populationSegment: 'male_senior',
      ageBand: undefined,
      parentalConsentHealthData: undefined,
    })

    expect(profile.seasonMode).toBe('in_season')
    expect(profile.ageBand).toBe('adult')
    expect(profile.parentalConsentHealthData).toBe(false)
  })
})
