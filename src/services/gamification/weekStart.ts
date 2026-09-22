/**
 * Bornes de semaine ISO (lundi → dimanche) pour la gamification.
 *
 * Le lundi est la clé d'agrégation de toutes les tables de scores : une seule
 * définition ici évite qu'un score, une cohorte et un duel ne tombent pas sur
 * la même semaine.
 */

/** Lundi de la semaine contenant `dateISO`, au format YYYY-MM-DD. */
export function weekStartISO(dateISO: string): string {
  const date = new Date(`${dateISO.slice(0, 10)}T12:00:00`)
  const dayOfWeek = date.getDay() // 0 = dimanche
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  date.setDate(date.getDate() + offsetToMonday)
  return date.toISOString().slice(0, 10)
}

/** Dimanche de la semaine contenant `dateISO`, au format YYYY-MM-DD. */
export function weekEndISO(dateISO: string): string {
  const monday = new Date(`${weekStartISO(dateISO)}T12:00:00`)
  monday.setDate(monday.getDate() + 6)
  return monday.toISOString().slice(0, 10)
}

/** Lundi de la semaine précédant celle de `dateISO`. */
export function previousWeekStartISO(dateISO: string): string {
  const monday = new Date(`${weekStartISO(dateISO)}T12:00:00`)
  monday.setDate(monday.getDate() - 7)
  return monday.toISOString().slice(0, 10)
}

/**
 * Jours restants jusqu’au prochain lundi (reset ligue / nouvelles cohortes).
 *
 * Lundi → 7 (semaine pleine devant soi). Dimanche → 1 (reset demain).
 */
export function daysUntilNextWeekStart(dateISO: string): number {
  const day = dateISO.slice(0, 10)
  const nextMonday = new Date(`${weekStartISO(day)}T12:00:00`)
  nextMonday.setDate(nextMonday.getDate() + 7)
  const today = new Date(`${day}T12:00:00`)
  return Math.round((nextMonday.getTime() - today.getTime()) / 86_400_000)
}

/** True si `dateISO` tombe dans la semaine commençant le lundi `mondayISO`. */
export function isInWeek(dateISO: string, mondayISO: string): boolean {
  const day = dateISO.slice(0, 10)
  return day >= mondayISO && day <= weekEndISO(mondayISO)
}
