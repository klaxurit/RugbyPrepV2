import type { Lang } from '../../i18n/appLabels.ts'
import type { AthleteLevel } from '../../types/gamification.ts'
import { LEVEL_THRESHOLDS } from './scoreConstants.ts'

/**
 * Badges de rigueur.
 *
 * Aucun jalon n'est indexé sur le volume : ni tonnage, ni heures cumulées, ni
 * nombre total de séances. Un badge « 100 séances » récompenserait exactement
 * le comportement que `computeWeeklyScore` refuse de payer, et l'athlète
 * lirait alors deux messages contradictoires sur le même écran.
 *
 * Les jalons portent donc sur trois faits vérifiables : des semaines de plan
 * intégralement tenues, des semaines consécutives, et des décharges
 * respectées. Le déblocage est persisté en base (`gamification_badges`) avec
 * sa date réelle, ce qui permet de le notifier une fois et une seule.
 */

export interface BadgeFacts {
  /** Semaines où le plan a été intégralement tenu, sur toute l'historique. */
  fullPlanWeeks: number
  /** Meilleure série de semaines consécutives tenues. */
  longestWeekStreak: number
  /** Semaines de décharge menées correctement. */
  deloadWeeksRespected: number
  level: AthleteLevel
}

export interface BadgeDefinition {
  id: string
  label: { fr: string; en: string }
  detail: { fr: string; en: string }
  isUnlocked: (facts: BadgeFacts) => boolean
}

function levelAtLeast(level: AthleteLevel, minimum: AthleteLevel): boolean {
  const order = LEVEL_THRESHOLDS.map((threshold) => threshold.level)
  return order.indexOf(level) >= order.indexOf(minimum)
}

export const BADGE_DEFINITIONS: readonly BadgeDefinition[] = [
  {
    id: 'plan_week_1',
    label: { fr: 'Plan tenu', en: 'Plan kept' },
    detail: { fr: 'Une semaine entière conforme au plan', en: 'One full week on plan' },
    isUnlocked: (facts) => facts.fullPlanWeeks >= 1,
  },
  {
    id: 'plan_week_4',
    label: { fr: 'Quatre sur quatre', en: 'Four for four' },
    detail: { fr: 'Quatre semaines conformes au plan', en: 'Four weeks on plan' },
    isUnlocked: (facts) => facts.fullPlanWeeks >= 4,
  },
  {
    id: 'plan_week_12',
    label: { fr: 'Bloc complet', en: 'Full block' },
    detail: { fr: 'Douze semaines conformes au plan', en: 'Twelve weeks on plan' },
    isUnlocked: (facts) => facts.fullPlanWeeks >= 12,
  },
  {
    id: 'plan_week_26',
    label: { fr: 'Saison tenue', en: 'Season kept' },
    detail: { fr: 'Vingt-six semaines conformes au plan', en: 'Twenty-six weeks on plan' },
    isUnlocked: (facts) => facts.fullPlanWeeks >= 26,
  },
  {
    id: 'streak_4',
    label: { fr: 'Régulier', en: 'Consistent' },
    detail: { fr: 'Quatre semaines d’affilée', en: 'Four weeks in a row' },
    isUnlocked: (facts) => facts.longestWeekStreak >= 4,
  },
  {
    id: 'streak_8',
    label: { fr: 'Installé', en: 'Locked in' },
    detail: { fr: 'Huit semaines d’affilée', en: 'Eight weeks in a row' },
    isUnlocked: (facts) => facts.longestWeekStreak >= 8,
  },
  {
    id: 'streak_16',
    label: { fr: 'Inarrêtable', en: 'Relentless' },
    detail: { fr: 'Seize semaines d’affilée', en: 'Sixteen weeks in a row' },
    isUnlocked: (facts) => facts.longestWeekStreak >= 16,
  },
  {
    // Savoir décharger est une compétence d'athlète, pas un relâchement. Le
    // badge existe pour le dire explicitement.
    id: 'deload_1',
    label: { fr: 'Décharge assumée', en: 'Deload owned' },
    detail: { fr: 'Une semaine de décharge respectée', en: 'One deload week respected' },
    isUnlocked: (facts) => facts.deloadWeeksRespected >= 1,
  },
  {
    id: 'deload_3',
    label: { fr: 'Gestion de charge', en: 'Load manager' },
    detail: { fr: 'Trois semaines de décharge respectées', en: 'Three deload weeks respected' },
    isUnlocked: (facts) => facts.deloadWeeksRespected >= 3,
  },
  {
    id: 'level_cadre',
    label: { fr: 'Cadre', en: 'Senior' },
    detail: { fr: 'Palier Cadre atteint', en: 'Reached the Senior level' },
    isUnlocked: (facts) => levelAtLeast(facts.level, 'cadre'),
  },
  {
    id: 'level_capitaine',
    label: { fr: 'Capitaine', en: 'Captain' },
    detail: { fr: 'Palier Capitaine atteint', en: 'Reached the Captain level' },
    isUnlocked: (facts) => levelAtLeast(facts.level, 'capitaine'),
  },
  {
    id: 'level_legende',
    label: { fr: 'Légende', en: 'Legend' },
    detail: { fr: 'Palier Légende atteint', en: 'Reached the Legend level' },
    isUnlocked: (facts) => levelAtLeast(facts.level, 'legende'),
  },
]

/** Identifiants de tous les badges débloqués par ces faits. */
export function resolveUnlockedBadgeIds(facts: BadgeFacts): string[] {
  return BADGE_DEFINITIONS.filter((badge) => badge.isUnlocked(facts)).map(
    (badge) => badge.id,
  )
}

/**
 * Badges nouvellement débloqués. `alreadyUnlocked` évite de réinsérer — et
 * donc de re-notifier — un badge déjà acquis.
 */
export function resolveNewBadgeIds(
  facts: BadgeFacts,
  alreadyUnlocked: readonly string[],
): string[] {
  const known = new Set(alreadyUnlocked)
  return resolveUnlockedBadgeIds(facts).filter((id) => !known.has(id))
}

export function badgeLabel(badgeId: string, lang: Lang): string | null {
  return BADGE_DEFINITIONS.find((badge) => badge.id === badgeId)?.label[lang] ?? null
}

export function badgeDetail(badgeId: string, lang: Lang): string | null {
  return BADGE_DEFINITIONS.find((badge) => badge.id === badgeId)?.detail[lang] ?? null
}
