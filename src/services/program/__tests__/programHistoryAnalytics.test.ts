import { describe, expect, it } from 'vitest'
import { getProgramHistorySummary, getRecentProgramSessions } from '../programHistoryAnalytics'
import type { SessionLog } from '../../../types/training'

function makeLog(overrides: Partial<SessionLog> & { id: string; dateISO: string }): SessionLog {
  return {
    week: 'W1',
    sessionType: 'FULL',
    fatigue: 'OK',
    ...overrides,
  } as SessionLog
}

const TODAY = '2026-03-20'

const LOGS: SessionLog[] = [
  // 1 day ago — mother_session off_season
  makeLog({ id: '1', dateISO: '2026-03-19T10:00:00Z', programSource: 'mother_session', programContext: { cycle: 'off_season', annualWeekCode: 'OFF_S02' } }),
  // 5 days ago — legacy in_season
  makeLog({ id: '2', dateISO: '2026-03-15T10:00:00Z', programSource: 'legacy', programContext: { cycle: 'in_season' } }),
  // 10 days ago — mother_session pre_season
  makeLog({ id: '3', dateISO: '2026-03-10T10:00:00Z', programSource: 'mother_session', programContext: { cycle: 'pre_season' } }),
  // 25 days ago — legacy no context (old log)
  makeLog({ id: '4', dateISO: '2026-02-23T10:00:00Z', programSource: 'legacy' }),
  // 35 days ago — no programSource (very old log)
  makeLog({ id: '5', dateISO: '2026-02-13T10:00:00Z' }),
]

describe('getProgramHistorySummary', () => {
  const summary = getProgramHistorySummary(LOGS, TODAY)

  it('totalSessions', () => {
    expect(summary.totalSessions).toBe(5)
  })

  it('sessionsLast7d', () => {
    expect(summary.sessionsLast7d).toBe(2) // id 1, 2
  })

  it('sessionsLast28d', () => {
    expect(summary.sessionsLast28d).toBe(4) // id 1, 2, 3, 4
  })

  it('legacySessions', () => {
    expect(summary.legacySessions).toBe(2) // id 2, 4
  })

  it('motherSessions', () => {
    expect(summary.motherSessions).toBe(2) // id 1, 3
  })

  it('byCycle', () => {
    expect(summary.byCycle.off_season).toBe(1)
    expect(summary.byCycle.pre_season).toBe(1)
    expect(summary.byCycle.in_season).toBe(1)
    expect(summary.byCycle.playoffs).toBe(0)
    expect(summary.byCycle.unknown).toBe(2) // id 4 (no context), id 5 (no source/context)
  })

  it('empty logs → all zeros', () => {
    const empty = getProgramHistorySummary([], TODAY)
    expect(empty.totalSessions).toBe(0)
    expect(empty.sessionsLast7d).toBe(0)
    expect(empty.legacySessions).toBe(0)
    expect(empty.motherSessions).toBe(0)
  })
})

describe('getRecentProgramSessions', () => {
  it('returns most recent N sessions sorted newest first', () => {
    const recent = getRecentProgramSessions(LOGS, 3)
    expect(recent).toHaveLength(3)
    expect(recent[0].id).toBe('1')
    expect(recent[1].id).toBe('2')
    expect(recent[2].id).toBe('3')
  })

  it('defaults to 6', () => {
    const recent = getRecentProgramSessions(LOGS)
    expect(recent).toHaveLength(5) // only 5 logs total
  })

  it('handles empty array', () => {
    expect(getRecentProgramSessions([])).toHaveLength(0)
  })
})
