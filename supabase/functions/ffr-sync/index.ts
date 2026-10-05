import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  extractClubMatchesFromCalendarJson,
  fetchFfrGraphql,
  isSafeFfrGraphqlQuery,
  QUERY_COMPETITION_CALENDAR,
  type NormalizedFfrMatch,
} from '../_shared/ffrGraphql.ts'
import { syncUserCalendar } from '../_shared/ffrCalendarSync.ts'
import { corsHeaders, json } from '../_shared/http.ts'
import { captureEdgeException } from '../_shared/sentry.ts'
import { requireUser } from '../_shared/supabase.ts'

type NormalizedMatch = NormalizedFfrMatch

interface RequestBody {
  action: string
  clubCode?: string
  competitionId?: string
  matches?: NormalizedMatch[]
  query?: string
  variables?: Record<string, unknown>
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()

    if (body.action === 'proxy_graphql') {
      return await handleProxyGraphql(req, body)
    }

    if (body.action === 'sync_calendar') {
      return await handleSyncCalendar(req, body)
    }

    return json({ success: false, error: 'unknown_action' }, 400)
  } catch (err) {
    console.error('ffr-sync error:', err)
    await captureEdgeException(err, { function: 'ffr-sync', extraTags: { scope: 'handler' } })
    return json({ success: false, error: 'internal_error', message: String(err) }, 500)
  }
})

async function handleProxyGraphql(req: Request, body: RequestBody) {
  const { user } = await requireUser(req)
  if (!user) return json({ success: false, error: 'unauthorized' }, 401)
  if (!isSafeFfrGraphqlQuery(body.query)) {
    return json({ success: false, error: 'invalid_query' }, 400)
  }
  const variables = body.variables && typeof body.variables === 'object' ? body.variables : {}
  try {
    const result = await fetchFfrGraphql(body.query, variables)
    console.log('proxy_graphql', { status: result.status, ok: result.ok })
    return json({ success: result.ok, ok: result.ok, status: result.status, json: result.json })
  } catch (err) {
    console.error('proxy_graphql failed:', err)
    await captureEdgeException(err, { function: 'ffr-sync', extraTags: { scope: 'proxy_graphql' } })
    return json({ success: false, ok: false, error: 'ffr_unavailable', message: String(err) })
  }
}

async function resolveClubMatches(
  competitionId: string,
  clubCode: string,
  clientMatches: NormalizedMatch[] | undefined,
): Promise<{ matches: NormalizedMatch[] } | { error: string }> {
  if (clientMatches?.length) return { matches: clientMatches }

  const compIdNum = Number(competitionId)
  const res = await fetchFfrGraphql(QUERY_COMPETITION_CALENDAR, {
    compId: Number.isFinite(compIdNum) ? compIdNum : competitionId,
  })
  console.log('sync_calendar ffr fetch', { status: res.status, ok: res.ok })
  if (!res.ok) return { error: `ffr_http_${res.status}` }

  const extracted = extractClubMatchesFromCalendarJson(res.json, clubCode)
  if (extracted.error) return { error: extracted.error }
  if (!extracted.matches?.length) return { error: 'missing_matches' }
  return { matches: extracted.matches }
}

async function handleSyncCalendar(req: Request, body: RequestBody) {
  const { user, serviceClient } = await requireUser(req)
  if (!user) return json({ success: false, error: 'unauthorized' }, 401)

  const { competitionId, matches: clientMatches, clubCode: bodyClubCode } = body
  if (!competitionId) return json({ success: false, error: 'missing_competition_id' }, 400)

  const clubCode = bodyClubCode ?? (await serviceClient
    .from('profiles')
    .select('club_code')
    .eq('id', user.id)
    .single()
    .then((r: { data?: { club_code?: string } | null }) => r.data?.club_code))

  if (!clubCode) return json({ success: false, error: 'no_club_code' }, 400)

  let matches: NormalizedMatch[]
  try {
    const resolved = await resolveClubMatches(competitionId, clubCode, clientMatches)
    if ('error' in resolved) return json({ success: false, error: resolved.error })
    matches = resolved.matches
  } catch (err) {
    console.error('sync_calendar ffr fetch threw:', err)
    await captureEdgeException(err, { function: 'ffr-sync', extraTags: { scope: 'ffr_fetch' } })
    return json({ success: false, error: 'ffr_unavailable', message: String(err) })
  }

  try {
    console.log('sync_calendar start', { userId: user.id, competitionId, matchCount: matches.length })
    const imported = await syncUserCalendar(serviceClient, user.id, clubCode, competitionId, matches)

    await serviceClient
      .from('profiles')
      .update({ ffr_last_sync_at: new Date().toISOString() })
      .eq('id', user.id)

    return json({ success: true, imported })
  } catch (err) {
    console.error('sync_calendar failed:', err)
    await captureEdgeException(err, { function: 'ffr-sync', extraTags: { scope: 'sync_calendar' } })
    const msg = err instanceof Error ? err.message : String(err)
    return json({ success: false, error: 'sync_failed', detail: msg, imported: 0 })
  }
}
