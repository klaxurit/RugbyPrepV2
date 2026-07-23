import { describe, expect, it } from 'vitest'
import { buildExerciseTourKey } from '../../../contexts/SessionRunContext'
import type { MotherSession } from '../../../types/motherSession'
import { collectSessionExerciseMaxLoads } from '../collectSessionExerciseMaxLoads'

function makeSession(): MotherSession {
  return {
    metadata: {
      id: 'LOWER_OFFSEASON_FORCE_V1',
      sessionType: 'lower',
      cycle: 'off_season',
      targetDuration: '45 min',
    },
    goal: [],
    sessionIdentity: [],
    blocks: [
      {
        name: 'A',
        format: '3 tours',
        exercises: [
          { name: 'Back Squat', exerciseId: 'back_squat', prescription: '5' },
          { name: 'RDL', exerciseId: 'rdl', prescription: '8' },
        ],
      },
    ],
  } as unknown as MotherSession
}

describe('collectSessionExerciseMaxLoads', () => {
  it('prend le max kg par exercice sur les tours validés', () => {
    const session = makeSession()
    const k0 = buildExerciseTourKey(1, 0, 0)
    const k1 = buildExerciseTourKey(1, 1, 0)
    const k2 = buildExerciseTourKey(1, 0, 1)
    const loads = {
      [k0]: { loadKg: 100, reps: 5 },
      [k1]: { loadKg: 120, reps: 5 },
      [k2]: { loadKg: 90, reps: 8 },
    }
    const completed = new Set([k0, k1, k2])

    const result = collectSessionExerciseMaxLoads({
      session,
      exerciseTourLoads: loads,
      completedExercises: completed,
      resolveName: (id) => (id === 'back_squat' ? 'Back Squat' : 'RDL'),
    })

    expect(result).toEqual([
      { exerciseId: 'back_squat', exerciseName: 'Back Squat', maxKg: 120 },
      { exerciseId: 'rdl', exerciseName: 'RDL', maxKg: 90 },
    ])
  })

  it('ignore les tours non validés', () => {
    const session = makeSession()
    const k0 = buildExerciseTourKey(1, 0, 0)
    const result = collectSessionExerciseMaxLoads({
      session,
      exerciseTourLoads: {
        [k0]: { loadKg: 100, reps: 5 },
        [buildExerciseTourKey(1, 1, 0)]: { loadKg: 140, reps: 5 },
      },
      completedExercises: new Set([k0]),
      resolveName: (id) => id,
    })
    expect(result).toHaveLength(1)
    expect(result[0]!.maxKg).toBe(100)
  })
})
