import { describe, expect, it } from 'vitest'
import {
  computeShareProgression,
  resolveHistoryEntryDateISO,
  resolveShareLoadProgression,
  resolveShareStreakProgression,
} from '../computeShareProgression'

describe('resolveHistoryEntryDateISO', () => {
  it('priorise dateISO puis updatedAt / createdAt', () => {
    expect(
      resolveHistoryEntryDateISO({
        exerciseId: 'a',
        dateISO: '2026-03-01',
        createdAt: '2026-01-01T10:00:00Z',
      }),
    ).toBe('2026-03-01')
    expect(
      resolveHistoryEntryDateISO({
        exerciseId: 'a',
        updatedAt: '2026-02-10T12:00:00.000Z',
      }),
    ).toBe('2026-02-10')
    expect(resolveHistoryEntryDateISO({ exerciseId: 'a' })).toBeNull()
  })
})

describe('resolveShareLoadProgression', () => {
  const today = '2026-11-10'
  // S−4 = [J−28, J−21] → 2026-10-13 … 2026-10-20

  it('calcule la meilleure hausse ≥ 5 % vs S−4', () => {
    const result = resolveShareLoadProgression({
      todayISO: today,
      currentLoads: [
        { exerciseId: 'squat', exerciseName: 'Squat', maxKg: 120 },
        { exerciseId: 'bench', exerciseName: 'Bench', maxKg: 90 },
      ],
      history: [
        { exerciseId: 'squat', loadKg: 100, dateISO: '2026-10-15' },
        { exerciseId: 'bench', loadKg: 88, dateISO: '2026-10-16' },
      ],
    })
    expect(result).toEqual({
      kind: 'load',
      percent: 20,
      weeks: 4,
      exerciseName: 'Squat',
    })
  })

  it('ignore une hausse &lt; 5 %', () => {
    expect(
      resolveShareLoadProgression({
        todayISO: today,
        currentLoads: [{ exerciseId: 'bench', exerciseName: 'Bench', maxKg: 92 }],
        history: [{ exerciseId: 'bench', loadKg: 90, dateISO: '2026-10-15' }],
      }),
    ).toBeNull()
  })

  it('sans historique dans la fenêtre → null', () => {
    expect(
      resolveShareLoadProgression({
        todayISO: today,
        currentLoads: [{ exerciseId: 'squat', exerciseName: 'Squat', maxKg: 120 }],
        history: [
          { exerciseId: 'squat', loadKg: 100, dateISO: '2026-09-01' },
          { exerciseId: 'squat', loadKg: 110, dateISO: '2026-11-01' },
        ],
      }),
    ).toBeNull()
  })

  it('omet exerciseName vide', () => {
    const result = resolveShareLoadProgression({
      todayISO: today,
      currentLoads: [{ exerciseId: 'row', exerciseName: '  ', maxKg: 80 }],
      history: [{ exerciseId: 'row', loadKg: 70, dateISO: '2026-10-14' }],
    })
    expect(result).toMatchObject({ kind: 'load', exerciseName: null, percent: expect.any(Number) })
  })
})

describe('resolveShareStreakProgression', () => {
  it('null si 0 / absent', () => {
    expect(resolveShareStreakProgression(0)).toBeNull()
    expect(resolveShareStreakProgression(null)).toBeNull()
    expect(resolveShareStreakProgression(undefined)).toBeNull()
  })

  it('renvoie les semaines truncatures ≥ 1', () => {
    expect(resolveShareStreakProgression(3.9)).toEqual({ kind: 'streak', weeks: 3 })
    expect(resolveShareStreakProgression(1)).toEqual({ kind: 'streak', weeks: 1 })
  })
})

describe('computeShareProgression', () => {
  it('priorise load ≥ 5 % sur streak', () => {
    expect(
      computeShareProgression({
        todayISO: '2026-11-10',
        currentLoads: [{ exerciseId: 'squat', exerciseName: 'Squat', maxKg: 110 }],
        history: [{ exerciseId: 'squat', loadKg: 100, dateISO: '2026-10-15' }],
        weekStreak: 6,
      }),
    ).toMatchObject({ kind: 'load', percent: 10 })
  })

  it('fallback streak si pas de load', () => {
    expect(
      computeShareProgression({
        todayISO: '2026-11-10',
        currentLoads: [],
        history: [],
        weekStreak: 4,
      }),
    ).toEqual({ kind: 'streak', weeks: 4 })
  })

  it('null si rien', () => {
    expect(
      computeShareProgression({
        todayISO: '2026-11-10',
        currentLoads: [],
        history: [],
        weekStreak: 0,
      }),
    ).toBeNull()
  })
})
