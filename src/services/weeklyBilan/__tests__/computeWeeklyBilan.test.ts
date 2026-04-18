import { describe, expect, it } from 'vitest'
import {
  addDaysISO,
  computeWeeklyBilan,
  startOfIsoWeek,
} from '../computeWeeklyBilan'
import type { BlockLog, SessionLog } from '../../../types/training'

const mkSession = (over: Partial<SessionLog>): SessionLog => ({
  id: over.id ?? `s-${Math.random()}`,
  dateISO: over.dateISO ?? '2026-04-15',
  week: over.week ?? 'W1',
  sessionType: over.sessionType ?? 'UPPER',
  fatigue: over.fatigue ?? 'OK',
  ...over,
})

const mkBlockLog = (over: Partial<BlockLog>): BlockLog => ({
  id: over.id ?? `b-${Math.random()}`,
  dateISO: over.dateISO ?? '2026-04-15',
  week: over.week ?? 'W1',
  sessionType: over.sessionType ?? 'UPPER',
  blockId: over.blockId ?? 'BLK_STR_01',
  blockName: over.blockName ?? 'Strength',
  entries: over.entries ?? [],
  ...over,
})

describe('startOfIsoWeek', () => {
  it('wednesday → monday', () => {
    expect(startOfIsoWeek('2026-04-15')).toBe('2026-04-13')
  })
  it('monday stays monday', () => {
    expect(startOfIsoWeek('2026-04-13')).toBe('2026-04-13')
  })
  it('sunday → previous monday', () => {
    expect(startOfIsoWeek('2026-04-19')).toBe('2026-04-13')
  })
})

describe('addDaysISO', () => {
  it('adds positive days', () => {
    expect(addDaysISO('2026-04-13', 6)).toBe('2026-04-19')
  })
  it('adds negative days', () => {
    expect(addDaysISO('2026-04-13', -1)).toBe('2026-04-12')
  })
})

describe('computeWeeklyBilan — empty', () => {
  it('returns zero-ish bilan when no data', () => {
    const b = computeWeeklyBilan([], [], '2026-04-15')
    expect(b.weekStart).toBe('2026-04-13')
    expect(b.weekEnd).toBe('2026-04-19')
    expect(b.sessionsDone).toBe(0)
    expect(b.sessionsDelta).toBe(0)
    expect(b.tonnageKg).toBeNull()
    expect(b.tonnageDeltaPct).toBeNull()
    expect(b.totalMinutes).toBeNull()
    expect(b.totalMinutesDelta).toBeNull()
    expect(b.topProgressions).toEqual([])
  })
})

describe('computeWeeklyBilan — sessions & RPE', () => {
  it('counts sessions in the ISO week only', () => {
    const sessions: SessionLog[] = [
      mkSession({ dateISO: '2026-04-13' }), // monday (in)
      mkSession({ dateISO: '2026-04-19' }), // sunday (in)
      mkSession({ dateISO: '2026-04-20' }), // next monday (out)
      mkSession({ dateISO: '2026-04-12' }), // previous sunday (out)
    ]
    const b = computeWeeklyBilan(sessions, [], '2026-04-15')
    expect(b.sessionsDone).toBe(2)
  })

  it('computes sessionsDelta vs previous week', () => {
    const sessions: SessionLog[] = [
      // previous week — 1 session
      mkSession({ dateISO: '2026-04-07' }),
      // current week — 3 sessions
      mkSession({ dateISO: '2026-04-13' }),
      mkSession({ dateISO: '2026-04-15' }),
      mkSession({ dateISO: '2026-04-17' }),
    ]
    const b = computeWeeklyBilan(sessions, [], '2026-04-15')
    expect(b.sessionsDone).toBe(3)
    expect(b.sessionsDelta).toBe(2)
  })

  it('sums durationMin across sessions', () => {
    const sessions: SessionLog[] = [
      mkSession({ dateISO: '2026-04-13', durationMin: 60 }),
      mkSession({ dateISO: '2026-04-15', durationMin: 45 }),
    ]
    const b = computeWeeklyBilan(sessions, [], '2026-04-15')
    expect(b.totalMinutes).toBe(105)
  })

  it('computes totalMinutesDelta vs previous week', () => {
    const sessions: SessionLog[] = [
      mkSession({ dateISO: '2026-04-06', durationMin: 60 }),
      mkSession({ dateISO: '2026-04-13', durationMin: 75 }),
      mkSession({ dateISO: '2026-04-15', durationMin: 60 }),
    ]
    const b = computeWeeklyBilan(sessions, [], '2026-04-15')
    expect(b.totalMinutes).toBe(135)
    expect(b.totalMinutesDelta).toBe(75)
  })

  it('totalMinutes null when no duration data', () => {
    const sessions: SessionLog[] = [mkSession({ dateISO: '2026-04-13' })]
    const b = computeWeeklyBilan(sessions, [], '2026-04-15')
    expect(b.totalMinutes).toBeNull()
    expect(b.totalMinutesDelta).toBeNull()
  })
})

describe('computeWeeklyBilan — tonnage', () => {
  it('picks up tonnageKg stored on SessionLog (mother-session path)', () => {
    const sessions: SessionLog[] = [
      mkSession({ dateISO: '2026-04-13', tonnageKg: 800 }),
      mkSession({ dateISO: '2026-04-15', tonnageKg: 1200 }),
    ]
    const b = computeWeeklyBilan(sessions, [], '2026-04-15')
    expect(b.tonnageKg).toBe(2000)
  })

  it('combines SessionLog.tonnageKg and BlockLog entries', () => {
    const sessions: SessionLog[] = [mkSession({ dateISO: '2026-04-13', tonnageKg: 500 })]
    const blocks: BlockLog[] = [
      mkBlockLog({
        dateISO: '2026-04-15',
        entries: [{ exerciseId: 'squat', loadKg: 100, reps: 5, setsCompleted: 3 }],
      }),
    ]
    const b = computeWeeklyBilan(sessions, blocks, '2026-04-15')
    // 500 from session + 1500 from block = 2000
    expect(b.tonnageKg).toBe(2000)
  })

  it('sums loadKg × reps × setsCompleted', () => {
    const blocks: BlockLog[] = [
      mkBlockLog({
        dateISO: '2026-04-13',
        entries: [
          { exerciseId: 'squat', loadKg: 100, reps: 5, setsCompleted: 3 }, // 1500
          { exerciseId: 'bench', loadKg: 80, reps: 5, setsCompleted: 3 }, // 1200
        ],
      }),
    ]
    const b = computeWeeklyBilan([], blocks, '2026-04-15')
    expect(b.tonnageKg).toBe(2700)
  })

  it('defaults setsCompleted to 1 when missing', () => {
    const blocks: BlockLog[] = [
      mkBlockLog({
        dateISO: '2026-04-13',
        entries: [{ exerciseId: 'squat', loadKg: 100, reps: 5 }], // 500
      }),
    ]
    const b = computeWeeklyBilan([], blocks, '2026-04-15')
    expect(b.tonnageKg).toBe(500)
  })

  it('computes tonnageDeltaPct vs previous week', () => {
    const blocks: BlockLog[] = [
      // previous week — 1000kg
      mkBlockLog({
        dateISO: '2026-04-06',
        entries: [{ exerciseId: 'squat', loadKg: 100, reps: 10, setsCompleted: 1 }],
      }),
      // current week — 1500kg
      mkBlockLog({
        dateISO: '2026-04-13',
        entries: [{ exerciseId: 'squat', loadKg: 100, reps: 5, setsCompleted: 3 }],
      }),
    ]
    const b = computeWeeklyBilan([], blocks, '2026-04-15')
    expect(b.tonnageKg).toBe(1500)
    expect(b.tonnageDeltaPct).toBe(50)
  })
})

describe('computeWeeklyBilan — top progressions', () => {
  it('returns top 3 exercises sorted by deltaKg desc', () => {
    const blocks: BlockLog[] = [
      // history (before the week) — baselines
      mkBlockLog({
        dateISO: '2026-04-01',
        entries: [
          { exerciseId: 'squat', loadKg: 100, reps: 5 },
          { exerciseId: 'bench', loadKg: 80, reps: 5 },
          { exerciseId: 'deadlift', loadKg: 120, reps: 3 },
          { exerciseId: 'row', loadKg: 60, reps: 8 },
        ],
      }),
      // current week — progressions
      mkBlockLog({
        dateISO: '2026-04-13',
        entries: [
          { exerciseId: 'squat', loadKg: 110, reps: 5 }, // +10
          { exerciseId: 'bench', loadKg: 82.5, reps: 5 }, // +2.5
          { exerciseId: 'deadlift', loadKg: 140, reps: 3 }, // +20
          { exerciseId: 'row', loadKg: 62.5, reps: 8 }, // +2.5
        ],
      }),
    ]
    const b = computeWeeklyBilan([], blocks, '2026-04-15')
    expect(b.topProgressions).toHaveLength(3)
    expect(b.topProgressions[0].exerciseId).toBe('deadlift')
    expect(b.topProgressions[0].deltaKg).toBe(20)
    expect(b.topProgressions[1].exerciseId).toBe('squat')
    expect(b.topProgressions[1].deltaKg).toBe(10)
  })

  it('excludes exercises with no prior history (not comparable)', () => {
    const blocks: BlockLog[] = [
      mkBlockLog({
        dateISO: '2026-04-13',
        entries: [{ exerciseId: 'squat', loadKg: 100, reps: 5 }],
      }),
    ]
    const b = computeWeeklyBilan([], blocks, '2026-04-15')
    expect(b.topProgressions).toEqual([])
  })

  it('excludes exercises with no current-week improvement', () => {
    const blocks: BlockLog[] = [
      mkBlockLog({
        dateISO: '2026-04-01',
        entries: [{ exerciseId: 'squat', loadKg: 100, reps: 5 }],
      }),
      mkBlockLog({
        dateISO: '2026-04-13',
        entries: [{ exerciseId: 'squat', loadKg: 100, reps: 5 }], // no change
      }),
    ]
    const b = computeWeeklyBilan([], blocks, '2026-04-15')
    expect(b.topProgressions).toEqual([])
  })
})
