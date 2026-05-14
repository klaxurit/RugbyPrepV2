import type { CalendarEvent } from './training'

export type AnnualCycle = 'off_season' | 'pre_season' | 'in_season' | 'playoffs'

export type OffSeasonPhase = 1 | 2 | 3 | 4 | 5
export type PreSeasonPhase = 1 | 2 | 3

export type InSeasonSubMode = 'competition' | 'treve_deep' | 'treve_return' | 'treve_rampup'
export type PlayoffTaperPhase = 'taper_1' | 'taper_2' | 'match_week'

/**
 * Fitness baseline déclaré à l'onboarding — KB: src/knowledge/population-specific.md §3.
 * Module la rampe de reprise via l'onboarding hint.
 */
export type TrainingBaselineInput = 'restart' | 'active' | 'peak'

export interface AthleteIdentityContext {
  athleteId?: string
  clubId?: string
  squadId?: string
  source?: 'self' | 'staff' | 'system'
}

export interface AthletePlanningInputs {
  events: Array<Pick<CalendarEvent, 'date' | 'type'>>
  today: Date | string

  weeklyFrequency: 2 | 3 | 4
  positionGroup: 'front_row' | 'back_three'

  fatigueLevel?: 'normal' | 'high' | 'very_high'

  /** État de forme déclaré à l'onboarding. Module la rampe de reprise (cf. onboardingCycleHint). */
  trainingBaseline?: TrainingBaselineInput

  identity?: AthleteIdentityContext

  planningAnchors?: {
    firstMatchDateOverride?: string
    offSeasonStartAt?: string
    seasonEndedAt?: string
    returnToTeamTrainingAt?: string
    manualCycleOverride?: AnnualCycle
    manualOffSeasonWeekOverride?: number
    manualPreSeasonWeekOverride?: number
    manualPlayoffs?: boolean
    /**
     * Bootstrap first-run : cycle suggéré par l'onboarding.
     * Utilisé uniquement quand events=0 et logs=0 (profil vierge).
     * Priorité inférieure au calendrier et aux ancres explicites.
     */
    onboardingCycleHint?: AnnualCycle
    /**
     * Si true : pour les semaines calendaires S1–S2 (phase Récupération), le programme
     * démarre comme S3–S4 (Transition). Ignoré si manualOffSeasonWeekOverride est défini.
     */
    skipOffSeasonRecoveryIntro?: boolean
  }

  monitoringSnapshot?: {
    completedSessionsLast7d?: number
    completedSessionsLast28d?: number
    readinessScore?: number
    jumpTrend?: 'up' | 'flat' | 'down'
    painFlags?: string[]
    latestRpeLoad?: number
    /** True if the athlete has any session logs in history (distinguishes long absence from first-run). */
    hasHistoricalLogs?: boolean
  }
}

export interface AnnualPlanningContext {
  cycle: AnnualCycle

  offSeasonPhase?: OffSeasonPhase
  preSeasonPhase?: PreSeasonPhase

  weekNumber?: number
  weekLabel: string

  isDeloadWeek: boolean
  mesocycleWeek?: 1 | 2 | 3 | 4
  mesocycleBlock?: number
  isMatchWeek: boolean

  firstMatchDate: string | null
  lastMatchDate: string | null
  offSeasonStartAt: string | null

  daysUntilNextMatch: number | null
  daysSinceLastMatch: number | null

  fatigueLevel: 'normal' | 'high' | 'very_high'
  /** Set par le resolver MS quand in_season + very_high fatigue → séances recovery. */
  loadManagementOverride?: 'recovery'
  weeklyFrequency: 2 | 3 | 4
  positionGroup: 'front_row' | 'back_three'

  /** Sous-mode in-season (trêve, compétition normale). Absent si cycle ≠ in_season. */
  inSeasonSubMode?: InSeasonSubMode

  /** Phase de taper en playoffs. Absent si cycle ≠ playoffs. */
  playoffTaperPhase?: PlayoffTaperPhase

  /** Durée effective de la pré-saison en semaines (6-12). */
  effectivePreSeasonWeeks?: number

  /** Durée effective de l'off-season en semaines (6-12). */
  effectiveOffSeasonWeeks?: number

  identity?: AthleteIdentityContext
  monitoringSnapshot?: AthletePlanningInputs['monitoringSnapshot']

  planningTrace: {
    resolutionMode:
      | 'manual_override'
      | 'explicit_anchors'
      | 'calendar_inferred'
      | 'onboarding_hint'
      | 'backfilled'
    rulesApplied: string[]
    warnings: string[]
  }
}
