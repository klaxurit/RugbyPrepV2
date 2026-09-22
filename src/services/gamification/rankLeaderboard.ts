import type { AthleteLevel, LeaderboardEntry } from '../../types/gamification'
import { LEVEL_THRESHOLDS } from './scoreConstants'
import { resolveAthleteFormCue, type AthleteFormCue } from './resolveAthleteFormCue'

/**
 * Mise en rang d'un classement renvoyé par une RPC.
 *
 * Les RPC trient déjà par points décroissants ; le rang est calculé ici pour
 * que les **ex æquo partagent le même rang**. Afficher deux positions
 * différentes pour un même total serait simplement faux, et dans un vestiaire
 * c'est le genre d'erreur qui se remarque.
 */

/** Forme des lignes renvoyées par `get_club_leaderboard` et `get_league_cohort`. */
export interface LeaderboardRowLike {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  club_code?: string | null
  club_name?: string | null
  points: number | null
  sessions_completed: number | null
  days_since_last_session?: number | null
  level: string | null
  is_self: boolean
}

export function toAthleteLevel(value: string | null | undefined): AthleteLevel {
  const known = LEVEL_THRESHOLDS.some((threshold) => threshold.level === value)
  return known ? (value as AthleteLevel) : 'espoir'
}

export function rankLeaderboard(
  rows: readonly LeaderboardRowLike[],
): LeaderboardEntry[] {
  let lastPoints: number | null = null
  let lastRank = 0

  return rows.map((row, index) => {
    const points = row.points ?? 0
    // Rang « olympique » : après deux ex æquo au rang 1, le suivant est 3e.
    const rank = points === lastPoints ? lastRank : index + 1
    lastPoints = points
    lastRank = rank
    const sessionsCompleted = row.sessions_completed ?? 0

    return {
      userId: row.user_id,
      displayName: row.display_name?.trim() ?? '',
      avatarUrl: row.avatar_url,
      clubCode: row.club_code?.trim() || null,
      clubName: row.club_name?.trim() || null,
      points,
      sessionsCompleted,
      daysSinceLastSession:
        row.days_since_last_session == null ? null : row.days_since_last_session,
      level: toAthleteLevel(row.level),
      rank,
      isSelf: row.is_self === true,
    }
  })
}

/** Indice de forme dérivé d'une entrée déjà rangée. */
export function formCueForEntry(entry: LeaderboardEntry): AthleteFormCue | null {
  return resolveAthleteFormCue({
    daysSinceLastSession: entry.daysSinceLastSession,
    sessionsCompletedThisWeek: entry.sessionsCompleted,
  })
}
