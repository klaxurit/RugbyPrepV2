import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { resolveLevel, resolveLevelProgress } from '../services/gamification/levels'
import { weekStartISO } from '../services/gamification/weekStart'
import { isCompetitionPauseActive } from '../services/gamification/competitionPause'
import type {
  CompetitionPauseKind,
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
  /** Pause compétition active aujourd'hui (après expiration calendaire). */
  competitionPauseActive: boolean
  loading: boolean
  /** Déclenche un recalcul serveur puis rafraîchit l'état local. */
  recompute: (payload: RecomputePayload) => Promise<void>
  refresh: () => Promise<void>
  /** Active ou lève la pause « Blessé » (RPC — pas de donnée médicale). */
  setCompetitionPause: (active: boolean) => Promise<boolean>
}

interface GamificationProfileRow {
  total_xp: number
  level: string
  current_week_streak: number
  longest_week_streak: number
  freeze_used_at: string | null
  league_tier: string
  competition_pause_kind: string | null
  competition_pause_started_on: string | null
  competition_pause_ends_on: string | null
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

interface GamificationSnapshot {
  profile: GamificationProfile | null
  currentWeek: WeeklyScore | null
  badges: UnlockedBadge[]
  loading: boolean
}

const EMPTY_SNAPSHOT: GamificationSnapshot = {
  profile: null,
  currentWeek: null,
  badges: [],
  loading: false,
}

/**
 * Fonction de module plutôt que closure du hook : l'instantané est construit
 * entièrement avant d'être posé en state, en un seul `setState`. Un enchaînement
 * de `setState` dans le corps d'un effet déclencherait des rendus en cascade.
 */
async function fetchSnapshot(
  userId: string | null,
  weekStart: string,
): Promise<GamificationSnapshot> {
  if (!userId) return EMPTY_SNAPSHOT

  const [profileResult, scoreResult, badgesResult] = await Promise.all([
    supabase
      .from('user_gamification_profile')
      .select(
        'total_xp, level, current_week_streak, longest_week_streak, freeze_used_at, league_tier, competition_pause_kind, competition_pause_started_on, competition_pause_ends_on',
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
  const scoreRow = scoreResult.data as WeeklyScoreRow | null

  return {
    // `social_visibility` vit sur `profiles` (consentement), pas ici : le hook
    // de profil reste la source unique de cette valeur.
    profile: profileRow
      ? {
          totalXp: profileRow.total_xp,
          level: resolveLevel(profileRow.total_xp),
          currentWeekStreak: profileRow.current_week_streak,
          longestWeekStreak: profileRow.longest_week_streak,
          freezeUsedAt: profileRow.freeze_used_at,
          leagueTier: profileRow.league_tier as GamificationProfile['leagueTier'],
          socialVisibility: 'private',
          competitionPauseKind:
            profileRow.competition_pause_kind === 'blesse'
              ? ('blesse' as CompetitionPauseKind)
              : null,
          competitionPauseStartedOn: profileRow.competition_pause_started_on,
          competitionPauseEndsOn: profileRow.competition_pause_ends_on,
        }
      : null,
    currentWeek: scoreRow
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
    badges: (badgesResult.data ?? []).map((row) => ({
      badgeId: row.badge_id as string,
      unlockedAt: row.unlocked_at as string,
    })),
    loading: false,
  }
}

export function useGamification(todayISO: string): UseGamificationResult {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [snapshot, setSnapshot] = useState<GamificationSnapshot>({
    ...EMPTY_SNAPSHOT,
    loading: true,
  })

  const weekStart = useMemo(() => weekStartISO(todayISO), [todayISO])

  const load = useCallback(async () => {
    setSnapshot(await fetchSnapshot(userId, weekStart))
  }, [userId, weekStart])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const next = await fetchSnapshot(userId, weekStart)
      if (cancelled) return
      setSnapshot(next)
    })()
    return () => {
      cancelled = true
    }
  }, [userId, weekStart])

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

  const setCompetitionPause = useCallback(
    async (active: boolean) => {
      if (!userId) return false
      const { error } = await supabase.rpc('set_competition_pause', {
        p_active: active,
      })
      if (error) {
        console.warn('[useGamification] set_competition_pause:', error.message)
        return false
      }
      await load()
      return true
    },
    [userId, load],
  )

  const levelProgress = useMemo(
    () => resolveLevelProgress(snapshot.profile?.totalXp ?? 0),
    [snapshot.profile?.totalXp],
  )

  const competitionPauseActive = useMemo(() => {
    const p = snapshot.profile
    if (!p) return false
    return isCompetitionPauseActive(
      {
        kind: p.competitionPauseKind,
        startedOn: p.competitionPauseStartedOn,
        endsOn: p.competitionPauseEndsOn,
      },
      todayISO,
    )
  }, [snapshot.profile, todayISO])

  return {
    profile: snapshot.profile,
    currentWeek: snapshot.currentWeek,
    badges: snapshot.badges,
    levelProgress,
    competitionPauseActive,
    loading: snapshot.loading,
    recompute,
    refresh: load,
    setCompetitionPause,
  }
}
