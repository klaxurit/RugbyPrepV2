import type { CalendarEvent } from '../../types/training'

/**
 * État du hero d'accueil. Pilote la variante visuelle :
 *
 * - `match_today`     : il y a un match aujourd'hui → carte "Jour de match"
 * - `post_match`      : un match a été joué dans les 48h (J+1 / J+2) → carte "Lendemain de match"
 * - `match_tomorrow`  : un match est demain → carte "Repos avant le match"
 * - `training_day`    : une séance salle est planifiée aujourd'hui (passée par le caller)
 * - `club_day`        : jour club sans séance salle → hero éditorial (≠ card /week)
 * - `rest_day`        : aucune séance, aucun club, aucun match imminent → carte "Repos programmé"
 */
export type HomeHeroState =
  | 'match_today'
  | 'post_match'
  | 'match_tomorrow'
  | 'training_day'
  | 'club_day'
  | 'rest_day'

interface DetectInputs {
  todayISO: string
  hasTrainingToday: boolean
  /** Jour club profil / présentation, hors indispo « Je n’y vais pas ». */
  hasClubToday?: boolean
  /** Tous les événements `match` passés et futurs (visible ou structurels). */
  matchEvents: readonly CalendarEvent[]
}

interface DetectResult {
  state: HomeHeroState
  /** Le match passé le plus récent (≤ 48h / J+1–J+2) si `state === 'post_match'`. */
  lastMatch: CalendarEvent | null
  /** Le match d'aujourd'hui si `state === 'match_today'`. */
  todayMatch: CalendarEvent | null
  /** Le match de demain si `state === 'match_tomorrow'`. */
  tomorrowMatch: CalendarEvent | null
}

function diffDaysISO(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T12:00:00`).getTime()
  const to = new Date(`${toISO}T12:00:00`).getTime()
  return Math.round((to - from) / 86_400_000)
}

export function detectHomeState({
  todayISO,
  hasTrainingToday,
  hasClubToday = false,
  matchEvents,
}: DetectInputs): DetectResult {
  const matches = matchEvents.filter((e) => e.type === 'match')

  const todayMatch = matches.find((e) => e.date === todayISO) ?? null
  if (todayMatch) {
    return { state: 'match_today', lastMatch: null, todayMatch, tomorrowMatch: null }
  }

  // Match dimanche → hero jusqu’au mardi (aligné sync score FFR 48h).
  const past = matches
    .filter((e) => e.date < todayISO)
    .sort((a, b) => b.date.localeCompare(a.date))
  const lastMatch = past[0] ?? null
  if (lastMatch) {
    const daysSince = diffDaysISO(lastMatch.date, todayISO)
    if (daysSince >= 1 && daysSince <= 2) {
      return { state: 'post_match', lastMatch, todayMatch: null, tomorrowMatch: null }
    }
  }

  // Match demain ?
  const future = matches
    .filter((e) => e.date > todayISO)
    .sort((a, b) => a.date.localeCompare(b.date))
  const tomorrowMatch =
    future[0] && diffDaysISO(todayISO, future[0].date) === 1 ? future[0] : null
  if (tomorrowMatch) {
    return { state: 'match_tomorrow', lastMatch: null, todayMatch: null, tomorrowMatch }
  }

  // Salle prime sur club (aligné resolveWeekDayType).
  if (hasTrainingToday) {
    return { state: 'training_day', lastMatch: null, todayMatch: null, tomorrowMatch: null }
  }
  if (hasClubToday) {
    return { state: 'club_day', lastMatch: null, todayMatch: null, tomorrowMatch: null }
  }
  return { state: 'rest_day', lastMatch: null, todayMatch: null, tomorrowMatch: null }
}
