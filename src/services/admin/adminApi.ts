import { supabase } from '../supabase/client'
import type { StaffMembershipRole } from '../staffPlanning/staffMembershipAdmin'
import { resolveProfileAvatarUrl } from '../profile/resolveAvatarUrl'

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

export type AdminUserListItem = {
  userId: string
  email: string | null
  displayName: string | null
  avatarUrl: string | null
  clubCode: string | null
  clubName: string | null
  weeklySessions: number | null
  seasonMode: string | null
  onboardingComplete: boolean
  hasProfile: boolean
  isPremium: boolean
  isFounding: boolean
  isActive: boolean
  sessionsThisWeek: number
  updatedAt: string | null
}

export type AdminUserListPage = {
  page: number
  pageSize: number
  total: number
  weekStart: string
  weekEnd: string
  users: AdminUserListItem[]
}

function mapAdminUserListRow(raw: Record<string, unknown>): AdminUserListItem {
  const avatarUrl = raw.avatar_url != null ? String(raw.avatar_url) : null
  const avatarPath = raw.avatar_path != null ? String(raw.avatar_path) : null
  return {
    userId: String(raw.user_id ?? ''),
    email: raw.email != null ? String(raw.email) : null,
    displayName: raw.display_name != null ? String(raw.display_name) : null,
    avatarUrl: resolveProfileAvatarUrl(avatarUrl, avatarPath) ?? null,
    clubCode: raw.club_code != null ? String(raw.club_code) : null,
    clubName: raw.club_name != null ? String(raw.club_name) : null,
    weeklySessions: raw.weekly_sessions != null ? Number(raw.weekly_sessions) : null,
    seasonMode: raw.season_mode != null ? String(raw.season_mode) : null,
    onboardingComplete: raw.onboarding_complete === true,
    hasProfile: raw.has_profile === true,
    isPremium: raw.is_premium === true,
    isFounding: raw.is_founding === true,
    isActive: raw.is_active === true,
    sessionsThisWeek: Number(raw.sessions_this_week ?? 0),
    updatedAt: raw.updated_at != null ? String(raw.updated_at) : null,
  }
}

export async function adminListUsers(params: {
  page?: number
  pageSize?: number
  search?: string
}): Promise<AdminUserListPage> {
  const raw = await invokeAdmin<{
    page: number
    pageSize: number
    total: number
    weekStart?: string
    weekEnd?: string
    users: Record<string, unknown>[]
  }>({
    action: 'list_users',
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
    search: params.search,
  })
  return {
    page: raw.page,
    pageSize: raw.pageSize,
    total: raw.total,
    weekStart: raw.weekStart ?? '',
    weekEnd: raw.weekEnd ?? '',
    users: (raw.users ?? []).map(mapAdminUserListRow),
  }
}
