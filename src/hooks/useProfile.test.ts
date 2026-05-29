import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PROFILE,
  normalizeLegacyProfile,
  profileToRow,
  rowToProfile,
  shouldApplyRemoteProfile,
  isProfileRowMissingError,
} from './useProfile'

type ProfileRow = Parameters<typeof rowToProfile>[0]

const makeRow = (overrides: Partial<ProfileRow> = {}): ProfileRow => ({
  avatar_url: null,
  avatar_path: null,
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
  level_modifier_profile: null,
  season_mode: null,
  training_baseline: null,
  training_baseline_set_at: null,
  performance_focus: null,
  preferred_language: null,
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
  ffr_competition_id: null,
  ffr_competition_name: null,
  ffr_last_sync_at: null,
  planning_anchors: null,
  season_transition_state: null,
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

  it('prefers the visible label from levelModifierProfile when present', () => {
    const profile = rowToProfile(makeRow({
      training_level: 'starter',
      level_modifier_profile: {
        schemaVersion: 'v1',
        visibleLabel: 'performance',
        axes: {
          exerciseComplexity: { average: 2.5, state: 'performance', source: 'onboarding' },
          volumeTolerance: { average: 2.5, state: 'performance', source: 'onboarding' },
          explosiveReadiness: { average: 2.5, state: 'performance', source: 'onboarding' },
          intensityTolerance: { average: 2.5, state: 'performance', source: 'derived' },
          optionalBlockTolerance: { average: 2.5, state: 'performance', source: 'derived' },
        },
        safetyCaps: [],
        source: 'onboarding_only',
        scoredAt: '2026-03-21T09:00:00.000Z',
      },
    }))

    expect(profile.trainingLevel).toBe('performance')
    expect(profile.levelModifierProfile?.visibleLabel).toBe('performance')
  })
})

describe('seasonTransitionState persistence', () => {
  it('reads seasonTransitionState from row', () => {
    const state = {
      transitionJournal: [],
      activeDeferral: {
        eventId: 'match-1',
        matchDateAtDefer: '2026-09-12',
        deferredAt: '2026-06-01',
        expiresAt: '2026-07-18',
      },
    }
    const profile = rowToProfile(makeRow({ season_transition_state: state }))
    expect(profile.seasonTransitionState).toEqual(state)
    expect(profile.seasonTransitionState?.activeDeferral?.eventId).toBe('match-1')
  })

  it('reads seasonEndedSource from planningAnchors', () => {
    const profile = rowToProfile(makeRow({
      planning_anchors: { seasonEndedAt: '2026-04-06', seasonEndedSource: 'derived' },
    }))
    expect(profile.planningAnchors?.seasonEndedSource).toBe('derived')
  })

  it('tolerates missing season_transition_state (legacy compat)', () => {
    const profile = rowToProfile(makeRow({ season_transition_state: null }))
    expect(profile.seasonTransitionState).toBeUndefined()
  })
})

describe('shouldApplyRemoteProfile', () => {
  it('applies remote row only when no local edit happened since load', () => {
    expect(shouldApplyRemoteProfile(0)).toBe(true)
    expect(shouldApplyRemoteProfile(1)).toBe(false)
    expect(shouldApplyRemoteProfile(3)).toBe(false)
  })
})

describe('isProfileRowMissingError', () => {
  it('detects PostgREST no-row error for new accounts', () => {
    expect(isProfileRowMissingError({ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' })).toBe(true)
    expect(isProfileRowMissingError({ code: '42501', message: 'permission denied' })).toBe(false)
  })
})

describe('profileToRow defaults vs user data', () => {
  it('DEFAULT_PROFILE maps to weekly_sessions 2 and null morpho', () => {
    const row = profileToRow(DEFAULT_PROFILE, 'user-1')
    expect(row.weekly_sessions).toBe(2)
    expect(row.height_cm).toBeNull()
    expect(row.weight_kg).toBeNull()
    expect(row.season_mode).toBe('in_season')
  })
})

describe('rowToProfile schedule + baseline persistence', () => {
  it('round-trips club schedule, sc schedule, and training baseline from row', () => {
    const clubSchedule = { clubDays: [{ day: 2 as const }, { day: 4 as const }], matchDay: 6 as const }
    const scSchedule = {
      source: 'auto' as const,
      sessions: [
        { sessionIndex: 0 as const, day: 1 as const },
        { sessionIndex: 1 as const, day: 3 as const },
      ],
    }
    const profile = rowToProfile(makeRow({
      club_schedule: clubSchedule,
      sc_schedule: scSchedule,
      training_baseline: 'active',
      training_baseline_set_at: '2026-05-01T10:00:00.000Z',
    }))

    expect(profile.clubSchedule).toEqual(clubSchedule)
    expect(profile.scSchedule).toEqual(scSchedule)
    expect(profile.trainingBaseline).toBe('active')
    expect(profile.trainingBaselineSetAt).toBe('2026-05-01T10:00:00.000Z')
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
