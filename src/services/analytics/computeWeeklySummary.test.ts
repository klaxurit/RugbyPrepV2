import { describe, expect, it } from 'vitest'
import { computeWeeklySummary } from './computeWeeklySummary'
import type { BlockLog, SessionLog } from '../../types/training'

const makeLog = (dateISO: string, rpe?: number, durationMin?: number): SessionLog => ({
  id: `log-${dateISO}`,
  dateISO,
  week: 'W1',
  sessionType: 'UPPER',
  fatigue: 'OK',
  rpe,
  durationMin,
})

const makeBlockLog = (dateISO: string, entries: BlockLog['entries']): BlockLog => ({
  id: `bl-${dateISO}`,
  dateISO,
  week: 'W1',
  sessionType: 'UPPER',
  blockId: 'BLK_1',
  blockName: 'Test Block',
  entries,
})

// todayISO = Wednesday 2026-04-01 → week is Mon 2026-03-30 to Sun 2026-04-05
const TODAY = '2026-04-01'

describe('computeWeeklySummary', () => {
  it('full week — 3 sessions done, correct load and RPE', () => {
    const logs = [
      makeLog('2026-03-30', 7, 60),
      makeLog('2026-04-01', 8, 55),
      makeLog('2026-04-03', 6, 50),
    ]
    const r = computeWeeklySummary({ logs, blockLogs: [], plannedSessionCount: 3, todayISO: TODAY })
    expect(r.sessionsDone).toBe(3)
    expect(r.sessionsPlanned).toBe(3)
    expect(r.completionRatio).toBe(1)
    expect(r.totalLoad).toBe(7 * 60 + 8 * 55 + 6 * 50)
    expect(r.avgRPE).toBe(7)
    expect(r.hasSufficientData).toBe(true)
  })

  it('partial week — 1 of 3 done', () => {
    const logs = [makeLog('2026-03-30', 7, 60)]
    const r = computeWeeklySummary({ logs, blockLogs: [], plannedSessionCount: 3, todayISO: TODAY })
    expect(r.sessionsDone).toBe(1)
    expect(r.completionRatio).toBeCloseTo(1 / 3, 2)
  })

  it('load change vs last week', () => {
    const logs = [
      makeLog('2026-03-30', 8, 60),   // this week: 480
      makeLog('2026-03-23', 8, 50),   // last week: 400
    ]
    const r = computeWeeklySummary({ logs, blockLogs: [], plannedSessionCount: 2, todayISO: TODAY })
    expect(r.totalLoad).toBe(480)
    expect(r.totalLoadLastWeek).toBe(400)
    expect(r.loadChangePercent).toBe(20)
  })

  it('no previous week data → loadChangePercent null', () => {
    const logs = [makeLog('2026-03-30', 7, 60)]
    const r = computeWeeklySummary({ logs, blockLogs: [], plannedSessionCount: 2, todayISO: TODAY })
    expect(r.loadChangePercent).toBeNull()
  })

  it('zero data — first-time user', () => {
    const r = computeWeeklySummary({ logs: [], blockLogs: [], plannedSessionCount: 2, todayISO: TODAY })
    expect(r.sessionsDone).toBe(0)
    expect(r.hasSufficientData).toBe(false)
    expect(r.avgRPE).toBeNull()
    expect(r.totalLoad).toBe(0)
  })

  it('no RPE data → avgRPE null', () => {
    const logs = [makeLog('2026-03-30', undefined, undefined)]
    const r = computeWeeklySummary({ logs, blockLogs: [], plannedSessionCount: 1, todayISO: TODAY })
    expect(r.avgRPE).toBeNull()
    expect(r.totalLoad).toBe(0)
  })

  it('detects top progressed exercise', () => {
    const thisWeek = [makeBlockLog('2026-03-30', [
      { exerciseId: 'squat', loadKg: 80, reps: 5 },
    ])]
    const lastWeek = [makeBlockLog('2026-03-23', [
      { exerciseId: 'squat', loadKg: 75, reps: 5 },
    ])]
    const r = computeWeeklySummary({
      logs: [makeLog('2026-03-30', 7, 60), makeLog('2026-03-23', 7, 60)],
      blockLogs: [...thisWeek, ...lastWeek],
      plannedSessionCount: 2,
      todayISO: TODAY,
    })
    expect(r.topProgressedExercise).not.toBeNull()
    expect(r.topProgressedExercise!.exerciseId).toBe('squat')
    expect(r.topProgressedExercise!.improvementLabel).toBe('+5 kg')
  })

  it('no exercise progression → topProgressedExercise null', () => {
    const r = computeWeeklySummary({ logs: [], blockLogs: [], plannedSessionCount: 2, todayISO: TODAY })
    expect(r.topProgressedExercise).toBeNull()
  })
})
