import type { AthleteIdentityContext, AthletePlanningInputs, AnnualPlanningContext } from './annualPlanning'
import type { MotherSession } from './motherSession'

export type StaffAlertSeverity = 'info' | 'warning' | 'critical'

export interface StaffAlert {
  code:
    | 'missing_position_mapping'
    | 'missing_recent_logs'
    | 'high_fatigue'
    | 'very_high_fatigue'
    | 'injury_flags_present'
    | 'missing_session_data'
    | 'match_week'
    | 'playoffs_taper'
    | 'low_adherence'
    | 'calendar_sparse'
  severity: StaffAlertSeverity
  message: string
}

export interface AthleteAdherenceSnapshot {
  completedSessionsLast7d: number
  completedSessionsLast28d: number
  plannedSessionsThisWeek: number
  completionVsPlanned7d: number | null
}

export interface AthleteLoadSnapshot {
  fatigueLevel: 'normal' | 'high' | 'very_high'
  latestRpeLoad: number | null
  painFlags: string[]
  acwrZone?: 'underload' | 'optimal' | 'caution' | 'danger' | 'critical' | null
}

export interface AthleteWeeklyMotherSessionSummary {
  status: 'resolved' | 'resolved_with_warnings' | 'missing_session'
  sessionIds: string[]
  sessionTitles: string[]
  companionRecommendations: string[]
  warnings: string[]
  sessions?: MotherSession[]
}

export interface AthleteStaffWeeklyView {
  identity: Required<Pick<AthleteIdentityContext, 'athleteId'>> & AthleteIdentityContext
  planningInputs: AthletePlanningInputs
  annualPlanning: AnnualPlanningContext
  motherSessions: AthleteWeeklyMotherSessionSummary
  adherence: AthleteAdherenceSnapshot
  load: AthleteLoadSnapshot
  alerts: StaffAlert[]
}

export interface SquadWeeklySummary {
  totalAthletes: number
  byCycle: Record<'off_season' | 'pre_season' | 'in_season' | 'playoffs', number>
  matchWeekCount: number
  highFatigueCount: number
  veryHighFatigueCount: number
  lowAdherenceCount: number
  missingSessionDataCount: number
}

export interface SquadWeeklyOverview {
  clubId?: string
  squadId?: string
  generatedForDate: string
  athletes: AthleteStaffWeeklyView[]
  summary: SquadWeeklySummary
  warnings: string[]
}
