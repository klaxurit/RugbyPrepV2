import { describe, expect, it } from 'vitest'
import { detectSessionPRs } from '../detectSessionPRs'
import type { ExerciseSetLog } from '../../../types/training'

const baseSet = (overrides: Partial<ExerciseSetLog>): ExerciseSetLog => ({
  id: 'id',
  slotSignature: 'slot-current',
  weekLabel: 'W1',
  sessionIndex: 0,
  blockNumber: 1,
  exerciseId: 'back_squat',
  tourIndex: 0,
  ...overrides,
})

describe('detectSessionPRs', () => {
  it('détecte un PR de charge si la séance courante dépasse le max historique', () => {
    const sets: ExerciseSetLog[] = [
      baseSet({ slotSignature: 'past-1', loadKg: 80, completed: true }),
      baseSet({ slotSignature: 'past-2', loadKg: 90, completed: true }),
      baseSet({ slotSignature: 'slot-current', loadKg: 95, completed: true }),
    ]
    const prs = detectSessionPRs({
      allSets: sets,
      currentSlotSignature: 'slot-current',
    })
    expect(prs).toEqual([{ exerciseId: 'back_squat', previousBest: 90, newBest: 95 }])
  })

  it('aucun PR si la charge ne bat pas l\'historique', () => {
    const sets: ExerciseSetLog[] = [
      baseSet({ slotSignature: 'past-1', loadKg: 100, completed: true }),
      baseSet({ slotSignature: 'past-2', loadKg: 110, completed: true }),
      baseSet({ slotSignature: 'slot-current', loadKg: 100, completed: true }),
    ]
    expect(
      detectSessionPRs({ allSets: sets, currentSlotSignature: 'slot-current' }),
    ).toEqual([])
  })

  it('exige au moins 2 logs historiques (par défaut) pour flagger un PR', () => {
    const sets: ExerciseSetLog[] = [
      baseSet({ slotSignature: 'past-1', loadKg: 80, completed: true }),
      baseSet({ slotSignature: 'slot-current', loadKg: 100, completed: true }),
    ]
    expect(
      detectSessionPRs({ allSets: sets, currentSlotSignature: 'slot-current' }),
    ).toEqual([])
  })

  it('ignore les sets non complétés sur la séance courante', () => {
    const sets: ExerciseSetLog[] = [
      baseSet({ slotSignature: 'past-1', loadKg: 80, completed: true }),
      baseSet({ slotSignature: 'past-2', loadKg: 90, completed: true }),
      baseSet({ slotSignature: 'slot-current', loadKg: 200, completed: false }),
    ]
    expect(
      detectSessionPRs({ allSets: sets, currentSlotSignature: 'slot-current' }),
    ).toEqual([])
  })

  it('ignore les exercices non trackables (assistance)', () => {
    const sets: ExerciseSetLog[] = [
      baseSet({ slotSignature: 'past-1', exerciseId: 'lateral_raise', loadKg: 8, completed: true }),
      baseSet({ slotSignature: 'past-2', exerciseId: 'lateral_raise', loadKg: 10, completed: true }),
      baseSet({ slotSignature: 'slot-current', exerciseId: 'lateral_raise', loadKg: 12, completed: true }),
    ]
    expect(
      detectSessionPRs({ allSets: sets, currentSlotSignature: 'slot-current' }),
    ).toEqual([])
  })

  it('détecte les PR sur plusieurs exercices', () => {
    const sets: ExerciseSetLog[] = [
      baseSet({ slotSignature: 'past-1', loadKg: 80, completed: true }),
      baseSet({ slotSignature: 'past-2', loadKg: 90, completed: true }),
      baseSet({ slotSignature: 'past-1', exerciseId: 'bench_press', loadKg: 60, completed: true }),
      baseSet({ slotSignature: 'past-2', exerciseId: 'bench_press', loadKg: 65, completed: true }),
      baseSet({ slotSignature: 'slot-current', loadKg: 95, completed: true }),
      baseSet({ slotSignature: 'slot-current', exerciseId: 'bench_press', loadKg: 70, completed: true }),
    ]
    const prs = detectSessionPRs({
      allSets: sets,
      currentSlotSignature: 'slot-current',
    })
    expect(prs).toHaveLength(2)
    expect(prs.find((p) => p.exerciseId === 'back_squat')).toEqual({
      exerciseId: 'back_squat',
      previousBest: 90,
      newBest: 95,
    })
    expect(prs.find((p) => p.exerciseId === 'bench_press')).toEqual({
      exerciseId: 'bench_press',
      previousBest: 65,
      newBest: 70,
    })
  })
})
