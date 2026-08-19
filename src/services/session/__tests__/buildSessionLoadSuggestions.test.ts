import { describe, expect, it } from 'vitest'
import { buildSessionLoadSuggestions } from '../buildSessionLoadSuggestions'
import type { ExerciseSetLog } from '../../../types/training'

const set = (overrides: Partial<ExerciseSetLog>): ExerciseSetLog => ({
  id: 'id',
  slotSignature: 'past-1',
  weekLabel: 'W1',
  sessionIndex: 0,
  blockNumber: 1,
  exerciseId: 'back_squat',
  tourIndex: 0,
  loadKg: 100,
  reps: 5,
  rir: 3,
  completed: true,
  createdAt: '2026-04-30T10:00:00Z',
  updatedAt: '2026-04-30T10:00:00Z',
  ...overrides,
})

describe('buildSessionLoadSuggestions', () => {
  it('exclut les sets de la séance courante de l\'historique', () => {
    const sets: ExerciseSetLog[] = [
      set({ slotSignature: 'past-1' }),
      set({ slotSignature: 'past-2', loadKg: 102.5 }),
      set({ slotSignature: 'current', loadKg: 999 }),
    ]
    const map = buildSessionLoadSuggestions({
      allSetLogs: sets,
      exercises: [{ exerciseId: 'back_squat', prescription: '5x5' }],
      currentSlotSignature: 'current',
      week: 'W1',
      acwr: null,
      fatigueLevel: 'normal',
      trainingLevel: 'performance',
      daysToMatch: null,
      now: new Date('2026-05-01T10:00:00Z'),
    })
    const r = map.get('back_squat')
    // 2 séances historiques avec RPE bas + reps == repsHigh → INCREASE
    expect(r?.decision).toBe('increase')
    // Dernier vrai max = 102.5kg (past-2, plus récente que past-1 par défaut)
  })

  it('renvoie no_data si aucun historique sur l\'exo', () => {
    const sets: ExerciseSetLog[] = [
      set({ exerciseId: 'bench_press' }),
    ]
    const map = buildSessionLoadSuggestions({
      allSetLogs: sets,
      exercises: [{ exerciseId: 'back_squat', prescription: '5x5' }],
      currentSlotSignature: 'current',
      week: 'W1',
      acwr: null,
      fatigueLevel: 'normal',
      trainingLevel: 'performance',
      daysToMatch: null,
    })
    expect(map.get('back_squat')?.decision).toBe('no_data')
  })

  it('renvoie no_suggestion pour trainingLevel=starter', () => {
    const sets: ExerciseSetLog[] = [
      set({ slotSignature: 'past-1' }),
      set({ slotSignature: 'past-2' }),
    ]
    const map = buildSessionLoadSuggestions({
      allSetLogs: sets,
      exercises: [{ exerciseId: 'back_squat', prescription: '5x5' }],
      currentSlotSignature: 'current',
      week: 'W1',
      acwr: null,
      fatigueLevel: 'normal',
      trainingLevel: 'starter',
      daysToMatch: null,
    })
    expect(map.get('back_squat')?.decision).toBe('no_suggestion')
  })

  it('respecte daysToMatch (J-2 → MAINTAIN)', () => {
    const sets: ExerciseSetLog[] = [
      set({ slotSignature: 'past-1' }),
      set({ slotSignature: 'past-2' }),
    ]
    const map = buildSessionLoadSuggestions({
      allSetLogs: sets,
      exercises: [{ exerciseId: 'back_squat', prescription: '5x5' }],
      currentSlotSignature: 'current',
      week: 'W1',
      acwr: null,
      fatigueLevel: 'normal',
      trainingLevel: 'performance',
      daysToMatch: 2,
    })
    const r = map.get('back_squat')
    expect(r?.decision).toBe('maintain')
    expect(r?.justification).toMatch(/match/i)
  })

  it('agrège plusieurs exos dans la même séance', () => {
    const sets: ExerciseSetLog[] = [
      set({ exerciseId: 'back_squat', slotSignature: 'past-1' }),
      set({ exerciseId: 'back_squat', slotSignature: 'past-2' }),
      set({ exerciseId: 'bench_press', slotSignature: 'past-1', loadKg: 60 }),
    ]
    const map = buildSessionLoadSuggestions({
      allSetLogs: sets,
      exercises: [
        { exerciseId: 'back_squat', prescription: '5x5' },
        { exerciseId: 'bench_press', prescription: '4x6' },
      ],
      currentSlotSignature: 'current',
      week: 'W1',
      acwr: null,
      fatigueLevel: 'normal',
      trainingLevel: 'performance',
      daysToMatch: null,
      now: new Date('2026-05-01T10:00:00Z'),
    })
    expect(map.get('back_squat')?.decision).toBe('increase')
    // bench_press n'a qu'un seul log → G1 → MAINTAIN
    expect(map.get('bench_press')?.decision).toBe('maintain')
  })

  it('ne suggère pas de kg tant qu\'aucun squat n\'est logué', () => {
    const map = buildSessionLoadSuggestions({
      allSetLogs: [
        set({ exerciseId: 'bench_press', slotSignature: 'past-1', loadKg: 60 }),
        set({ exerciseId: 'bench_press', slotSignature: 'past-2', loadKg: 62.5 }),
      ],
      exercises: [{ exerciseId: 'bench_press', prescription: '4x6' }],
      currentSlotSignature: 'current',
      week: 'W1',
      acwr: null,
      fatigueLevel: 'normal',
      trainingLevel: 'performance',
      daysToMatch: null,
    })
    const r = map.get('bench_press')
    expect(r?.decision).toBe('no_data')
    expect(r?.suggestedWeight).toBeNull()
  })
})
