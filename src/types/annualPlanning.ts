import type { CalendarEvent } from './training'

export type AnnualCycle = 'off_season' | 'pre_season' | 'in_season' | 'playoffs'

export type OffSeasonPhase = 1 | 2 | 3 | 4
export type PreSeasonPhase = 1 | 2 | 3

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
  }

  monitoringSnapshot?: {
    completedSessionsLast7d?: number
    completedSessionsLast28d?: number
    readinessScore?: number
    jumpTrend?: 'up' | 'flat' | 'down'
    painFlags?: string[]
    latestRpeLoad?: number
  }
}

export interface AnnualPlanningContext {
  cycle: AnnualCycle

  offSeasonPhase?: OffSeasonPhase
  preSeasonPhase?: PreSeasonPhase

  weekNumber?: number
  weekLabel: string

  isDeloadWeek: boolean
  isMatchWeek: boolean

  firstMatchDate: string | null
  lastMatchDate: string | null
  offSeasonStartAt: string | null

  daysUntilNextMatch: number | null

  fatigueLevel: 'normal' | 'high' | 'very_high'
  /** Set par le resolver MS quand in_season + very_high fatigue → séances recovery. */
  loadManagementOverride?: 'recovery'
  weeklyFrequency: 2 | 3 | 4
  positionGroup: 'front_row' | 'back_three'

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
