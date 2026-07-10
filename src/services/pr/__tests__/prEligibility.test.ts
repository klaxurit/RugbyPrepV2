import { describe, expect, it } from 'vitest'
import { isPRTrackableExercise } from '../prEligibility'

describe('isPRTrackableExercise', () => {
  it('accepte les polyarticulaires catalogués', () => {
    expect(isPRTrackableExercise('squat__back_squat__barbell')).toBe(true)
    expect(isPRTrackableExercise('push_horizontal__bench_press__barbell')).toBe(true)
    expect(isPRTrackableExercise('hinge__romanian_deadlift__barbell')).toBe(true)
  })

  it('refuse assistance et ballistic', () => {
    expect(isPRTrackableExercise('push_vertical__lateral_raise__dumbbell')).toBe(false)
    expect(isPRTrackableExercise('power__box_jump__bodyweight')).toBe(false)
  })

  it('heuristique legacy IDs (tests / anciens logs)', () => {
    expect(isPRTrackableExercise('back_squat')).toBe(true)
    expect(isPRTrackableExercise('bench_press')).toBe(true)
    expect(isPRTrackableExercise('lateral_raise')).toBe(false)
  })
})
