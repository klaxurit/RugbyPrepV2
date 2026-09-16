import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { weekStartISO } from '../services/gamification/weekStart'
import { resolveLeagueCutoffs } from '../services/gamification/cohortMatchmaking'
import type {
  AthleteLevel,
  ClubChallenge,
  Duel,
  DuelStatus,
  LeaderboardEntry,
  LeagueCohort,
  LeagueTier,
} from '../types/gamification'

/**
 * Données sociales de l'athlète : classement du club, cohorte de ligue, défi
 * collectif, duels, kudos.
 *
 * Tout passe par des RPC `SECURITY DEFINER`. Aucune table n'autorise la
 * lecture croisée en RLS, donc un athlète qui n'a pas donné son consentement
 * `social_visibility` reçoit simplement des listes vides — la confidentialité
 * ne dépend pas de ce que le client demande.
 */

interface LeaderboardRow {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  points: number | null
  sessions_completed: number | null
  level: string | null
  is_self: boolean
}

interface CohortRow extends LeaderboardRow {
  cohort_id: string
  tier: string
  promotion_cutoff: number | null
  relegation_cutoff: number | null
}

interface ChallengeRow {
  club_code: string
  target: number | null
  current_total: number | null
  participant_count: number | null
}

interface DuelRow {
  duel_id: string
  week_start: string
  status: string
  is_challenger: boolean
  opponent_display_name: string | null
  opponent_avatar_url: string | null
  self_points: number | null
  opponent_points: number | null
}

interface CandidateRow {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  level: string | null
}

export interface DuelCandidate {
  userId: string
  displayName: string
  avatarUrl: string | null
  level: AthleteLevel
}

export interface UseSquadResult {
  clubLeaderboard: LeaderboardEntry[]
  cohort: LeagueCohort | null
  challenge: ClubChallenge | null
  duels: Duel[]
  duelCandidates: DuelCandidate[]
  /** Athlètes déjà salués cette semaine : le bouton kudos doit être inactif. */
  kudosGiven: Set<string>
  loading: boolean
  challengeAthlete: (opponentId: string) => Promise<void>
  respondToDuel: (duelId: string, accept: boolean) => Promise<void>
  giveKudos: (toUserId: string) => Promise<void>
  refresh: () => Promise<void>
}

const KNOWN_LEVELS: readonly AthleteLevel[] = [
  'espoir',
  'titulaire',
  'cadre',
  'capitaine',
  'legende',
]

const KNOWN_TIERS: readonly LeagueTier[] = [
  'reserve',
  'espoirs',
  'premiere',
  'federale',
  'elite',
]

function toLevel(value: string | null): AthleteLevel {
  return KNOWN_LEVELS.includes(value as AthleteLevel) ? (value as AthleteLevel) : 'espoir'
}

function toTier(value: string): LeagueTier {
  return KNOWN_TIERS.includes(value as LeagueTier) ? (value as LeagueTier) : 'reserve'
}

function toDuelStatus(value: string): DuelStatus {
  return value === 'active' || value === 'completed' || value === 'declined'
    ? value
    : 'pending'
}

/**
 * Les rangs sont attribués côté client parce que les RPC renvoient déjà les
 * lignes triées par points décroissants. Les ex æquo partagent le même rang :
 * afficher deux rangs différents pour un même total serait faux.
 */
function withRanks(rows: readonly LeaderboardRow[]): LeaderboardEntry[] {
  let lastPoints: number | null = null
  let lastRank = 0

  return rows.map((row, index) => {
    const points = row.points ?? 0
    const rank = points === lastPoints ? lastRank : index + 1
    lastPoints = points
    lastRank = rank

    return {
      userId: row.user_id,
      displayName: row.display_name?.trim() ?? '',
      avatarUrl: row.avatar_url,
      points,
      sessionsCompleted: row.sessions_completed ?? 0,
      level: toLevel(row.level),
      rank,
      isSelf: row.is_self === true,
    }
  })
}

export function useSquad(todayISO: string): UseSquadResult {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [clubLeaderboard, setClubLeaderboard] = useState<LeaderboardEntry[]>([])
  const [cohort, setCohort] = useState<LeagueCohort | null>(null)
  const [challenge, setChallenge] = useState<ClubChallenge | null>(null)
  const [duels, setDuels] = useState<Duel[]>([])
  const [duelCandidates, setDuelCandidates] = useState<DuelCandidate[]>([])
  const [kudosGiven, setKudosGiven] = useState<Set<string>>(() => new Set())
  const [loading, setLoading] = useState(true)

  const weekStart = useMemo(() => weekStartISO(todayISO), [todayISO])

  const load = useCallback(async () => {
    if (!userId) {
      setClubLeaderboard([])
      setCohort(null)
      setChallenge(null)
      setDuels([])
      setDuelCandidates([])
      setKudosGiven(new Set())
      setLoading(false)
      return
    }

    const params = { p_week_start: weekStart }
    const [boardResult, cohortResult, challengeResult, duelsResult, candidatesResult, kudosResult] =
      await Promise.all([
        supabase.rpc('get_club_leaderboard', params),
        supabase.rpc('get_league_cohort', params),
        supabase.rpc('get_club_challenge', params),
        supabase.rpc('get_my_duels', params),
        supabase.rpc('get_duel_candidates', params),
        supabase.rpc('get_kudos_given', params),
      ])

    for (const [label, result] of [
      ['classement club', boardResult],
      ['cohorte', cohortResult],
      ['défi club', challengeResult],
      ['duels', duelsResult],
      ['adversaires', candidatesResult],
      ['kudos', kudosResult],
    ] as const) {
      if (result.error) console.warn(`[useSquad] ${label}:`, result.error.message)
    }

    setClubLeaderboard(withRanks((boardResult.data ?? []) as LeaderboardRow[]))

    const cohortRows = (cohortResult.data ?? []) as CohortRow[]
    if (cohortRows.length === 0) {
      setCohort(null)
    } else {
      const head = cohortRows[0]
      // Une cohorte ouverte porte des seuils à 0 : ils ne sont écrits qu'à la
      // clôture. On les dérive alors de la même fonction que le cron, pour que
      // l'UI n'annonce jamais une zone de promotion différente de celle qui
      // sera appliquée.
      const derived = resolveLeagueCutoffs(cohortRows.length)
      const storedPromotion = head.promotion_cutoff ?? 0
      const storedRelegation = head.relegation_cutoff ?? 0
      setCohort({
        id: head.cohort_id,
        weekStartISO: weekStart,
        tier: toTier(head.tier),
        entries: withRanks(cohortRows),
        promotionCutoff: storedPromotion > 0 ? storedPromotion : derived.promotionCutoff,
        relegationCutoff: storedRelegation > 0 ? storedRelegation : derived.relegationCutoff,
      })
    }

    const challengeRow = ((challengeResult.data ?? []) as ChallengeRow[])[0] ?? null
    setChallenge(
      challengeRow
        ? {
            clubCode: challengeRow.club_code,
            weekStartISO: weekStart,
            target: challengeRow.target ?? 0,
            current: challengeRow.current_total ?? 0,
            participantCount: challengeRow.participant_count ?? 0,
          }
        : null,
    )

    setDuels(
      ((duelsResult.data ?? []) as DuelRow[]).map((row) => ({
        id: row.duel_id,
        weekStartISO: row.week_start,
        status: toDuelStatus(row.status),
        opponentDisplayName: row.opponent_display_name?.trim() ?? '',
        opponentAvatarUrl: row.opponent_avatar_url,
        selfPoints: row.self_points ?? 0,
        opponentPoints: row.opponent_points ?? 0,
        isChallenger: row.is_challenger === true,
      })),
    )

    setDuelCandidates(
      ((candidatesResult.data ?? []) as CandidateRow[])
        .filter((row) => (row.display_name?.trim() ?? '').length > 0)
        .map((row) => ({
          userId: row.user_id,
          displayName: row.display_name!.trim(),
          avatarUrl: row.avatar_url,
          level: toLevel(row.level),
        })),
    )

    setKudosGiven(
      new Set(
        ((kudosResult.data ?? []) as { to_user_id: string }[]).map((row) => row.to_user_id),
      ),
    )

    setLoading(false)
  }, [userId, weekStart])

  useEffect(() => {
    void load()
  }, [load])

  const challengeAthlete = useCallback(
    async (opponentId: string) => {
      if (!userId) return
      const { error } = await supabase.from('duels').insert({
        challenger_id: userId,
        opponent_id: opponentId,
        week_start: weekStart,
      })
      if (error) {
        console.warn('[useSquad] duel:', error.message)
        return
      }
      await load()
    },
    [userId, weekStart, load],
  )

  const respondToDuel = useCallback(
    async (duelId: string, accept: boolean) => {
      const { error } = await supabase
        .from('duels')
        .update({ status: accept ? 'active' : 'declined' })
        .eq('id', duelId)
      if (error) {
        console.warn('[useSquad] réponse duel:', error.message)
        return
      }
      await load()
    },
    [load],
  )

  const giveKudos = useCallback(
    async (toUserId: string) => {
      const { error } = await supabase.rpc('give_kudos', {
        p_to_user_id: toUserId,
        p_week_start: weekStart,
      })
      if (error) {
        console.warn('[useSquad] kudos:', error.message)
        return
      }
      setKudosGiven((current) => new Set(current).add(toUserId))
    },
    [weekStart],
  )

  return {
    clubLeaderboard,
    cohort,
    challenge,
    duels,
    duelCandidates,
    kudosGiven,
    loading,
    challengeAthlete,
    respondToDuel,
    giveKudos,
    refresh: load,
  }
}
