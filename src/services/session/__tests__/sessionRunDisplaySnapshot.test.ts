import { describe, expect, it } from 'vitest'
import {
  captureSessionRunDisplaySnapshot,
  resolveSessionRunDisplayData,
} from '../sessionRunDisplaySnapshot'

describe('sessionRunDisplaySnapshot', () => {
  it('capture isole le freeze du live ultérieur', () => {
    const live = new Set(['b1:t0:e0', 'b1:t0:e1'])
    const freeze = captureSessionRunDisplaySnapshot({
      completedExercises: live,
      exerciseTourLoads: { 'b1:t0:e0': { loadKg: 60 } },
    })
    live.add('b1:t1:e0')
    live.clear()
    expect(freeze.completedExercises.has('b1:t0:e0')).toBe(true)
    expect(freeze.completedExercises.size).toBe(2)
    expect(freeze.exerciseTourLoads['b1:t0:e0']?.loadKg).toBe(60)
  })

  it('phase completed + freeze → freeze même si live vide (régression Terminé 0/N)', () => {
    const freeze = captureSessionRunDisplaySnapshot({
      completedExercises: new Set(['a', 'b']),
      exerciseTourLoads: {},
    })
    const resolved = resolveSessionRunDisplayData({
      phase: 'completed',
      liveCompletedExercises: new Set(),
      liveExerciseTourLoads: {},
      freeze,
    })
    expect(resolved.completedExercises.size).toBe(2)
    expect(resolved.completedExercises.has('a')).toBe(true)
  })

  it('phase running → live, ignore freeze', () => {
    const freeze = captureSessionRunDisplaySnapshot({
      completedExercises: new Set(['old']),
      exerciseTourLoads: {},
    })
    const resolved = resolveSessionRunDisplayData({
      phase: 'running',
      liveCompletedExercises: new Set(['live']),
      liveExerciseTourLoads: {},
      freeze,
    })
    expect([...resolved.completedExercises]).toEqual(['live'])
  })
})
