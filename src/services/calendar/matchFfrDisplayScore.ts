import type { CalendarEvent } from '../../types/training'

/**
 * Score affiché côté joueur : « nous » vs adversaire.
 * Les colonnes FFR restent locale / visiteur (domicile extérieur au bulletin).
 */
export function matchFfrDisplayScore(
  event: CalendarEvent,
): { home: number; away: number } | undefined {
  if (!event.ffr_score_valid) return undefined
  const locale = event.ffr_score_locale
  const visiteur = event.ffr_score_visiteur
  if (locale == null || visiteur == null) return undefined

  if (event.is_home === true) return { home: locale, away: visiteur }
  if (event.is_home === false) return { home: visiteur, away: locale }
  return { home: locale, away: visiteur }
}
