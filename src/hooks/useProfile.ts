import { useCallback, useEffect, useState } from 'react'
import type {
  UserProfile,
  ClubSchedule,
  SCSchedule,
  TrainingLevel,
  SeasonMode,
  AgeBand,
  PopulationSegment,
  RehabInjury,
  HealthConsentSource,
  PerformanceFocus,
} from '../types/training'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { applyHealthConsentLifecycle } from '../services/privacy/healthConsentLifecycle'

const STORAGE_KEY = 'rugbyprep.profile.v1'

export const DEFAULT_PROFILE: UserProfile = {
  level: 'intermediate',
  trainingLevel: 'builder',
  performanceFocus: 'balanced',
  weeklySessions: 2,
  equipment: ['dumbbell', 'band', 'bench', 'pullup_bar'],
  injuries: [],
  seasonMode: 'in_season',
  position: 'BACK_ROW',
  rugbyPosition: 'BACK_ROW',
  populationSegment: 'unknown',
  ageBand: 'adult',
  parentalConsentHealthData: false,
  adultPlayEligibilityApproved: false,
  maturityStatus: 'unknown',
  cycleTrackingOptIn: false,
  healthConsentStatus: 'not_required',
  healthDataRetentionState: 'active',
  healthConsentAuditTrail: [],
}

// ─── Onboarding (per-user) ────────────────────────────────────

export function onboardingKey(userId: string) {
  return `rugbyprep.onboarding.${userId}`
}

export function isOnboardingComplete(userId: string): boolean {
  return localStorage.getItem(onboardingKey(userId)) === '1'
}

export function markOnboardingComplete(userId: string) {
  localStorage.setItem(onboardingKey(userId), '1')
  // Persist to Supabase for multi-device support (fire and forget)
  void supabase
    .from('profiles')
    .upsert({ id: userId, onboarding_complete: true }, { onConflict: 'id' })
}

type OnboardingStatusRow = {
  onboarding_complete: boolean | null
  position: string | null
  rugby_position: string | null
  training_level: string | null
}

const inferCompletedOnboarding = (row: OnboardingStatusRow | null): boolean => {
  if (!row) return false
  if (row.onboarding_complete) return true

  // Legacy profiles predate server-side onboarding tracking. If the user has
  // already selected a rugby position and a training level, treat the profile
  // as onboarded and backfill the server flag.
  return Boolean((row.position ?? row.rugby_position) && row.training_level)
}

export async function resolveOnboardingComplete(userId: string): Promise<boolean> {
  if (isOnboardingComplete(userId)) return true

  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_complete, position, rugby_position, training_level')
    .eq('id', userId)
    .maybeSingle()

  if (error) return false

  const complete = inferCompletedOnboarding((data as OnboardingStatusRow | null) ?? null)
  if (complete) {
    localStorage.setItem(onboardingKey(userId), '1')

    if (!(data as OnboardingStatusRow | null)?.onboarding_complete) {
      void supabase
        .from('profiles')
        .upsert({ id: userId, onboarding_complete: true }, { onConflict: 'id' })
    }
  }

  return complete
}

export function useOnboardingStatus(userId: string | null) {
  const [resolved, setResolved] = useState<{
    userId: string | null
    status: 'complete' | 'incomplete'
  } | null>(null)

  useEffect(() => {
    if (!userId || isOnboardingComplete(userId)) return

    let cancelled = false

    void resolveOnboardingComplete(userId).then((complete) => {
      if (!cancelled) {
        setResolved({
          userId,
          status: complete ? 'complete' : 'incomplete',
        })
      }
    })

    return () => {
      cancelled = true
    }
  }, [userId])

  if (!userId) return 'incomplete'
  if (isOnboardingComplete(userId)) return 'complete'
  if (!resolved || resolved.userId !== userId) return 'loading'
  return resolved.status
}

// ─── LocalStorage helpers ─────────────────────────────────────

const saveToStorage = (profile: UserProfile) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch { /* ignore */ }
}

const inferNormalizedAgeBand = (
  ageBand: AgeBand | null | undefined,
  populationSegment: PopulationSegment | null | undefined
): AgeBand => {
  if (ageBand === 'adult' || ageBand === 'u18') return ageBand
  if (populationSegment === 'u18_female' || populationSegment === 'u18_male') return 'u18'
  if (populationSegment === 'female_senior' || populationSegment === 'male_senior') return 'adult'
  // Legacy profiles predate age segmentation. Default to the historic adult path
  // so existing senior users are not falsely blocked by the beta guard.
  return 'adult'
}

export const normalizeLegacyProfile = (profile: UserProfile): UserProfile => {
  const ageBand = inferNormalizedAgeBand(profile.ageBand, profile.populationSegment)

  return {
    ...profile,
    seasonMode:
      profile.seasonMode === 'in_season' ||
      profile.seasonMode === 'off_season' ||
      profile.seasonMode === 'pre_season'
        ? profile.seasonMode
        : 'in_season',
    ageBand,
    parentalConsentHealthData:
      profile.parentalConsentHealthData ?? (ageBand === 'adult' ? false : undefined),
  }
}

const loadFromStorage = (): UserProfile | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return normalizeLegacyProfile(JSON.parse(raw) as UserProfile)
  } catch {
    return null
  }
}

// ─── Row ↔ UserProfile mapping ────────────────────────────────

type ProfileRow = {
  level: string
  weekly_sessions: number
  equipment: string[]
  injuries: string[]
  position: string | null
  rugby_position: string | null
  league_level: string | null
  club_code: string | null
  club_name: string | null
  club_ligue: string | null
  club_department_code: string | null
  height_cm: number | null
  weight_kg: number | null
  onboarding_complete: boolean | null
  club_schedule: ClubSchedule | null
  sc_schedule: SCSchedule | null
  training_level: string | null
  season_mode: string | null
  performance_focus: UserProfile['performanceFocus'] | null
  rehab_injury: unknown | null
  population_segment: UserProfile['populationSegment'] | null
  age_band: UserProfile['ageBand'] | null
  parental_consent_health_data: boolean | null
  adult_play_eligibility_approved: boolean | null
  maturity_status: UserProfile['maturityStatus'] | null
  cycle_tracking_opt_in: boolean | null
  cycle_symptom_score_today: UserProfile['cycleSymptomScoreToday'] | null
  prevention_sessions_week: number | null
  weekly_load_context: UserProfile['weeklyLoadContext'] | null
  health_consent_status: UserProfile['healthConsentStatus'] | null
  health_consent_granted_at: string | null
  health_consent_revoked_at: string | null
  health_consent_source: UserProfile['healthConsentSource'] | null
  health_consent_audit_trail: UserProfile['healthConsentAuditTrail'] | null
  health_data_retention_state: UserProfile['healthDataRetentionState'] | null
}

export const rowToProfile = (row: ProfileRow): UserProfile => {
  return normalizeLegacyProfile({
    level: (row.level === 'beginner' ? 'beginner' : 'intermediate') as UserProfile['level'],
    weeklySessions: (row.weekly_sessions === 2 ? 2 : 3) as UserProfile['weeklySessions'],
    equipment: row.equipment as UserProfile['equipment'],
    injuries: row.injuries as UserProfile['injuries'],
    position: (row.position ?? undefined) as UserProfile['position'],
    rugbyPosition: (row.rugby_position ?? undefined) as UserProfile['rugbyPosition'],
    leagueLevel: row.league_level ?? undefined,
    clubCode: row.club_code ?? undefined,
    clubName: row.club_name ?? undefined,
    clubLigue: row.club_ligue ?? undefined,
    clubDepartmentCode: row.club_department_code ?? undefined,
    heightCm: row.height_cm ?? undefined,
    weightKg: row.weight_kg ?? undefined,
    clubSchedule: row.club_schedule ?? undefined,
    scSchedule: row.sc_schedule ?? undefined,
    trainingLevel: (row.training_level as TrainingLevel | null) ?? (
      row.level === 'beginner' ? 'starter' as TrainingLevel :
      row.level === 'intermediate' ? 'builder' as TrainingLevel :
      'starter' as TrainingLevel
    ),
    seasonMode: (row.season_mode as SeasonMode | null) ?? undefined,
    performanceFocus: (row.performance_focus as PerformanceFocus | null) ?? undefined,
    rehabInjury: (row.rehab_injury as RehabInjury | null) ?? undefined,
    populationSegment: (row.population_segment as PopulationSegment | null) ?? undefined,
    ageBand: row.age_band ?? undefined,
    parentalConsentHealthData: row.parental_consent_health_data ?? undefined,
    adultPlayEligibilityApproved: row.adult_play_eligibility_approved ?? undefined,
    maturityStatus: row.maturity_status ?? undefined,
    cycleTrackingOptIn: row.cycle_tracking_opt_in ?? undefined,
    cycleSymptomScoreToday: row.cycle_symptom_score_today ?? undefined,
    preventionSessionsWeek: row.prevention_sessions_week ?? undefined,
    weeklyLoadContext: row.weekly_load_context ?? undefined,
    healthConsentStatus: row.health_consent_status ?? undefined,
    healthConsentGrantedAt: row.health_consent_granted_at ?? undefined,
    healthConsentRevokedAt: row.health_consent_revoked_at ?? undefined,
    healthConsentSource: row.health_consent_source ?? undefined,
    healthConsentAuditTrail: row.health_consent_audit_trail ?? undefined,
    healthDataRetentionState: row.health_data_retention_state ?? undefined,
  })
}

const profileToRow = (profile: UserProfile, userId: string) => ({
  id: userId,
  level: profile.level,
  weekly_sessions: profile.weeklySessions,
  equipment: profile.equipment,
  injuries: profile.injuries,
  position: profile.position ?? null,
  rugby_position: profile.rugbyPosition ?? null,
  league_level: profile.leagueLevel ?? null,
  club_code: profile.clubCode ?? null,
  club_name: profile.clubName ?? null,
  club_ligue: profile.clubLigue ?? null,
  club_department_code: profile.clubDepartmentCode ?? null,
  height_cm: profile.heightCm ?? null,
  weight_kg: profile.weightKg ?? null,
  club_schedule: profile.clubSchedule ?? null,
  sc_schedule: profile.scSchedule ?? null,
  training_level: profile.trainingLevel ?? null,
  season_mode: profile.seasonMode ?? null,
  performance_focus: profile.performanceFocus ?? null,
  rehab_injury: profile.rehabInjury ?? null,
  population_segment: profile.populationSegment ?? null,
  age_band: profile.ageBand ?? null,
  parental_consent_health_data: profile.parentalConsentHealthData ?? null,
  adult_play_eligibility_approved: profile.adultPlayEligibilityApproved ?? null,
  maturity_status: profile.maturityStatus ?? null,
  cycle_tracking_opt_in: profile.cycleTrackingOptIn ?? null,
  cycle_symptom_score_today: profile.cycleSymptomScoreToday ?? null,
  prevention_sessions_week: profile.preventionSessionsWeek ?? null,
  weekly_load_context: profile.weeklyLoadContext ?? null,
  health_consent_status: profile.healthConsentStatus ?? null,
  health_consent_granted_at: profile.healthConsentGrantedAt ?? null,
  health_consent_revoked_at: profile.healthConsentRevokedAt ?? null,
  health_consent_source: profile.healthConsentSource ?? null,
  health_consent_audit_trail: profile.healthConsentAuditTrail ?? null,
  health_data_retention_state: profile.healthDataRetentionState ?? null,
  updated_at: new Date().toISOString(),
})

export interface UpdateProfileOptions {
  source?: HealthConsentSource
}

// ─── Hook ────────────────────────────────────────────────────

export const useProfile = () => {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  // Initialise depuis localStorage pour éviter le flash DEFAULT entre navigations
  const [profile, setProfileState] = useState<UserProfile>(() => loadFromStorage() ?? DEFAULT_PROFILE)

  // Quand userId change : charge depuis Supabase (source de vérité)
  // On ne wipe plus localStorage ici — le cache local reste valide entre navigations
  useEffect(() => {
    if (!userId) {
      // Pas connecté → reset propre
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfileState(DEFAULT_PROFILE)
      saveToStorage(DEFAULT_PROFILE)
      return
    }

    supabase
      .from('profiles')
      .select(
        'level, weekly_sessions, equipment, injuries, position, rugby_position, league_level, club_code, club_name, club_ligue, club_department_code, height_cm, weight_kg, onboarding_complete, club_schedule, sc_schedule, training_level, season_mode, performance_focus, rehab_injury, population_segment, age_band, parental_consent_health_data, adult_play_eligibility_approved, maturity_status, cycle_tracking_opt_in, cycle_symptom_score_today, prevention_sessions_week, weekly_load_context, health_consent_status, health_consent_granted_at, health_consent_revoked_at, health_consent_source, health_consent_audit_trail, health_data_retention_state'
      )
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          // Pas encore de profil → onboarding requis (clé absente = pas complété)
          return
        }
        const loaded = rowToProfile(data as ProfileRow)
        setProfileState(loaded)
        saveToStorage(loaded)
        // Profil Supabase trouvé avec onboarding complet → marquer localement
        if (inferCompletedOnboarding(data as unknown as OnboardingStatusRow)) {
          localStorage.setItem(onboardingKey(userId), '1')
        }
      })
  }, [userId])

  // Persist Supabase + localStorage
  const persistProfile = useCallback(
    async (next: UserProfile, uid: string | null) => {
      saveToStorage(next)
      if (!uid) return
      const { error } = await supabase
        .from('profiles')
        .upsert(profileToRow(next, uid), { onConflict: 'id' })
      if (error) {
        console.error('[useProfile] Supabase persist failed:', error.message)
      }
    },
    []
  )

  const setProfile = useCallback(
    (next: UserProfile) => {
      setProfileState(next)
      void persistProfile(next, userId)
    },
    [userId, persistProfile]
  )

  const updateProfile = useCallback(
    (patch: Partial<UserProfile>, options?: UpdateProfileOptions) => {
      setProfileState((current) => {
        const next = applyHealthConsentLifecycle({
          current,
          patch,
          source: options?.source ?? 'profile',
        })
        void persistProfile(next, userId)
        return next
      })
    },
    [userId, persistProfile]
  )

  const resetProfile = useCallback(() => {
    setProfile(DEFAULT_PROFILE)
  }, [setProfile])

  return { profile, setProfile, updateProfile, resetProfile }
}
