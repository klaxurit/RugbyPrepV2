import { corsHeaders, json } from '../_shared/http.ts'
import { captureEdgeException } from '../_shared/sentry.ts'
import { requireUser } from '../_shared/supabase.ts'

const DEFAULT_ADMIN_EMAILS = ['juncahugo@gmail.com']

function adminAllowlist(): Set<string> {
  const raw = Deno.env.get('ADMIN_EMAIL_ALLOWLIST') ?? DEFAULT_ADMIN_EMAILS.join(',')
  return new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  )
}

function isAdminCaller(email: string | undefined | null): boolean {
  if (!email) return false
  return adminAllowlist().has(email.trim().toLowerCase())
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type StaffRole =
  | 'head_coach'
  | 'assistant_coach'
  | 'strength_coach'
  | 'physio'
  | 'analyst'
  | 'admin'

const STAFF_ROLES = new Set<StaffRole>([
  'head_coach',
  'assistant_coach',
  'strength_coach',
  'physio',
  'analyst',
  'admin',
])

async function resolveUserId(
  serviceClient: Awaited<ReturnType<typeof requireUser>>['serviceClient'],
  query: string
): Promise<string | null> {
  const q = query.trim()
  if (UUID_RE.test(q)) return q

  const { data, error } = await serviceClient.rpc('admin_find_user_id_by_email', { p_email: q })
  if (error) throw new Error(error.message)
  return (data as string | null) ?? null
}

async function findStaffRowId(
  serviceClient: Awaited<ReturnType<typeof requireUser>>['serviceClient'],
  row: { staff_user_id: string; club_id: string; squad_id: string | null }
): Promise<string | null> {
  let q = serviceClient
    .from('club_staff_memberships')
    .select('id')
    .eq('staff_user_id', row.staff_user_id)
    .eq('club_id', row.club_id)
    .limit(1)
  q = row.squad_id == null ? q.is('squad_id', null) : q.eq('squad_id', row.squad_id)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data?.[0]?.id ?? null
}

async function upsertStaffRow(
  serviceClient: Awaited<ReturnType<typeof requireUser>>['serviceClient'],
  row: {
    staff_user_id: string
    club_id: string
    squad_id: string | null
    role: StaffRole
    status: 'active' | 'inactive'
    metadata: Record<string, unknown>
  }
): Promise<'inserted' | 'updated'> {
  const id = await findStaffRowId(serviceClient, row)
  if (id) {
    const { error } = await serviceClient
      .from('club_staff_memberships')
      .update({ role: row.role, status: row.status, metadata: row.metadata })
      .eq('id', id)
    if (error) throw new Error(error.message)
    return 'updated'
  }
  const { error } = await serviceClient.from('club_staff_memberships').insert(row)
  if (error) throw new Error(error.message)
  return 'inserted'
}

async function findAthleteRowId(
  serviceClient: Awaited<ReturnType<typeof requireUser>>['serviceClient'],
  row: { athlete_user_id: string; club_id: string; squad_id: string | null }
): Promise<string | null> {
  let q = serviceClient
    .from('club_athlete_memberships')
    .select('id')
    .eq('athlete_user_id', row.athlete_user_id)
    .eq('club_id', row.club_id)
    .limit(1)
  q = row.squad_id == null ? q.is('squad_id', null) : q.eq('squad_id', row.squad_id)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data?.[0]?.id ?? null
}

async function upsertAthleteRow(
  serviceClient: Awaited<ReturnType<typeof requireUser>>['serviceClient'],
  row: {
    athlete_user_id: string
    club_id: string
    squad_id: string | null
    status: 'active' | 'inactive'
    source: 'manual'
    metadata: Record<string, unknown>
  }
): Promise<'inserted' | 'updated'> {
  const id = await findAthleteRowId(serviceClient, row)
  if (id) {
    const { error } = await serviceClient
      .from('club_athlete_memberships')
      .update({ status: row.status, source: row.source, metadata: row.metadata })
      .eq('id', id)
    if (error) throw new Error(error.message)
    return 'updated'
  }
  const { error } = await serviceClient.from('club_athlete_memberships').insert(row)
  if (error) throw new Error(error.message)
  return 'inserted'
}

async function loadUserDetail(
  serviceClient: Awaited<ReturnType<typeof requireUser>>['serviceClient'],
  userId: string
) {
  const [{ data: authData }, { data: profile }, { data: entitlements }, { data: staff }, { data: athletes }] =
    await Promise.all([
      serviceClient.auth.admin.getUserById(userId),
      serviceClient
        .from('profiles')
        .select(
          'club_code, club_name, weekly_sessions, season_mode, planning_anchors, season_transition_state, onboarding_complete, display_name, avatar_url'
        )
        .eq('id', userId)
        .maybeSingle(),
      serviceClient
        .from('user_entitlements')
        .select('entitlement_key, status, source')
        .eq('user_id', userId)
        .eq('status', 'active'),
      serviceClient
        .from('club_staff_memberships')
        .select('club_id, squad_id, role, status')
        .eq('staff_user_id', userId),
      serviceClient
        .from('club_athlete_memberships')
        .select('club_id, squad_id, status')
        .eq('athlete_user_id', userId),
    ])

  const premiumHints = new Set([
    'premium_logging',
    'premium_program_adaptations',
    'advanced_notifications',
    'premium_analytics',
    'coach_mode',
    'priority_support',
  ])

  const premiumEntitlements = (entitlements ?? [])
    .map((e) => e.entitlement_key as string)
    .filter((k) => premiumHints.has(k))

  return {
    userId,
    email: authData.user?.email ?? null,
    profile: profile ?? null,
    premiumEntitlements,
    staffMemberships: staff ?? [],
    athleteMemberships: athletes ?? [],
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { user, serviceClient } = await requireUser(req)
  if (!user) return json({ error: 'Authentication required' }, 401)
  if (!isAdminCaller(user.email)) return json({ error: 'Forbidden' }, 403)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const action = String(body.action ?? '')

  try {
    switch (action) {
      case 'search': {
        const query = String(body.query ?? '').trim()
        if (!query) return json({ error: 'query required' }, 400)
        const userId = await resolveUserId(serviceClient, query)
        if (!userId) return json({ error: 'User not found' }, 404)
        const { data: authData } = await serviceClient.auth.admin.getUserById(userId)
        return json({ userId, email: authData.user?.email ?? null })
      }

      case 'get_user': {
        const userId = String(body.userId ?? '').trim()
        if (!UUID_RE.test(userId)) return json({ error: 'Invalid userId' }, 400)
        const detail = await loadUserDetail(serviceClient, userId)
        return json(detail)
      }

      case 'update_profile': {
        const userId = String(body.userId ?? '').trim()
        if (!UUID_RE.test(userId)) return json({ error: 'Invalid userId' }, 400)

        const patch: Record<string, unknown> = {}

        if (body.seasonMode !== undefined) {
          patch.season_mode = String(body.seasonMode)
        }
        if (body.weeklySessions !== undefined) {
          const n = Number(body.weeklySessions)
          if (!Number.isFinite(n) || n < 1 || n > 7) {
            return json({ error: 'weeklySessions must be 1–7' }, 400)
          }
          patch.weekly_sessions = Math.round(n)
        }

        if (body.planningAnchors !== undefined) {
          const merge = body.mergePlanningAnchors !== false
          if (body.planningAnchors === null) {
            patch.planning_anchors = null
          } else if (merge) {
            const { data: existing } = await serviceClient
              .from('profiles')
              .select('planning_anchors')
              .eq('id', userId)
              .maybeSingle()
            const prev =
              existing?.planning_anchors && typeof existing.planning_anchors === 'object'
                ? (existing.planning_anchors as Record<string, unknown>)
                : {}
            const incoming = body.planningAnchors as Record<string, unknown>
            const merged: Record<string, unknown> = { ...prev }
            for (const [key, value] of Object.entries(incoming)) {
              if (value === null) delete merged[key]
              else merged[key] = value
            }
            patch.planning_anchors = merged
          } else {
            patch.planning_anchors = body.planningAnchors
          }
        }

        if (Object.keys(patch).length === 0) {
          return json({ error: 'No fields to update' }, 400)
        }

        const { error } = await serviceClient.from('profiles').update(patch).eq('id', userId)
        if (error) return json({ error: error.message }, 500)
        return json({ ok: true })
      }

      case 'grant_premium': {
        const userId = String(body.userId ?? '').trim()
        if (!UUID_RE.test(userId)) return json({ error: 'Invalid userId' }, 400)
        const { error } = await serviceClient.rpc('grant_premium_to_tester', { target_user_id: userId })
        if (error) return json({ error: error.message }, 500)
        return json({ ok: true })
      }

      case 'revoke_premium': {
        const userId = String(body.userId ?? '').trim()
        if (!UUID_RE.test(userId)) return json({ error: 'Invalid userId' }, 400)
        const { error } = await serviceClient.rpc('revoke_premium_from_tester', { target_user_id: userId })
        if (error) return json({ error: error.message }, 500)
        return json({ ok: true })
      }

      case 'upsert_staff_membership': {
        const staffUserId = String(body.staffUserId ?? '').trim()
        const clubId = String(body.clubId ?? '').trim()
        const squadIdRaw = body.squadId !== undefined && body.squadId !== null ? String(body.squadId).trim() : null
        const squad_id = squadIdRaw === '' ? null : squadIdRaw
        const role = String(body.role ?? '') as StaffRole
        const status = (body.status === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive'

        if (!UUID_RE.test(staffUserId)) return json({ error: 'Invalid staffUserId' }, 400)
        if (!clubId) return json({ error: 'clubId required' }, 400)
        if (!STAFF_ROLES.has(role)) return json({ error: 'Invalid role' }, 400)

        const result = await upsertStaffRow(serviceClient, {
          staff_user_id: staffUserId,
          club_id: clubId,
          squad_id,
          role,
          status,
          metadata: { granted_by: user.id, granted_at: new Date().toISOString() },
        })
        return json({ ok: true, result })
      }

      case 'upsert_athlete_membership': {
        const athleteUserId = String(body.athleteUserId ?? '').trim()
        const clubId = String(body.clubId ?? '').trim()
        const squadIdRaw = body.squadId !== undefined && body.squadId !== null ? String(body.squadId).trim() : null
        const squad_id = squadIdRaw === '' ? null : squadIdRaw
        const status = (body.status === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive'

        if (!UUID_RE.test(athleteUserId)) return json({ error: 'Invalid athleteUserId' }, 400)
        if (!clubId) return json({ error: 'clubId required' }, 400)

        const result = await upsertAthleteRow(serviceClient, {
          athlete_user_id: athleteUserId,
          club_id: clubId,
          squad_id,
          status,
          source: 'manual',
          metadata: { linked_by: user.id, linked_at: new Date().toISOString() },
        })
        return json({ ok: true, result })
      }

      case 'backfill_athlete_memberships': {
        const { data: profileRows, error: profileErr } = await serviceClient
          .from('profiles')
          .select('id, club_code')
          .not('club_code', 'is', null)

        if (profileErr) return json({ error: profileErr.message }, 500)

        let synced = 0
        for (const row of profileRows ?? []) {
          const code = String(row.club_code ?? '').trim()
          if (!code) continue
          await upsertAthleteRow(serviceClient, {
            athlete_user_id: row.id as string,
            club_id: code,
            squad_id: null,
            status: 'active',
            source: 'manual',
            metadata: { backfill_by: user.id, backfill_at: new Date().toISOString() },
          })
          synced += 1
        }
        return json({ ok: true, synced })
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (err) {
    await captureEdgeException(err, { function: 'admin-panel', extraTags: { action } })
    const message = err instanceof Error ? err.message : 'Internal error'
    return json({ error: message }, 500)
  }
})
