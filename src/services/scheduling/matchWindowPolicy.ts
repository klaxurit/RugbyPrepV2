import type { DayOfWeek, PresentedMatchEvent } from '../../types/scheduling'
import { parseLocalDateOnly } from '../dates/localIsoDate'

/**
 * Politique "match window" — règles temporelles autour des matchs.
 *
 * Fondements scientifiques (KB periodization.md §4.3, §6, +
 *   Tillin & Bishop 2009, Kilduff 2013, Mujika & Padilla 2003) :
 *   - PAS de séance S&C lourde dans les 48h précédant un match
 *   - PAS de séance S&C dans les 24h suivant un match (récupération)
 *   - PRIMER optimal entre 18h et 36h avant le kickoff (idéal 24h, soit MD-1)
 */

/** Kickoff par défaut si l'évènement n'a pas de `kickoff_time` — 15h (moyenne amateur FR). */
export const DEFAULT_KICKOFF_HOUR = 15

/** Fenêtre optimale primer avant kickoff (heures). */
export const PRIMER_MIN_HOURS = 18
export const PRIMER_OPTIMAL_MAX_HOURS = 36

/** Blocage post-match (aucune séance S&C). */
export const POST_MATCH_BLOCK_HOURS = 24

/** Blocage pré-match dur (MD-1 non-light = interdit). */
export const PRE_MATCH_HARD_BLOCK_HOURS = 48

/** Résout le kickoff complet (date + heure) d'un match. Fallback 15h si kickoff_time absent. */
export function resolveKickoffDate(match: PresentedMatchEvent): Date {
  const [y, m, d] = match.date.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d ?? 1)
  if (match.kickoff_time) {
    const [hh, mm] = match.kickoff_time.split(':').map(Number)
    date.setHours(hh ?? DEFAULT_KICKOFF_HOUR, mm ?? 0, 0, 0)
  } else {
    date.setHours(DEFAULT_KICKOFF_HOUR, 0, 0, 0)
  }
  return date
}

/** Retourne la date locale d'un `DayOfWeek` dans la semaine ISO contenant `reference`. */
export function dateOfWeekday(dayOfWeek: DayOfWeek, reference: Date): Date {
  const refDow = reference.getDay()
  const mondayOffset = (refDow + 6) % 7
  const monday = new Date(reference)
  monday.setDate(reference.getDate() - mondayOffset)
  monday.setHours(0, 0, 0, 0)
  const offsetFromMonday = dayOfWeek === 0 ? 6 : (dayOfWeek as number) - 1
  const target = new Date(monday)
  target.setDate(monday.getDate() + offsetFromMonday)
  return target
}

/**
 * Heures écoulées entre le midi (12h) d'un `dayOfWeek` de la semaine ISO contenant
 * `reference` et le kickoff du match. Négatif si le jour est avant le match.
 */
export function hoursFromDayToKickoff(
  dayOfWeek: DayOfWeek,
  match: PresentedMatchEvent,
  reference: Date,
): number {
  const dayDate = dateOfWeekday(dayOfWeek, reference)
  dayDate.setHours(12, 0, 0, 0)
  const kickoff = resolveKickoffDate(match)
  return (kickoff.getTime() - dayDate.getTime()) / 3_600_000
}

/** Un `dayOfWeek` tombe-t-il dans la fenêtre post-match (≤ 24h après kickoff) ? */
export function isPostMatchWindow(
  dayOfWeek: DayOfWeek,
  match: PresentedMatchEvent,
  reference: Date,
): boolean {
  const hours = hoursFromDayToKickoff(dayOfWeek, match, reference)
  // Après le match : `hours` est négatif. Blocage si |hours| < 24.
  return hours < 0 && hours > -POST_MATCH_BLOCK_HOURS
}

/**
 * Un `dayOfWeek` tombe-t-il dans la fenêtre primer idéale (18h–36h avant kickoff) ?
 * Utilisé pour placer les séances `full_light_primer`.
 */
export function isPrimerWindow(
  dayOfWeek: DayOfWeek,
  match: PresentedMatchEvent,
  reference: Date,
): boolean {
  const hours = hoursFromDayToKickoff(dayOfWeek, match, reference)
  return hours >= PRIMER_MIN_HOURS && hours <= PRIMER_OPTIMAL_MAX_HOURS
}

/**
 * Un `dayOfWeek` tombe-t-il dans la zone pré-match "light uniquement"
 * (≤ 48h avant kickoff) ? Les séances non-light y sont interdites.
 */
export function isPreMatchLightOnlyWindow(
  dayOfWeek: DayOfWeek,
  match: PresentedMatchEvent,
  reference: Date,
): boolean {
  const hours = hoursFromDayToKickoff(dayOfWeek, match, reference)
  return hours > 0 && hours <= PRE_MATCH_HARD_BLOCK_HOURS
}

/**
 * Rail registre (niveau C) + règle d'or periodization §4.3 : pas de S&C lourd
 * de J-2 jusqu'au jour de match, **en jours calendaires**.
 *
 * Distinct de `isPreMatchLightOnlyWindow` (48 h depuis midi) : un match
 * samedi 15 h exclut le jeudi de la fenêtre 48 h (51 h), alors que J-2
 * calendaire l'inclut. Ne pas fusionner les deux.
 *
 * J+1 n'est pas dans cette fenêtre.
 */
export function isCalendarPreMatchNoHeavyWindow(
  sessionIso: string,
  matchIso: string,
): boolean {
  const session = parseLocalDateOnly(sessionIso)
  const match = parseLocalDateOnly(matchIso)
  if (!session || !match) return false
  const days =
    (match.getTime() - session.getTime()) / (24 * 60 * 60 * 1000)
  return days >= 0 && days <= 2
}

/** True si au moins un match réel tombe dans [J-2, jour de match]. */
export function sessionRequiresPreMatchLight(
  sessionIso: string,
  matchDates: readonly string[],
): boolean {
  return matchDates.some((matchIso) =>
    isCalendarPreMatchNoHeavyWindow(sessionIso, matchIso),
  )
}

export function withPreMatchNoHeavyVariant<
  T extends { variant?: 'normal' | 'light' },
>(slot: T, sessionIso: string, matchDates: readonly string[]): T {
  if (!sessionRequiresPreMatchLight(sessionIso, matchDates)) return slot
  if (slot.variant === 'light') return slot
  return { ...slot, variant: 'light' }
}

/**
 * Jour de la semaine ISO qui correspond au match (MD).
 */
function matchDayOfWeek(match: PresentedMatchEvent): DayOfWeek {
  const [y, m, d] = match.date.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1).getDay() as DayOfWeek
}

/**
 * Sélectionne le meilleur `DayOfWeek` pour poser un primer :
 *   1. priorité : MD-1 (idéal 24h avant kickoff, fenêtre 18h-36h)
 *   2. fallback : MD-2 (~48h, limite acceptable)
 *   3. null : impossible (aucun jour utilisable)
 *
 * Utilise l'arithmétique sur `DayOfWeek` plutôt que les heures brutes — le
 * scheduler place au jour près, pas à l'heure près. Les helpers horaires
 * (`isPrimerWindow`, etc.) servent côté UI/diagnostic.
 *
 * `isDayBlocked(day)` permet à l'appelant d'exclure les jours club/utilisés.
 */
export function pickPrimerDay(
  match: PresentedMatchEvent,
  _reference: Date,
  isDayBlocked: (day: DayOfWeek) => boolean,
): DayOfWeek | null {
  const md = matchDayOfWeek(match)
  // MD-1 : jour précédent dans la semaine ISO (lundi=1 … dim=0).
  const md1 = (md === 0 ? 6 : md - 1) as DayOfWeek
  if (!isDayBlocked(md1)) return md1
  // MD-2 : fallback
  const md2 = (md1 === 0 ? 6 : md1 - 1) as DayOfWeek
  if (!isDayBlocked(md2)) return md2
  return null
}
