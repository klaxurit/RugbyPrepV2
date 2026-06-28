import { corsHeaders, json } from '../_shared/http.ts'
import { captureEdgeException } from '../_shared/sentry.ts'
import { requireUser } from '../_shared/supabase.ts'

type ServiceClient = Awaited<ReturnType<typeof requireUser>>['serviceClient']

async function upsertAthleteClubMembership(
  serviceClient: ServiceClient,
  userId: string,
  clubId: string
): Promise<void> {
  const club_id = clubId.trim()
  if (!club_id) throw new Error('clubCode required')

  const { data: existing } = await serviceClient
    .from('club_athlete_memberships')
    .select('id')
    .eq('athlete_user_id', userId)
    .eq('club_id', club_id)
    .is('squad_id', null)
    .limit(1)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await serviceClient
      .from('club_athlete_memberships')
      .update({ status: 'active', source: 'profile_backfill', updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
    return
  }

  const { error } = await serviceClient.from('club_athlete_memberships').insert({
    athlete_user_id: userId,
    club_id,
    squad_id: null,
    status: 'active',
    source: 'profile_backfill',
    metadata: {},
  })
  if (error) throw new Error(error.message)
}

async function deactivateAthleteClubMemberships(
  serviceClient: ServiceClient,
  userId: string,
  clubId?: string
): Promise<void> {
  let q = serviceClient
    .from('club_athlete_memberships')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .eq('athlete_user_id', userId)
    .eq('status', 'active')
    .is('squad_id', null)

  if (clubId?.trim()) {
    q = q.eq('club_id', clubId.trim())
  }

  const { error } = await q
  if (error) throw new Error(error.message)
}

/**
 * sync-club-membership — lie le compte connecté à club_athlete_memberships
 * quand il choisit un club dans son profil (profiles.club_code seul ne suffit pas pour le staff).
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { user, serviceClient } = await requireUser(req)
  if (!user) return json({ error: 'Authentication required' }, 401)

  let body: { clubCode?: string | null } = {}
  try {
    body = await req.json()
  } catch {
    // body optionnel
  }

  try {
    const raw = body.clubCode
    const clubCode = raw === null || raw === undefined ? null : String(raw).trim()

    if (!clubCode) {
      await deactivateAthleteClubMemberships(serviceClient, user.id)
      return json({ ok: true, action: 'deactivated' })
    }

    await upsertAthleteClubMembership(serviceClient, user.id, clubCode)
    return json({ ok: true, action: 'upserted', clubId: clubCode })
  } catch (err) {
    await captureEdgeException(err, { function: 'sync-club-membership' })
    const message = err instanceof Error ? err.message : 'Internal error'
    return json({ error: message }, 500)
  }
})
