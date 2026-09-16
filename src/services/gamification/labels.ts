import type { Lang } from '../../i18n/appLabels'
import type { AthleteLevel, LeagueTier } from '../../types/gamification'

/**
 * Libellés des paliers de gamification.
 *
 * Fichier `.ts` séparé des composants : une constante partagée exportée depuis
 * un `.tsx` de composant casserait `react-refresh/only-export-components`, et
 * donc le job Lint de la CI.
 */

const LEVEL_LABELS: Record<AthleteLevel, { fr: string; en: string }> = {
  espoir: { fr: 'Espoir', en: 'Prospect' },
  titulaire: { fr: 'Titulaire', en: 'Starter' },
  cadre: { fr: 'Cadre', en: 'Senior' },
  capitaine: { fr: 'Capitaine', en: 'Captain' },
  legende: { fr: 'Légende', en: 'Legend' },
}

const LEAGUE_TIER_LABELS: Record<LeagueTier, { fr: string; en: string }> = {
  reserve: { fr: 'Réserve', en: 'Reserve' },
  espoirs: { fr: 'Espoirs', en: 'Academy' },
  premiere: { fr: 'Première', en: 'First team' },
  federale: { fr: 'Fédérale', en: 'National' },
  elite: { fr: 'Élite', en: 'Elite' },
}

export function levelLabel(level: AthleteLevel, lang: Lang): string {
  return LEVEL_LABELS[level][lang]
}

export function leagueTierLabel(tier: LeagueTier, lang: Lang): string {
  return LEAGUE_TIER_LABELS[tier][lang]
}
