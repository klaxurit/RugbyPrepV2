/**
 * Écriture calendrier FFR → match_calendar (insert / update / link manuel).
 * Partagé entre `ffr-sync` (JWT user) et `ffr-sync-batch` (cron).
 */

import { resolveMatchKindOnFfrSync } from './inferMatchKindFromFfrJournee.ts'
import type { NormalizedFfrMatch } from './ffrGraphql.ts'

/** Client service-role PostgREST (typage lâche côté Edge Deno). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- chaînes .from().select/update partagées ffr-sync / batch
export type FfrSyncServiceClient = any

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
  match_kind: string | null
  competition_id: string | null
}

function ffrScoreDbFields(match: NormalizedFfrMatch): Record<string, unknown> {
  return {
    ffr_score_locale: match.score_locale ?? null,
    ffr_score_visiteur: match.score_visiteur ?? null,
    ffr_score_valid: match.score_valid ?? false,
  }
}

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

/** Sync les rencontres FFR d’un user. Retourne le nombre de nouvelles liaisons / inserts. */
export async function syncUserCalendar(
  serviceClient: FfrSyncServiceClient,
  userId: string,
  clubCode: string,
  competitionId: string,
  matches: NormalizedFfrMatch[],
): Promise<number> {
  let imported = 0

  const { data: existing } = await serviceClient
    .from('match_calendar')
    .select('id, date, external_id, opponent_code, source, user_hidden, user_override, notes, rpe, duration_min, match_kind, competition_id')
    .eq('user_id', userId)

  const existingByExtId = new Map<string, ExistingEvent>()
  const existingByDate = new Map<string, ExistingEvent[]>()
  for (const e of (existing ?? []) as ExistingEvent[]) {
    if (e.external_id) existingByExtId.set(e.external_id, e)
    const dateEvents = existingByDate.get(e.date) ?? []
    dateEvents.push(e)
    existingByDate.set(e.date, dateEvents)
  }

  for (const match of matches) {
    const isHome = match.home_club_code === clubCode
    const opponent = isHome ? match.away_club_name : match.home_club_name
    const opponentCode = isHome ? match.away_club_code : match.home_club_code

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
        ...ffrScoreDbFields(match),
      }

      if (!existingImport.user_override) {
        updateData.date = match.match_date
        updateData.kickoff_time = match.kickoff_time ?? null
      } else {
        const override = existingImport.user_override
        if (override.date === match.match_date) {
          updateData.user_override = null
          updateData.date = match.match_date
          updateData.kickoff_time = match.kickoff_time ?? null
        }
      }

      const inferredKind = resolveMatchKindOnFfrSync(
        existingImport.match_kind as 'league' | 'friendly' | 'cup_final' | null,
        match.journee_name,
      )
      if (inferredKind) updateData.match_kind = inferredKind

      await serviceClient
        .from('match_calendar')
        .update(updateData)
        .eq('id', existingImport.id)

      continue
    }

    const linkedManual = findManualMatchNearDate(existingByDate, match.match_date, opponentCode)
    if (linkedManual) {
      const linkUpdate: Record<string, unknown> = {
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
        ...ffrScoreDbFields(match),
      }
      const inferredKind = resolveMatchKindOnFfrSync(
        linkedManual.match_kind as 'league' | 'friendly' | 'cup_final' | null,
        match.journee_name,
      )
      if (inferredKind) linkUpdate.match_kind = inferredKind

      await serviceClient
        .from('match_calendar')
        .update(linkUpdate)
        .eq('id', linkedManual.id)

      imported++
      continue
    }

    const insertRow: Record<string, unknown> = {
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
      ...ffrScoreDbFields(match),
    }
    const inferredKind = resolveMatchKindOnFfrSync(null, match.journee_name)
    if (inferredKind) insertRow.match_kind = inferredKind

    await serviceClient
      .from('match_calendar')
      .insert(insertRow)

    imported++
  }

  const incomingExternalIds = new Set(matches.map((m) => m.external_id))
  const staleIds = ((existing ?? []) as ExistingEvent[])
    .filter((row) => row.source === 'ffr_import')
    .filter((row) => {
      if (row.external_id && incomingExternalIds.has(row.external_id)) return false
      return row.competition_id !== competitionId
    })
    .map((row) => row.id)
  if (staleIds.length) {
    console.log('sync_calendar purge other competition', { count: staleIds.length })
    await serviceClient.from('match_calendar').delete().in('id', staleIds)
  }

  return imported
}
