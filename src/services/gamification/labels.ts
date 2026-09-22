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
 * Les **IDs** (`espoir`…`legende`, `reserve`…`elite`) restent stables en base.
 * Les libellés UI suivent la direction « vie de club » (Buvette → Bouclier) —
 * mêmes noms pour le palier XP perso et la division de ligue.
 */

/** Ordre partagé : palier XP et division de ligue. */
const VIE_DE_CLUB_LABELS = [
  { fr: 'Buvette', en: 'Club bar' },
  { fr: 'Banc de touche', en: 'Sideline' },
  { fr: 'Titulaires', en: 'Starters' },
  { fr: 'Capitaines', en: 'Captains' },
  { fr: 'Bouclier', en: 'Shield' },
] as const

const LEVEL_LABELS: Record<AthleteLevel, { fr: string; en: string }> = {
  espoir: VIE_DE_CLUB_LABELS[0],
  titulaire: VIE_DE_CLUB_LABELS[1],
  cadre: VIE_DE_CLUB_LABELS[2],
  capitaine: VIE_DE_CLUB_LABELS[3],
  legende: VIE_DE_CLUB_LABELS[4],
}

const LEAGUE_TIER_LABELS: Record<LeagueTier, { fr: string; en: string }> = {
  reserve: VIE_DE_CLUB_LABELS[0],
  espoirs: VIE_DE_CLUB_LABELS[1],
  premiere: VIE_DE_CLUB_LABELS[2],
  federale: VIE_DE_CLUB_LABELS[3],
  elite: VIE_DE_CLUB_LABELS[4],
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
