import { describe, expect, it } from 'vitest'
import {
  buildAllTimePRsFromSetLogs,
  mergePRBoardEntries,
} from '../buildAllTimePRs'
import type { ExerciseSetLog } from '../../types/training'

const mk = (overrides: Partial<ExerciseSetLog>): ExerciseSetLog => ({
  id: '1',
  slotSignature: 'slot',
  weekLabel: 'W1',
  sessionIndex: 0,
  blockNumber: 1,
  exerciseId: 'squat__back_squat__barbell',
  tourIndex: 0,
  loadKg: 100,
  reps: 5,
  completed: true,
  updatedAt: '2026-06-01T10:00:00Z',
  ...overrides,
})

describe('buildAllTimePRsFromSetLogs', () => {
  it('retient la charge max, pas le volume (100×3 bat 95×5 en charge)', () => {
    const prs = buildAllTimePRsFromSetLogs([
      mk({ loadKg: 95, reps: 5, updatedAt: '2026-06-01T10:00:00Z' }),
      mk({ loadKg: 100, reps: 3, updatedAt: '2026-06-10T10:00:00Z' }),
    ])
    expect(prs).toHaveLength(1)
    expect(prs[0].bestValue).toBe(100)
    expect(prs[0].bestLabel).toBe('100 kg × 3')
    expect(prs[0].dateISO).toBe('2026-06-10')
  })

  it('exclut les exercices assistance', () => {
    const prs = buildAllTimePRsFromSetLogs([
      mk({
        exerciseId: 'push_vertical__lateral_raise__dumbbell',
        loadKg: 12,
        reps: 15,
      }),
    ])
    expect(prs).toHaveLength(0)
  })

  it('ignore les sets non complétés', () => {
    const prs = buildAllTimePRsFromSetLogs([
      mk({ loadKg: 200, completed: false }),
      mk({ loadKg: 90, completed: true }),
    ])
    expect(prs[0].bestValue).toBe(90)
  })

  it('à charge égale, ne crée pas de nouveau record (plus de reps)', () => {
    const prs = buildAllTimePRsFromSetLogs([
      mk({ loadKg: 80, reps: 4, updatedAt: '2026-06-01T10:00:00Z' }),
      mk({ loadKg: 80, reps: 5, updatedAt: '2026-06-10T10:00:00Z' }),
    ])
    expect(prs).toHaveLength(1)
    expect(prs[0].bestValue).toBe(80)
    expect(prs[0].bestLabel).toBe('80 kg × 4')
    expect(prs[0].dateISO).toBe('2026-06-01')
  })
})

describe('mergePRBoardEntries', () => {
  it('priorise set logs quand la charge est supérieure', () => {
    const merged = mergePRBoardEntries(
      [
        {
          exerciseId: 'squat__back_squat__barbell',
          metricType: 'load_reps',
          bestValue: 95,
          bestLabel: '95 kg × 5',
          dateISO: '2026-05-01',
          isRecent: false,
        },
      ],
      [
        {
          exerciseId: 'squat__back_squat__barbell',
          metricType: 'load_reps',
          bestValue: 100,
          bestLabel: '100 kg × 3',
          dateISO: '2026-06-01',
          isRecent: true,
        },
      ],
    )
    expect(merged[0].bestValue).toBe(100)
    expect(merged[0].bestLabel).toBe('100 kg × 3')
  })
})
