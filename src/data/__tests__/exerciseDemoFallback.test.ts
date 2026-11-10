import { describe, expect, it } from 'vitest'
import {
  getExerciseDemo,
  listExercisesMissingDemo,
  resolveDemoFallbackId,
} from '../exercises'

describe('exercise demo fallback', () => {
  it('maps unilateral / BW hip thrust to barbell demo', () => {
    expect(resolveDemoFallbackId('hinge__hip_thrust__bodyweight')).toBe(
      'hinge__hip_thrust__barbell',
    )
    const demo = getExerciseDemo('hinge__hip_thrust__bodyweight', 'fr')
    expect(demo).not.toBeNull()
    expect(demo?.isFallbackVariant).toBe(true)
    expect(demo?.youtubeEmbedUrl).toBeTruthy()
    expect(demo?.notes).toMatch(/Variante proche/i)
  })

  it('lists corpus exercises without a direct video demo', () => {
    const missing = listExercisesMissingDemo()
      .map((ex) => ex.exerciseId ?? ex.id)
      .filter(Boolean)
      .sort()
    expect(missing.length).toBeGreaterThan(0)
    expect(missing).toContain('hinge__hip_thrust__bodyweight')
    // Snapshot volontaire : audit corpus pour combler les démos.
    expect(missing).toMatchSnapshot()
  })
})
