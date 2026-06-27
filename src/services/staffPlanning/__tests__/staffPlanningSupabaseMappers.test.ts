import { describe, expect, it } from 'vitest'
import {
  calendarDateToIsoString,
  calendarRowToCalendarEvent,
  formatKickoffTime,
  profileRowToUserProfile,
  sessionLogRowToSessionLog,
  type MatchCalendarRow,
  type ProfileRow,
  type SessionLogRow,
} from '../staffPlanningSupabaseMappers'

describe('staffPlanningSupabaseMappers', () => {
  describe('formatKickoffTime', () => {
    it('retourne HH:MM pour une time SQL', () => {
      expect(formatKickoffTime('18:30:00')).toBe('18:30')
    })
    it('laisse HH:MM inchangé', () => {
      expect(formatKickoffTime('09:15')).toBe('09:15')
    })
    it('retourne undefined pour null', () => {
      expect(formatKickoffTime(null)).toBeUndefined()
    })
  })

  describe('calendarDateToIsoString', () => {
    it('normalise YYYY-MM-DD', () => {
      expect(calendarDateToIsoString('2025-03-18')).toBe('2025-03-18')
    })
  })

  describe('profileRowToUserProfile', () => {
    it('mappe une row minimale vers UserProfile cohérent', () => {
      const row: ProfileRow = {
        id: 'u1',
        level: 'intermediate',
        weekly_sessions: 3,
        equipment: ['barbell'],
        injuries: [],
        position: 'BACK_ROW',
        rugby_position: 'BACK_ROW',
        league_level: null,
        club_code: 'CLUB1',
        club_name: 'Mon club',
        club_ligue: null,
        club_department_code: null,
        height_cm: 180,
        weight_kg: 85,
        club_schedule: null,
        sc_schedule: null,
        training_level: 'performance',
        level_modifier_profile: null,
        season_mode: 'in_season',
        performance_focus: 'balanced',
        population_segment: 'male_senior',
        age_band: 'adult',
        parental_consent_health_data: false,
        adult_play_eligibility_approved: true,
        maturity_status: 'unknown',
        cycle_tracking_opt_in: false,
        cycle_symptom_score_today: null,
        prevention_sessions_week: null,
        weekly_load_context: null,
        health_consent_status: 'not_required',
        health_consent_granted_at: null,
        health_consent_revoked_at: null,
        health_consent_source: null,
        health_consent_audit_trail: [],
        health_data_retention_state: 'active',
      }
      const p = profileRowToUserProfile(row)
      expect(p.clubCode).toBe('CLUB1')
      expect(p.weeklySessions).toBe(3)
      expect(p.trainingLevel).toBe('performance')
      expect(p.seasonMode).toBe('in_season')
      expect(p.heightCm).toBe(180)
      expect(p.weightKg).toBe(85)
    })
  })

  describe('calendarRowToCalendarEvent', () => {
    it('mappe match_calendar vers CalendarEvent', () => {
      const row: MatchCalendarRow = {
        id: 'e1',
        user_id: 'u1',
        date: '2025-04-01',
        type: 'match',
        kickoff_time: '15:00:00',
        opponent: 'RC Test',
        opponent_code: '1234X',
        is_home: true,
        notes: null,
        rpe: 7,
        duration_min: 90,
        created_at: '2025-01-01T00:00:00Z',
      }
      const ev = calendarRowToCalendarEvent(row)
      expect(ev.id).toBe('e1')
      expect(ev.date).toBe('2025-04-01')
      expect(ev.type).toBe('match')
      expect(ev.kickoff_time).toBe('15:00')
      expect(ev.opponent).toBe('RC Test')
      expect(ev.opponent_code).toBe('1234X')
      expect(ev.is_home).toBe(true)
      expect(ev.rpe).toBe(7)
    })
  })

  describe('sessionLogRowToSessionLog', () => {
    it('mappe session_logs vers SessionLog', () => {
      const row: SessionLogRow = {
        id: 'log1',
        user_id: 'u1',
        date_iso: '2025-03-10',
        week: 'W2',
        session_type: 'LOWER',
        fatigue: 'FATIGUE',
        notes: 'dur',
        rpe: 8,
        duration_min: 60,
        created_at: '2025-03-10T12:00:00Z',
      }
      const log = sessionLogRowToSessionLog(row)
      expect(log.id).toBe('log1')
      expect(log.dateISO).toBe('2025-03-10')
      expect(log.week).toBe('W2')
      expect(log.sessionType).toBe('LOWER')
      expect(log.fatigue).toBe('FATIGUE')
      expect(log.rpe).toBe(8)
    })
  })
})
