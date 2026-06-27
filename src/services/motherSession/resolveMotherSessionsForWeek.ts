import { getWeeklyTemplate, type WeeklySessionSlot } from '../../data/weeklyTemplates'
import { MOTHER_SESSIONS_BY_ID } from '../../data/motherSessions.generated'
import type { AthletePlanningInputs, AnnualPlanningContext, PlayoffTaperPhase } from '../../types/annualPlanning'
import type { MotherSession } from '../../types/motherSession'
import type { Equipment } from '../../types/training'
import {
  bodyweightSessionFallbackWarning,
  mapWeeklySlotsForEquipment,
} from '../equipment/motherSessionEquipmentMap'
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
  offSeasonPhase?: 1 | 2 | 3 | 4 | 5
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

function applyEquipmentProgramToSlots(
  slots: WeeklySessionSlot[],
  equipment: AthletePlanningInputs['equipment'],
  resolverWarnings: string[],
): WeeklySessionSlot[] {
  const mapped = mapWeeklySlotsForEquipment(slots, equipment)
  for (let i = 0; i < slots.length; i += 1) {
    const warning = bodyweightSessionFallbackWarning(slots[i].sessionId, mapped[i].sessionId, equipment)
    if (warning) resolverWarnings.push(warning)
  }
  return mapped
}

function hydrateSlots(
  slots: WeeklySessionSlot[],
  planningContext: AnnualPlanningContext,
  templateContext: ResolvedWeeklyTemplateContext,
  templateWarnings: string[],
  companionRecommendations: string[] | undefined,
  resolverWarnings: string[],
  sessionsById: Record<string, MotherSession>,
  equipment?: Equipment[],
): ResolveMotherSessionsForWeekResult {
  const resolvedSlots = applyEquipmentProgramToSlots(slots, equipment, resolverWarnings)
  const missingSessionIds: string[] = []
  const sessions: ResolvedMotherSessionSlot[] = []

  for (const slot of resolvedSlots) {
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
  const result = resolveMotherSessionsForWeekCore(params, options)

  // ── Post-process: long-absence adaptation (>28 days) ───────────────
  const monitoring = result.planningContext.monitoringSnapshot
  const isLongAbsence =
    monitoring?.completedSessionsLast7d === 0 &&
    monitoring?.completedSessionsLast28d === 0 &&
    monitoring?.hasHistoricalLogs === true

  if (isLongAbsence && result.status !== 'missing_session') {
    return applyLongAbsenceAdaptation(result)
  }

  return result
}

function resolveMotherSessionsForWeekCore(
  params: ResolveMotherSessionsForWeekParams,
  options?: ResolveMotherSessionsForWeekOptions
): ResolveMotherSessionsForWeekResult {
  const sessionsById = options?.sessionsById ?? MOTHER_SESSIONS_BY_ID
  const planningContext = detectAnnualPlanningContext(params)
  const { weeklyFrequency, positionGroup, fatigueLevel } = planningContext
  const { equipment } = params

  const resolverWarnings: string[] = []

  // ── Playoffs V2 : taper phasé (Mujika & Padilla 2003)
  if (planningContext.cycle === 'playoffs') {
    const taperPhase: PlayoffTaperPhase = planningContext.playoffTaperPhase ?? 'taper_1'

    const taperConfig: Record<PlayoffTaperPhase, { freq: 2 | 3; maxBlocks: number; variant: 'normal' | 'light' }> = {
      taper_1:    { freq: Math.min(weeklyFrequency, 3) as 2 | 3, maxBlocks: 3, variant: 'normal' },
      taper_2:    { freq: 2, maxBlocks: 2, variant: 'light' },
      match_week: { freq: 2, maxBlocks: 2, variant: 'light' },
    }

    const cfg = taperConfig[taperPhase]
    const TAPER_LABEL_FR: Record<PlayoffTaperPhase, string> = {
      taper_1: 'Phase 1 — Maintien',
      taper_2: 'Phase 2 — Affûtage',
      match_week: 'Semaine de match',
    }
    const volumeReduction =
      taperPhase === 'taper_1' ? '−30 %' : taperPhase === 'taper_2' ? '−50 %' : '−50 %'
    resolverWarnings.push(
      `Playoffs · ${TAPER_LABEL_FR[taperPhase]} — volume ${volumeReduction}, intensité maintenue.`,
    )

    // Match-week playoffs : on s'écarte du template in-season générique
    // (LOWER+UPPER) pour composer FULL_BODY + FULL_LIGHT_PRIMER.
    // Sources : Jones et al. 2017 (72 % des équipes pro rugby = full body en
    // match week), Duthie 2006 (distribution bilatérale > split pour limiter
    // fatigue localisée pré-match), Argus et al. 2010.
    let taperSlots: (WeeklySessionSlot & { variant: 'normal' | 'light'; maxBlocks: number })[]
    let tplWarnings: string[] = []

    if (taperPhase === 'match_week') {
      const posSuffix = positionGroup === 'front_row' ? 'FRONT_ROW' : 'BACK_THREE'
      taperSlots = [
        {
          sessionId: `FULL_BODY_IN_SEASON_${posSuffix}_V1`,
          role: 'primary',
          dayPreference: 'early_week',
          variant: cfg.variant,
          maxBlocks: 3,
        },
        {
          sessionId: `FULL_LIGHT_PRIMER_IN_SEASON_${posSuffix}_V1`,
          role: 'primary',
          dayPreference: 'pre_match',
          variant: cfg.variant,
          maxBlocks: 3,
        },
      ]
    } else {
      const tpl = getWeeklyTemplate({
        cycle: 'in_season',
        frequency: cfg.freq,
        positionGroup,
        matchContext: cfg.freq === 3 ? 'match_week' : undefined,
        fatigueLevel,
      })
      taperSlots = tpl.sessions.map((s) => ({
        ...s,
        variant: cfg.variant,
        maxBlocks: cfg.maxBlocks,
      }))
      tplWarnings = tpl.warnings
    }
    const templateContext: ResolvedWeeklyTemplateContext = {
      cycle: 'in_season',
      requestedFrequency: weeklyFrequency,
      effectiveFrequency: cfg.freq,
      positionGroup,
      fatigueLevel,
      playoffsTaper: true,
    }
    return hydrateSlots(
      taperSlots,
      planningContext,
      templateContext,
      tplWarnings,
      ['Maintenir mobilité et activation neuromusculaire. Récupération prioritaire.'],
      resolverWarnings,
      sessionsById,
      equipment,
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
      maintenanceParity: (planningContext.weekNumber ?? 1) % 2 === 1 ? 'A' : 'B',
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
      sessionsById,
      equipment,
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
      sessionsById,
      equipment,
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
      sessionsById,
      equipment,
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
      sessionsById,
      equipment,
    )
  }

  // ── In-season trêve V2 : utiliser le sous-mode calculé par detectAnnualPlanningContext
  if (planningContext.inSeasonSubMode === 'treve_rampup') {
    resolverWarnings.push('Ramp-up pré-reprise — programme allégé pour ré-acclimation.')
    const rampTpl = getWeeklyTemplate({ cycle: 'in_season', frequency: 2, positionGroup, fatigueLevel })
    const rampSlots = rampTpl.sessions.map((s) => ({ ...s, variant: 'light' as const, maxBlocks: 2 }))
    return hydrateSlots(
      rampSlots,
      { ...planningContext, loadManagementOverride: 'recovery' },
      { cycle: 'in_season', requestedFrequency: weeklyFrequency, effectiveFrequency: 2, positionGroup, fatigueLevel },
      rampTpl.warnings,
      ['Activation neuromusculaire + mobilité avant la reprise des matchs'],
      resolverWarnings,
      sessionsById,
      equipment,
    )
  }

  if (planningContext.inSeasonSubMode === 'treve_return') {
    resolverWarnings.push('Semaine de retour post-trêve — intensité progressive.')
    const returnTpl = getWeeklyTemplate({
      cycle: 'in_season',
      frequency: weeklyFrequency,
      positionGroup,
      matchContext: 'no_match_week',
      fatigueLevel,
    })
    return hydrateSlots(
      returnTpl.sessions,
      planningContext,
      { cycle: 'in_season', requestedFrequency: weeklyFrequency, effectiveFrequency: returnTpl.effectiveFrequency, positionGroup, matchContext: 'no_match_week', fatigueLevel },
      returnTpl.warnings,
      ['Reprise progressive — maintenir l\'intensité, ne pas surcharger le volume'],
      resolverWarnings,
      sessionsById,
      equipment,
    )
  }

  if (planningContext.inSeasonSubMode === 'treve_deep') {
    resolverWarnings.push(`Trêve détectée — prochain match dans ${Math.floor((planningContext.daysUntilNextMatch ?? 0) / 7)} semaines. Bloc force opportuniste.`)
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
      sessionsById,
      equipment,
    )
  }

  // ── Fin de saison : dernier match passé, aucun match futur, avant la bascule auto
  // en inter-saison. Fenêtre de décompression — volume réduit, maintien sans surcharge.
  if (planningContext.inSeasonSubMode === 'end_of_season') {
    resolverWarnings.push('Fin de saison — décompression : volume réduit avant la coupure inter-saison.')
    const eosTpl = getWeeklyTemplate({ cycle: 'in_season', frequency: 2, positionGroup, fatigueLevel })
    const eosSlots = eosTpl.sessions.map((s) => ({ ...s, variant: 'light' as const, maxBlocks: 2 }))
    return hydrateSlots(
      eosSlots,
      { ...planningContext, loadManagementOverride: 'recovery' },
      { cycle: 'in_season', requestedFrequency: weeklyFrequency, effectiveFrequency: 2, positionGroup, fatigueLevel },
      eosTpl.warnings,
      ['Décompression de fin de saison — entretien léger, on relâche avant la coupure'],
      resolverWarnings,
      sessionsById,
      equipment,
    )
  }

  // ── Monitoring micro-modulation V2 : readinessScore et jumpTrend
  const monitoring = planningContext.monitoringSnapshot
  let microMaxBlocksOverride: number | undefined
  if (monitoring) {
    if (monitoring.readinessScore != null && monitoring.readinessScore < 50) {
      resolverWarnings.push('Readiness basse — volume réduit cette semaine.')
      microMaxBlocksOverride = 2
    }
    if (monitoring.jumpTrend === 'down') {
      resolverWarnings.push('Tendance CMJ en baisse — fatigue neuromusculaire probable, volume réduit.')
      microMaxBlocksOverride = 2
    }
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

  // Apply micro-modulation maxBlocks override if set
  if (microMaxBlocksOverride != null) {
    sessions = sessions.map((s) => ({ ...s, maxBlocks: microMaxBlocksOverride }))
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
    sessionsById,
    equipment,
  )
}

/**
 * Reduce volume for athletes returning after >28 days of inactivity.
 * Uses existing variant/maxBlocks mechanisms — no new session types.
 */
function applyLongAbsenceAdaptation(
  result: ResolveMotherSessionsForWeekResult,
): ResolveMotherSessionsForWeekResult {
  const adaptedSessions = result.sessions.map((slot) => ({
    ...slot,
    variant: 'light' as const,
    maxBlocks: slot.maxBlocks != null
      ? Math.max(slot.maxBlocks - 1, 2)
      : Math.max(slot.session.blocks.length - 1, 2),
  }))

  const warnings = [
    ...result.warnings,
    'Reprise progressive après une longue pause — volume réduit cette semaine.',
  ]

  return {
    ...result,
    sessions: adaptedSessions,
    warnings,
    status: 'resolved_with_warnings',
  }
}
