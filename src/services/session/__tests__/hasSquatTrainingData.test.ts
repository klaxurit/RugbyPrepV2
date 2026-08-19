import { describe, expect, it } from 'vitest'
import { hasSquatLoadLog, isSquatExerciseId } from '../hasSquatTrainingData'

describe('isSquatExerciseId', () => {
  it('reconnaît le back squat et les variantes chargées', () => {
    expect(isSquatExerciseId('squat__back_squat__barbell')).toBe(true)
    expect(isSquatExerciseId('back_squat')).toBe(true)
    expect(isSquatExerciseId('front_squat')).toBe(true)
    expect(isSquatExerciseId('lower_squat__goblet_squat__dumbbell')).toBe(true)
  })

  it('ignore les sauts et le reste du programme', () => {
    expect(isSquatExerciseId('squat__jump_squat__bodyweight')).toBe(false)
    expect(isSquatExerciseId('bench_press')).toBe(false)
    expect(isSquatExerciseId('rdl')).toBe(false)
  })
})

describe('hasSquatLoadLog', () => {
  it('exige une charge > 0 sur un squat', () => {
    expect(
      hasSquatLoadLog([{ exerciseId: 'squat__back_squat__barbell', loadKg: 80 }]),
    ).toBe(true)
    expect(
      hasSquatLoadLog([{ exerciseId: 'squat__back_squat__barbell', loadKg: 0 }]),
    ).toBe(false)
    expect(
      hasSquatLoadLog([{ exerciseId: 'squat__back_squat__barbell' }]),
    ).toBe(false)
    expect(
      hasSquatLoadLog([{ exerciseId: 'bench_press', loadKg: 90 }]),
    ).toBe(false)
  })
})
