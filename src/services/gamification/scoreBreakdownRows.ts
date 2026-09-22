import type { Lang } from '../../i18n/appLabels'
import type { WeeklyScore, WeeklyScoreBreakdown } from '../../types/gamification'

/**
 * Mise en mots du détail des points.
 *
 * Fichier `.ts` séparé du composant : exporter ces libellés depuis un `.tsx`
 * casserait `react-refresh/only-export-components`, et donc le job Lint.
 *
 * L'ordre n'est pas décoratif. `prescribedRest` et `deloadCompensation`
 * apparaissent au même rang que les séances tenues, parce que c'est ce qui
 * apprend à l'athlète que le repos programmé rapporte autant que
 * l'entraînement. Les masquer reviendrait à vendre un score de conformité tout
 * en affichant un score de volume.
 */

export interface ScoreBreakdownRow {
  id: keyof WeeklyScoreBreakdown
  label: string
  points: number
}

const LABELS: Record<keyof WeeklyScoreBreakdown, { fr: string; en: string }> = {
  plannedSessions: { fr: 'Séances du plan tenues', en: 'Planned sessions done' },
  offPlanSessions: { fr: 'Séance ajoutée', en: 'Extra session' },
  prescribedRest: { fr: 'Repos prescrit respecté', en: 'Prescribed rest respected' },
  fullPlanBonus: { fr: 'Plan intégralement tenu', en: 'Full plan respected' },
  deloadCompensation: { fr: 'Semaine de décharge tenue', en: 'Deload week respected' },
  logQualityBonus: { fr: 'Séances renseignées', en: 'Sessions fully logged' },
  streakBonus: { fr: 'Régularité', en: 'Consistency' },
}

const ORDER: readonly (keyof WeeklyScoreBreakdown)[] = [
  'plannedSessions',
  'prescribedRest',
  'deloadCompensation',
  'fullPlanBonus',
  'offPlanSessions',
  'logQualityBonus',
  'streakBonus',
]

/** Postes ayant réellement rapporté des points. Les zéros ne sont pas listés. */
export function buildScoreBreakdownRows(
  score: WeeklyScore,
  lang: Lang,
): ScoreBreakdownRow[] {
  return ORDER.filter((id) => (score.breakdown[id] ?? 0) > 0).map((id) => ({
    id,
    label: LABELS[id][lang],
    points: score.breakdown[id],
  }))
}
