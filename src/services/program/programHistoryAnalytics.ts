/**
 * Pure analytics helpers for SessionLog[].
 * No side effects, no hidden clock — `today` is always explicit.
 */
import type { SessionLog } from '../../types/training'

export interface ProgramHistorySummary {
  totalSessions: number
  sessionsLast7d: number
  sessionsLast28d: number
  legacySessions: number
  motherSessions: number
  byCycle: {
    off_season: number
    pre_season: number
    in_season: number
    playoffs: number
    unknown: number
  }
}

export function getProgramHistorySummary(logs: SessionLog[], today: string): ProgramHistorySummary {
  const todayMs = new Date(today).getTime()
  const ms7d = 7 * 24 * 60 * 60 * 1000
  const ms28d = 28 * 24 * 60 * 60 * 1000

  const summary: ProgramHistorySummary = {
    totalSessions: logs.length,
    sessionsLast7d: 0,
    sessionsLast28d: 0,
    legacySessions: 0,
    motherSessions: 0,
    byCycle: { off_season: 0, pre_season: 0, in_season: 0, playoffs: 0, unknown: 0 },
  }

  for (const log of logs) {
    const logMs = new Date(log.dateISO).getTime()
    const age = todayMs - logMs

    if (age <= ms7d) summary.sessionsLast7d++
    if (age <= ms28d) summary.sessionsLast28d++

    if (log.programSource === 'mother_session') {
      summary.motherSessions++
    } else if (log.programSource === 'legacy') {
      summary.legacySessions++
    }
    // Logs without programSource count in total but not in legacy/mother split

    const cycle = log.programContext?.cycle
    if (cycle && cycle in summary.byCycle) {
      summary.byCycle[cycle as keyof typeof summary.byCycle]++
    } else {
      summary.byCycle.unknown++
    }
  }

  return summary
}

/**
 * Returns the most recent `limit` sessions, sorted newest first.
 * Input is assumed already sorted (useHistory guarantees this), but we
 * re-sort defensively.
 */
export function getRecentProgramSessions(logs: SessionLog[], limit: number = 6): SessionLog[] {
  return [...logs]
    .sort((a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime())
    .slice(0, limit)
}
