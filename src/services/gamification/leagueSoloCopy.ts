import type { Lang } from '../../i18n/appLabels'

/**
 * Copy honnête quand la ligue n’a qu’un seul membre (souvent soi).
 * Explique l’opt-in + le prochain matching — sans inventer d’adversaires.
 */
export function leagueSoloBoardLabel(memberCount: number, lang: Lang): string | null {
  if (memberCount !== 1) return null
  return lang === 'fr'
    ? '1 athlète en ligue pour l’instant — les autres s’entraînent en privé ou club seulement. Tu seras apparié dès qu’un autre joueur active « Club + ligue hebdo » (refill en cours de semaine).'
    : '1 athlete in league for now — others train private or club-only. You’ll be matched as soon as someone turns on “Club + weekly league” (mid-week refill).'
}

/** Message « en attente » : plus seulement « lundi », le refill mid-week existe. */
export function leaguePendingBoardLabel(lang: Lang): string {
  return lang === 'fr'
    ? 'Ta ligue se constitue dès qu’assez d’athlètes ont activé « Club + ligue hebdo ». D’ici là, tes points de la semaine comptent déjà.'
    : 'Your league forms as soon as enough athletes turn on “Club + weekly league”. Until then, this week’s points already count.'
}
