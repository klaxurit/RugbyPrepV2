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

describe('detectPRs', () => {
  // ── load_reps ─────────────────────────────────────────────

  it('detects load_reps PR when score exceeds best', () => {
    const r = detectPRs([
      make({
        exerciseId: 'squat',
        draft: { loadKg: 90, reps: 5 },
        previousBest: { bestLoadRepsScore: 400 },
      }),
    ])
    expect(r).toHaveLength(1)
    expect(r[0].exerciseId).toBe('squat')
    expect(r[0].newValue).toBe(450)
    expect(r[0].improvement).toBe('+50 score')
    expect(r[0].label).toBe('90kg x 5')
  })

  it('no PR when load_reps score is equal', () => {
    const r = detectPRs([
      make({
        exerciseId: 'squat',
        draft: { loadKg: 80, reps: 5 },
        previousBest: { bestLoadRepsScore: 400 },
      }),
    ])
    expect(r).toHaveLength(0)
  })

  it('no PR when load_reps score is lower', () => {
    const r = detectPRs([
      make({
        exerciseId: 'squat',
        draft: { loadKg: 70, reps: 5 },
        previousBest: { bestLoadRepsScore: 400 },
      }),
    ])
    expect(r).toHaveLength(0)
  })

  // ── reps ──────────────────────────────────────────────────

  it('detects reps PR', () => {
    const r = detectPRs([
      make({
        exerciseId: 'pushup',
        metricType: 'reps',
        draft: { reps: 25 },
        previousBest: { bestReps: 20 },
      }),
    ])
    expect(r).toHaveLength(1)
    expect(r[0].improvement).toBe('+5 reps')
    expect(r[0].label).toBe('25 reps')
  })

  it('no reps PR when equal', () => {
    const r = detectPRs([
      make({
        exerciseId: 'pushup',
        metricType: 'reps',
        draft: { reps: 20 },
        previousBest: { bestReps: 20 },
      }),
    ])
    expect(r).toHaveLength(0)
  })

  // ── meters ────────────────────────────────────────────────

  it('detects meters PR', () => {
    const r = detectPRs([
      make({
        exerciseId: 'carry',
        metricType: 'meters',
        draft: { meters: 55 },
        previousBest: { bestMeters: 50 },
      }),
    ])
    expect(r).toHaveLength(1)
    expect(r[0].improvement).toBe('+5m')
  })

  // ── seconds (lower is better) ─────────────────────────────

  it('detects seconds PR (lower is better)', () => {
    const r = detectPRs([
      make({
        exerciseId: 'plank',
        metricType: 'seconds',
        draft: { seconds: 58 },
        previousBest: { bestSeconds: 60 },
      }),
    ])
    expect(r).toHaveLength(1)
    expect(r[0].improvement).toBe('-2s')
    expect(r[0].label).toBe('58s')
  })

  it('no seconds PR when higher (slower)', () => {
    const r = detectPRs([
      make({
        exerciseId: 'plank',
        metricType: 'seconds',
        draft: { seconds: 65 },
        previousBest: { bestSeconds: 60 },
      }),
    ])
    expect(r).toHaveLength(0)
  })

  // ── first-ever entry ──────────────────────────────────────

  it('first-ever entry counts as PR', () => {
    const r = detectPRs([
      make({
        exerciseId: 'squat',
        draft: { loadKg: 80, reps: 5 },
        previousBest: {},
      }),
    ])
    expect(r).toHaveLength(1)
    expect(r[0].improvement).toBe('Premier record')
  })

  // ── edge cases ────────────────────────────────────────────

  it('skips entries with no relevant draft values', () => {
    const r = detectPRs([
      make({ exerciseId: 'squat', draft: {} }),
    ])
    expect(r).toHaveLength(0)
  })

  it('skips entries with zero load', () => {
    const r = detectPRs([
      make({ exerciseId: 'squat', draft: { loadKg: 0, reps: 5 } }),
    ])
    expect(r).toHaveLength(0)
  })

  it('detects multiple PRs in one batch', () => {
    const r = detectPRs([
      make({
        exerciseId: 'squat',
        draft: { loadKg: 100, reps: 5 },
        previousBest: { bestLoadRepsScore: 400 },
      }),
      make({
        exerciseId: 'bench',
        draft: { loadKg: 80, reps: 6 },
        previousBest: { bestLoadRepsScore: 450 },
      }),
      make({
        exerciseId: 'curl',
        metricType: 'reps',
        draft: { reps: 15 },
        previousBest: { bestReps: 15 },
      }),
    ])
    expect(r).toHaveLength(2) // squat PR (500 > 400), bench PR (480 > 450), curl same (no PR)
    expect(r.map((p) => p.exerciseId)).toEqual(['squat', 'bench'])
  })
})
