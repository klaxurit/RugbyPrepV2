import type { CalendarEvent } from '../../types/training'

/** Sync « quotidien » classique (horaires / reportages FFR). */
export const FFR_STALE_SYNC_MS = 24 * 60 * 60 * 1000

/**
 * Fenêtre post-match où le hero affiche le score : resync plus agressif
 * pour rattraper la validation FFR du dimanche soir.
 */
export const FFR_SCORE_REFRESH_MS = 6 * 60 * 60 * 1000
export const FFR_POST_MATCH_SCORE_WINDOW_HOURS = 48

function diffHoursISO(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T12:00:00`).getTime()
  const to = new Date(`${toISO}T12:00:00`).getTime()
  return (to - from) / (60 * 60 * 1000)
}

/** Match FFR récent sans score officiel validé → on veut re-tirer l’API. */
export function hasPendingFfrPostMatchScore(
  events: CalendarEvent[],
  todayISO: string,
): boolean {
  return events.some((e) => {
    if (e.type !== 'match' || e.user_hidden) return false
    if (e.source !== 'ffr_import') return false
    if (e.ffr_score_valid) return false
    if (!e.date || e.date > todayISO) return false
    const hours = diffHoursISO(e.date, todayISO)
    return hours >= 0 && hours <= FFR_POST_MATCH_SCORE_WINDOW_HOURS
  })
}

export type FfrAutoSyncReason = 'stale' | 'post_match_score' | null

/**
 * Décide si le client doit lancer un sync FFR silencieux.
 * - `stale` : >24h depuis la dernière sync
 * - `post_match_score` : match FFR ≤48h sans score validé, et dernière sync >6h
 */
export function shouldAutoSyncFfrCalendar(input: {
  lastSyncAt: string | null | undefined
  events: CalendarEvent[]
  todayISO: string
  nowMs?: number
}): FfrAutoSyncReason {
  const now = input.nowMs ?? Date.now()
  const lastSync = input.lastSyncAt ? new Date(input.lastSyncAt).getTime() : 0
  const age = now - lastSync

  if (age > FFR_STALE_SYNC_MS) return 'stale'

  if (
    hasPendingFfrPostMatchScore(input.events, input.todayISO) &&
    age > FFR_SCORE_REFRESH_MS
  ) {
    return 'post_match_score'
  }

  return null
}
