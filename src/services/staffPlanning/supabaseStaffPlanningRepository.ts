/**
 * Implémentation Supabase (lecture seule) de StaffPlanningRepository — client anon + RLS, pas de service_role.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase as defaultSupabaseClient } from '../supabase/client'
import type { StaffPlanningAthleteRecord, StaffPlanningRepository } from './staffPlanningRepository'
import type { CalendarEvent, SessionLog } from '../../types/training'
import {
  calendarRowToCalendarEvent,
  profileRowToUserProfile,
  sessionLogRowToSessionLog,
  type MatchCalendarRow,
  type ProfileRow,
  type SessionLogRow,
} from './staffPlanningSupabaseMappers'

/** Colonnes alignées sur la persistance actuelle des profils (hors hooks). */
export const STAFF_PLANNING_PROFILE_SELECT = [
  'id',
  'level',
  'weekly_sessions',
  'equipment',
  'injuries',
  'position',
  'rugby_position',
  'league_level',
  'club_code',
  'club_name',
  'club_ligue',
  'club_department_code',
  'height_cm',
  'weight_kg',
  'onboarding_complete',
  'club_schedule',
  'sc_schedule',
  'training_level',
  'level_modifier_profile',
  'season_mode',
  'performance_focus',
  'population_segment',
  'age_band',
  'parental_consent_health_data',
  'adult_play_eligibility_approved',
  'maturity_status',
  'cycle_tracking_opt_in',
  'cycle_symptom_score_today',
  'prevention_sessions_week',
  'weekly_load_context',
  'health_consent_status',
  'health_consent_granted_at',
  'health_consent_revoked_at',
  'health_consent_source',
  'health_consent_audit_trail',
  'health_data_retention_state',
].join(', ')

const MATCH_CALENDAR_SELECT =
  'id, user_id, date, type, kickoff_time, opponent, opponent_code, is_home, notes, rpe, duration_min, created_at'

const SESSION_LOGS_SELECT =
  'id, user_id, date_iso, week, session_type, fatigue, notes, rpe, duration_min, created_at'

export function deriveFatigueFromSessionLogRows(rows: SessionLogRow[]): 'OK' | 'FATIGUE' {
  if (rows.length === 0) return 'OK'
  const sorted = [...rows].sort((a, b) => {
    const byDate = b.date_iso.localeCompare(a.date_iso)
    if (byDate !== 0) return byDate
    const ac = (a.created_at ?? '').localeCompare(b.created_at ?? '')
    if (ac !== 0) return -ac
    return b.id.localeCompare(a.id)
  })
  return sorted[0]!.fatigue === 'FATIGUE' ? 'FATIGUE' : 'OK'
}

function sortCalendarRows(rows: MatchCalendarRow[]): MatchCalendarRow[] {
  return [...rows].sort((a, b) => {
    const ad = calendarRowToCalendarEvent(a).date
    const bd = calendarRowToCalendarEvent(b).date
    const byDate = ad.localeCompare(bd)
    if (byDate !== 0) return byDate
    return a.id.localeCompare(b.id)
  })
}

function groupByUserId<T extends { user_id: string }>(rows: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>()
  for (const r of rows) {
    const list = m.get(r.user_id)
    if (list) list.push(r)
    else m.set(r.user_id, [r])
  }
  return m
}

export function createSupabaseStaffPlanningRepository(client: SupabaseClient): StaffPlanningRepository {
  return {
    async listAthletesForClub(params: { clubId: string; squadId?: string }): Promise<StaffPlanningAthleteRecord[]> {
      const { clubId, squadId } = params

      let membershipQuery = client
        .from('club_athlete_memberships')
        .select('athlete_user_id, club_id, squad_id')
        .eq('club_id', clubId)
        .eq('status', 'active')
        .order('athlete_user_id', { ascending: true })

      if (squadId !== undefined) {
        membershipQuery = membershipQuery.eq('squad_id', squadId)
      }

      const { data: membershipRows, error: membershipError } = await membershipQuery

      if (membershipError) {
        throw new Error(membershipError.message)
      }

      const memberships = (membershipRows ?? []) as Array<{
        athlete_user_id: string
        club_id: string
        squad_id: string | null
      }>

      if (memberships.length === 0) {
        return []
      }

      const athleteIds = memberships.map((m) => m.athlete_user_id)

      const { data: profileRows, error: profilesError } = await client
        .from('profiles')
        .select(STAFF_PLANNING_PROFILE_SELECT)
        .in('id', athleteIds)

      if (profilesError) {
        throw new Error(profilesError.message)
      }

      const profileById = new Map<string, ProfileRow>()
      for (const row of (profileRows ?? []) as unknown as ProfileRow[]) {
        profileById.set(row.id, row)
      }

      const resolvedIds: string[] = []
      for (const m of memberships) {
        if (profileById.has(m.athlete_user_id)) {
          resolvedIds.push(m.athlete_user_id)
        }
      }

      if (resolvedIds.length === 0) {
        return []
      }

      const { data: calendarRows, error: calendarError } = await client
        .from('match_calendar')
        .select(MATCH_CALENDAR_SELECT)
        .in('user_id', resolvedIds)
        .order('date', { ascending: true })

      if (calendarError) {
        throw new Error(calendarError.message)
      }

      const { data: logRows, error: logsError } = await client
        .from('session_logs')
        .select(SESSION_LOGS_SELECT)
        .in('user_id', resolvedIds)
        .order('date_iso', { ascending: false })

      if (logsError) {
        throw new Error(logsError.message)
      }

      const eventsByUser = groupByUserId((calendarRows ?? []) as MatchCalendarRow[])
      const logsByUser = groupByUserId((logRows ?? []) as SessionLogRow[])

      const out: StaffPlanningAthleteRecord[] = []

      for (const m of memberships) {
        const profileRow = profileById.get(m.athlete_user_id)
        if (!profileRow) {
          continue
        }

        const rawEvents = eventsByUser.get(m.athlete_user_id) ?? []
        const rawLogs = logsByUser.get(m.athlete_user_id) ?? []

        const events: CalendarEvent[] = sortCalendarRows(rawEvents).map(calendarRowToCalendarEvent)
        const logs: SessionLog[] = [...rawLogs]
          .sort((a, b) => {
            const byDate = b.date_iso.localeCompare(a.date_iso)
            if (byDate !== 0) return byDate
            const ac = (a.created_at ?? '').localeCompare(b.created_at ?? '')
            if (ac !== 0) return -ac
            return b.id.localeCompare(a.id)
          })
          .map(sessionLogRowToSessionLog)

        out.push({
          athleteId: m.athlete_user_id,
          clubId: m.club_id,
          squadId: m.squad_id ?? undefined,
          profile: profileRowToUserProfile(profileRow),
          events,
          logs,
          fatigue: deriveFatigueFromSessionLogRows(rawLogs),
          acwrZone: null,
        })
      }

      return out
    },
  }
}

export const supabaseStaffPlanningRepository = createSupabaseStaffPlanningRepository(defaultSupabaseClient)
