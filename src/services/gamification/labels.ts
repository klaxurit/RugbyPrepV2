import type { Lang } from '../../i18n/appLabels'
import type { AthleteLevel, LeagueTier } from '../../types/gamification'
import { LEAGUE_TIER_ORDER } from './scoreConstants'

/**
 * Libellés des paliers de gamification.
 *
 * Fichier `.ts` séparé des composants : une constante partagée exportée depuis
 * un `.tsx` de composant casserait `react-refresh/only-export-components`, et
 * donc le job Lint de la CI.
 *
 * Les **IDs** de ligue (`reserve`…`elite`) restent stables en base. Les
 * libellés UI suivent la direction « vie de club » (Buvette → Bouclier).
 */

const LEVEL_LABELS: Record<AthleteLevel, { fr: string; en: string }> = {
  espoir: { fr: 'Espoir', en: 'Prospect' },
  titulaire: { fr: 'Titulaire', en: 'Starter' },
  cadre: { fr: 'Cadre', en: 'Senior' },
  capitaine: { fr: 'Capitaine', en: 'Captain' },
  legende: { fr: 'Légende', en: 'Legend' },
}

/** Noms fun — progression vestiaire, pas championnat officiel. */
const LEAGUE_TIER_LABELS: Record<LeagueTier, { fr: string; en: string }> = {
  reserve: { fr: 'Buvette', en: 'Club bar' },
  espoirs: { fr: 'Banc de touche', en: 'Sideline' },
  premiere: { fr: 'Titulaires', en: 'Starters' },
  federale: { fr: 'Capitaines', en: 'Captains' },
  elite: { fr: 'Bouclier', en: 'Shield' },
}

export function levelLabel(level: AthleteLevel, lang: Lang): string {
  return LEVEL_LABELS[level][lang]
}

export function leagueTierLabel(tier: LeagueTier, lang: Lang): string {
  return LEAGUE_TIER_LABELS[tier][lang]
}

/** Div. 1 … Div. 5 — sous-titre pour que l’ordre reste lisible aux nouveaux. */
export function leagueTierDivisionIndex(tier: LeagueTier): number {
  const index = LEAGUE_TIER_ORDER.indexOf(tier)
  return index >= 0 ? index + 1 : 1
}

export function leagueTierDivisionLabel(tier: LeagueTier, lang: Lang): string {
  const n = leagueTierDivisionIndex(tier)
  return lang === 'fr' ? `Div. ${n}` : `Div. ${n}`
}
