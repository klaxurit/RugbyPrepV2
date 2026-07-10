import { describe, expect, it } from 'vitest'
import { detectPRs, type PRDetectionInput } from './detectPRs'

const make = (
  overrides: Partial<PRDetectionInput> & Pick<PRDetectionInput, 'exerciseId'>,
): PRDetectionInput => ({
  metricType: 'load_reps',
  draft: {},
  previousBest: {},
  ...overrides,
})

const SQUAT = 'squat__back_squat__barbell'
const BENCH = 'push_horizontal__bench_press__barbell'
const CURL = 'push_vertical__lateral_raise__dumbbell'

describe('detectPRs', () => {
  it('detects load PR when load exceeds best without reps in draft', () => {
    const r = detectPRs([
      make({
        exerciseId: SQUAT,
        draft: { loadKg: 90 },
        previousBest: { bestLoadKg: 87.5 },
      }),
    ])
    expect(r).toHaveLength(1)
    expect(r[0].improvement).toBe('+2.5 kg')
    expect(r[0].label).toBe('90 kg')
  })

  it('detects load PR when load exceeds best (charge prime sur volume)', () => {
    const r = detectPRs([
      make({
        exerciseId: SQUAT,
        draft: { loadKg: 100, reps: 3 },
        previousBest: { bestLoadKg: 95 },
      }),
    ])
    expect(r).toHaveLength(1)
    expect(r[0].improvement).toBe('+5 kg')
    expect(r[0].label).toBe('100 kg × 3')
  })

  it('no PR when load is lower even if volume would beat (95×5 vs 100×3)', () => {
    const r = detectPRs([
      make({
        exerciseId: SQUAT,
        draft: { loadKg: 95, reps: 5 },
        previousBest: { bestLoadKg: 100 },
      }),
    ])
    expect(r).toHaveLength(0)
  })

  it('no PR when load is equal', () => {
    const r = detectPRs([
      make({
        exerciseId: SQUAT,
        draft: { loadKg: 80, reps: 5 },
        previousBest: { bestLoadKg: 80 },
      }),
    ])
    expect(r).toHaveLength(0)
  })

  it('skips non-trackable assistance exercises', () => {
    const r = detectPRs([
      make({
        exerciseId: CURL,
        draft: { loadKg: 20, reps: 12 },
        previousBest: { bestLoadKg: 15 },
      }),
    ])
    expect(r).toHaveLength(0)
  })

  it('skips reps-only metric (pompes sans charge)', () => {
    const r = detectPRs([
      make({
        exerciseId: 'push_horizontal__push_up__bodyweight',
        metricType: 'reps',
        draft: { reps: 25 },
        previousBest: {},
      }),
    ])
    expect(r).toHaveLength(0)
  })

  it('first-ever entry counts as PR for trackable compound', () => {
    const r = detectPRs([
      make({
        exerciseId: SQUAT,
        draft: { loadKg: 80, reps: 5 },
        previousBest: {},
      }),
    ])
    expect(r).toHaveLength(1)
    expect(r[0].improvement).toBe('Premier record')
  })

  it('skips entries with no load', () => {
    expect(detectPRs([make({ exerciseId: SQUAT, draft: {} })])).toHaveLength(0)
    expect(detectPRs([make({ exerciseId: SQUAT, draft: { loadKg: 0, reps: 5 } })])).toHaveLength(0)
  })

  it('detects multiple compound PRs in one batch', () => {
    const r = detectPRs([
      make({
        exerciseId: SQUAT,
        draft: { loadKg: 100, reps: 5 },
        previousBest: { bestLoadKg: 90 },
      }),
      make({
        exerciseId: BENCH,
        draft: { loadKg: 80, reps: 6 },
        previousBest: { bestLoadKg: 75 },
      }),
    ])
    expect(r).toHaveLength(2)
    expect(r.map((p) => p.exerciseId)).toEqual([SQUAT, BENCH])
  })
})
