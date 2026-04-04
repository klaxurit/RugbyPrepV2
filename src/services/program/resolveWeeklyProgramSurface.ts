/**
 * Couche d'orchestration pure — source de vérité pour la surface joueur.
 *
 * Politique annual-first :
 * - mother_session = surface canonique dès qu'une résolution exploitable existe
 * - quand la résolution échoue, un fallback séquentiel safe est produit
 *   (l'état terminal `unavailable` n'est plus émis au runtime)
 * - legacy n'est plus jamais exposé comme surface joueur
 *
 * Aucun hook React ici. Entrée = données pures, sortie = décision + résultats.
 */
import type { CalendarEvent, CycleWeek, SessionLog, UserProfile } from '../../types/training'
import type { AnnualPlanningContext } from '../../types/annualPlanning'
import type { SchedulingMode, SchedulingModeResult } from '../../types/scheduling'
import type {
  ResolveMotherSessionsForWeekResult,
} from '../motherSession/resolveMotherSessionsForWeek'
import { resolveMotherSessionsForWeek } from '../motherSession/resolveMotherSessionsForWeek'
import {
  buildAthletePlanningInputs,
  type AcwrZoneInput,
} from '../annualPlanning/buildAthletePlanningInputs'
import { resolveSchedulingMode } from '../scheduling/resolveSchedulingMode'
import { buildSafeSequentialFallback } from '../scheduling/buildSafeSequentialFallback'
import type { ProgramFeatureFlags } from './policies/featureFlags'

// ── Types publics ────────────────────────────────────────────────────────────

/** `'unavailable'` is retained in the union for downstream type compat but never emitted at runtime. */
export type WeeklyProgramPrimarySource = 'mother_session' | 'unavailable'

export interface ResolveWeeklyProgramSurfaceParams {
  profile: UserProfile
  events: CalendarEvent[]
  logs: SessionLog[]
  today: string
  fatigue: 'OK' | 'FATIGUE'
  acwrZone?: AcwrZoneInput
  week: CycleWeek
  lastNonDeloadWeek: CycleWeek
  ignoreAcwrOverload?: boolean
  hasSufficientACWRData?: boolean
  featureFlags?: Partial<ProgramFeatureFlags>
  readinessScore?: number
  jumpTrend?: 'up' | 'flat' | 'down'
}

export interface WeeklyProgramSurfaceResult {
  primarySource: WeeklyProgramPrimarySource
  planningContext: AnnualPlanningContext
  planningInputWarnings: string[]
  warnings: string[]
  decisionReason: string

  motherSession?: ResolveMotherSessionsForWeekResult

  schedulingMode: SchedulingMode
  schedulingModeResult: SchedulingModeResult
}

// ── Résolution ───────────────────────────────────────────────────────────────

export function resolveWeeklyProgramSurface(
  params: ResolveWeeklyProgramSurfaceParams,
): WeeklyProgramSurfaceResult {
  const {
    profile,
    events,
    logs,
    today,
    fatigue,
    acwrZone,
    readinessScore,
    jumpTrend,
  } = params

  // 1. Résoudre le contexte annuel (planning inputs + detection)
  const { inputs, warnings: planningInputWarnings } = buildAthletePlanningInputs({
    profile,
    events,
    logs,
    today,
    fatigue,
    acwrZone,
    athleteIdentity: undefined,
    readinessScore,
    jumpTrend,
  })

  // 2. Résoudre le scheduling mode (après planning inputs pour accéder aux anchors)
  const schedulingModeResult = resolveSchedulingMode({
    events,
    today,
    planningAnchors: inputs.planningAnchors,
    onboardingCycleHint: inputs.planningAnchors?.onboardingCycleHint,
  })

  // 3. Résoudre les mother sessions
  const motherSessionResult = resolveMotherSessionsForWeek(inputs)
  const planningContext = motherSessionResult.planningContext

  // 4. Décision : mother_session si exploitable, fallback séquentiel sinon
  const msExploitable =
    motherSessionResult.status !== 'missing_session' &&
    motherSessionResult.sessions.length > 0

  if (msExploitable) {
    return {
      primarySource: 'mother_session',
      planningContext,
      planningInputWarnings,
      warnings: [...motherSessionResult.warnings],
      decisionReason: `Programme annuel — ${planningContext.weekLabel}`,
      motherSession: motherSessionResult,
      schedulingMode: schedulingModeResult.mode,
      schedulingModeResult,
    }
  }

  // ── Fallback : le moteur n'a pas produit de sessions exploitables ──
  // Construire un programme séquentiel safe, en préservant le planningContext
  // et les warnings du moteur original.
  const fallback = buildSafeSequentialFallback(planningContext)

  // Merge warnings: original engine warnings + fallback warnings (no duplicates)
  const mergedWarnings = [
    'Le plan annuel n\'a pas pu être résolu pour cette semaine.',
    ...motherSessionResult.warnings,
    ...fallback.warnings,
  ]

  return {
    primarySource: 'mother_session',
    planningContext,
    planningInputWarnings,
    warnings: mergedWarnings,
    decisionReason: `Programme adapté — ${planningContext.weekLabel}`,
    motherSession: fallback,
    schedulingMode: 'sequential',
    schedulingModeResult: {
      mode: 'sequential',
      confidence: 'high',
      reason: 'engine_fallback_no_sessions',
      calendarSignalStrength: 0,
    },
  }
}
