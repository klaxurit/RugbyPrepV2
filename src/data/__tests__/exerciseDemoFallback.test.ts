import { describe, expect, it } from 'vitest'
import {
  getExerciseDemo,
  isDemoFallbackEquipmentCoherent,
  listExercisesMissingDemo,
  resolveDemoFallbackId,
  resolveExerciseDemoContentId,
} from '../exercises'

describe('exercise demo fallback', () => {
  it('maps unilateral / BW hip thrust to barbell demo id', () => {
    expect(resolveDemoFallbackId('hinge__hip_thrust__bodyweight')).toBe(
      'hinge__hip_thrust__barbell',
    )
  })

  it('salle complète : fiche résolue = barre (titre, notes, vidéo alignés)', () => {
    const fullGym = ['barbell', 'bench', 'dumbbell', 'squat_rack'] as const
    expect(
      resolveExerciseDemoContentId('hinge__hip_thrust__bodyweight', {
        equipment: [...fullGym],
      }),
    ).toEqual({ contentId: 'hinge__hip_thrust__barbell', isFallback: true })

    const demo = getExerciseDemo('hinge__hip_thrust__bodyweight', 'fr', {
      equipment: [...fullGym],
    })
    expect(demo).not.toBeNull()
    expect(demo?.isFallbackVariant).toBe(true)
    expect(demo?.exerciseId).toBe('hinge__hip_thrust__barbell')
    expect(demo?.title).toMatch(/barre/i)
    expect(demo?.youtubeEmbedUrl).toBeTruthy()
    expect(demo?.notes).toMatch(/banc/i)
    expect(demo?.notes).not.toMatch(/Variante proche/i)
    expect(demo?.notes).not.toMatch(/Épaules sur le sol/i)
    expect(demo?.prescribedLabel).toMatch(/poids du corps/i)
  })

  it('sans barre/banc : pas de fallback vidéo salle, consignes BW seules', () => {
    expect(
      isDemoFallbackEquipmentCoherent('hinge__hip_thrust__barbell', ['band']),
    ).toBe(false)
    const demo = getExerciseDemo('hinge__hip_thrust__bodyweight', 'fr', {
      equipment: ['band'],
    })
    expect(demo?.isFallbackVariant).toBeFalsy()
    expect(demo?.exerciseId).toBe('hinge__hip_thrust__bodyweight')
    expect(demo?.title).toMatch(/poids du corps/i)
    expect(demo?.notes).toMatch(/Épaules sur le sol/i)
    expect(demo?.youtubeEmbedUrl).toBeNull()
    expect(demo?.textOnly).toBe(true)
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
