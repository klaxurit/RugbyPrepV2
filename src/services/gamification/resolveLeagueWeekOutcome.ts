import type { LeagueOutcome } from '../../types/gamification.ts'

/**
 * Issue d’un athlète à la clôture d’une cohorte.
 *
 * Ordre de priorité :
 * 1. Pause compétition (« Blessé ») → `stayed` (ni promo ni relég)
 * 2. Malus d’inactivité soutenue → `relegated` (0 séance sur N semaines
 *    consécutives, dont la semaine clôturée)
 * 3. Zones promo / relég classiques selon le rang
 *
 * Le score hebdo récompense déjà la conformité (0 pt si aucun entraînement).
 * Le malus force la descente de division quand l’inactivité se prolonge, pour
 * que rester en haut sans s’entraîner soit impossible même dans une ligue
 * « morte ».
 */

/** Nombre total de semaines à 0 séance (incluant la semaine clôturée) avant relégation forcée. */
export const INACTIVE_WEEKS_BEFORE_FORCE_RELEGATION = 2

export interface LeagueWeekOutcomeInput {
  rank: number
  promotionCutoff: number
  relegationCutoff: number
  /** Séances complétées pendant la semaine clôturée. */
  sessionsCompleted: number
  /**
   * Semaines **précédentes** consécutives déjà à 0 séance (juste avant la
   * semaine clôturée). 1 + cette valeur = durée totale d’inactivité si la
   * semaine courante est aussi à 0.
   */
  priorConsecutiveInactiveWeeks: number
  /** Pause compétition active au moment de la clôture. */
  isPaused: boolean
}

export function resolveLeagueWeekOutcome(input: LeagueWeekOutcomeInput): LeagueOutcome {
  if (input.isPaused) return 'stayed'

  const inactiveThisWeek = input.sessionsCompleted <= 0
  if (inactiveThisWeek) {
    const totalInactiveWeeks = input.priorConsecutiveInactiveWeeks + 1
    if (totalInactiveWeeks >= INACTIVE_WEEKS_BEFORE_FORCE_RELEGATION) {
      return 'relegated'
    }
  }

  if (input.promotionCutoff === 0) return 'stayed'
  if (input.rank <= input.promotionCutoff) return 'promoted'
  if (input.relegationCutoff > 0 && input.rank >= input.relegationCutoff) {
    return 'relegated'
  }
  return 'stayed'
}

/**
 * Compte les semaines consécutives à 0 séance juste avant `closingWeekStart`,
 * à partir d’un historique trié (week_start → sessions_completed).
 */
export function countPriorConsecutiveInactiveWeeks(
  history: ReadonlyArray<{ weekStartISO: string; sessionsCompleted: number }>,
  closingWeekStartISO: string,
): number {
  const prior = history
    .filter((row) => row.weekStartISO < closingWeekStartISO)
    .sort((a, b) => b.weekStartISO.localeCompare(a.weekStartISO))

  let count = 0
  for (const row of prior) {
    if (row.sessionsCompleted > 0) break
    count += 1
  }
  return count
}
