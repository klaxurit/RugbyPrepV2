/**
 * Couche d'orchestration pure — source de vérité pour la surface joueur.
 *
 * Politique annual-first :
 * - mother_session = surface canonique dès qu'une résolution exploitable existe
 * - unavailable = état d'indisponibilité si la résolution échoue
 * - legacy n'est plus jamais exposé comme surface joueur
 *
 * Aucun hook React ici. Entrée = données pures, sortie = décision + résultats.
 */
import type { CalendarEvent, CycleWeek, SessionLog, UserProfile } from '../../types/training'
import type { AnnualPlanningContext } from '../../types/annualPlanning'
import type {
  ResolveMotherSessionsForWeekResult,
} from '../motherSession/resolveMotherSessionsForWeek'
import { resolveMotherSessionsForWeek } from '../motherSession/resolveMotherSessionsForWeek'
import {
  buildAthletePlanningInputs,
  type AcwrZoneInput,
} from '../annualPlanning/buildAthletePlanningInputs'
import type { ProgramFeatureFlags } from './policies/featureFlags'

// ── Types publics ────────────────────────────────────────────────────────────

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
}

export interface WeeklyProgramSurfaceResult {
  primarySource: WeeklyProgramPrimarySource
  planningContext: AnnualPlanningContext
  planningInputWarnings: string[]
  warnings: string[]
  decisionReason: string

  motherSession?: ResolveMotherSessionsForWeekResult
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
  })

  // 2. Résoudre les mother sessions
  const motherSessionResult = resolveMotherSessionsForWeek(inputs)
  const planningContext = motherSessionResult.planningContext

  // 3. Décision : mother_session si exploitable, unavailable sinon
  const msExploitable =
    motherSessionResult.status !== 'missing_session' &&
    motherSessionResult.sessions.length > 0

  const primarySource: WeeklyProgramPrimarySource = msExploitable
    ? 'mother_session'
    : 'unavailable'

  const decisionReason = msExploitable
    ? `Programme annuel — ${planningContext.weekLabel}`
    : 'Résolution annual indisponible.'

  const warnings: string[] = []
  if (!msExploitable) {
    warnings.push('Le plan annuel n\'a pas pu être résolu pour cette semaine.')
  }

  return {
    primarySource,
    planningContext,
    planningInputWarnings,
    warnings: [...warnings, ...motherSessionResult.warnings],
    decisionReason,
    motherSession: motherSessionResult,
  }
}
