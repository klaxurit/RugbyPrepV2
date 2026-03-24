/**
 * Contrat repository staff (V2 club) — aucune implémentation réseau / Supabase ici.
 */
import type { UserProfile, CalendarEvent, SessionLog } from '../../types/training'

export interface StaffPlanningAthleteRecord {
  athleteId: string
  clubId?: string
  squadId?: string
  profile: UserProfile
  events: CalendarEvent[]
  logs: SessionLog[]
  fatigue: 'OK' | 'FATIGUE'
  acwrZone?: 'underload' | 'optimal' | 'caution' | 'danger' | 'critical' | null
}

export interface StaffPlanningRepository {
  listAthletesForClub(params: { clubId: string; squadId?: string }): Promise<StaffPlanningAthleteRecord[]>
}
