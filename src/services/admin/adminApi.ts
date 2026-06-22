import { supabase } from '../supabase/client'
import type { StaffMembershipRole } from '../staffPlanning/staffMembershipAdmin'

export type AdminUserDetail = {
  userId: string
  email: string | null
  profile: {
    club_code: string | null
    club_name: string | null
    weekly_sessions: number | null
    season_mode: string | null
    planning_anchors: Record<string, unknown> | null
    season_transition_state: Record<string, unknown> | null
    onboarding_complete: boolean | null
    display_name: string | null
    avatar_url: string | null
  } | null
  premiumEntitlements: string[]
  staffMemberships: Array<{
    club_id: string
    squad_id: string | null
    role: string
    status: string
  }>
  athleteMemberships: Array<{
    club_id: string
    squad_id: string | null
    status: string
  }>
}

type AdminPanelResponse<T> = T & { error?: string }

async function invokeAdmin<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<AdminPanelResponse<T>>('admin-panel', { body })
  if (error) throw new Error(error.message)
  if (data && typeof data === 'object' && 'error' in data && data.error) {
    throw new Error(String(data.error))
  }
  return data as T
}

export async function adminSearchUser(query: string): Promise<{ userId: string; email: string | null }> {
  return invokeAdmin({ action: 'search', query })
}

export async function adminGetUser(userId: string): Promise<AdminUserDetail> {
  return invokeAdmin({ action: 'get_user', userId })
}

export async function adminUpdateProfile(params: {
  userId: string
  seasonMode?: string
  weeklySessions?: number
  planningAnchors?: Record<string, unknown> | null
  mergePlanningAnchors?: boolean
}): Promise<{ ok: true }> {
  return invokeAdmin({
    action: 'update_profile',
    userId: params.userId,
    seasonMode: params.seasonMode,
    weeklySessions: params.weeklySessions,
    planningAnchors: params.planningAnchors,
    mergePlanningAnchors: params.mergePlanningAnchors ?? true,
  })
}

export async function adminGrantPremium(userId: string): Promise<{ ok: true }> {
  return invokeAdmin({ action: 'grant_premium', userId })
}

export async function adminRevokePremium(userId: string): Promise<{ ok: true }> {
  return invokeAdmin({ action: 'revoke_premium', userId })
}

export async function adminUpsertStaffMembership(params: {
  staffUserId: string
  clubId: string
  squadId?: string
  role: StaffMembershipRole
  status?: 'active' | 'inactive'
}): Promise<{ ok: true; result: 'inserted' | 'updated' }> {
  return invokeAdmin({
    action: 'upsert_staff_membership',
    staffUserId: params.staffUserId,
    clubId: params.clubId,
    squadId: params.squadId,
    role: params.role,
    status: params.status ?? 'active',
  })
}

export async function adminUpsertAthleteMembership(params: {
  athleteUserId: string
  clubId: string
  squadId?: string
  status?: 'active' | 'inactive'
}): Promise<{ ok: true; result: 'inserted' | 'updated' }> {
  return invokeAdmin({
    action: 'upsert_athlete_membership',
    athleteUserId: params.athleteUserId,
    clubId: params.clubId,
    squadId: params.squadId,
    status: params.status ?? 'active',
  })
}

export async function adminBackfillAthleteMemberships(): Promise<{ ok: true; synced: number }> {
  return invokeAdmin({ action: 'backfill_athlete_memberships' })
}
