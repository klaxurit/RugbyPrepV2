import { useCallback, useEffect, useState } from 'react'
import type { UserProfile, ClubSchedule, SCSchedule, TrainingLevel, SeasonMode, RehabInjury } from '../types/training'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'

const STORAGE_KEY = 'rugbyprep.profile.v1'

export const DEFAULT_PROFILE: UserProfile = {
  level: 'intermediate',
  trainingLevel: 'builder',
  weeklySessions: 2,
  equipment: ['dumbbell', 'band', 'bench', 'pullup_bar'],
  injuries: [],
  position: 'BACK_ROW',
  rugbyPosition: 'BACK_ROW'
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

// ─── LocalStorage helpers ─────────────────────────────────────

const saveToStorage = (profile: UserProfile) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch { /* ignore */ }
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
  rehab_injury: unknown | null
}

const rowToProfile = (row: ProfileRow): UserProfile => ({
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
  rehabInjury: (row.rehab_injury as RehabInjury | null) ?? undefined,
})

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
  rehab_injury: profile.rehabInjury ?? null,
  updated_at: new Date().toISOString(),
})

// ─── Hook ────────────────────────────────────────────────────

export const useProfile = () => {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [profile, setProfileState] = useState<UserProfile>(DEFAULT_PROFILE)

  // Quand userId change : reset au DEFAULT puis charge depuis Supabase
  useEffect(() => {
    // Toujours repartir sur du propre (évite les données de l'ancien compte)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfileState(DEFAULT_PROFILE)
    saveToStorage(DEFAULT_PROFILE)

    if (!userId) return

    supabase
      .from('profiles')
      .select(
        'level, weekly_sessions, equipment, injuries, position, rugby_position, league_level, club_code, club_name, club_ligue, club_department_code, height_cm, weight_kg, onboarding_complete, club_schedule, sc_schedule, training_level, season_mode, rehab_injury'
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
        if ((data as ProfileRow).onboarding_complete) {
          localStorage.setItem(onboardingKey(userId), '1')
        }
      })
  }, [userId])

  // Persist Supabase + localStorage
  const persistProfile = useCallback(
    async (next: UserProfile, uid: string | null) => {
      saveToStorage(next)
      if (!uid) return
      await supabase
        .from('profiles')
        .upsert(profileToRow(next, uid), { onConflict: 'id' })
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
    (patch: Partial<UserProfile>) => {
      setProfileState((current) => {
        const next = { ...current, ...patch }
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
