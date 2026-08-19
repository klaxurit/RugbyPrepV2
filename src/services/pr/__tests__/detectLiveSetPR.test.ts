import { describe, expect, it } from 'vitest'
import type { ExerciseSetLog } from '../../../types/training'
import { collectPriorSessionDrafts, detectLiveSetPR } from '../detectLiveSetPR'

const mkSet = (overrides: Partial<ExerciseSetLog>): ExerciseSetLog => ({
  id: '1',
  slotSignature: 'old',
  weekLabel: 'W1',
  sessionIndex: 0,
  blockNumber: 1,
  exerciseId: 'bench',
  tourIndex: 0,
  loadKg: 80,
  reps: 5,
  ...overrides,
})

const validatingSet = {
  slotSignature: 'current',
  blockNumber: 1,
  tourIndex: 1,
}

describe('detectLiveSetPR', () => {
  it('retourne un PR quand la charge dépasse le record d’une séance passée', () => {
    const pr = detectLiveSetPR({
      setLogs: [mkSet({}), mkSet({ id: '2', loadKg: 77.5, reps: 5 })],
      exerciseId: 'bench',
      metricType: 'load_reps',
      draft: { loadKg: 82.5, reps: 5 },
      validatingSet: { slotSignature: 'current', blockNumber: 1, tourIndex: 0 },
    })
    expect(pr).not.toBeNull()
    expect(pr!.label).toBe('82.5 kg × 5')
  })

  it('ignore la toute première série sans baseline', () => {
    const pr = detectLiveSetPR({
      setLogs: [],
      exerciseId: 'bench',
      metricType: 'load_reps',
      draft: { loadKg: 100, reps: 5 },
      validatingSet: { slotSignature: 'current', blockNumber: 1, tourIndex: 0 },
    })
    expect(pr).toBeNull()
  })

  it('détecte un PR charge même sans reps saisies', () => {
    const pr = detectLiveSetPR({
      setLogs: [mkSet({ loadKg: 80, reps: 5 })],
      exerciseId: 'bench',
      metricType: 'load_reps',
      draft: { loadKg: 82.5 },
      validatingSet: { slotSignature: 'current', blockNumber: 1, tourIndex: 0 },
    })
    expect(pr).not.toBeNull()
    expect(pr!.label).toBe('82.5 kg')
  })

  it('détecte un PR quand la charge augmente sur un tour suivant dans la même séance', () => {
    const pr = detectLiveSetPR({
      setLogs: [
        mkSet({
          id: 'in-session',
          slotSignature: 'current',
          tourIndex: 0,
          loadKg: 80,
          reps: 8,
        }),
      ],
      exerciseId: 'bench',
      metricType: 'load_reps',
      draft: { loadKg: 85, reps: 8 },
      validatingSet,
      priorSessionDrafts: [{ loadKg: 80, reps: 8 }],
    })
    expect(pr).not.toBeNull()
    expect(pr!.improvement).toBe('+5 kg')
  })

  it('détecte un PR contre une séance passée (autre slotSignature)', () => {
    const pr = detectLiveSetPR({
      setLogs: [
        mkSet({
          id: 'week-ago',
          slotSignature: 'ms:W1:0',
          loadKg: 80,
          reps: 8,
        }),
      ],
      exerciseId: 'bench',
      metricType: 'load_reps',
      draft: { loadKg: 85, reps: 8 },
      validatingSet: { slotSignature: 'ms:W2:0', blockNumber: 1, tourIndex: 0 },
    })
    expect(pr).not.toBeNull()
    expect(pr!.improvement).toBe('+5 kg')
  })

  it('ignore une série égale ou inférieure au tour précédent', () => {
    const pr = detectLiveSetPR({
      setLogs: [],
      exerciseId: 'bench',
      metricType: 'load_reps',
      draft: { loadKg: 80, reps: 8 },
      validatingSet,
      priorSessionDrafts: [{ loadKg: 80, reps: 8 }],
    })
    expect(pr).toBeNull()
  })

  it('ne re-flagge pas un PR sur les tours suivants à la même charge', () => {
    const pr = detectLiveSetPR({
      setLogs: [
        mkSet({ slotSignature: 'past', loadKg: 40, reps: 8 }),
        mkSet({
          id: 'tour-0',
          slotSignature: 'current',
          tourIndex: 0,
          loadKg: 50,
          reps: 8,
        }),
      ],
      exerciseId: 'bench',
      metricType: 'load_reps',
      draft: { loadKg: 50, reps: 8 },
      validatingSet: { slotSignature: 'current', blockNumber: 1, tourIndex: 1 },
      priorSessionDrafts: [{ loadKg: 50, reps: 8 }],
    })
    expect(pr).toBeNull()
  })
})

describe('collectPriorSessionDrafts', () => {
  it('collecte les tours précédents du même exo', () => {
    const key = (b: number, t: number, e: number) => `${b}_${t}_${e}`
    const drafts = collectPriorSessionDrafts(
      {
        '1_0_0': { loadKg: 80, reps: 8 },
        '1_1_0': { loadKg: 85, reps: 8 },
      },
      1,
      2,
      0,
      key,
    )
    expect(drafts).toEqual([
      { loadKg: 80, reps: 8 },
      { loadKg: 85, reps: 8 },
    ])
  })
})
