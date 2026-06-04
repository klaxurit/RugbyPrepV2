import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, json } from '../_shared/http.ts'
import { captureEdgeException } from '../_shared/sentry.ts'
import { requireUser } from '../_shared/supabase.ts'

// ─── Types ───

interface NormalizedMatch {
  external_id: string
  match_date: string
  kickoff_time?: string
  home_club_code: string
  home_club_name: string
  away_club_code: string
  away_club_name: string
  match_day?: number
  journee_name?: string
  venue?: string
  match_status: string
}

interface RequestBody {
  action: string
  clubCode?: string
  competitionId?: string
  matches?: NormalizedMatch[]
}

// ─── Handler ───

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body: RequestBody = await req.json()

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

// ─── sync_calendar ───

async function handleSyncCalendar(req: Request, body: RequestBody) {
  const { user, serviceClient } = await requireUser(req)
  if (!user) return json({ success: false, error: 'unauthorized' }, 401)

  const { competitionId, matches: clientMatches, clubCode: bodyClubCode } = body
  if (!competitionId) return json({ success: false, error: 'missing_competition_id' }, 400)
  if (!clientMatches?.length) return json({ success: false, error: 'missing_matches' }, 400)

  const clubCode = bodyClubCode ?? (await serviceClient
    .from('profiles')
    .select('club_code')
    .eq('id', user.id)
    .single()
    .then(r => r.data?.club_code))

  if (!clubCode) return json({ success: false, error: 'no_club_code' }, 400)

  try {
    const imported = await syncUserCalendar(serviceClient, user.id, clubCode, competitionId, clientMatches)

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

// ─── Types ───

interface SupabaseClient {
  from: (table: string) => { select: (...args: unknown[]) => unknown; insert: (...args: unknown[]) => unknown; update: (...args: unknown[]) => unknown; delete: () => unknown }
}

interface ExistingEvent {
  id: string
  date: string
  external_id: string | null
  opponent_code: string | null
  source: string
  user_hidden: boolean
  user_override: { date?: string; kickoff_time?: string } | null
  notes: string | null
  rpe: number | null
  duration_min: number | null
  kickoff_time: string | null
}

// ─── Sync user calendar ───

async function syncUserCalendar(
  serviceClient: SupabaseClient,
  userId: string,
  clubCode: string,
  competitionId: string,
  matches: NormalizedMatch[],
): Promise<number> {
  let imported = 0

  const { data: existing } = await serviceClient
    .from('match_calendar')
    .select('id, date, external_id, opponent_code, source, user_hidden, user_override, notes, rpe, duration_min')
    .eq('user_id', userId)

  const existingByExtId = new Map<string, ExistingEvent>()
  const existingByDate = new Map<string, ExistingEvent[]>()
  for (const e of existing ?? []) {
    if (e.external_id) existingByExtId.set(e.external_id, e)
    const dateEvents = existingByDate.get(e.date) ?? []
    dateEvents.push(e)
    existingByDate.set(e.date, dateEvents)
  }

  for (const match of matches) {
    const isHome = match.home_club_code === clubCode
    const opponent = isHome ? match.away_club_name : match.home_club_name
    const opponentCode = isHome ? match.away_club_code : match.home_club_code

    // Case 1: Already imported (same external_id) → update
    const existingImport = existingByExtId.get(match.external_id)
    if (existingImport) {
      const updateData: Record<string, unknown> = {
        opponent,
        opponent_code: opponentCode,
        is_home: isHome,
        match_day: match.match_day,
        journee_name: match.journee_name ?? null,
        match_status: match.match_status,
        venue: match.venue,
        competition_id: competitionId,
        synced_at: new Date().toISOString(),
      }

      if (!existingImport.user_override) {
        updateData.date = match.match_date
        updateData.kickoff_time = match.kickoff_time ?? null
      } else {
        const override = existingImport.user_override as { date?: string; kickoff_time?: string }
        if (override.date === match.match_date) {
          updateData.user_override = null
          updateData.date = match.match_date
          updateData.kickoff_time = match.kickoff_time ?? null
        }
      }

      await serviceClient
        .from('match_calendar')
        .update(updateData)
        .eq('id', existingImport.id)

      continue
    }

    // Case 2: Manual match at ±1 day with same opponent → link
    const linkedManual = findManualMatchNearDate(existingByDate, match.match_date, opponentCode)
    if (linkedManual) {
      await serviceClient
        .from('match_calendar')
        .update({
          source: 'ffr_import',
          external_id: match.external_id,
          date: match.match_date,
          kickoff_time: match.kickoff_time ?? linkedManual.kickoff_time ?? null,
          opponent,
          opponent_code: opponentCode,
          is_home: isHome,
          competition_id: competitionId,
          match_day: match.match_day,
          journee_name: match.journee_name ?? null,
          match_status: match.match_status,
          venue: match.venue,
          synced_at: new Date().toISOString(),
        })
        .eq('id', linkedManual.id)

      imported++
      continue
    }

    // Case 3: New match → create
    await serviceClient
      .from('match_calendar')
      .insert({
        user_id: userId,
        date: match.match_date,
        type: 'match',
        kickoff_time: match.kickoff_time ?? null,
        opponent,
        opponent_code: opponentCode,
        is_home: isHome,
        source: 'ffr_import',
        external_id: match.external_id,
        competition_id: competitionId,
        match_day: match.match_day,
        journee_name: match.journee_name ?? null,
        match_status: match.match_status,
        venue: match.venue,
        user_hidden: false,
        synced_at: new Date().toISOString(),
      })

    imported++
  }

  return imported
}

// ─── Helpers ───

function findManualMatchNearDate(
  existingByDate: Map<string, ExistingEvent[]>,
  matchDate: string,
  opponentCode: string,
): ExistingEvent | null {
  const d = new Date(matchDate)
  for (let offset = -1; offset <= 1; offset++) {
    const checkDate = new Date(d)
    checkDate.setDate(checkDate.getDate() + offset)
    const dateStr = checkDate.toISOString().slice(0, 10)
    const events = existingByDate.get(dateStr) ?? []
    for (const e of events) {
      if (e.source === 'manual' && e.opponent_code === opponentCode) {
        return e
      }
    }
  }
  return null
}
