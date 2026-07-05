import { describe, expect, it } from 'vitest'
import type { BlockLog, ExerciseSetLog } from '../../../types/training'
import { blockLogsToSyntheticSetLogs, mergeExerciseHistoryLogs } from '../mergeExerciseHistoryLogs'

const mkSetLog = (overrides: Partial<ExerciseSetLog>): ExerciseSetLog => ({
  id: 'set-1',
  slotSignature: 'ms:W1:0',
  weekLabel: 'W1',
  sessionIndex: 0,
  blockNumber: 1,
  exerciseId: 'push_horizontal__bench_press__barbell',
  tourIndex: 0,
  loadKg: 80,
  reps: 8,
  ...overrides,
})

describe('blockLogsToSyntheticSetLogs', () => {
  it('convertit les entrées legacy en set logs synthétiques', () => {
    const blockLog: BlockLog = {
      id: 'bl-1',
      dateISO: '2026-06-01T10:00:00.000Z',
      week: 'W1',
      sessionType: 'UPPER',
      blockId: 'bench-block',
      blockName: 'Bench',
      entries: [
        { exerciseId: 'push_horizontal__bench_press__barbell', loadKg: 75, reps: 8 },
      ],
    }
    const out = blockLogsToSyntheticSetLogs([blockLog])
    expect(out).toHaveLength(1)
    expect(out[0].slotSignature).toBe('legacy:block:bl-1')
    expect(out[0].loadKg).toBe(75)
  })
})

describe('mergeExerciseHistoryLogs', () => {
  it('fusionne set logs et legacy block logs', () => {
    const setLogs = [mkSetLog({ loadKg: 82.5 })]
    const blockLogs: BlockLog[] = [
      {
        id: 'bl-old',
        dateISO: '2026-05-01T10:00:00.000Z',
        week: 'W1',
        sessionType: 'UPPER',
        blockId: 'bench',
        blockName: 'Bench',
        entries: [{ exerciseId: 'push_horizontal__bench_press__barbell', loadKg: 70, reps: 8 }],
      },
    ]
    const merged = mergeExerciseHistoryLogs(setLogs, blockLogs)
    expect(merged).toHaveLength(2)
    expect(merged.some((s) => s.loadKg === 70)).toBe(true)
    expect(merged.some((s) => s.loadKg === 82.5)).toBe(true)
  })
})
