import { describe, expect, it } from 'vitest'
import { buildExerciseSessionJournal } from '../buildExerciseSessionJournal'
import type { ExerciseSetLog } from '../../../types/training'

const mkSet = (over: Partial<ExerciseSetLog> = {}): ExerciseSetLog => ({
  id: 'id-1',
  slotSignature: 'old-slot',
  motherSessionId: 'ms1',
  weekLabel: 'W1',
  sessionIndex: 0,
  blockNumber: 1,
  exerciseId: 'back_squat',
  tourIndex: 0,
  loadKg: 80,
  reps: 5,
  completed: true,
  createdAt: '2026-06-01T10:00:00Z',
  updatedAt: '2026-06-01T10:00:00Z',
  ...over,
})

describe('buildExerciseSessionJournal', () => {
  it('retourne null sans historique ni série courante', () => {
    expect(
      buildExerciseSessionJournal({
        allSetLogs: [],
        exerciseId: 'back_squat',
        currentSlotSignature: 'current',
        blockNumber: 1,
        totalTours: 3,
        tourDataByIndex: {},
        currentTourIdx: -1,
        metricType: 'load_reps',
      }),
    ).toBeNull()
  })

  it('affiche la dernière séance (PREV) avec date', () => {
    const journal = buildExerciseSessionJournal({
      allSetLogs: [
        mkSet({ slotSignature: 'old-1', tourIndex: 0, loadKg: 70, reps: 8 }),
        mkSet({
          slotSignature: 'old-1',
          tourIndex: 1,
          loadKg: 75,
          reps: 6,
          updatedAt: '2026-06-10T10:00:00Z',
        }),
        mkSet({ slotSignature: 'current', loadKg: 50, reps: 10 }),
      ],
      exerciseId: 'back_squat',
      currentSlotSignature: 'current',
      blockNumber: 1,
      totalTours: 2,
      tourDataByIndex: {},
      currentTourIdx: -1,
      metricType: 'load_reps',
      lang: 'fr',
    })

    expect(journal).not.toBeNull()
    expect(journal!.lastSessionRows).toHaveLength(2)
    expect(journal!.lastSessionRows[0].state).toBe('history')
    expect(journal!.lastSessionRows[0].label).toContain('70')
    expect(journal!.lastSessionDate).toBeTruthy()
    expect(journal!.currentRows).toHaveLength(0)
  })

  it('construit les lignes de la séance en cours (done / active / pending)', () => {
    const journal = buildExerciseSessionJournal({
      allSetLogs: [],
      exerciseId: 'back_squat',
      currentSlotSignature: 'current',
      blockNumber: 1,
      totalTours: 3,
      tourDataByIndex: {
        0: { kg: '80', reps: '5', validated: true },
        1: { kg: '82.5', reps: '5', validated: false },
        2: { validated: false },
      },
      currentTourIdx: 1,
      metricType: 'load_reps',
    })

    expect(journal).not.toBeNull()
    expect(journal!.currentRows).toHaveLength(2)
    expect(journal!.currentRows[0].state).toBe('current_done')
    expect(journal!.currentRows[1].state).toBe('current_active')
    expect(journal!.currentRows[1].label).toContain('82.5')
  })

  it('ignore les sets de la séance courante pour PREV', () => {
    const journal = buildExerciseSessionJournal({
      allSetLogs: [
        mkSet({ slotSignature: 'current', loadKg: 100, reps: 3 }),
        mkSet({
          slotSignature: 'past',
          loadKg: 90,
          reps: 4,
          updatedAt: '2026-06-05T10:00:00Z',
        }),
      ],
      exerciseId: 'back_squat',
      currentSlotSignature: 'current',
      blockNumber: 1,
      totalTours: 1,
      tourDataByIndex: { 0: { kg: '100', reps: '3', validated: true } },
      currentTourIdx: 0,
      metricType: 'load_reps',
    })

    expect(journal!.lastSessionRows).toHaveLength(1)
    expect(journal!.lastSessionRows[0].label).toContain('90')
    expect(journal!.currentRows[0].state).toBe('current_done')
  })
})
