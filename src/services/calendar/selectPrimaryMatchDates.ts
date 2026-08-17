/**
 * Amateur FFR = 1 match / semaine. Deux dates dans la même semaine ISO
 * (import FFR, réserve + première, doublon) : on n’en garde qu’une pour le
 * moteur (isMatchWeek, J-2, primers). Le calendrier UI peut encore tout lister.
 *
 * Priorité : coupe / championnat avant amical, sinon la date la plus tôt.
 */
import type { CalendarEvent, MatchKind } from '../../types/training'
import { parseLocalDateOnly, toIsoDateLocal } from '../dates/localIsoDate'

export type MatchForPrimaryPick = Pick<CalendarEvent, 'date'> & {
  type?: CalendarEvent['type']
  match_kind?: MatchKind | null
}

function isoWeekMonday(iso: string): string | null {
  const d = parseLocalDateOnly(iso)
  if (!d) return null
  const daysFromMonday = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - daysFromMonday)
  return toIsoDateLocal(d)
}

function kindRank(kind: MatchKind | null | undefined): number {
  if (kind === 'cup_final') return 0
  if (kind === 'league') return 1
  if (kind === 'friendly') return 3
  return 2
}

function pickPrimary<T extends MatchForPrimaryPick>(a: T, b: T): T {
  const rankA = kindRank(a.match_kind)
  const rankB = kindRank(b.match_kind)
  if (rankA !== rankB) return rankA < rankB ? a : b
  return a.date <= b.date ? a : b
}

/** Un event gagnant par semaine ISO (lundi–dimanche). */
export function selectPrimaryMatchEvents<T extends MatchForPrimaryPick>(events: T[]): T[] {
  const byWeek = new Map<string, T>()
  for (const event of events) {
    if (event.type !== undefined && event.type !== 'match') continue
    const monday = isoWeekMonday(event.date)
    if (!monday) continue
    const previous = byWeek.get(monday)
    byWeek.set(monday, previous ? pickPrimary(previous, event) : event)
  }
  return [...byWeek.values()].sort((a, b) => a.date.localeCompare(b.date))
}

/** Dates de match retenues pour le moteur, triées. */
export function selectPrimaryMatchDates(events: MatchForPrimaryPick[]): string[] {
  return selectPrimaryMatchEvents(events).map((event) => event.date)
}
