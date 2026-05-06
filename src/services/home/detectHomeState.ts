import type { CalendarEvent } from '../../types/training'

/**
 * État du hero d'accueil. Pilote la variante visuelle :
 *
 * - `match_today`     : il y a un match aujourd'hui → carte "Jour de match"
 * - `post_match`      : un match a été joué dans les dernières 24h → carte "Lendemain de match"
 * - `match_tomorrow`  : un match est demain → carte "Repos avant le match"
 * - `training_day`    : une séance est planifiée aujourd'hui (passée par le caller)
 * - `rest_day`        : aucune séance, aucun match imminent → carte "Repos programmé"
 */
export type HomeHeroState =
  | 'match_today'
  | 'post_match'
  | 'match_tomorrow'
  | 'training_day'
  | 'rest_day'

interface DetectInputs {
  todayISO: string
  hasTrainingToday: boolean
  /** Tous les événements `match` passés et futurs (visible ou structurels). */
  matchEvents: readonly CalendarEvent[]
}

interface DetectResult {
  state: HomeHeroState
  /** Le match passé le plus récent (≤ 24h) si `state === 'post_match'`. */
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
  matchEvents,
}: DetectInputs): DetectResult {
  const matches = matchEvents.filter((e) => e.type === 'match')

  const todayMatch = matches.find((e) => e.date === todayISO) ?? null
  if (todayMatch) {
    return { state: 'match_today', lastMatch: null, todayMatch, tomorrowMatch: null }
  }

  // Match dans les dernières 24h ?
  const past = matches
    .filter((e) => e.date < todayISO)
    .sort((a, b) => b.date.localeCompare(a.date))
  const lastMatch = past[0] ?? null
  if (lastMatch) {
    const daysSince = diffDaysISO(lastMatch.date, todayISO)
    if (daysSince === 1) {
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

  if (hasTrainingToday) {
    return { state: 'training_day', lastMatch: null, todayMatch: null, tomorrowMatch: null }
  }
  return { state: 'rest_day', lastMatch: null, todayMatch: null, tomorrowMatch: null }
}
