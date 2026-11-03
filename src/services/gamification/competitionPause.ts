/**
 * Pause compétition déclarée (« Blessé »).
 *
 * Ce n’est **pas** un suivi médical : l’athlète gèle temporairement les
 * malus / relégations d’inactivité de la ligue hebdomadaire. Aucune donnée
 * de santé (localisation, diagnostic, RPE) n’est collectée.
 */

/** Durée max d’une pause déclarée, en jours calendaires. */
export const COMPETITION_PAUSE_MAX_DAYS = 28

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

/** Calcule la date de fin inclusive d’une pause démarrée aujourd’hui. */
export function competitionPauseEndsOn(startedOnISO: string): string {
  const start = parseISODate(startedOnISO)
  start.setUTCDate(start.getUTCDate() + COMPETITION_PAUSE_MAX_DAYS - 1)
  return toISODate(start)
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function toISODate(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
