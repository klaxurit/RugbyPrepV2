import { describe, expect, it } from 'vitest'
import type { ExerciseSetLog } from '../../../types/training'
import {
  buildPreviousSessionSetMap,
  formatPreviousSessionSetLabel,
  previousSessionSetKey,
} from '../buildPreviousSessionSetMap'

const mkSet = (overrides: Partial<ExerciseSetLog>): ExerciseSetLog => ({
  id: '1',
  slotSignature: 'slot-a',
  weekLabel: 'W1',
  sessionIndex: 0,
  blockNumber: 1,
  exerciseId: 'bench',
  tourIndex: 0,
  ...overrides,
})

describe('buildPreviousSessionSetMap', () => {
  it('retourne la série la plus récente pour exerciseId + tourIndex', () => {
    const map = buildPreviousSessionSetMap({
      allSetLogs: [
        mkSet({ slotSignature: 'old-1', loadKg: 50, reps: 8, updatedAt: '2026-06-01T10:00:00Z' }),
        mkSet({ slotSignature: 'old-2', loadKg: 80, reps: 5, updatedAt: '2026-06-10T10:00:00Z' }),
        mkSet({ slotSignature: 'current', loadKg: 40, reps: 10 }),
      ],
      currentSlotSignature: 'current',
      exerciseIds: ['bench'],
      tourCount: 3,
    })

    expect(map.get(previousSessionSetKey('bench', 0))).toEqual({ loadKg: 80, reps: 5 })
  })

  it('ignore la séance courante et différencie les tours', () => {
    const map = buildPreviousSessionSetMap({
      allSetLogs: [
        mkSet({ slotSignature: 'old', tourIndex: 0, loadKg: 50, reps: 8 }),
        mkSet({ slotSignature: 'old', tourIndex: 1, loadKg: 50, reps: 10 }),
        mkSet({ slotSignature: 'current', tourIndex: 1, loadKg: 40, reps: 12 }),
      ],
      currentSlotSignature: 'current',
      exerciseIds: ['bench'],
      tourCount: 3,
    })

    expect(map.get(previousSessionSetKey('bench', 1))).toEqual({ loadKg: 50, reps: 10 })
    expect(map.has(previousSessionSetKey('bench', 2))).toBe(false)
  })
})

describe('formatPreviousSessionSetLabel', () => {
  it('formate load_reps', () => {
    expect(formatPreviousSessionSetLabel({ loadKg: 82.5, reps: 5 }, 'load_reps')).toBe('82.5 kg × 5')
  })
})
