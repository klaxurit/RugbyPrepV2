/**
 * Notice one-shot + détection « séance nouvelle vs semaine précédente »
 * pour la variété in-season planifiée.
 */

import type { Lang } from '../../i18n/appLabels'
import type { ProgramChangeNotice } from '../../types/programChange'
import type { AnnualPlanningContext } from '../../types/annualPlanning'

/** Id stable — ack une seule fois (localStorage program notice). */
export const IN_SEASON_VARIETY_NOTICE_ID = 'feature:in_season_variety_v1'

/**
 * Date de lancement de la nouveauté (YYYY-MM-DD).
 * Comptes créés à cette date ou après = tout est déjà « nouveau » → pas d’annonce.
 */
export const IN_SEASON_VARIETY_NOTICE_LAUNCH_YMD = '2026-04-01'

export type FeatureNoveltyGate = {
  /** Séances gym terminées (hors récup). */
  completedGymSessionCount: number
  /** Date de création compte / onboarding (YYYY-MM-DD), si connue. */
  accountCreatedYmd: string | null | undefined
}

/**
 * Nouveautés produit : uniquement après au moins 1 séance terminée,
 * et seulement pour les comptes créés **avant** le lancement de la feature.
 */
export function canOfferFeatureNoveltyNotice(gate: FeatureNoveltyGate): boolean {
  if (gate.completedGymSessionCount < 1) return false
  const created = gate.accountCreatedYmd?.slice(0, 10)
  if (!created || !/^\d{4}-\d{2}-\d{2}$/.test(created)) return false
  return created < IN_SEASON_VARIETY_NOTICE_LAUNCH_YMD
}

export function buildInSeasonVarietyNotice(
  current: AnnualPlanningContext,
  today: string,
  lang: Lang,
  gate?: FeatureNoveltyGate,
): ProgramChangeNotice | null {
  if (current.cycle !== 'in_season') return null
  if (gate && !canOfferFeatureNoveltyNotice(gate)) return null

  const title =
    lang === 'fr'
      ? 'Ton programme en saison devient plus vivant'
      : 'Your in-season program gets more variety'

  const summary =
    lang === 'fr'
      ? 'On garde la même logique rugby (force, puissance, match), mais certains exercices tournent selon ton bloc — pour que tu ne fasses pas toujours les mêmes séances.'
      : 'Same rugby logic (strength, power, match week), but some exercises rotate by block — so you are not stuck on the same sessions.'

  const bullets =
    lang === 'fr'
      ? [
          'Les gros mouvements restent stables pour progresser et rester frais le week-end.',
          'Bas du corps, haut du corps, Activation et Complète changent un peu selon ton bloc (Fondations = plus lent, Performance = plus souvent).',
          'En poids de corps : variante A/B selon ton poste — « Nouvelle variante » quand on passe de A à B.',
          'Rien à régler : c’est automatique, pour ton adhérence autant que pour ta perf.',
        ]
      : [
          'Main lifts stay stable so you can progress and stay fresh for the weekend.',
          'Lower, Upper, Activation and Full rotate a bit by block (Foundations = slower, Performance = more often).',
          'Bodyweight: A/B variants by position — “New variant” when you switch A → B.',
          'Nothing to configure — automatic, for adherence as much as performance.',
        ]

  return {
    id: IN_SEASON_VARIETY_NOTICE_ID,
    type: 'feature',
    severity: 'info',
    title,
    summary,
    bullets,
    postponable: true,
    effectiveDate: today,
  }
}

/** IDs présents cette semaine mais absents la semaine précédente. */
export function novelMotherSessionIds(
  currentIds: readonly string[],
  previousIds: readonly string[],
): Set<string> {
  const prev = new Set(previousIds)
  return new Set(currentIds.filter((id) => !prev.has(id)))
}
