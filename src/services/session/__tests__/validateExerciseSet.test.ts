import { describe, expect, it, vi } from 'vitest'
import type { Block } from '../../../types/motherSession'
import {
  buildExerciseValidatePrefill,
  resolveExerciseSetValidatePrefill,
  validateExerciseSetFromBlock,
} from '../validateExerciseSet'

const benchBlock = (): Block => ({
  number: 1,
  name: 'Main Upper Push Hypertrophy',
  format: '`4 work sets`, `2 min` rest between sets',
  exercises: [{ name: 'Bench Press', prescription: '4x8-10', exerciseId: 'push_horizontal__bench_press__barbell' }],
  coachingNotes: [],
})

describe('buildExerciseValidatePrefill', () => {
  it('prefills from previous session when fields are empty', () => {
    expect(
      buildExerciseValidatePrefill({
        hasLoadInputs: true,
        showKgInput: true,
        showRepsInput: true,
        kg: '',
        reps: '',
        previousSession: { loadKg: 80, reps: 8 },
      }),
    ).toEqual({ kg: '80', reps: '8' })
  })
})

describe('resolveExerciseSetValidatePrefill', () => {
  it('resolves previous session for tour 1 on bench press', () => {
    const getPreviousSessionSet = vi.fn(() => ({ loadKg: 82.5, reps: 9 }))
    const prefill = resolveExerciseSetValidatePrefill({
      block: benchBlock(),
      blockNumber: 1,
      tourIndex: 0,
      exerciseIndex: 0,
      exerciseTourLoads: {},
      premium: true,
      getPreviousSessionSet,
    })
    expect(getPreviousSessionSet).toHaveBeenCalledWith('push_horizontal__bench_press__barbell', 0)
    expect(prefill).toEqual({ kg: '82.5', reps: '9' })
  })
})

describe('validateExerciseSetFromBlock', () => {
  it('fires onLiveSetValidated with typed loads via sticky path', () => {
    const onLiveSetValidated = vi.fn()
    const onBlockCompleted = vi.fn()
    const completedExercises = new Set<string>()
    const sessionRun = {
      completedExercises,
      exerciseTourLoads: {
        '1_0_0': { loadKg: 290, reps: 8 },
      },
      restTimer: null,
      skipRestTimer: vi.fn(),
      markExerciseDone: vi.fn((key: string) => {
        completedExercises.add(key)
      }),
      unmarkExerciseDone: vi.fn(),
      setExerciseTourLoad: vi.fn(),
      startRestTimer: vi.fn(),
    }

    validateExerciseSetFromBlock({
      session: { blocks: [benchBlock()] } as never,
      blockNumber: 1,
      tourIndex: 0,
      exerciseIndex: 0,
      sessionRun,
      block: benchBlock(),
      lang: 'fr',
      onBlockCompleted,
      onLiveSetValidated,
    })

    expect(onLiveSetValidated).toHaveBeenCalledWith({
      exerciseId: 'push_horizontal__bench_press__barbell',
      loadKg: 290,
      reps: 8,
      blockNumber: 1,
      tourIndex: 0,
      exerciseIndex: 0,
      exerciseTourLoads: {
        '1_0_0': { loadKg: 290, reps: 8 },
      },
    })
    expect(onBlockCompleted).toHaveBeenCalled()
  })
})
