/**
 * Pause compétition déclarée (« Blessé »).
 *
 * Ce n’est **pas** un suivi médical : l’athlète gèle temporairement les
 * malus / relégations d’inactivité de la ligue hebdomadaire. Aucune donnée
 * de santé (localisation, diagnostic, RPE) n’est collectée.
 *
 * Durée : ouverte jusqu’à levée manuelle (`endsOn` null). Les anciennes
 * pauses avec `endsOn` restent honorées jusqu’à expiration.
 */

export type CompetitionPauseKind = 'blesse'

export interface CompetitionPauseState {
  kind: CompetitionPauseKind | null
  startedOn: string | null
  endsOn: string | null
}

/** True si une pause est active à `todayISO` (YYYY-MM-DD). */
export function isCompetitionPauseActive(
  pause: CompetitionPauseState,
  todayISO: string,
): boolean {
  if (pause.kind == null || !pause.startedOn) return false
  if (todayISO < pause.startedOn) return false
  if (pause.endsOn && todayISO > pause.endsOn) return false
  return true
}
