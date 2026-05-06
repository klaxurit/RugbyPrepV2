import { describe, expect, it } from 'vitest'
import { computeSessionTonnage } from '../computeSessionTonnage'
import type { ExerciseSetLog } from '../../../types/training'

const baseSet = (overrides: Partial<ExerciseSetLog>): ExerciseSetLog => ({
  id: 'id',
  slotSignature: 'slot-A',
  weekLabel: 'W1',
  sessionIndex: 0,
  blockNumber: 1,
  exerciseId: 'back_squat',
  tourIndex: 0,
  ...overrides,
})

describe('computeSessionTonnage', () => {
  it('somme loadKg × reps pour les sets du slot courant', () => {
    const sets: ExerciseSetLog[] = [
      baseSet({ loadKg: 100, reps: 5 }),
      baseSet({ loadKg: 100, reps: 5, tourIndex: 1 }),
      baseSet({ loadKg: 60, reps: 8, exerciseId: 'rdl', blockNumber: 2 }),
    ]
    expect(
      computeSessionTonnage({ sets, slotSignature: 'slot-A', bodyweightKg: 80 }),
    ).toBe(100 * 5 + 100 * 5 + 60 * 8)
  })

  it('ignore les sets dont le slotSignature ne correspond pas', () => {
    const sets: ExerciseSetLog[] = [
      baseSet({ loadKg: 100, reps: 5 }),
      baseSet({ slotSignature: 'autre', loadKg: 200, reps: 5 }),
    ]
    expect(
      computeSessionTonnage({ sets, slotSignature: 'slot-A', bodyweightKg: null }),
    ).toBe(500)
  })

  it('utilise le bodyweight pour les exos BW (push_up) si dispo', () => {
    const sets: ExerciseSetLog[] = [
      baseSet({ exerciseId: 'push_up_bw', reps: 10, loadKg: undefined }),
    ]
    expect(
      computeSessionTonnage({ sets, slotSignature: 'slot-A', bodyweightKg: 80 }),
    ).toBe(80 * 10)
  })

  it('ignore les exos BW si bodyweight non renseigné', () => {
    const sets: ExerciseSetLog[] = [
      baseSet({ exerciseId: 'push_up_bw', reps: 10, loadKg: undefined }),
    ]
    expect(
      computeSessionTonnage({ sets, slotSignature: 'slot-A', bodyweightKg: null }),
    ).toBe(0)
  })

  it('renvoie 0 si pas de sets', () => {
    expect(
      computeSessionTonnage({ sets: [], slotSignature: 'slot-A', bodyweightKg: 80 }),
    ).toBe(0)
  })

  it('ignore les sets avec reps invalides', () => {
    const sets: ExerciseSetLog[] = [
      baseSet({ loadKg: 100, reps: 0 }),
      baseSet({ loadKg: 100, reps: undefined, tourIndex: 1 }),
    ]
    expect(
      computeSessionTonnage({ sets, slotSignature: 'slot-A', bodyweightKg: null }),
    ).toBe(0)
  })
})
