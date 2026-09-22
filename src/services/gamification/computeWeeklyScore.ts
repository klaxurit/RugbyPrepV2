import type { ACWRZone } from '../../types/acwr.ts'
import type { WeeklyScore, WeeklyScoreBreakdown } from '../../types/gamification.ts'
import { SCORE_CAPS, SCORE_POINTS } from './scoreConstants.ts'

/**
 * Entrées du score hebdomadaire.
 *
 * Répartition de l'autorité : le client connaît le **plan** (le moteur de
 * planification vit côté app), le serveur connaît les **séances réellement
 * enregistrées** et applique les plafonds. Les compteurs de séances passés ici
 * doivent donc toujours provenir de `session_logs`, jamais d'un état client.
 */
export interface WeeklyScoreInput {
  /** Lundi de la semaine, YYYY-MM-DD. */
  weekStartISO: string
  /** Séances prévues au programme pour cette semaine. */
  sessionsPlanned: number
  /** Séances prévues qui ont été complétées. */
  plannedSessionsCompleted: number
  /** Séances complétées hors programme. */
  offPlanSessionsCompleted: number
  /** Jours de repos prescrits (J-1 / J+1 de match) effectivement respectés. */
  prescribedRestRespected: number
  /** La semaine est une semaine de décharge. */
  isDeloadWeek: boolean
  /**
   * Nombre de séances d'une semaine de charge normale pour cet athlète. Sert
   * à compenser la semaine de deload pour qu'elle rapporte autant.
   */
  referenceSessionCount: number
  /** RPE et durée renseignés sur toutes les séances complétées. */
  allCompletedHaveLoadData: boolean
  /** Semaines consécutives déjà tenues avant celle-ci. */
  priorWeekStreak: number
  /** Zone ACWR de l'athlète, ou null si l'historique est insuffisant. */
  acwrZone: ACWRZone | null
}

/** Zones où l'ajout de volume ne doit plus rien rapporter. */
function isOverloaded(zone: ACWRZone | null): boolean {
  return zone === 'danger' || zone === 'critical'
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(Math.max(Math.trunc(value), min), max)
}

function sumBreakdown(breakdown: WeeklyScoreBreakdown): number {
  return (
    breakdown.plannedSessions +
    breakdown.offPlanSessions +
    breakdown.prescribedRest +
    breakdown.fullPlanBonus +
    breakdown.deloadCompensation +
    breakdown.logQualityBonus +
    breakdown.streakBonus
  )
}

/**
 * Calcule le score d'une semaine.
 *
 * Propriétés garanties, couvertes par les tests :
 *  - une semaine de deload respectée rapporte autant qu'une semaine de charge
 *    respectée ;
 *  - ajouter des séances au-delà du plan ne rapporte jamais plus d'une séance
 *    hors plan, et rien du tout en zone de surcharge ;
 *  - le score ne dépend ni du tonnage, ni de la charge, ni de la valeur du RPE
 *    (seulement de la présence des champs, qui conditionne la fiabilité de
 *    l'ACWR) ;
 *  - le total est monotone en conformité : tenir plus de son plan ne fait
 *    jamais baisser le score.
 */
export function computeWeeklyScore(input: WeeklyScoreInput): WeeklyScore {
  const sessionsPlanned = clamp(
    input.sessionsPlanned,
    0,
    SCORE_CAPS.MAX_PLANNED_SESSIONS_PER_WEEK,
  )
  const plannedCompleted = clamp(input.plannedSessionsCompleted, 0, sessionsPlanned)
  const acwrCapped = isOverloaded(input.acwrZone)

  const offPlanCounted = acwrCapped
    ? 0
    : clamp(
        input.offPlanSessionsCompleted,
        0,
        SCORE_CAPS.OFF_PLAN_SESSIONS_PER_WEEK,
      )

  const restCounted = clamp(
    input.prescribedRestRespected,
    0,
    SCORE_CAPS.PRESCRIBED_REST_PER_WEEK,
  )

  const planFullyRespected = sessionsPlanned > 0 && plannedCompleted === sessionsPlanned
  const deloadRespected = input.isDeloadWeek && planFullyRespected

  // Une semaine de décharge comporte moins de séances par construction. Sans
  // compensation, respecter un deload coûterait des points — exactement
  // l'incitation à ne pas se reposer qu'il faut éviter.
  const referenceSessions = clamp(
    input.referenceSessionCount,
    0,
    SCORE_CAPS.MAX_PLANNED_SESSIONS_PER_WEEK,
  )
  const missingVersusReference = Math.max(0, referenceSessions - sessionsPlanned)
  const deloadCompensation = deloadRespected
    ? missingVersusReference * SCORE_POINTS.PLANNED_SESSION
    : 0

  const streakWeeks = planFullyRespected
    ? clamp(
        input.priorWeekStreak + 1,
        0,
        SCORE_CAPS.MAX_STREAK_WEEKS_COUNTED,
      )
    : 0

  const breakdown: WeeklyScoreBreakdown = {
    plannedSessions: plannedCompleted * SCORE_POINTS.PLANNED_SESSION,
    offPlanSessions: offPlanCounted * SCORE_POINTS.OFF_PLAN_SESSION,
    prescribedRest: restCounted * SCORE_POINTS.PRESCRIBED_REST,
    fullPlanBonus: planFullyRespected ? SCORE_POINTS.FULL_PLAN_BONUS : 0,
    deloadCompensation,
    logQualityBonus:
      input.allCompletedHaveLoadData && plannedCompleted + offPlanCounted > 0
        ? SCORE_POINTS.LOG_QUALITY_BONUS
        : 0,
    streakBonus: streakWeeks * SCORE_POINTS.PER_STREAK_WEEK,
  }

  return {
    weekStartISO: input.weekStartISO,
    points: sumBreakdown(breakdown),
    sessionsPlanned,
    sessionsCompleted: plannedCompleted + offPlanCounted,
    deloadRespected,
    acwrCapped,
    breakdown,
  }
}
