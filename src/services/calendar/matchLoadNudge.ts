/**
 * Match passé sans charge ni absence déclarée → relance « Enregistrer ma charge ».
 */
import type { CalendarEvent } from '../../types/training'

export function matchNeedsLoadLog(event: CalendarEvent): boolean {
  if (event.type !== 'match') return false
  if (event.participation_status === 'not_selected' || event.participation_status === 'did_not_play') {
    return false
  }
  if (event.participation_status === 'played' && event.rpe != null && event.duration_min != null) {
    return false
  }
  // Charge déjà saisie (rpe) = fait, même sans flag played explicite.
  if (event.rpe != null && event.duration_min != null && event.duration_min > 0) {
    return false
  }
  return true
}

/** Dates ISO (locales) à J−1 et J−2 inclus pour la relance. */
export function matchLoadNudgeDates(todayISO: string): string[] {
  const [y, m, d] = todayISO.split('-').map(Number)
  const base = new Date(y, m - 1, d, 12, 0, 0, 0)
  const out: string[] = []
  for (const delta of [1, 2]) {
    const dt = new Date(base)
    dt.setDate(base.getDate() - delta)
    const yy = dt.getFullYear()
    const mm = String(dt.getMonth() + 1).padStart(2, '0')
    const dd = String(dt.getDate()).padStart(2, '0')
    out.push(`${yy}-${mm}-${dd}`)
  }
  return out
}

export function findMatchNeedingLoadNudge(
  events: readonly CalendarEvent[],
  todayISO: string,
): CalendarEvent | null {
  const dates = new Set(matchLoadNudgeDates(todayISO))
  const candidates = events.filter(
    (e) => e.type === 'match' && dates.has(e.date) && matchNeedsLoadLog(e),
  )
  if (candidates.length === 0) return null
  // Plus récent d’abord (J−1 avant J−2).
  return [...candidates].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
}
