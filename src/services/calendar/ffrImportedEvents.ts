import type { CalendarEvent } from '../../types/training'
import { supabase } from '../supabase/client'

export function dropFfrImportedEvents<T extends Pick<CalendarEvent, 'source'> | { source?: string }>(
  events: T[],
): T[] {
  return events.filter((event) => event.source !== 'ffr_import')
}

/** Imports FFR d’une autre compétition (changement de club / championnat). */
export function staleFfrImportIds(
  rows: Array<{ id: string; competition_id: string | null; external_id: string | null }>,
  competitionId: string,
  incomingExternalIds: ReadonlySet<string>,
): string[] {
  return rows
    .filter((row) => {
      if (row.external_id && incomingExternalIds.has(row.external_id)) return false
      return row.competition_id !== competitionId
    })
    .map((row) => row.id)
}

export async function deleteFfrImportedMatches(userId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('match_calendar')
    .delete()
    .eq('user_id', userId)
    .eq('source', 'ffr_import')
  if (error) return { error: error.message }
  return {}
}
