import { describe, expect, it } from 'vitest'
import { resolveLiveSetFeedback } from '../resolveLiveSetFeedback'
import type { ExerciseSetLog } from '../../../types/training'

function key(b: number, t: number, e: number) {
  return `${b}:${t}:${e}`
}

describe('resolveLiveSetFeedback', () => {
  it('célèbre vs dernière séance sans PR all-time', () => {
    const out = resolveLiveSetFeedback({
      exerciseId: 'push_horizontal__bench_press__barbell',
      loadKg: 85,
      reps: 5,
      blockNumber: 1,
      tourIndex: 0,
      exerciseIndex: 0,
      slotSignature: 'slot-today',
      metricType: 'load_reps',
      lang: 'fr',
      historyLogs: [],
      exerciseTourLoads: {},
      buildTourKey: key,
      getPreviousSessionSet: () => ({ loadKg: 80, reps: 5 }),
    })
    expect(out?.event).toBe('session_vs_previous')
    expect(out?.toast.title).toBe('Vs dernière séance')
    expect(out?.toast.delta).toBe('+5 kg')
    expect(out?.beatPreviousSession).toBe(true)
  })

  it('célèbre vs série précédente sur exo non-PR (isolation)', () => {
    // Polyarticulaires → record séance (prioritaire) ; isolation → vs tour préc.
    const out = resolveLiveSetFeedback({
      exerciseId: 'arm_extension__skull_crusher__ez_bar',
      loadKg: 30,
      reps: 10,
      blockNumber: 1,
      tourIndex: 1,
      exerciseIndex: 0,
      slotSignature: 'slot-today',
      metricType: 'load_reps',
      lang: 'fr',
      historyLogs: [],
      exerciseTourLoads: {
        [key(1, 0, 0)]: { loadKg: 25, reps: 10 },
      },
      buildTourKey: key,
    })
    expect(out?.event).toBe('session_vs_prior_tour')
    expect(out?.toast.title).toBe('Vs série précédente')
    expect(out?.beatPreviousSession).toBe(false)
  })

  it('polyarticulaire : battre le tour préc. = record séance (pas vs tour)', () => {
    const out = resolveLiveSetFeedback({
      exerciseId: 'push_horizontal__bench_press__barbell',
      loadKg: 82.5,
      reps: 5,
      blockNumber: 1,
      tourIndex: 1,
      exerciseIndex: 0,
      slotSignature: 'slot-today',
      metricType: 'load_reps',
      lang: 'fr',
      historyLogs: [],
      exerciseTourLoads: {
        [key(1, 0, 0)]: { loadKg: 80, reps: 5 },
      },
      buildTourKey: key,
    })
    expect(out?.event).toBe('session_live_pr')
  })

  it('ne re-célèbre pas si charge déjà annoncée', () => {
    const out = resolveLiveSetFeedback({
      exerciseId: 'push_horizontal__bench_press__barbell',
      loadKg: 80,
      reps: 5,
      blockNumber: 1,
      tourIndex: 0,
      exerciseIndex: 0,
      slotSignature: 'slot-today',
      metricType: 'load_reps',
      lang: 'fr',
      historyLogs: [],
      exerciseTourLoads: {},
      buildTourKey: key,
      getPreviousSessionSet: () => ({ loadKg: 70, reps: 5 }),
      alreadyAnnouncedKg: 80,
    })
    expect(out).toBeNull()
  })

  it('PR séance prioritaire sur vs previous', () => {
    const historyLogs: ExerciseSetLog[] = [
      {
        id: '1',
        userId: 'u',
        exerciseId: 'push_horizontal__bench_press__barbell',
        slotSignature: 'slot-today',
        blockNumber: 1,
        tourIndex: 0,
        loadKg: 90,
        reps: 3,
        completed: true,
        createdAt: '',
      } as ExerciseSetLog,
    ]
    const out = resolveLiveSetFeedback({
      exerciseId: 'push_horizontal__bench_press__barbell',
      loadKg: 95,
      reps: 3,
      blockNumber: 1,
      tourIndex: 1,
      exerciseIndex: 0,
      slotSignature: 'slot-today',
      metricType: 'load_reps',
      lang: 'fr',
      historyLogs,
      exerciseTourLoads: {
        [key(1, 0, 0)]: { loadKg: 90, reps: 3 },
      },
      buildTourKey: key,
      getPreviousSessionSet: () => ({ loadKg: 100, reps: 3 }),
    })
    expect(out?.event).toBe('session_live_pr')
  })
})
