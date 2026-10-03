/**
 * Notice one-shot + détection « séance nouvelle vs semaine précédente »
 * pour la variété in-season planifiée.
 */

import type { Lang } from '../../i18n/appLabels'
import type { ProgramChangeNotice } from '../../types/programChange'
import type { AnnualPlanningContext } from '../../types/annualPlanning'

/** Id stable — ack une seule fois (localStorage program notice). */
export const IN_SEASON_VARIETY_NOTICE_ID = 'feature:in_season_variety_v1'

export function buildInSeasonVarietyNotice(
  current: AnnualPlanningContext,
  today: string,
  lang: Lang,
): ProgramChangeNotice | null {
  if (current.cycle !== 'in_season') return null

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
          'Lower, Primer et Full changent un peu selon ton bloc (Fondations = plus lent, Performance = plus souvent).',
          'Rien à régler : c’est automatique, pour ton adhérence autant que pour ta perf.',
        ]
      : [
          'Main lifts stay stable so you can progress and stay fresh for the weekend.',
          'Lower, Primer and Full rotate a bit by block (Foundations = slower, Performance = more often).',
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
