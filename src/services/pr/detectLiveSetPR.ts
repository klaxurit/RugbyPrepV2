import type { ExerciseSetLog } from '../../types/training'
import type { ExerciseMetricType } from '../ui/exerciseMetrics'
import {
  aggregateMaxLoadBests,
  type SetDraft,
} from './buildAllTimePRs'
import { detectPRs, type DetectedPR } from './detectPRs'
import { isPRTrackableExercise } from './prEligibility'

export type LiveSetPRDraft = SetDraft

export type ValidatingSetRef = {
  slotSignature: string
  blockNumber: number
  tourIndex: number
}

function setHasLoggableData(set: LiveSetPRDraft): boolean {
  return set.loadKg != null && set.loadKg > 0
}

function isSameValidatingSet(
  set: Pick<ExerciseSetLog, 'slotSignature' | 'blockNumber' | 'tourIndex'>,
  validatingSet: ValidatingSetRef,
): boolean {
  return (
    set.slotSignature === validatingSet.slotSignature &&
    set.blockNumber === validatingSet.blockNumber &&
    set.tourIndex === validatingSet.tourIndex
  )
}

/**
 * Séries déjà loggées dans la séance en cours (tours précédents) — complète setLogs
 * quand l'autosave n'a pas encore rafraîchi le hook.
 */
export function collectPriorSessionDrafts(
  exerciseTourLoads: Readonly<Record<string, LiveSetPRDraft>>,
  blockNumber: number,
  tourIndex: number,
  exerciseIndex: number,
  buildKey: (blockNumber: number, tourIndex: number, exerciseIndex: number) => string,
): LiveSetPRDraft[] {
  const drafts: LiveSetPRDraft[] = []
  for (let tour = 0; tour < tourIndex; tour++) {
    const load = exerciseTourLoads[buildKey(blockNumber, tour, exerciseIndex)]
    if (load && setHasLoggableData(load)) {
      drafts.push({ loadKg: load.loadKg, reps: load.reps })
    }
  }
  return drafts
}

/**
 * Détecte un PR lors de la validation d'une série en séance.
 * Charge max uniquement, polyarticulaires uniquement.
 */
export function detectLiveSetPR(params: {
  setLogs: readonly ExerciseSetLog[]
  exerciseId: string
  metricType: ExerciseMetricType
  draft: LiveSetPRDraft
  validatingSet: ValidatingSetRef
  priorSessionDrafts?: readonly LiveSetPRDraft[]
}): DetectedPR | null {
  const { setLogs, exerciseId, metricType, draft, validatingSet, priorSessionDrafts = [] } =
    params

  if (!isPRTrackableExercise(exerciseId)) return null
  if (metricType !== 'load_reps') return null
  if (!setHasLoggableData(draft)) return null

  const baselineDrafts: SetDraft[] = []

  for (const set of setLogs) {
    if (set.exerciseId !== exerciseId) continue
    if (!setHasLoggableData(set)) continue
    if (set.completed === false) continue
    if (isSameValidatingSet(set, validatingSet)) continue
    baselineDrafts.push({ loadKg: set.loadKg, reps: set.reps })
  }

  for (const prior of priorSessionDrafts) {
    if (setHasLoggableData(prior)) baselineDrafts.push(prior)
  }

  if (baselineDrafts.length === 0) return null

  const previousBest = aggregateMaxLoadBests(baselineDrafts)
  const [pr] = detectPRs([{ exerciseId, metricType, draft, previousBest }])
  if (!pr || pr.previousValue === undefined) return null
  return pr
}
