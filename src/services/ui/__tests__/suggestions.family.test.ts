import { describe, it, expect } from 'vitest'
import { getExerciseSuggestion, getProgressionFamily } from '../suggestions'

describe('getProgressionFamily', () => {
  it('upper_compound for bench press', () => {
    expect(getProgressionFamily('push_horizontal__bench_press__barbell')).toBe('upper_compound')
  })
  it('lower_compound for back squat', () => {
    expect(getProgressionFamily('squat__back_squat__barbell')).toBe('lower_compound')
  })
  it('lower_compound for hip thrust (not assistance)', () => {
    expect(getProgressionFamily('hinge__hip_thrust__barbell')).toBe('lower_compound')
  })
  it('upper_compound for push press (not assistance)', () => {
    expect(getProgressionFamily('power__push_press__barbell')).toBe('upper_compound')
  })
  it('assistance for landmine press speed (not upper_compound)', () => {
    expect(getProgressionFamily('power__landmine_press__speed')).toBe('assistance')
  })
  it('assistance for hammer curl', () => {
    expect(getProgressionFamily('arm_curl__hammer_curl__dumbbell')).toBe('assistance')
  })
  it('ballistic_iso for broad jump', () => {
    expect(getProgressionFamily('power__jump__broad_jump')).toBe('ballistic_iso')
  })
  it('fallback to assistance for unknown exercise', () => {
    expect(getProgressionFamily('some__unknown__exercise')).toBe('assistance')
  })
})

describe('family-based progression (V1 — rir defined)', () => {
  it('upper_compound: +2.5 kg when rir >= 3', () => {
    const s = getExerciseSuggestion({
      exerciseId: 'push_horizontal__bench_press__barbell',
      week: 'W1',
      fatigue: 'OK',
      lastEntry: { loadKg: 80, reps: 5, rir: 3, setsCompleted: 4 },
    })
    expect(s.suggestedLoadKg).toBe(82.5)
    expect(s.suggestedReps).toBe(5)
  })

  it('upper_compound: +1.25 kg when rir == 2', () => {
    const s = getExerciseSuggestion({
      exerciseId: 'push_horizontal__bench_press__barbell',
      week: 'W1',
      fatigue: 'OK',
      lastEntry: { loadKg: 80, reps: 5, rir: 2, setsCompleted: 4 },
    })
    expect(s.suggestedLoadKg).toBe(81.25)
  })

  it('upper_compound: hold when rir <= 1', () => {
    const s = getExerciseSuggestion({
      exerciseId: 'push_horizontal__bench_press__barbell',
      week: 'W1',
      fatigue: 'OK',
      lastEntry: { loadKg: 80, reps: 5, rir: 1, setsCompleted: 4 },
    })
    expect(s.suggestedLoadKg).toBe(80)
    expect(s.suggestedReps).toBe(5)
  })

  it('lower_compound: +5 kg when rir >= 3', () => {
    const s = getExerciseSuggestion({
      exerciseId: 'squat__back_squat__barbell',
      week: 'W1',
      fatigue: 'OK',
      lastEntry: { loadKg: 100, reps: 5, rir: 3, setsCompleted: 4 },
    })
    expect(s.suggestedLoadKg).toBe(105)
  })

  it('lower_compound: +2.5 kg when rir == 2', () => {
    const s = getExerciseSuggestion({
      exerciseId: 'squat__back_squat__barbell',
      week: 'W1',
      fatigue: 'OK',
      lastEntry: { loadKg: 100, reps: 5, rir: 2, setsCompleted: 4 },
    })
    expect(s.suggestedLoadKg).toBe(102.5)
  })

  it('assistance: reps+1 when not at top of range', () => {
    const s = getExerciseSuggestion({
      exerciseId: 'arm_curl__hammer_curl__dumbbell',
      week: 'W1',
      fatigue: 'OK',
      lastEntry: { loadKg: 12, reps: 10, rir: 2, setsCompleted: 3 },
    })
    expect(s.suggestedReps).toBe(11)
    expect(s.suggestedLoadKg).toBe(12) // hold load
  })

  it('assistance: +load and reset reps at top of range (12 reps)', () => {
    const s = getExerciseSuggestion({
      exerciseId: 'arm_curl__hammer_curl__dumbbell',
      week: 'W1',
      fatigue: 'OK',
      lastEntry: { loadKg: 12, reps: 12, rir: 2, setsCompleted: 3 },
    })
    expect(s.suggestedLoadKg).toBe(13.75) // 12 + 1.25 rounded
    expect(s.suggestedReps).toBe(8)
  })

  it('ballistic_iso: no load increment', () => {
    const s = getExerciseSuggestion({
      exerciseId: 'power__jump__broad_jump',
      week: 'W1',
      fatigue: 'OK',
      lastEntry: { loadKg: 0, reps: 5, rir: 3, setsCompleted: 4 },
    })
    // Should not suggest load increase — 0 kg stays 0 kg
    expect(s.suggestedLoadKg).toBe(0)
    // Reps should progress +1
    expect(s.suggestedReps).toBe(6)
  })
})

describe('fatigue → hold for all families', () => {
  it('fatigue holds for upper_compound', () => {
    const s = getExerciseSuggestion({
      exerciseId: 'push_horizontal__bench_press__barbell',
      week: 'W1',
      fatigue: 'FATIGUE',
      lastEntry: { loadKg: 80, reps: 5, rir: 3, setsCompleted: 4 },
    })
    expect(s.suggestedLoadKg).toBe(80)
    expect(s.suggestedReps).toBe(5)
    expect(s.rationale).toContain('Fatigue')
  })

  it('fatigue holds for lower_compound', () => {
    const s = getExerciseSuggestion({
      exerciseId: 'squat__back_squat__barbell',
      week: 'W1',
      fatigue: 'FATIGUE',
      lastEntry: { loadKg: 100, reps: 5, rir: 3, setsCompleted: 4 },
    })
    expect(s.suggestedLoadKg).toBe(100)
  })
})

describe('deload → reduce for all families', () => {
  it('deload reduces for upper_compound', () => {
    const s = getExerciseSuggestion({
      exerciseId: 'push_horizontal__bench_press__barbell',
      week: 'DELOAD',
      fatigue: 'OK',
      lastEntry: { loadKg: 80, reps: 5, rir: 3, setsCompleted: 4 },
    })
    // deload = ~85% of 80 = 68 rounded
    expect(s.suggestedLoadKg).toBe(67.5)
    expect(s.rationale).toContain('DELOAD')
  })
})

describe('backward compat (FIX F5/F13) — old logs without rir/setsCompleted', () => {
  it('uses RER-based logic when rir is undefined', () => {
    const s = getExerciseSuggestion({
      exerciseId: 'push_horizontal__bench_press__barbell',
      week: 'W1',
      fatigue: 'OK',
      targetRer: 3,
      lastEntry: { loadKg: 80, reps: 5 },
    })
    // RER-based: 80 * 1.025 = 82 → max(82, 82.5) = 82.5
    expect(s.suggestedLoadKg).toBe(82.5)
    expect(s.suggestedReps).toBe(5)
  })

  it('RER-based hold when targetRer <= 1', () => {
    const s = getExerciseSuggestion({
      exerciseId: 'push_horizontal__bench_press__barbell',
      week: 'W1',
      fatigue: 'OK',
      targetRer: 1,
      lastEntry: { loadKg: 80, reps: 5 },
    })
    expect(s.suggestedLoadKg).toBe(80)
  })

  it('transition: uses family logic when rir IS defined', () => {
    const s = getExerciseSuggestion({
      exerciseId: 'push_horizontal__bench_press__barbell',
      week: 'W1',
      fatigue: 'OK',
      lastEntry: { loadKg: 80, reps: 5, rir: 2, setsCompleted: 4 },
    })
    // Family logic (upper_compound, rir=2): +1.25
    expect(s.suggestedLoadKg).toBe(81.25)
  })
})
