/**
 * Mappers purs Supabase → domaine training (staff planning).
 * Pas d’import depuis les hooks UI.
 */
import type {
  AgeBand,
  CalendarEvent,
  ClubSchedule,
  HealthConsentSource,
  LevelModifierProfileV1,
  PerformanceFocus,
  PopulationSegment,
  SCSchedule,
  SessionLog,
  TrainingLevel,
  UserProfile,
  SeasonMode,
} from '../../types/training'

export type ProfileRow = {
  id: string
  level: string
  weekly_sessions: number
  equipment: string[]
  injuries: string[]
  position: string | null
  rugby_position: string | null
  league_level: string | null
  club_code: string | null
  club_name: string | null
  club_ligue: string | null
  club_department_code: string | null
  height_cm: number | null
  weight_kg: number | null
  onboarding_complete?: boolean | null
  club_schedule: ClubSchedule | null
  sc_schedule: SCSchedule | null
  training_level: string | null
  level_modifier_profile: LevelModifierProfileV1 | null
  season_mode: string | null
  performance_focus: PerformanceFocus | null
  population_segment: PopulationSegment | null
  age_band: AgeBand | null
  parental_consent_health_data: boolean | null
  adult_play_eligibility_approved: boolean | null
  maturity_status: UserProfile['maturityStatus'] | null
  cycle_tracking_opt_in: boolean | null
  cycle_symptom_score_today: UserProfile['cycleSymptomScoreToday'] | null
  prevention_sessions_week: number | null
  weekly_load_context: UserProfile['weeklyLoadContext'] | null
  health_consent_status: UserProfile['healthConsentStatus'] | null
  health_consent_granted_at: string | null
  health_consent_revoked_at: string | null
  health_consent_source: HealthConsentSource | null
  health_consent_audit_trail: UserProfile['healthConsentAuditTrail'] | null
  health_data_retention_state: UserProfile['healthDataRetentionState'] | null
}

export type MatchCalendarRow = {
  id: string
  user_id: string
  date: string
  type: string
  kickoff_time?: string | null
  opponent?: string | null
  opponent_code?: string | null
  is_home?: boolean | null
  notes?: string | null
  rpe?: number | null
  duration_min?: number | null
  created_at?: string | null
}

export type SessionLogRow = {
  id: string
  user_id: string
  date_iso: string
  week: string
  session_type: string
  fatigue: string
  notes?: string | null
  rpe?: number | null
  duration_min?: number | null
  created_at?: string | null
}

function inferNormalizedAgeBand(
  ageBand: AgeBand | null | undefined,
  populationSegment: PopulationSegment | null | undefined
): AgeBand {
  if (ageBand === 'adult' || ageBand === 'u18') return ageBand
  if (populationSegment === 'u18_female' || populationSegment === 'u18_male') return 'u18'
  if (populationSegment === 'female_senior' || populationSegment === 'male_senior') return 'adult'
  return 'adult'
}

function normalizeStaffUserProfile(profile: UserProfile): UserProfile {
  const ageBand = inferNormalizedAgeBand(profile.ageBand, profile.populationSegment)
  const trainingLevel = profile.levelModifierProfile?.visibleLabel ?? profile.trainingLevel

  return {
    ...profile,
    trainingLevel,
    seasonMode:
      profile.seasonMode === 'in_season' ||
      profile.seasonMode === 'off_season' ||
      profile.seasonMode === 'pre_season'
        ? profile.seasonMode
        : 'in_season',
    ageBand,
    parentalConsentHealthData:
      profile.parentalConsentHealthData ?? (ageBand === 'adult' ? false : undefined),
  }
}

/** Formate une heure Postgres (time) ou chaîne HH:MM:SS en HH:MM pour l’UI. */
export function formatKickoffTime(raw: string | null | undefined): string | undefined {
  if (raw == null || raw === '') return undefined
  const s = String(raw).trim()
  if (/^\d{2}:\d{2}$/.test(s)) return s
  if (/^\d{2}:\d{2}:\d{2}/.test(s)) return s.slice(0, 5)
  return undefined
}

/** Normalise une date calendrier (date SQL ou ISO). */
export function calendarDateToIsoString(date: string | Date): string {
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
    const d = new Date(date)
    if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0] ?? date
    return date
  }
  return date.toISOString().split('T')[0] ?? ''
}

export function profileRowToUserProfile(row: ProfileRow): UserProfile {
  const levelModifierProfile = row.level_modifier_profile ?? undefined
  const modifierVisibleLabel = levelModifierProfile?.visibleLabel
  const normalizedTrainingLevel: TrainingLevel =
    modifierVisibleLabel === 'starter' ||
    modifierVisibleLabel === 'builder' ||
    modifierVisibleLabel === 'performance'
      ? modifierVisibleLabel
      : (row.training_level as TrainingLevel | null) ??
        (row.level === 'beginner' ? 'starter' : row.level === 'intermediate' ? 'builder' : 'starter')

  return normalizeStaffUserProfile({
    level: (row.level === 'beginner' ? 'beginner' : 'intermediate') as UserProfile['level'],
    weeklySessions: (row.weekly_sessions === 2 ? 2 : 3) as UserProfile['weeklySessions'],
    equipment: row.equipment as UserProfile['equipment'],
    injuries: row.injuries as UserProfile['injuries'],
    position: (row.position ?? undefined) as UserProfile['position'],
    rugbyPosition: (row.rugby_position ?? undefined) as UserProfile['rugbyPosition'],
    leagueLevel: row.league_level ?? undefined,
    clubCode: row.club_code ?? undefined,
    clubName: row.club_name ?? undefined,
    clubLigue: row.club_ligue ?? undefined,
    clubDepartmentCode: row.club_department_code ?? undefined,
    heightCm: row.height_cm ?? undefined,
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : undefined,
    clubSchedule: row.club_schedule ?? undefined,
    scSchedule: row.sc_schedule ?? undefined,
    trainingLevel: normalizedTrainingLevel,
    levelModifierProfile,
    seasonMode: (row.season_mode as SeasonMode | null) ?? undefined,
    performanceFocus: row.performance_focus ?? undefined,
    populationSegment: row.population_segment ?? undefined,
    ageBand: row.age_band ?? undefined,
    parentalConsentHealthData: row.parental_consent_health_data ?? undefined,
    adultPlayEligibilityApproved: row.adult_play_eligibility_approved ?? undefined,
    maturityStatus: row.maturity_status ?? undefined,
    cycleTrackingOptIn: row.cycle_tracking_opt_in ?? undefined,
    cycleSymptomScoreToday: row.cycle_symptom_score_today ?? undefined,
    preventionSessionsWeek: row.prevention_sessions_week ?? undefined,
    weeklyLoadContext: row.weekly_load_context ?? undefined,
    healthConsentStatus: row.health_consent_status ?? undefined,
    healthConsentGrantedAt: row.health_consent_granted_at ?? undefined,
    healthConsentRevokedAt: row.health_consent_revoked_at ?? undefined,
    healthConsentSource: row.health_consent_source ?? undefined,
    healthConsentAuditTrail: row.health_consent_audit_trail ?? undefined,
    healthDataRetentionState: row.health_data_retention_state ?? undefined,
  })
}

export function calendarRowToCalendarEvent(row: MatchCalendarRow): CalendarEvent {
  return {
    id: row.id,
    date: calendarDateToIsoString(row.date),
    type: row.type as CalendarEvent['type'],
    kickoff_time: formatKickoffTime(row.kickoff_time ?? undefined),
    opponent: row.opponent ?? undefined,
    opponent_code: row.opponent_code ?? undefined,
    is_home: row.is_home ?? undefined,
    notes: row.notes ?? undefined,
    rpe: row.rpe ?? undefined,
    duration_min: row.duration_min ?? undefined,
    created_at: row.created_at ?? undefined,
  }
}

export function sessionLogRowToSessionLog(row: SessionLogRow): SessionLog {
  return {
    id: row.id,
    dateISO: row.date_iso,
    week: row.week as SessionLog['week'],
    sessionType: row.session_type as SessionLog['sessionType'],
    fatigue: row.fatigue as SessionLog['fatigue'],
    notes: row.notes ?? undefined,
    rpe: row.rpe ?? undefined,
    durationMin: row.duration_min ?? undefined,
  }
}
