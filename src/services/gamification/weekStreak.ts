import { previousWeekStartISO } from './weekStart'

/**
 * Transition du streak hebdomadaire.
 *
 * Le streak compte les semaines où le plan a été **intégralement tenu**. Une
 * tolérance (« gel ») pardonne une semaine ratée : sans elle, une blessure, un
 * déplacement ou une semaine d'examens remettrait à zéro plusieurs mois de
 * régularité, ce qui produit l'effet inverse de celui recherché. Duolingo a
 * résolu le même problème avec le streak freeze.
 */

/** Semaines avant qu'une tolérance consommée ne redevienne disponible. */
export const FREEZE_REGENERATION_WEEKS = 8

/** Streak minimal pour que la tolérance s'applique. */
export const FREEZE_MIN_STREAK = 2

export interface WeekStreakInput {
  /** Lundi de la semaine qui vient d'être clôturée. */
  weekStartISO: string
  /** Le plan de cette semaine a été intégralement tenu. */
  planFullyRespected: boolean
  currentWeekStreak: number
  longestWeekStreak: number
  /** Lundi de la semaine où la tolérance a été consommée, ou null. */
  freezeUsedAt: string | null
}

export interface WeekStreakTransition {
  currentWeekStreak: number
  longestWeekStreak: number
  freezeUsedAt: string | null
  /** La tolérance vient d'être utilisée pour cette semaine. */
  freezeConsumed: boolean
}

function weeksBetween(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO.slice(0, 10)}T12:00:00`).getTime()
  const to = new Date(`${toISO.slice(0, 10)}T12:00:00`).getTime()
  return Math.round((to - from) / (7 * 86_400_000))
}

export function isFreezeAvailable(
  freezeUsedAt: string | null,
  weekStartISO: string,
): boolean {
  if (!freezeUsedAt) return true
  return weeksBetween(freezeUsedAt, weekStartISO) >= FREEZE_REGENERATION_WEEKS
}

export function resolveWeekStreak(input: WeekStreakInput): WeekStreakTransition {
  const prior = Math.max(0, Math.trunc(input.currentWeekStreak))
  const longest = Math.max(0, Math.trunc(input.longestWeekStreak))

  if (input.planFullyRespected) {
    const next = prior + 1
    return {
      currentWeekStreak: next,
      longestWeekStreak: Math.max(longest, next),
      freezeUsedAt: input.freezeUsedAt,
      freezeConsumed: false,
    }
  }

  const canFreeze =
    prior >= FREEZE_MIN_STREAK && isFreezeAvailable(input.freezeUsedAt, input.weekStartISO)

  if (canFreeze) {
    return {
      currentWeekStreak: prior,
      longestWeekStreak: Math.max(longest, prior),
      freezeUsedAt: input.weekStartISO,
      freezeConsumed: true,
    }
  }

  return {
    currentWeekStreak: 0,
    longestWeekStreak: longest,
    freezeUsedAt: input.freezeUsedAt,
    freezeConsumed: false,
  }
}

/**
 * Streak à créditer dans le score de la semaine en cours, c'est-à-dire le
 * streak tel qu'il était à la clôture de la semaine précédente.
 */
export function priorStreakForWeek(
  storedStreak: number,
  storedStreakWeekISO: string | null,
  weekStartISO: string,
): number {
  if (!storedStreakWeekISO) return Math.max(0, Math.trunc(storedStreak))
  // Le streak stocké appartient déjà à la semaine en cours : ne pas le
  // recompter, sinon le bonus de régularité doublerait à chaque recalcul.
  if (storedStreakWeekISO === weekStartISO) {
    return Math.max(0, Math.trunc(storedStreak) - 1)
  }
  if (storedStreakWeekISO === previousWeekStartISO(weekStartISO)) {
    return Math.max(0, Math.trunc(storedStreak))
  }
  // Trou d'au moins une semaine entière sans clôture : le streak est rompu.
  return 0
}
