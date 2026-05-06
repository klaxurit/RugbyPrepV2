/**
 * Numéro de semaine dans la saison rugby (commence le 1er septembre).
 *
 * Convention : la saison N/N+1 démarre le 1er septembre N (semaine 1).
 * Une saison dure ~12 mois → ~52 semaines maximum.
 *
 * Exemples :
 *   - 2026-09-01 → 1
 *   - 2026-09-08 → 2
 *   - 2027-05-04 → ~35
 *   - 2026-08-31 → 52 (dernière semaine de la saison précédente)
 */
export function getRugbySeasonWeek(todayISO: string): number {
  const today = new Date(`${todayISO}T12:00:00`)
  const year = today.getFullYear()
  const month = today.getMonth() // 0-11

  // Anchor : 1er septembre de la saison courante.
  // Si on est en jan-août → la saison a commencé le 1er sept de l'année précédente.
  // Si on est en sept-déc → la saison a commencé le 1er sept de l'année courante.
  const anchorYear = month >= 8 ? year : year - 1
  const anchor = new Date(anchorYear, 8, 1, 12, 0, 0) // mois 8 = septembre

  const diffMs = today.getTime() - anchor.getTime()
  const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1
  return Math.max(1, Math.min(weeks, 52))
}
