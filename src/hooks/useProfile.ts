import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  UserProfile,
  ClubSchedule,
  SCSchedule,
  TrainingLevel,
  SeasonMode,
  TrainingBaseline,
  AgeBand,
  PopulationSegment,
  HealthConsentSource,
  PerformanceFocus,
  LevelModifierProfileV1,
} from '../types/training'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { applyHealthConsentLifecycle } from '../services/privacy/healthConsentLifecycle'
import { readUserScoped, writeUserScoped } from '../services/storage/userScopedStorage'

const STORAGE_BASE = 'rugbyprep.profile'

export const DEFAULT_PROFILE: UserProfile = {
  avatarUrl: undefined,
  avatarPath: undefined,
  level: 'intermediate',
  trainingLevel: 'builder',
  performanceFocus: 'balanced',
  preferredLanguage: 'fr',
  weeklySessions: 2,
  equipment: ['barbell', 'dumbbell', 'bench', 'pullup_bar', 'band', 'box'],
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
  level_modifier_profile?: Pick<LevelModifierProfileV1, 'visibleLabel'> | null
}

const inferCompletedOnboarding = (row: OnboardingStatusRow | null): boolean => {
  if (!row) return false
  if (row.onboarding_complete) return true

  // Legacy profiles predate server-side onboarding tracking. If the user has
  // already selected a rugby position and a training level, treat the profile
  // as onboarded and backfill the server flag.
  return Boolean(
    (row.position ?? row.rugby_position) &&
    (row.training_level ?? row.level_modifier_profile?.visibleLabel)
  )
}

export async function resolveOnboardingComplete(userId: string): Promise<boolean> {
  if (isOnboardingComplete(userId)) return true

  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_complete, position, rugby_position, training_level, level_modifier_profile')
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

// ─── LocalStorage helpers (user-scoped) ───────────────────────

const saveToStorage = (profile: UserProfile, userId: string | null) => {
  writeUserScoped(STORAGE_BASE, userId, profile)
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
  const trainingLevel = profile.levelModifierProfile?.visibleLabel ?? profile.trainingLevel

  return {
    ...profile,
    trainingLevel,
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

const loadFromStorage = (userId: string | null): UserProfile | null => {
  const parsed = readUserScoped<UserProfile>(STORAGE_BASE, userId)
  if (!parsed) return null
  return normalizeLegacyProfile(parsed)
}

// ─── Row ↔ UserProfile mapping ────────────────────────────────

type ProfileRow = {
  avatar_url: string | null
  avatar_path: string | null
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
  level_modifier_profile: LevelModifierProfileV1 | null
  season_mode: string | null
  training_baseline: string | null
  training_baseline_set_at: string | null
  performance_focus: UserProfile['performanceFocus'] | null
  preferred_language: string | null
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
  ffr_competition_id: string | null
  ffr_competition_name: string | null
  ffr_last_sync_at: string | null
  planning_anchors: unknown | null
  season_transition_state: unknown | null
}

export const rowToProfile = (row: ProfileRow): UserProfile => {
  const levelModifierProfile = row.level_modifier_profile ?? undefined
  const modifierVisibleLabel = levelModifierProfile?.visibleLabel
  const normalizedTrainingLevel = (
    modifierVisibleLabel === 'starter' ||
    modifierVisibleLabel === 'builder' ||
    modifierVisibleLabel === 'performance'
  )
    ? modifierVisibleLabel
    : (row.training_level as TrainingLevel | null) ?? (
      row.level === 'beginner' ? 'starter' as TrainingLevel :
      row.level === 'intermediate' ? 'builder' as TrainingLevel :
      'starter' as TrainingLevel
    )

  return normalizeLegacyProfile({
    avatarUrl: row.avatar_url ?? undefined,
    avatarPath: row.avatar_path ?? undefined,
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
    trainingLevel: normalizedTrainingLevel,
    levelModifierProfile,
    seasonMode: (row.season_mode as SeasonMode | null) ?? undefined,
    trainingBaseline: (row.training_baseline as TrainingBaseline | null) ?? undefined,
    trainingBaselineSetAt: row.training_baseline_set_at ?? null,
    performanceFocus: (row.performance_focus as PerformanceFocus | null) ?? undefined,
    preferredLanguage: (row.preferred_language as 'fr' | 'en' | null) ?? 'fr',
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
    ffrCompetitionId: row.ffr_competition_id ?? undefined,
    ffrCompetitionName: row.ffr_competition_name ?? undefined,
    ffrLastSyncAt: row.ffr_last_sync_at ?? undefined,
    planningAnchors: normalizePlanningAnchors(row.planning_anchors as UserProfile['planningAnchors']),
    seasonTransitionState: (row.season_transition_state as UserProfile['seasonTransitionState']) ?? undefined,
  })
}

export const profileToRow = (profile: UserProfile, userId: string) => ({
  id: userId,
  avatar_url: profile.avatarUrl ?? null,
  avatar_path: profile.avatarPath ?? null,
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
  training_level: profile.levelModifierProfile?.visibleLabel ?? profile.trainingLevel ?? null,
  level_modifier_profile: profile.levelModifierProfile ?? null,
  season_mode: profile.seasonMode ?? null,
  training_baseline: profile.trainingBaseline ?? null,
  training_baseline_set_at: profile.trainingBaselineSetAt ?? null,
  performance_focus: profile.performanceFocus ?? null,
  preferred_language: profile.preferredLanguage ?? 'fr',
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
  ffr_competition_id: profile.ffrCompetitionId ?? null,
  ffr_competition_name: profile.ffrCompetitionName ?? null,
  ffr_last_sync_at: profile.ffrLastSyncAt ?? null,
  planning_anchors: profile.planningAnchors ?? null,
  season_transition_state: profile.seasonTransitionState ?? null,
  updated_at: new Date().toISOString(),
})

export interface UpdateProfileOptions {
  source?: HealthConsentSource
}

// ─── Hook ────────────────────────────────────────────────────

/** Évite qu'un fetch Supabase lent n'écrase des edits locaux plus récents (état + localStorage). */
export const shouldApplyRemoteProfile = (localEditsSinceLoad: number): boolean =>
  localEditsSinceLoad === 0

/** PostgREST `.single()` when the profiles row does not exist yet. */
export const isProfileRowMissingError = (error: { code?: string; message?: string } | null): boolean =>
  error?.code === 'PGRST116'

/**
 * Ancres legacy sans `seasonEndedSource` : traiter comme décision manuelle pour
 * éviter qu'un match FFR ne réinitialise l'inter-saison.
 */
export function normalizePlanningAnchors(
  raw: UserProfile['planningAnchors'] | null | undefined,
): UserProfile['planningAnchors'] {
  if (!raw) return undefined
  if (raw.seasonEndedAt && !raw.seasonEndedSource) {
    return { ...raw, seasonEndedSource: 'manual' }
  }
  return raw
}

function applyPendingProfilePatches(
  base: UserProfile,
  patches: Partial<UserProfile>[],
): UserProfile {
  let acc = base
  for (const patch of patches) {
    acc = applyHealthConsentLifecycle({
      current: acc,
      patch,
      source: 'profile',
    })
  }
  return acc
}

export const useProfileSource = () => {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  // Initialise depuis le cache user-scoped pour éviter le flash DEFAULT entre
  // navigations de la même session utilisateur. Aucune fuite possible entre
  // comptes : la clé inclut `userId`, donc un nouvel utilisateur voit DEFAULT_PROFILE.
  const [profile, setProfileState] = useState<UserProfile>(() => loadFromStorage(userId) ?? DEFAULT_PROFILE)
  const profileRef = useRef(profile)
  const isHydratedRef = useRef(!userId)
  const localEditsSinceLoadRef = useRef(0)
  const preHydrationPatchesRef = useRef<Partial<UserProfile>[]>([])

  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  // Persist Supabase + localStorage
  const persistProfile = useCallback(
    async (next: UserProfile, uid: string | null) => {
      // Never persist before remote row loaded — DEFAULT_PROFILE + sync FFR would clobber Supabase.
      if (!uid || !isHydratedRef.current) return
      saveToStorage(next, uid)
      const { error } = await supabase
        .from('profiles')
        .upsert(profileToRow(next, uid), { onConflict: 'id' })
      if (error) {
        console.error('[useProfile] Supabase persist failed:', error.message)
      }
    },
    []
  )

  const persistProfileRef = useRef(persistProfile)
  useEffect(() => {
    persistProfileRef.current = persistProfile
  }, [persistProfile])

  // Quand userId change : recharge depuis le cache user-scoped ou le défaut,
  // puis Supabase écrase avec la source de vérité (sauf si l'utilisateur a déjà modifié).
  useEffect(() => {
    localEditsSinceLoadRef.current = 0
    preHydrationPatchesRef.current = []
    isHydratedRef.current = !userId
    // eslint-disable-next-line react-hooks/set-state-in-effect -- required: userId change must reset cache
    setProfileState(loadFromStorage(userId) ?? DEFAULT_PROFILE)
    if (!userId) return

    let cancelled = false

    supabase
      .from('profiles')
      .select(
        'avatar_url, avatar_path, level, weekly_sessions, equipment, injuries, position, rugby_position, league_level, club_code, club_name, club_ligue, club_department_code, height_cm, weight_kg, onboarding_complete, club_schedule, sc_schedule, training_level, level_modifier_profile, season_mode, training_baseline, training_baseline_set_at, performance_focus, preferred_language, rehab_injury, population_segment, age_band, parental_consent_health_data, adult_play_eligibility_approved, maturity_status, cycle_tracking_opt_in, cycle_symptom_score_today, prevention_sessions_week, weekly_load_context, health_consent_status, health_consent_granted_at, health_consent_revoked_at, health_consent_source, health_consent_audit_trail, health_data_retention_state, ffr_competition_id, ffr_competition_name, ffr_last_sync_at, planning_anchors, season_transition_state'
      )
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return

        if (error) {
          if (isProfileRowMissingError(error)) {
            isHydratedRef.current = true
          } else {
            console.error('[useProfile] Supabase fetch failed:', error.message)
          }
          return
        }

        isHydratedRef.current = true

        const pendingPatches = preHydrationPatchesRef.current
        preHydrationPatchesRef.current = []

        if (!shouldApplyRemoteProfile(localEditsSinceLoadRef.current)) {
          const pending = applyPendingProfilePatches(
            loadFromStorage(userId) ?? profileRef.current,
            pendingPatches,
          )
          void persistProfileRef.current(pending, userId)
          return
        }

        const loaded = applyPendingProfilePatches(rowToProfile(data as ProfileRow), pendingPatches)
        localEditsSinceLoadRef.current = 0
        setProfileState(loaded)
        saveToStorage(loaded, userId)
        void persistProfileRef.current(loaded, userId)
        // Profil Supabase trouvé avec onboarding complet → marquer localement
        if (inferCompletedOnboarding(data as unknown as OnboardingStatusRow)) {
          localStorage.setItem(onboardingKey(userId), '1')
        }
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const setProfile = useCallback(
    (next: UserProfile) => {
      if (isHydratedRef.current) {
        localEditsSinceLoadRef.current += 1
        setProfileState(next)
        void persistProfile(next, userId)
      } else {
        setProfileState(next)
      }
    },
    [userId, persistProfile]
  )

  const updateProfile = useCallback(
    (patch: Partial<UserProfile>, options?: UpdateProfileOptions) => {
      setProfileState((current) => {
        // Auto-set trainingBaselineSetAt quand le baseline change (sauf override explicite).
        // Sert à expirer auto le mode 'restart' après 14j (rampe de reprise).
        const baselineChanged =
          'trainingBaseline' in patch &&
          patch.trainingBaseline !== current.trainingBaseline
        const stampedPatch =
          baselineChanged && !('trainingBaselineSetAt' in patch)
            ? { ...patch, trainingBaselineSetAt: new Date().toISOString() }
            : patch
        const next = applyHealthConsentLifecycle({
          current,
          patch: stampedPatch,
          source: options?.source ?? 'profile',
        })
        if (isHydratedRef.current) {
          localEditsSinceLoadRef.current += 1
          void persistProfile(next, userId)
        } else {
          preHydrationPatchesRef.current.push(stampedPatch)
        }
        return next
      })
    },
    [userId, persistProfile]
  )

  const resetProfile = useCallback(() => {
    const confirmed = window.confirm(
      'Réinitialiser ton profil ? Toutes tes préférences (séances, morphologie, saison…) seront remises par défaut.',
    )
    if (!confirmed) return
    setProfile(DEFAULT_PROFILE)
  }, [setProfile])

  return { profile, setProfile, updateProfile, resetProfile }
}

export { useProfile } from '../contexts/profileContextValue'
