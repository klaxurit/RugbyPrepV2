import type { CalendarEvent } from '../../types/training'

/** Row shape returned by `match_calendar` select (snake_case). */
export type MatchCalendarRow = {
  id: string
  date: string
  type: string
  kickoff_time?: string | null
  opponent?: string | null
  opponent_code?: string | null
  is_home?: boolean | null
  is_neutral?: boolean | null
  notes?: string | null
  rpe?: number | null
  duration_min?: number | null
  created_at?: string | null
  source?: string | null
  external_id?: string | null
  competition_id?: string | null
  competition_name?: string | null
  match_day?: number | null
  journee_name?: string | null
  match_status?: string | null
  venue?: string | null
  user_hidden?: boolean | null
  user_override?: CalendarEvent['user_override']
  synced_at?: string | null
  match_kind?: CalendarEvent['match_kind']
}

function formatKickoffTime(raw: string | null | undefined): string | undefined {
  if (raw == null || raw === '') return undefined
  const s = String(raw).trim()
  if (/^\d{2}:\d{2}$/.test(s)) return s
  if (/^\d{2}:\d{2}:\d{2}/.test(s)) return s.slice(0, 5)
  return s
}

function calendarDateToIsoString(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
  const d = new Date(date)
  if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0] ?? date
  return date
}

export function calendarRowToEvent(row: MatchCalendarRow): CalendarEvent {
  return {
    id: row.id,
    date: calendarDateToIsoString(row.date),
    type: row.type as CalendarEvent['type'],
    match_kind: row.match_kind ?? undefined,
    kickoff_time: formatKickoffTime(row.kickoff_time ?? undefined),
    opponent: row.opponent ?? undefined,
    opponent_code: row.opponent_code ?? undefined,
    is_home: row.is_home ?? undefined,
    is_neutral: row.is_neutral ?? undefined,
    notes: row.notes ?? undefined,
    rpe: row.rpe ?? undefined,
    duration_min: row.duration_min ?? undefined,
    created_at: row.created_at ?? undefined,
    source: (row.source as CalendarEvent['source']) ?? 'manual',
    external_id: row.external_id ?? undefined,
    competition_id: row.competition_id ?? undefined,
    competition_name: row.competition_name ?? undefined,
    match_day: row.match_day ?? undefined,
    journee_name: row.journee_name ?? undefined,
    match_status: row.match_status ?? undefined,
    venue: row.venue ?? undefined,
    user_hidden: row.user_hidden ?? undefined,
    user_override: row.user_override ?? undefined,
    synced_at: row.synced_at ?? undefined,
  }
}
