/**
 * Indice de forme affiché sur les classements.
 *
 * Volontairement grossier : 🔥 = enchaîne, 💤 = silencieux depuis un moment.
 * Aucune donnée de santé (RPE, fatigue) n'entre dans le calcul — seulement
 * la récence d'une séance loguée et le volume de la semaine courante déjà
 * exposé via le classement.
 */

export type AthleteFormCue = 'hot' | 'dormant'

/** Au-delà de ce délai sans séance, l'athlète est « en pause ». */
export const FORM_DORMANT_DAYS = 7

/** Sous ce délai, ou avec ≥ 2 séances cette semaine, l'athlète « enchaîne ». */
export const FORM_HOT_DAYS = 2

export function resolveAthleteFormCue(input: {
  daysSinceLastSession: number | null
  sessionsCompletedThisWeek: number
}): AthleteFormCue | null {
  const days = input.daysSinceLastSession
  if (days == null || days >= FORM_DORMANT_DAYS) return 'dormant'
  if (days <= FORM_HOT_DAYS || input.sessionsCompletedThisWeek >= 2) return 'hot'
  return null
}

export function athleteFormCueEmoji(cue: AthleteFormCue | null | undefined): string | null {
  if (cue === 'hot') return '🔥'
  if (cue === 'dormant') return '💤'
  return null
}
