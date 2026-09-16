import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { resolveLevel, resolveLevelProgress } from '../services/gamification/levels'
import { weekStartISO } from '../services/gamification/weekStart'
import type {
  GamificationProfile,
  UnlockedBadge,
  WeeklyScore,
  WeeklyScoreBreakdown,
} from '../types/gamification'

/**
 * État de gamification de l'athlète courant.
 *
 * Le client **lit** uniquement : le score est calculé et écrit par l'Edge
 * Function `recompute-gamification`, qui relit les séances dans
 * `session_logs`. Aucune table de gamification n'a de policy d'écriture pour
 * un utilisateur authentifié, donc personne ne peut s'attribuer des points.
 */

const EMPTY_BREAKDOWN: WeeklyScoreBreakdown = {
  plannedSessions: 0,
  offPlanSessions: 0,
  prescribedRest: 0,
  fullPlanBonus: 0,
  deloadCompensation: 0,
  logQualityBonus: 0,
  streakBonus: 0,
}

export interface RecomputePayload {
  todayISO: string
  plannedSessionDates: string[]
  matchDates: string[]
  isDeloadWeek: boolean
  referenceSessionCount: number
}

export interface UseGamificationResult {
  profile: GamificationProfile | null
  currentWeek: WeeklyScore | null
  badges: UnlockedBadge[]
  levelProgress: ReturnType<typeof resolveLevelProgress>
  loading: boolean
  /** Déclenche un recalcul serveur puis rafraîchit l'état local. */
  recompute: (payload: RecomputePayload) => Promise<void>
  refresh: () => Promise<void>
}

interface GamificationProfileRow {
  total_xp: number
  level: string
  current_week_streak: number
  longest_week_streak: number
  freeze_used_at: string | null
  league_tier: string
}

interface WeeklyScoreRow {
  week_start: string
  points: number
  sessions_planned: number
  sessions_completed: number
  deload_respected: boolean
  acwr_capped: boolean
  breakdown: Partial<WeeklyScoreBreakdown> | null
}

export function useGamification(todayISO: string): UseGamificationResult {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [profile, setProfile] = useState<GamificationProfile | null>(null)
  const [currentWeek, setCurrentWeek] = useState<WeeklyScore | null>(null)
  const [badges, setBadges] = useState<UnlockedBadge[]>([])
  const [loading, setLoading] = useState(true)

  const weekStart = useMemo(() => weekStartISO(todayISO), [todayISO])

  const load = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      setCurrentWeek(null)
      setBadges([])
      setLoading(false)
      return
    }

    const [profileResult, scoreResult, badgesResult] = await Promise.all([
      supabase
        .from('user_gamification_profile')
        .select(
          'total_xp, level, current_week_streak, longest_week_streak, freeze_used_at, league_tier',
        )
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('gamification_weekly_scores')
        .select(
          'week_start, points, sessions_planned, sessions_completed, deload_respected, acwr_capped, breakdown',
        )
        .eq('user_id', userId)
        .eq('week_start', weekStart)
        .maybeSingle(),
      supabase
        .from('gamification_badges')
        .select('badge_id, unlocked_at')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: true }),
    ])

    if (profileResult.error) {
      console.warn('[useGamification] profil:', profileResult.error.message)
    }
    if (scoreResult.error) {
      console.warn('[useGamification] score:', scoreResult.error.message)
    }

    const profileRow = profileResult.data as GamificationProfileRow | null
    // `social_visibility` vit sur `profiles` (consentement), pas ici : le hook
    // de profil reste la source unique de cette valeur.
    setProfile(
      profileRow
        ? {
            totalXp: profileRow.total_xp,
            level: resolveLevel(profileRow.total_xp),
            currentWeekStreak: profileRow.current_week_streak,
            longestWeekStreak: profileRow.longest_week_streak,
            freezeUsedAt: profileRow.freeze_used_at,
            leagueTier: profileRow.league_tier as GamificationProfile['leagueTier'],
            socialVisibility: 'private',
          }
        : null,
    )

    const scoreRow = scoreResult.data as WeeklyScoreRow | null
    setCurrentWeek(
      scoreRow
        ? {
            weekStartISO: scoreRow.week_start,
            points: scoreRow.points,
            sessionsPlanned: scoreRow.sessions_planned,
            sessionsCompleted: scoreRow.sessions_completed,
            deloadRespected: scoreRow.deload_respected,
            acwrCapped: scoreRow.acwr_capped,
            breakdown: { ...EMPTY_BREAKDOWN, ...(scoreRow.breakdown ?? {}) },
          }
        : null,
    )

    setBadges(
      (badgesResult.data ?? []).map((row) => ({
        badgeId: row.badge_id as string,
        unlockedAt: row.unlocked_at as string,
      })),
    )
    setLoading(false)
  }, [userId, weekStart])

  useEffect(() => {
    void load()
  }, [load])

  const recompute = useCallback(
    async (payload: RecomputePayload) => {
      if (!userId) return
      const { error } = await supabase.functions.invoke('recompute-gamification', {
        body: payload,
      })
      if (error) {
        console.warn('[useGamification] recompute:', error.message)
        return
      }
      await load()
    },
    [userId, load],
  )

  const levelProgress = useMemo(
    () => resolveLevelProgress(profile?.totalXp ?? 0),
    [profile?.totalXp],
  )

  return { profile, currentWeek, badges, levelProgress, loading, recompute, refresh: load }
}
