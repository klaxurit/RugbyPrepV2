import type { ACWRZone } from '../../types/acwr.ts'
import type { SessionType } from '../../types/training.ts'
import type { WeeklyScoreInput } from './computeWeeklyScore.ts'
import { isInWeek, weekStartISO } from './weekStart.ts'

/**
 * Traduit les données brutes (plan de la semaine, `session_logs`, calendrier
 * des matchs) en entrées de la formule de score.
 *
 * Isolé de `computeWeeklyScore` pour que la formule reste testable sans
 * fabriquer de logs, et que cette dérivation reste testable sans raisonner sur
 * le barème.
 */

/** Types de séance qui ne comptent pas comme de l'entraînement ajouté. */
const RECOVERY_TYPES: readonly SessionType[] = ['RECOVERY', 'ACTIVE_RECOVERY']

function isRecovery(type: string): boolean {
  return (RECOVERY_TYPES as readonly string[]).includes(type)
}

export interface PlannedSessionRef {
  /** Jour prévu, YYYY-MM-DD. */
  dateISO: string
}

/**
 * Forme minimale d'une séance pour le calcul de conformité.
 *
 * Volontairement structurelle et non liée à `SessionLog` : la même dérivation
 * sert au client (qui manipule des `SessionLog`) et à l'Edge Function (qui lit
 * des lignes Supabase brutes, où `session_type` est un `string`).
 */
export interface ScorableSessionLog {
  dateISO: string
  sessionType: string
  rpe?: number | null
  durationMin?: number | null
}

export interface WeeklyConformityInput {
  /** Jour de référence pour déterminer la semaine, YYYY-MM-DD. */
  todayISO: string
  /** Séances prévues au programme pour la semaine. */
  plannedSessions: readonly PlannedSessionRef[]
  logs: readonly ScorableSessionLog[]
  /** Dates de match de la semaine et de ses bords, YYYY-MM-DD. */
  matchDatesISO: readonly string[]
  isDeloadWeek: boolean
  /** Séances d'une semaine de charge normale pour cet athlète. */
  referenceSessionCount: number
  acwrZone: ACWRZone | null
  priorWeekStreak: number
}

function dayOf(dateISO: string): string {
  return dateISO.slice(0, 10)
}

function shiftDay(dateISO: string, days: number): string {
  const date = new Date(`${dayOf(dateISO)}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

/**
 * Jours de repos prescrits autour d'un match : la veille (J-1) et le
 * lendemain (J+1).
 *
 * `src/knowledge/load-budgeting.md` prescrit « repos ou mobilité seulement »
 * en J-1 et « repos ou mobilité légère » en J+1. Ne pas s'entraîner ces
 * jours-là est donc un comportement correct, qui doit rapporter des points au
 * lieu d'apparaître comme un trou dans la semaine.
 */
export function prescribedRestDays(
  matchDatesISO: readonly string[],
  mondayISO: string,
): string[] {
  const days = new Set<string>()
  for (const match of matchDatesISO) {
    for (const offset of [-1, 1]) {
      const day = shiftDay(match, offset)
      if (isInWeek(day, mondayISO) && !matchDatesISO.some((m) => dayOf(m) === day)) {
        days.add(day)
      }
    }
  }
  return [...days].sort()
}

export function deriveWeeklyScoreInput(input: WeeklyConformityInput): WeeklyScoreInput {
  const monday = weekStartISO(input.todayISO)

  const weekLogs = input.logs.filter((log) => isInWeek(log.dateISO, monday))
  const trainingDays = new Set(
    weekLogs.filter((log) => !isRecovery(log.sessionType)).map((log) => dayOf(log.dateISO)),
  )
  const anyLogDays = new Set(weekLogs.map((log) => dayOf(log.dateISO)))

  const plannedDays = new Set(
    input.plannedSessions
      .map((session) => dayOf(session.dateISO))
      .filter((day) => isInWeek(day, monday)),
  )

  // Une séance prévue est tenue dès qu'un log existe ce jour-là, quel que soit
  // son type : l'athlète qui remplace sa séance par de la récup active sur
  // consigne de fatigue a respecté le plan, pas triché.
  let plannedSessionsCompleted = 0
  for (const day of plannedDays) {
    if (anyLogDays.has(day)) plannedSessionsCompleted += 1
  }

  // Hors plan : uniquement de l'entraînement réel ajouté un jour non prévu.
  // La récup active ajoutée n'est ni récompensée ni pénalisée.
  let offPlanSessionsCompleted = 0
  for (const day of trainingDays) {
    if (!plannedDays.has(day)) offPlanSessionsCompleted += 1
  }

  const restDays = prescribedRestDays(input.matchDatesISO, monday)
  const prescribedRestRespected = restDays.filter((day) => !trainingDays.has(day)).length

  const completedLogs = weekLogs.filter((log) => !isRecovery(log.sessionType))
  const allCompletedHaveLoadData =
    completedLogs.length > 0 &&
    completedLogs.every((log) => log.rpe != null && log.durationMin != null)

  return {
    weekStartISO: monday,
    sessionsPlanned: plannedDays.size,
    plannedSessionsCompleted,
    offPlanSessionsCompleted,
    prescribedRestRespected,
    isDeloadWeek: input.isDeloadWeek,
    referenceSessionCount: input.referenceSessionCount,
    allCompletedHaveLoadData,
    priorWeekStreak: input.priorWeekStreak,
    acwrZone: input.acwrZone,
  }
}
