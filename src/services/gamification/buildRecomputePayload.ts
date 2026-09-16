import { isInWeek, weekEndISO, weekStartISO } from './weekStart'

/**
 * Construction de la charge utile envoyée à `recompute-gamification`.
 *
 * Le client transmet le **plan** de la semaine (dates prévues, matchs,
 * décharge) parce que le moteur de planification vit dans l'app. Il ne
 * transmet **aucune séance réalisée** : l'Edge Function relit `session_logs`
 * elle-même, donc gonfler cette charge utile ne rapporte pas de points.
 *
 * La signature sert de clé de déduplication : on ne rappelle le serveur que
 * quand le plan ou l'historique de la semaine a réellement bougé.
 */

export interface RecomputeSourceWeekSession {
  /** Jour de la semaine, 0 = dimanche (convention `Date.getDay`). */
  dayOfWeek: number
}

export interface RecomputeSourceEvent {
  date: string
  kind?: string
}

export interface BuildRecomputePayloadInput {
  todayISO: string
  /** Séances datées de la semaine courante, en mode calendrier. */
  weekSessions: readonly RecomputeSourceWeekSession[]
  /** Événements structurants (matchs importés ou saisis). */
  events: readonly RecomputeSourceEvent[]
  isDeloadWeek: boolean
  /** Séances hebdomadaires de référence pour l'athlète. */
  weeklySessions: number | null | undefined
  /** Dates ISO des séances enregistrées, pour la signature de déduplication. */
  loggedDatesISO: readonly string[]
}

export interface RecomputeRequest {
  todayISO: string
  plannedSessionDates: string[]
  matchDates: string[]
  isDeloadWeek: boolean
  referenceSessionCount: number
  /** Change dès que le plan ou les séances de la semaine changent. */
  signature: string
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

/**
 * Le planning expose des jours de semaine (`dayOfWeek`), pas des dates. On les
 * projette sur la semaine ISO courante, dont le lundi est le jour 0.
 */
function dayOfWeekToISO(mondayISO: string, dayOfWeek: number): string | null {
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) return null
  // `Date.getDay` place dimanche à 0 ; la semaine ISO le place en 7e position.
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  return addDays(mondayISO, offset)
}

export function buildRecomputePayload(
  input: BuildRecomputePayloadInput,
): RecomputeRequest {
  const monday = weekStartISO(input.todayISO)
  const sunday = weekEndISO(input.todayISO)

  const plannedSessionDates = [
    ...new Set(
      input.weekSessions
        .map((session) => dayOfWeekToISO(monday, session.dayOfWeek))
        .filter((date): date is string => date != null),
    ),
  ].sort()

  const matchDates = [
    ...new Set(
      input.events
        .map((event) => String(event.date ?? '').slice(0, 10))
        .filter((date) => date.length === 10)
        // On garde J−1 et J+1 hors semaine : un match le lundi suivant rend le
        // dimanche courant jour de repos prescrit.
        .filter(
          (date) =>
            isInWeek(date, monday) ||
            date === addDays(monday, -1) ||
            date === addDays(sunday, 1),
        ),
    ),
  ].sort()

  const referenceSessionCount =
    typeof input.weeklySessions === 'number' && input.weeklySessions > 0
      ? input.weeklySessions
      : 3

  const loggedThisWeek = [
    ...new Set(
      input.loggedDatesISO
        .map((date) => String(date).slice(0, 10))
        .filter((date) => isInWeek(date, monday)),
    ),
  ].sort()

  return {
    todayISO: input.todayISO,
    plannedSessionDates,
    matchDates,
    isDeloadWeek: input.isDeloadWeek,
    referenceSessionCount,
    signature: [
      monday,
      plannedSessionDates.join(','),
      matchDates.join(','),
      input.isDeloadWeek ? 'deload' : 'load',
      referenceSessionCount,
      loggedThisWeek.join(','),
    ].join('|'),
  }
}
