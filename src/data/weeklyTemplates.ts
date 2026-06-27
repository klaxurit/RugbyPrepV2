/**
 * Modèle de données des weekly templates (pré-saison / in-season / off-season).
 * Aligné sur docs/training/mother-sessions/WEEKLY_TEMPLATES_*.md — sans lecture runtime des MD.
 */

import type { OffSeasonPhase } from '../types/annualPlanning'
import type { FatigueLevel } from '../types/training'

export type Cycle = 'pre_season' | 'in_season'
export type PreSeasonPhase = 1 | 2 | 3
export type Frequency = 2 | 3 | 4
export type PositionGroup = 'front_row' | 'back_three'
export type MatchContext = 'match_week' | 'no_match_week'
// Type ré-exporté depuis `types/training.ts` (source canonical) pour préserver
// les imports historiques `import type { FatigueLevel } from '../data/weeklyTemplates'`.
export type { FatigueLevel } from '../types/training'

/** Cycle pris en charge par getWeeklyTemplate (pas de playoffs : géré dans le resolver). */
export type WeeklyTemplateCycle = Cycle | 'off_season'

export interface WeeklySessionSlot {
  sessionId: string
  role: 'primary' | 'secondary' | 'optional'
  dayPreference?: 'early_week' | 'mid_week' | 'late_week' | 'pre_match'
  variant?: 'normal' | 'light'
  maxBlocks?: number
}

export interface WeeklyTemplate {
  cycle: Cycle
  phase?: PreSeasonPhase
  frequency: Frequency
  positionGroup: PositionGroup
  matchContext?: MatchContext
  sessions: WeeklySessionSlot[]
}

export interface FatigueOverride {
  condition: string
  action: string
  priority: number
}

export interface GetWeeklyTemplateParams {
  cycle: WeeklyTemplateCycle
  /** Requise si cycle === 'pre_season' */
  phase?: PreSeasonPhase
  /** Requise si cycle === 'off_season' */
  offSeasonPhase?: OffSeasonPhase
  frequency: Frequency
  positionGroup: PositionGroup
  /** Requis si cycle === 'in_season' et frequency === 3 */
  matchContext?: MatchContext
  fatigueLevel?: FatigueLevel
  /** For off-season phase 5 maintenance: A/B alternation based on week parity. */
  maintenanceParity?: 'A' | 'B'
}

/** Résolution template : séances + signaux métier (warnings, conditioning compagnon). */
export interface WeeklyTemplateResolution {
  sessions: WeeklySessionSlot[]
  warnings: string[]
  companionRecommendations?: string[]
  requestedFrequency: Frequency
  effectiveFrequency: Frequency
}

/**
 * IDs off-season réellement présents dans motherSessions.generated (V1).
 * Tenir synchro avec le dataset : sert au repli 3x Force-Bridge si la FULL n’est pas publiée.
 */
export const OFF_SEASON_SESSION_IDS_IN_DATASET_V1 = new Set<string>([
  'FULL_OFFSEASON_RECOVERY_A_V1',
  'FULL_OFFSEASON_RECOVERY_B_V1',
  'FULL_BW_OFFSEASON_RECOVERY_A_V1',
  'FULL_BW_OFFSEASON_RECOVERY_B_V1',
  'LOWER_BW_OFFSEASON_TRANSITION_V1',
  'UPPER_BW_OFFSEASON_TRANSITION_V1',
  'FULL_BW_OFFSEASON_TRANSITION_V1',
  'LOWER_BW_OFFSEASON_HYPERTROPHY_V1',
  'UPPER_BW_OFFSEASON_HYPERTROPHY_V1',
  'FULL_BW_OFFSEASON_HYPERTROPHY_V1',
  'LOWER_BW_OFFSEASON_FORCE_BRIDGE_V1',
  'UPPER_BW_OFFSEASON_FORCE_BRIDGE_V1',
  'FULL_BW_OFFSEASON_FORCE_BRIDGE_V1',
  'LOWER_OFFSEASON_TRANSITION_V1',
  'UPPER_OFFSEASON_TRANSITION_V1',
  'FULL_OFFSEASON_TRANSITION_V1',
  'LOWER_OFFSEASON_HYPERTROPHY_V1',
  'UPPER_OFFSEASON_HYPERTROPHY_V1',
  'FULL_OFFSEASON_HYPERTROPHY_V1',
  'LOWER_OFFSEASON_FORCE_BRIDGE_V1',
  'UPPER_OFFSEASON_FORCE_BRIDGE_V1',
  'FULL_OFFSEASON_FORCE_BRIDGE_V1',
  'LOWER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1',
  'UPPER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1',
  'FULL_OFFSEASON_HYPERTROPHY_BACK_THREE_V1',
  'LOWER_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1',
  'UPPER_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1',
  'FULL_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1',
])

export const OFF_SEASON_FULL_FORCE_BRIDGE_SESSION_ID = 'FULL_OFFSEASON_FORCE_BRIDGE_V1'

function inferDayPreference(sessionId: string): WeeklySessionSlot['dayPreference'] {
  if (sessionId.includes('FULL_LIGHT_PRIMER')) return 'pre_match'
  if (sessionId.startsWith('LOWER_')) return 'early_week'
  if (sessionId.startsWith('UPPER_')) return 'mid_week'
  if (sessionId.startsWith('SPEED_POWER_')) return 'late_week'
  if (sessionId.startsWith('FULL_')) return 'late_week'
  return undefined
}

function makeSlots(
  ids: string[],
  optionalLast = false
): WeeklySessionSlot[] {
  return ids.map((sessionId, i) => {
    const isLast = i === ids.length - 1
    const role: WeeklySessionSlot['role'] =
      optionalLast && isLast ? 'optional' : 'primary'
    return {
      sessionId,
      role,
      dayPreference: inferDayPreference(sessionId),
    }
  })
}

/** Templates source (une entrée par combinaison position + contexte). */
export const WEEKLY_TEMPLATES: WeeklyTemplate[] = [
  // ─── Pré-saison phase 1 ─────────────────────────────────────
  {
    cycle: 'pre_season',
    phase: 1,
    frequency: 2,
    positionGroup: 'front_row',
    sessions: makeSlots(['LOWER_PRESEASON_FORCE_V1', 'UPPER_PRESEASON_FORCE_V1']),
  },
  {
    cycle: 'pre_season',
    phase: 1,
    frequency: 2,
    positionGroup: 'back_three',
    sessions: makeSlots(['LOWER_PRESEASON_FORCE_V1', 'UPPER_PRESEASON_FORCE_V1']),
  },
  {
    cycle: 'pre_season',
    phase: 1,
    frequency: 3,
    positionGroup: 'front_row',
    sessions: makeSlots([
      'LOWER_PRESEASON_FORCE_V1',
      'UPPER_PRESEASON_FORCE_V1',
      'FULL_PRESEASON_FORCE_V1',
    ]),
  },
  {
    cycle: 'pre_season',
    phase: 1,
    frequency: 3,
    positionGroup: 'back_three',
    sessions: makeSlots([
      'LOWER_PRESEASON_FORCE_V1',
      'UPPER_PRESEASON_FORCE_V1',
      'FULL_PRESEASON_FORCE_V1',
    ]),
  },
  {
    cycle: 'pre_season',
    phase: 1,
    frequency: 4,
    positionGroup: 'front_row',
    sessions: makeSlots(
      [
        'LOWER_PRESEASON_FORCE_V1',
        'UPPER_PRESEASON_FORCE_V1',
        'FULL_PRESEASON_FORCE_V1',
        'SPEED_POWER_PRESEASON_INTRO_V1',
      ],
      true
    ),
  },
  {
    cycle: 'pre_season',
    phase: 1,
    frequency: 4,
    positionGroup: 'back_three',
    sessions: makeSlots(
      [
        'LOWER_PRESEASON_FORCE_V1',
        'UPPER_PRESEASON_FORCE_V1',
        'FULL_PRESEASON_FORCE_V1',
        'SPEED_POWER_PRESEASON_INTRO_V1',
      ],
      true
    ),
  },

  // ─── Pré-saison phase 2 ───────────────────────────────────────
  {
    cycle: 'pre_season',
    phase: 2,
    frequency: 2,
    positionGroup: 'front_row',
    sessions: makeSlots(['LOWER_PRESEASON_FORCE_POWER_V1', 'UPPER_PRESEASON_FORCE_POWER_V1']),
  },
  {
    cycle: 'pre_season',
    phase: 2,
    frequency: 2,
    positionGroup: 'back_three',
    sessions: makeSlots(['LOWER_PRESEASON_FORCE_POWER_V1', 'UPPER_PRESEASON_FORCE_POWER_V1']),
  },
  {
    cycle: 'pre_season',
    phase: 2,
    frequency: 3,
    positionGroup: 'front_row',
    sessions: makeSlots([
      'LOWER_PRESEASON_FORCE_POWER_V1',
      'UPPER_PRESEASON_FORCE_POWER_V1',
      'FULL_PRESEASON_FORCE_POWER_V1',
    ]),
  },
  {
    cycle: 'pre_season',
    phase: 2,
    frequency: 3,
    positionGroup: 'back_three',
    sessions: makeSlots([
      'LOWER_PRESEASON_FORCE_POWER_V1',
      'UPPER_PRESEASON_FORCE_POWER_V1',
      'FULL_PRESEASON_FORCE_POWER_V1',
    ]),
  },
  {
    cycle: 'pre_season',
    phase: 2,
    frequency: 4,
    positionGroup: 'front_row',
    sessions: makeSlots(
      [
        'LOWER_PRESEASON_FORCE_POWER_V1',
        'UPPER_PRESEASON_FORCE_POWER_V1',
        'FULL_PRESEASON_FORCE_POWER_V1',
        'SPEED_POWER_PRESEASON_V1',
      ],
      true
    ),
  },
  {
    cycle: 'pre_season',
    phase: 2,
    frequency: 4,
    positionGroup: 'back_three',
    sessions: makeSlots(
      [
        'LOWER_PRESEASON_FORCE_POWER_V1',
        'UPPER_PRESEASON_FORCE_POWER_V1',
        'FULL_PRESEASON_FORCE_POWER_V1',
        'SPEED_POWER_PRESEASON_V1',
      ],
      true
    ),
  },

  // ─── Pré-saison phase 3 (pas de 4e séance terrain) ───────────
  {
    cycle: 'pre_season',
    phase: 3,
    frequency: 2,
    positionGroup: 'front_row',
    sessions: makeSlots(['LOWER_PRESEASON_POWER_FRONT_ROW_V1', 'UPPER_PRESEASON_POWER_FRONT_ROW_V1']),
  },
  {
    cycle: 'pre_season',
    phase: 3,
    frequency: 2,
    positionGroup: 'back_three',
    sessions: makeSlots(['LOWER_PRESEASON_POWER_BACK_THREE_V1', 'UPPER_PRESEASON_POWER_BACK_THREE_V1']),
  },
  {
    cycle: 'pre_season',
    phase: 3,
    frequency: 3,
    positionGroup: 'front_row',
    sessions: makeSlots([
      'LOWER_PRESEASON_POWER_FRONT_ROW_V1',
      'UPPER_PRESEASON_POWER_FRONT_ROW_V1',
      'FULL_PRESEASON_POWER_FRONT_ROW_V1',
    ]),
  },
  {
    cycle: 'pre_season',
    phase: 3,
    frequency: 3,
    positionGroup: 'back_three',
    sessions: makeSlots([
      'LOWER_PRESEASON_POWER_BACK_THREE_V1',
      'UPPER_PRESEASON_POWER_BACK_THREE_V1',
      'FULL_PRESEASON_POWER_BACK_THREE_V1',
    ]),
  },

  // ─── In-season ────────────────────────────────────────────────
  {
    cycle: 'in_season',
    frequency: 2,
    positionGroup: 'front_row',
    sessions: makeSlots(['LOWER_IN_SEASON_FRONT_ROW_V1', 'UPPER_IN_SEASON_FRONT_ROW_V1']),
  },
  {
    cycle: 'in_season',
    frequency: 2,
    positionGroup: 'back_three',
    sessions: makeSlots(['LOWER_IN_SEASON_BACK_THREE_V1', 'UPPER_IN_SEASON_BACK_THREE_V1']),
  },
  {
    cycle: 'in_season',
    frequency: 3,
    positionGroup: 'front_row',
    matchContext: 'match_week',
    sessions: makeSlots([
      'LOWER_IN_SEASON_FRONT_ROW_V1',
      'UPPER_IN_SEASON_FRONT_ROW_V1',
      'FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1',
    ]),
  },
  {
    cycle: 'in_season',
    frequency: 3,
    positionGroup: 'front_row',
    matchContext: 'no_match_week',
    sessions: makeSlots([
      'LOWER_IN_SEASON_FRONT_ROW_V1',
      'UPPER_IN_SEASON_FRONT_ROW_V1',
      'FULL_BODY_IN_SEASON_FRONT_ROW_V1',
    ]),
  },
  {
    cycle: 'in_season',
    frequency: 3,
    positionGroup: 'back_three',
    matchContext: 'match_week',
    sessions: makeSlots([
      'LOWER_IN_SEASON_BACK_THREE_V1',
      'UPPER_IN_SEASON_BACK_THREE_V1',
      'FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_V1',
    ]),
  },
  {
    cycle: 'in_season',
    frequency: 3,
    positionGroup: 'back_three',
    matchContext: 'no_match_week',
    sessions: makeSlots([
      'LOWER_IN_SEASON_BACK_THREE_V1',
      'UPPER_IN_SEASON_BACK_THREE_V1',
      'FULL_BODY_IN_SEASON_BACK_THREE_V1',
    ]),
  },
]

/** Règles fatigue (documentation + priorisation métier). */
export const FATIGUE_OVERRIDES: FatigueOverride[] = [
  {
    condition: 'normal fatigue + match week (in-season 3x)',
    action: 'keep Primer (FULL_LIGHT_PRIMER)',
    priority: 10,
  },
  {
    condition: 'normal fatigue + no match week (in-season 3x)',
    action: 'keep Full Body (FULL_BODY)',
    priority: 10,
  },
  {
    condition: 'high fatigue + no match week (in-season 3x)',
    action: 'replace Full Body by Primer with variant light and maxBlocks 2',
    priority: 20,
  },
  {
    condition: 'high fatigue + match week (in-season 3x)',
    action: 'keep Primer with variant light and maxBlocks 2',
    priority: 20,
  },
  {
    condition: 'high fatigue + pre-season phase 1 or 2 + 4x',
    action: 'remove optional 4th session (speed/power) before adjusting gym',
    priority: 5,
  },
  {
    condition: 'very_high fatigue',
    action: 'in_season: intercepté par recovery override (resolveMotherSessionsForWeek) avant d\'atteindre getWeeklyTemplate. Autres cycles: treated as high.',
    priority: 25,
  },
]

const FULL_BODY_BY_POSITION: Record<PositionGroup, string> = {
  front_row: 'FULL_BODY_IN_SEASON_FRONT_ROW_V1',
  back_three: 'FULL_BODY_IN_SEASON_BACK_THREE_V1',
}

const PRIMER_BY_POSITION: Record<PositionGroup, string> = {
  front_row: 'FULL_LIGHT_PRIMER_IN_SEASON_FRONT_ROW_V1',
  back_three: 'FULL_LIGHT_PRIMER_IN_SEASON_BACK_THREE_V1',
}

const LOWER_OFFSEASON_FORCE_BRIDGE = 'LOWER_OFFSEASON_FORCE_BRIDGE_V1'
const UPPER_OFFSEASON_FORCE_BRIDGE = 'UPPER_OFFSEASON_FORCE_BRIDGE_V1'

function makeRecoveryOffSeasonSlots(): WeeklySessionSlot[] {
  return [
    {
      sessionId: 'FULL_OFFSEASON_RECOVERY_A_V1',
      role: 'primary' as const,
      dayPreference: 'early_week' as const,
    },
    {
      sessionId: 'FULL_OFFSEASON_RECOVERY_B_V1',
      role: 'primary' as const,
      dayPreference: 'late_week' as const,
    },
  ]
}

/**
 * Off-season V1 : phases, fréquences 2/3/4, fatigue Recovery/Transition (doc WEEKLY_TEMPLATES_OFF_SEASON).
 * Pas de throw pour limites métier : warnings + effectiveFrequency.
 */
export function resolveOffSeasonWeeklyTemplate(params: {
  offSeasonPhase: OffSeasonPhase
  frequency: Frequency
  positionGroup?: PositionGroup
  fatigueLevel?: FatigueLevel
  /** For phase 5 maintenance: A/B alternation based on week parity. */
  maintenanceParity?: 'A' | 'B'
}): WeeklyTemplateResolution {
  const { offSeasonPhase, frequency: requestedFrequency, positionGroup } = params
  const fatigueLevel = params.fatigueLevel ?? 'normal'
  const isHigh = fatigueLevel === 'high' || fatigueLevel === 'very_high'
  const warnings: string[] = []
  let effectiveFrequency: Frequency = requestedFrequency

  // ── Phase 1 Recovery (S1–S2) : toujours 2 séances gym en V1
  if (offSeasonPhase === 1) {
    if (requestedFrequency === 3) {
      effectiveFrequency = 2
      warnings.push(
        'Off-season Recovery : pas de structure 3x V1 ; repli déterministe sur 2 séances / semaine.'
      )
    } else if (requestedFrequency === 4) {
      effectiveFrequency = 2
      warnings.push(
        'Off-season Recovery : fréquence 4 non prévue en V1 ; repli sur 2 séances / semaine.'
      )
    } else {
      effectiveFrequency = 2
    }
    return {
      sessions: cloneSlots(makeRecoveryOffSeasonSlots()),
      warnings,
      companionRecommendations: [
        '2x 20-30 min activité légère : marche, vélo, natation, mobilité',
        'Objectif : bouger sans forcer, favoriser la récupération',
      ],
      requestedFrequency,
      effectiveFrequency,
    }
  }

  // ── Phase 5 Maintenance : 2 sessions/week, A/B alternation
  if (offSeasonPhase === 5) {
    effectiveFrequency = 2
    const parity = params.maintenanceParity ?? 'A'
    const b3 = positionGroup === 'back_three'
    const hypoLower = b3 ? 'LOWER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1' : 'LOWER_OFFSEASON_HYPERTROPHY_V1'
    const hypoUpper = b3 ? 'UPPER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1' : 'UPPER_OFFSEASON_HYPERTROPHY_V1'
    const hypoFull = b3 ? 'FULL_OFFSEASON_HYPERTROPHY_BACK_THREE_V1' : 'FULL_OFFSEASON_HYPERTROPHY_V1'

    const sessions = parity === 'A'
      ? makeSlots([hypoLower, hypoUpper])
      : makeSlots([hypoUpper, hypoFull])

    return {
      sessions: cloneSlots(sessions),
      warnings,
      companionRecommendations: [
        '1-2x 30 min cardio entretien : footing, vélo, natation',
        'Maintien des acquis en attendant la pré-saison',
      ],
      requestedFrequency,
      effectiveFrequency,
    }
  }

  // Phases 2–4 : structure Lower + Upper [+ Full] ; fréquence 4 → 3
  if (requestedFrequency === 4) {
    effectiveFrequency = 3
    warnings.push(
      'Off-season (Transition / Hypertrophy / Force-Bridge) : fréquence 4 ramenée à la structure 3 séances V1.'
    )
  }

  // Fatigue haute : Recovery/Transition → plafond 2x (doc §7)
  if (isHigh && offSeasonPhase === 2 && effectiveFrequency >= 3) {
    effectiveFrequency = 2
    warnings.push(
      'Fatigue haute : off-season Transition limité à 2 séances gym / semaine (conditioning réduit en premier).'
    )
  }

  let sessions: WeeklySessionSlot[]
  const companionRecommendations: string[] = []

  if (offSeasonPhase === 2) {
    companionRecommendations.push(
      '2x 25-35 min cardio léger : vélo, footing tranquille, natation',
      'Tu peux ajouter 1 séance de course à allure modérée (conversation possible)',
    )
    if (effectiveFrequency >= 3) {
      sessions = makeSlots([
        'LOWER_OFFSEASON_TRANSITION_V1',
        'UPPER_OFFSEASON_TRANSITION_V1',
        'FULL_OFFSEASON_TRANSITION_V1',
      ])
    } else {
      sessions = makeSlots(['LOWER_OFFSEASON_TRANSITION_V1', 'UPPER_OFFSEASON_TRANSITION_V1'])
    }
  } else if (offSeasonPhase === 3) {
    companionRecommendations.push(
      '1-2x 30 min cardio modéré : footing, vélo, rameur',
      'Évite le cardio jambes le lendemain de ta séance bas du corps',
    )
    const b3 = positionGroup === 'back_three'
    const hypoLower = b3 ? 'LOWER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1' : 'LOWER_OFFSEASON_HYPERTROPHY_V1'
    const hypoUpper = b3 ? 'UPPER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1' : 'UPPER_OFFSEASON_HYPERTROPHY_V1'
    const hypoFull = b3 ? 'FULL_OFFSEASON_HYPERTROPHY_BACK_THREE_V1' : 'FULL_OFFSEASON_HYPERTROPHY_V1'
    if (effectiveFrequency >= 3) {
      sessions = makeSlots([hypoLower, hypoUpper, hypoFull])
    } else {
      sessions = makeSlots([hypoLower, hypoUpper])
    }
  } else {
    // Phase 4 Force-Bridge
    companionRecommendations.push(
      '1-2x 25 min cardio entretien : footing, vélo',
      'Optionnel : 3-4 sprints courts (20-30m) si tu te sens frais',
    )
    const b3 = positionGroup === 'back_three'
    const fbLower = b3 ? 'LOWER_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1' : LOWER_OFFSEASON_FORCE_BRIDGE
    const fbUpper = b3 ? 'UPPER_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1' : UPPER_OFFSEASON_FORCE_BRIDGE
    const fbFullId = b3 ? 'FULL_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1' : OFF_SEASON_FULL_FORCE_BRIDGE_SESSION_ID
    const fullReady = OFF_SEASON_SESSION_IDS_IN_DATASET_V1.has(fbFullId)
    if (effectiveFrequency >= 3 && !fullReady) {
      effectiveFrequency = 2
      warnings.push(
        'Off-season Force-Bridge : pas de mother session FULL dataset-ready ; repli déterministe 3x→2x (Lower + Upper).'
      )
    }
    if (effectiveFrequency >= 3 && fullReady) {
      sessions = makeSlots([fbLower, fbUpper, fbFullId])
    } else {
      sessions = makeSlots([fbLower, fbUpper])
    }
  }

  return {
    sessions: cloneSlots(sessions),
    warnings,
    companionRecommendations,
    requestedFrequency,
    effectiveFrequency,
  }
}

function cloneSlots(slots: WeeklySessionSlot[]): WeeklySessionSlot[] {
  return slots.map((s) => ({ ...s }))
}

function findBaseTemplate(params: {
  cycle: Cycle
  phase?: PreSeasonPhase
  frequency: Frequency
  positionGroup: PositionGroup
  matchContext?: MatchContext
}): WeeklyTemplate {
  const { cycle, phase, frequency, positionGroup, matchContext } = params

  const effectiveFrequency: Frequency =
    cycle === 'pre_season' && phase === 3 && frequency === 4 ? 3 : frequency

  const found = WEEKLY_TEMPLATES.find((t) => {
    if (t.cycle !== cycle) return false
    if (t.frequency !== effectiveFrequency) return false
    if (t.positionGroup !== positionGroup) return false
    if (cycle === 'pre_season') {
      if (t.phase !== phase) return false
      return t.matchContext === undefined
    }
    // in_season
    if (effectiveFrequency === 3) {
      return t.matchContext === matchContext
    }
    return t.matchContext === undefined
  })

  if (!found) {
    const ctx =
      cycle === 'pre_season'
        ? `pre_season phase ${phase} frequency ${effectiveFrequency} ${positionGroup}`
        : `in_season frequency ${effectiveFrequency} ${positionGroup} matchContext=${matchContext ?? 'n/a'}`
    throw new Error(`Aucun weekly template pour : ${ctx}`)
  }

  return found
}

/**
 * Retourne les créneaux de la semaine (copie profonde), après application des overrides fatigue,
 * plus fréquences effectives et warnings métier (off-season, repli fréquence).
 */
export function getWeeklyTemplate(params: GetWeeklyTemplateParams): WeeklyTemplateResolution {
  const {
    cycle,
    phase,
    offSeasonPhase,
    frequency,
    positionGroup,
    matchContext,
    fatigueLevel = 'normal',
  } = params

  if (cycle === 'off_season') {
    if (offSeasonPhase === undefined) {
      throw new Error('getWeeklyTemplate: offSeasonPhase requise pour cycle off_season')
    }
    return resolveOffSeasonWeeklyTemplate({
      offSeasonPhase,
      frequency,
      positionGroup,
      fatigueLevel,
      maintenanceParity: params.maintenanceParity,
    })
  }

  if (cycle === 'pre_season' && phase === undefined) {
    throw new Error('getWeeklyTemplate: phase requise pour cycle pre_season')
  }

  if (cycle === 'in_season' && frequency === 3 && matchContext === undefined) {
    throw new Error(
      'getWeeklyTemplate: matchContext requis pour in_season avec frequency 3'
    )
  }

  let effectiveOut: Frequency =
    cycle === 'pre_season' && phase === 3 && frequency === 4 ? 3 : frequency

  const base = findBaseTemplate({
    cycle,
    phase,
    frequency,
    positionGroup,
    matchContext,
  })

  let slots = cloneSlots(base.sessions)

  const isHigh = fatigueLevel === 'high' || fatigueLevel === 'very_high'

  // 1) Pré-saison phases 1–2, 4x, fatigue haute : retirer d’abord la 4e séance optionnelle
  if (
    isHigh &&
    cycle === 'pre_season' &&
    (phase === 1 || phase === 2) &&
    frequency === 4
  ) {
    slots = slots.filter((s) => s.role !== 'optional')
    effectiveOut = 3
  }

  // 2) In-season 3x + fatigue haute
  if (isHigh && cycle === 'in_season' && frequency === 3 && matchContext) {
    if (matchContext === 'no_match_week') {
      slots = slots.map((s) => {
        if (s.sessionId === FULL_BODY_BY_POSITION[positionGroup]) {
          return {
            ...s,
            sessionId: PRIMER_BY_POSITION[positionGroup],
            dayPreference: 'pre_match' as const,
            variant: 'light' as const,
            maxBlocks: 2,
          }
        }
        return s
      })
    } else {
      slots = slots.map((s) => {
        if (s.sessionId === PRIMER_BY_POSITION[positionGroup]) {
          return { ...s, variant: 'light' as const, maxBlocks: 2 }
        }
        return s
      })
    }
  }

  return {
    sessions: slots,
    warnings: [],
    companionRecommendations: undefined,
    requestedFrequency: frequency,
    effectiveFrequency: effectiveOut,
  }
}
