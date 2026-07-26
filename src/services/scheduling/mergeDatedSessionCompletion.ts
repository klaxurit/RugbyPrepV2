import type { SessionLog, SessionType } from '../../types/training'
import type { DatedSession } from '../../types/scheduling'
import { toISOWeekId } from './weekSnapshot'

function logCalendarDate(log: SessionLog): string {
  return log.dateISO.slice(0, 10)
}

function isGymSessionLog(log: SessionLog): boolean {
  return log.sessionType !== 'ACTIVE_RECOVERY' && log.sessionType !== 'RECOVERY'
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
 * Trouve le SessionLog correspondant à une séance planifiée.
 * Priorité : motherSessionId dans la semaine ISO (date planifiée d'abord),
 * puis repli legacy date + sessionType.
 *
 * Important : ne pas matcher « n'importe quel log du jour » — sinon un Bas
 * fait le jeudi ouvre la revue du Haut planifié ce jour-là.
 */
export function findSessionLogForPlannedSlot(
  logs: readonly SessionLog[] | undefined,
  opts: {
    motherSessionId: string
    plannedDateISO: string
    weekAnchorISO: string
    /** Repli pour logs legacy sans motherSessionId. */
    expectedSessionType?: SessionType
  },
): SessionLog | undefined {
  if (!logs?.length) return undefined

  const weekId = toISOWeekId(opts.weekAnchorISO)
  const byMotherId = logs.filter(
    (l) =>
      isGymSessionLog(l) &&
      l.motherSessionId === opts.motherSessionId &&
      toISOWeekId(logCalendarDate(l)) === weekId,
  )
  if (byMotherId.length > 0) {
    return (
      byMotherId.find((l) => logCalendarDate(l) === opts.plannedDateISO) ??
      byMotherId[0]
    )
  }

  if (!opts.expectedSessionType) return undefined
  return logs.find(
    (l) =>
      isGymSessionLog(l) &&
      !l.motherSessionId &&
      logCalendarDate(l) === opts.plannedDateISO &&
      l.sessionType === opts.expectedSessionType,
  )
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
  return mergeDatedSessionCompletionForWeek(sessions, logs, today)
}

/** Variante pour une semaine ISO arbitraire (vue mois, replays). */
export function mergeDatedSessionCompletionForWeek(
  sessions: DatedSession[],
  logs: SessionLog[],
  weekAnchorIso: string,
): DatedSession[] {
  const completedIds = motherSessionIdsLoggedThisWeek(logs, weekAnchorIso)
  return sessions.map((s) => {
    if (s.completionStatus === 'skipped') return s
    if (completedIds.has(s.sessionSlot.sessionId)) {
      return { ...s, completionStatus: 'completed' as const }
    }
    // Retirer un `completed` stale (ex. merge précédent / snapshot) si plus aucun log.
    if (s.completionStatus === 'completed') {
      const rest = { ...s }
      delete rest.completionStatus
      return rest
    }
    return s
  })
}
