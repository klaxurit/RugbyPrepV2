import { getWeeklyTemplate, type WeeklySessionSlot } from '../../data/weeklyTemplates'
import { MOTHER_SESSIONS_BY_ID } from '../../data/motherSessions.generated'
import type { AthletePlanningInputs, AnnualPlanningContext } from '../../types/annualPlanning'
import type { MotherSession } from '../../types/motherSession'
import { detectAnnualPlanningContext } from '../season/detectAnnualPlanningContext'

/** Entrée alignée sur le contexte annuel (identity, ancres, monitoring). */
export type ResolveMotherSessionsForWeekParams = AthletePlanningInputs

/** Surcharge du dataset (ex. tests) — par défaut `MOTHER_SESSIONS_BY_ID` généré. */
export interface ResolveMotherSessionsForWeekOptions {
  sessionsById?: Record<string, MotherSession>
}

export interface ResolvedMotherSessionSlot {
  sessionId: string
  session: MotherSession
  role: 'primary' | 'secondary' | 'optional'
  dayPreference?: 'early_week' | 'mid_week' | 'late_week' | 'pre_match'
  variant?: 'normal' | 'light'
  maxBlocks?: number
}

export interface ResolvedWeeklyTemplateContext {
  cycle: 'pre_season' | 'in_season' | 'off_season'
  phase?: 1 | 2 | 3
  offSeasonPhase?: 1 | 2 | 3 | 4
  matchContext?: 'match_week' | 'no_match_week'
  requestedFrequency: 2 | 3 | 4
  effectiveFrequency: 2 | 3 | 4
  positionGroup: 'front_row' | 'back_three'
  fatigueLevel: 'normal' | 'high' | 'very_high'
  /** Playoffs V1 : logique type in-season match week + primer allégé */
  playoffsTaper?: boolean
}

export interface ResolveMotherSessionsForWeekResult {
  status: 'resolved' | 'resolved_with_warnings' | 'missing_session'
  planningContext: AnnualPlanningContext
  templateContext?: ResolvedWeeklyTemplateContext
  sessions: ResolvedMotherSessionSlot[]
  warnings: string[]
  companionRecommendations?: string[]
  missingSessionIds?: string[]
  message?: string
}

const PRIMER_IDS: Record<'front_row' | 'back_three', string> = {
  front_row: 'FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1',
  back_three: 'FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_V1',
}

function mergeWarnings(
  planningContext: AnnualPlanningContext,
  templateWarnings: string[],
  extra: string[]
): string[] {
  return [...planningContext.planningTrace.warnings, ...templateWarnings, ...extra]
}

function finalizeStatus(
  missingIds: string[],
  allWarnings: string[],
  companions: string[] | undefined
): 'resolved' | 'resolved_with_warnings' | 'missing_session' {
  if (missingIds.length > 0) return 'missing_session'
  if (allWarnings.length > 0 || (companions !== undefined && companions.length > 0)) {
    return 'resolved_with_warnings'
  }
  return 'resolved'
}

function applyPlayoffsPrimerLight(
  slots: WeeklySessionSlot[],
  positionGroup: 'front_row' | 'back_three'
): WeeklySessionSlot[] {
  const primerId = PRIMER_IDS[positionGroup]
  return slots.map((s) =>
    s.sessionId === primerId
      ? {
          ...s,
          variant: 'light' as const,
          maxBlocks: 2,
          dayPreference: 'pre_match' as const,
        }
      : s
  )
}

function hydrateSlots(
  slots: WeeklySessionSlot[],
  planningContext: AnnualPlanningContext,
  templateContext: ResolvedWeeklyTemplateContext,
  templateWarnings: string[],
  companionRecommendations: string[] | undefined,
  resolverWarnings: string[],
  sessionsById: Record<string, MotherSession>
): ResolveMotherSessionsForWeekResult {
  const missingSessionIds: string[] = []
  const sessions: ResolvedMotherSessionSlot[] = []

  for (const slot of slots) {
    const session = sessionsById[slot.sessionId]
    if (!session) {
      missingSessionIds.push(slot.sessionId)
    } else {
      sessions.push({
        sessionId: slot.sessionId,
        session,
        role: slot.role,
        dayPreference: slot.dayPreference,
        variant: slot.variant,
        maxBlocks: slot.maxBlocks,
      })
    }
  }

  const warnings = mergeWarnings(planningContext, templateWarnings, resolverWarnings)
  const status = finalizeStatus(missingSessionIds, warnings, companionRecommendations)

  if (missingSessionIds.length > 0) {
    return {
      status: 'missing_session',
      planningContext,
      templateContext,
      sessions: [],
      warnings,
      companionRecommendations,
      missingSessionIds,
      message: `Mother session(s) absentes du dataset : ${missingSessionIds.join(', ')}.`,
    }
  }

  return {
    status,
    planningContext,
    templateContext,
    sessions,
    warnings,
    companionRecommendations,
  }
}

/**
 * Détermine les mother sessions pour la semaine de `today` via le contexte annuel,
 * templates hebdo (pré / in / off / playoffs V1) et dataset consolidé.
 */
export function resolveMotherSessionsForWeek(
  params: ResolveMotherSessionsForWeekParams,
  options?: ResolveMotherSessionsForWeekOptions
): ResolveMotherSessionsForWeekResult {
  const sessionsById = options?.sessionsById ?? MOTHER_SESSIONS_BY_ID
  const planningContext = detectAnnualPlanningContext(params)
  const { weeklyFrequency, positionGroup, fatigueLevel } = planningContext

  const resolverWarnings: string[] = []

  // ── Playoffs V1 : variante in-season « match week » + primer light forcé en 3x
  // ── Playoffs tapering : fréquence plafonnée à 2, volume -50% (Mujika & Padilla 2003)
  if (planningContext.cycle === 'playoffs') {
    resolverWarnings.push('Playoffs taper : fréquence plafonnée à 2, volume -50%, intensité maintenue.')
    const tpl = getWeeklyTemplate({
      cycle: 'in_season',
      frequency: 2,
      positionGroup,
      fatigueLevel,
    })
    const taperSlots = tpl.sessions.map((s) => ({
      ...s,
      variant: 'light' as const,
      maxBlocks: 2,
    }))
    const templateContext: ResolvedWeeklyTemplateContext = {
      cycle: 'in_season',
      requestedFrequency: weeklyFrequency,
      effectiveFrequency: 2,
      positionGroup,
      fatigueLevel,
      playoffsTaper: true,
    }
    return hydrateSlots(
      taperSlots,
      planningContext,
      templateContext,
      tpl.warnings,
      ['Maintenir mobilité et activation neuromusculaire. Récupération prioritaire.'],
      resolverWarnings,
      sessionsById
    )
  }

  // ── Off-season
  if (planningContext.cycle === 'off_season') {
    if (planningContext.offSeasonPhase === undefined) {
      throw new Error(
        'resolveMotherSessionsForWeek: offSeasonPhase manquant pour cycle off_season.'
      )
    }
    const tpl = getWeeklyTemplate({
      cycle: 'off_season',
      offSeasonPhase: planningContext.offSeasonPhase,
      frequency: weeklyFrequency,
      positionGroup,
      fatigueLevel,
    })
    const templateContext: ResolvedWeeklyTemplateContext = {
      cycle: 'off_season',
      offSeasonPhase: planningContext.offSeasonPhase,
      requestedFrequency: tpl.requestedFrequency,
      effectiveFrequency: tpl.effectiveFrequency,
      positionGroup,
      fatigueLevel,
    }
    return hydrateSlots(
      tpl.sessions,
      planningContext,
      templateContext,
      tpl.warnings,
      tpl.companionRecommendations,
      resolverWarnings,
      sessionsById
    )
  }

  // ── Pré-saison
  if (planningContext.cycle === 'pre_season') {
    if (planningContext.preSeasonPhase === undefined) {
      throw new Error(
        'resolveMotherSessionsForWeek: preSeasonPhase manquant pour cycle pre_season.'
      )
    }
    const tpl = getWeeklyTemplate({
      cycle: 'pre_season',
      phase: planningContext.preSeasonPhase,
      frequency: weeklyFrequency,
      positionGroup,
      fatigueLevel,
    })
    const templateContext: ResolvedWeeklyTemplateContext = {
      cycle: 'pre_season',
      phase: planningContext.preSeasonPhase,
      requestedFrequency: tpl.requestedFrequency,
      effectiveFrequency: tpl.effectiveFrequency,
      positionGroup,
      fatigueLevel,
    }
    return hydrateSlots(
      tpl.sessions,
      planningContext,
      templateContext,
      tpl.warnings,
      tpl.companionRecommendations,
      resolverWarnings,
      sessionsById
    )
  }

  // ── In-season recovery override : very_high fatigue → séances de récupération
  // Le cycle reste in_season côté affichage. Seul loadManagementOverride change.
  if (planningContext.fatigueLevel === 'very_high') {
    const recoverySlots: WeeklySessionSlot[] = [
      { sessionId: 'FULL_OFFSEASON_RECOVERY_A_V1', role: 'primary', dayPreference: 'early_week' },
      { sessionId: 'FULL_OFFSEASON_RECOVERY_B_V1', role: 'primary', dayPreference: 'late_week' },
    ]
    const recoveryContext: ResolvedWeeklyTemplateContext = {
      cycle: 'in_season',
      requestedFrequency: weeklyFrequency,
      effectiveFrequency: 2,
      positionGroup,
      fatigueLevel,
    }
    return hydrateSlots(
      recoverySlots,
      { ...planningContext, loadManagementOverride: 'recovery' },
      recoveryContext,
      [],
      ['2x 20-30 min zone 2 (marche, vélo, jogging léger)'],
      resolverWarnings,
      sessionsById
    )
  }

  // ── In-season deload week (3:1 mesocycle) — volume réduit, intensité maintenue
  if (planningContext.isDeloadWeek) {
    resolverWarnings.push('Semaine de décharge (3:1) — volume réduit, intensité maintenue.')
    const deloadTpl = getWeeklyTemplate({
      cycle: 'in_season',
      frequency: 2,
      positionGroup,
      fatigueLevel,
    })
    const deloadSlots = deloadTpl.sessions.map((s) => ({
      ...s,
      variant: 'light' as const,
      maxBlocks: 2,
    }))
    const deloadContext: ResolvedWeeklyTemplateContext = {
      cycle: 'in_season',
      requestedFrequency: weeklyFrequency,
      effectiveFrequency: 2,
      positionGroup,
      fatigueLevel,
    }
    return hydrateSlots(
      deloadSlots,
      { ...planningContext, loadManagementOverride: 'recovery' },
      deloadContext,
      deloadTpl.warnings,
      ['1-2x zone 2 (20-30 min) — maintien cardiovasculaire'],
      resolverWarnings,
      sessionsById
    )
  }

  // ── In-season trêve adaptation (gap > 3 weeks between matches)
  const dun = planningContext.daysUntilNextMatch
  const dsl = planningContext.daysSinceLastMatch

  if (dun != null && dun > 21) {
    if (dun <= 7) {
      // Last week before match return: deload + activation (ramp-down)
      resolverWarnings.push('Reprise J-' + dun + ' — programme allégé pour la ré-acclimation.')
      const rampTpl = getWeeklyTemplate({ cycle: 'in_season', frequency: 2, positionGroup, fatigueLevel })
      const rampSlots = rampTpl.sessions.map((s) => ({ ...s, variant: 'light' as const, maxBlocks: 2 }))
      return hydrateSlots(
        rampSlots,
        { ...planningContext, loadManagementOverride: 'recovery' },
        { cycle: 'in_season', requestedFrequency: weeklyFrequency, effectiveFrequency: 2, positionGroup, fatigueLevel },
        rampTpl.warnings,
        ['Activation neuromusculaire + mobilité avant la reprise des matchs'],
        resolverWarnings,
        sessionsById
      )
    }
    // Deep in trêve: use no_match_week templates (full body available) — opportunity for force block
    resolverWarnings.push(`Trêve détectée — prochain match dans ${Math.floor(dun / 7)} semaines. Bloc force opportuniste.`)
    const treveTpl = getWeeklyTemplate({
      cycle: 'in_season',
      frequency: weeklyFrequency,
      positionGroup,
      matchContext: weeklyFrequency === 3 ? 'no_match_week' : undefined,
      fatigueLevel,
    })
    return hydrateSlots(
      treveTpl.sessions,
      planningContext,
      { cycle: 'in_season', requestedFrequency: treveTpl.requestedFrequency, effectiveFrequency: treveTpl.effectiveFrequency, positionGroup, matchContext: 'no_match_week', fatigueLevel },
      treveTpl.warnings,
      ['Profite de la trêve : volume légèrement supérieur possible (pas de charge de match)'],
      resolverWarnings,
      sessionsById
    )
  }

  // ── In-season ramp-up after 2+ week gap, match approaching in 5-14 days
  if (dun != null && dun >= 5 && dun <= 14 && dsl != null && dsl >= 14) {
    resolverWarnings.push('Reprise après pause — programme allégé cette semaine.')
    const rampTpl = getWeeklyTemplate({ cycle: 'in_season', frequency: 2, positionGroup, fatigueLevel })
    const rampSlots = rampTpl.sessions.map((s) => ({ ...s, variant: 'light' as const, maxBlocks: 2 }))
    return hydrateSlots(
      rampSlots,
      { ...planningContext, loadManagementOverride: 'recovery' },
      { cycle: 'in_season', requestedFrequency: weeklyFrequency, effectiveFrequency: 2, positionGroup, fatigueLevel },
      rampTpl.warnings,
      ['Reprise progressive — ne pas charger trop vite après une pause'],
      resolverWarnings,
      sessionsById
    )
  }

  // ── In-season normal
  const matchContext = planningContext.isMatchWeek ? 'match_week' : 'no_match_week'
  const tpl = getWeeklyTemplate({
    cycle: 'in_season',
    frequency: weeklyFrequency,
    positionGroup,
    matchContext: weeklyFrequency === 3 ? matchContext : undefined,
    fatigueLevel,
  })

  // Stimulus variation: alternate session emphasis by mesocycle block
  // Odd blocks (1,3,5): LOWER early_week (force emphasis)
  // Even blocks (2,4,6): UPPER early_week (power/speed emphasis)
  let sessions = [...tpl.sessions]
  const mesocycleBlock = planningContext.mesocycleBlock ?? 1
  const isForceEmphasis = mesocycleBlock % 2 === 1
  if (!isForceEmphasis && sessions.length >= 2) {
    const [first, second, ...rest] = sessions
    sessions = [
      { ...second, dayPreference: 'early_week' as const },
      { ...first, dayPreference: 'mid_week' as const },
      ...rest,
    ]
  }

  const templateContext: ResolvedWeeklyTemplateContext = {
    cycle: 'in_season',
    requestedFrequency: tpl.requestedFrequency,
    effectiveFrequency: tpl.effectiveFrequency,
    positionGroup,
    matchContext: weeklyFrequency === 3 ? matchContext : undefined,
    fatigueLevel,
  }
  return hydrateSlots(
    sessions,
    planningContext,
    templateContext,
    tpl.warnings,
    tpl.companionRecommendations,
    resolverWarnings,
    sessionsById
  )
}
