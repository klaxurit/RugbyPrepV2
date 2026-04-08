import type { SessionLog } from '../../types/training'
import type { DatedSession } from '../../types/scheduling'
import { toISOWeekId } from './weekSnapshot'

function logCalendarDate(log: SessionLog): string {
  return log.dateISO.slice(0, 10)
}

/**
 * Mother-session logs complétés dans la même semaine ISO que `today`, par `sessionId` du slot.
 */
export function motherSessionIdsLoggedThisWeek(logs: SessionLog[], today: string): Set<string> {
  const weekId = toISOWeekId(today)
  const ids = new Set<string>()
  for (const log of logs) {
    if (log.programSource !== 'mother_session' || !log.motherSessionId) continue
    if (toISOWeekId(logCalendarDate(log)) !== weekId) continue
    ids.add(log.motherSessionId)
  }
  return ids
}

/**
 * Enrichit les séances datées avec `completionStatus: 'completed'` quand un SessionLog
 * correspondant existe dans la semaine courante (mode calendrier uniquement, UI).
 */
export function mergeDatedSessionCompletion(
  sessions: DatedSession[],
  logs: SessionLog[],
  today: string,
): DatedSession[] {
  const completedIds = motherSessionIdsLoggedThisWeek(logs, today)
  return sessions.map((s) => {
    if (s.completionStatus === 'skipped') return s
    if (completedIds.has(s.sessionSlot.sessionId)) {
      return { ...s, completionStatus: 'completed' as const }
    }
    return s
  })
}
