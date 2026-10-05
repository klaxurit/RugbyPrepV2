/**
 * Cron batch : resync calendrier FFR (+ scores) pour tous les profils
 * avec club + compétition. Auth : x-cron-secret (pas de JWT user).
 *
 * Créneaux (UTC, ≈ Europe/Paris) — voir migration schedule_ffr_sync_cron :
 *   dimanche 20:00 UTC, lundi 06:00 UTC, lundi 18:00 UTC (~20h Paris été).
 */

import { corsHeaders, json } from '../_shared/http.ts'
import {
  extractClubMatchesFromCalendarJson,
  fetchFfrGraphql,
  QUERY_COMPETITION_CALENDAR,
} from '../_shared/ffrGraphql.ts'
import { syncUserCalendar } from '../_shared/ffrCalendarSync.ts'
import { captureEdgeException } from '../_shared/sentry.ts'
import { createClients } from '../_shared/supabase.ts'

interface ProfileRow {
  id: string
  club_code: string
  ffr_competition_id: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const cronSecret = Deno.env.get('CRON_SHARED_SECRET')
  if (!cronSecret) return json({ error: 'Cron secret not configured' }, 500)
  if (req.headers.get('x-cron-secret') !== cronSecret) {
    return json({ error: 'Invalid cron secret' }, 401)
  }

  const { serviceClient } = createClients(req)

  try {
    const { data: profiles, error } = await serviceClient
      .from('profiles')
      .select('id, club_code, ffr_competition_id')
      .not('club_code', 'is', null)
      .not('ffr_competition_id', 'is', null)

    if (error) return json({ error: error.message }, 400)

    const eligible = ((profiles ?? []) as ProfileRow[]).filter(
      (p) => Boolean(p.club_code?.trim()) && Boolean(p.ffr_competition_id?.trim()),
    )

    const byCompetition = new Map<string, ProfileRow[]>()
    for (const p of eligible) {
      const list = byCompetition.get(p.ffr_competition_id) ?? []
      list.push(p)
      byCompetition.set(p.ffr_competition_id, list)
    }

    let usersSynced = 0
    let usersFailed = 0
    let competitionsFetched = 0
    let competitionsFailed = 0
    let importedTotal = 0

    for (const [competitionId, users] of byCompetition) {
      const compIdNum = Number(competitionId)
      let res: Awaited<ReturnType<typeof fetchFfrGraphql>>
      try {
        res = await fetchFfrGraphql(QUERY_COMPETITION_CALENDAR, {
          compId: Number.isFinite(compIdNum) ? compIdNum : competitionId,
        })
      } catch (err) {
        competitionsFailed++
        console.error('ffr-sync-batch ffr fetch threw', { competitionId, err: String(err) })
        await captureEdgeException(err, {
          function: 'ffr-sync-batch',
          extraTags: { scope: 'ffr_fetch', competitionId },
        })
        usersFailed += users.length
        continue
      }

      if (!res.ok) {
        competitionsFailed++
        console.error('ffr-sync-batch ffr http', { competitionId, status: res.status })
        usersFailed += users.length
        continue
      }

      competitionsFetched++

      for (const user of users) {
        try {
          const extracted = extractClubMatchesFromCalendarJson(res.json, user.club_code)
          if (extracted.error || !extracted.matches?.length) {
            usersFailed++
            continue
          }

          const imported = await syncUserCalendar(
            serviceClient,
            user.id,
            user.club_code,
            competitionId,
            extracted.matches,
          )
          importedTotal += imported

          await serviceClient
            .from('profiles')
            .update({ ffr_last_sync_at: new Date().toISOString() })
            .eq('id', user.id)

          usersSynced++
        } catch (err) {
          usersFailed++
          console.error('ffr-sync-batch user failed', { userId: user.id, err: String(err) })
          await captureEdgeException(err, {
            function: 'ffr-sync-batch',
            extraTags: { scope: 'user_sync', userId: user.id },
          })
        }
      }
    }

    console.log('ffr-sync-batch done', {
      eligible: eligible.length,
      competitions: byCompetition.size,
      competitionsFetched,
      competitionsFailed,
      usersSynced,
      usersFailed,
      importedTotal,
    })

    return json({
      ok: true,
      eligible: eligible.length,
      competitions: byCompetition.size,
      competitionsFetched,
      competitionsFailed,
      usersSynced,
      usersFailed,
      importedTotal,
    })
  } catch (err) {
    console.error('ffr-sync-batch error:', err)
    await captureEdgeException(err, { function: 'ffr-sync-batch', extraTags: { scope: 'handler' } })
    return json({ error: 'internal_error', message: String(err) }, 500)
  }
})
