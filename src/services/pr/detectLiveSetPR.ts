import type { ExerciseSetLog } from '../../types/training'
import type { ExerciseMetricType } from '../ui/exerciseMetrics'
import type { ExerciseHistoricalBests } from './buildExerciseBestsFromSetLogs'
import { detectPRs, type DetectedPR } from './detectPRs'

export type LiveSetPRDraft = {
  loadKg?: number
  reps?: number
  seconds?: number
  meters?: number
}

export type ValidatingSetRef = {
  slotSignature: string
  blockNumber: number
  tourIndex: number
}

function setHasLoggableData(set: LiveSetPRDraft): boolean {
  return (
    set.loadKg != null ||
    set.reps != null ||
    set.meters != null ||
    set.seconds != null
  )
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

function aggregateBests(sets: readonly LiveSetPRDraft[]): ExerciseHistoricalBests {
  const bests: ExerciseHistoricalBests = {}

  for (const set of sets) {
    if (set.loadKg != null && set.loadKg > 0) {
      bests.bestLoadKg =
        bests.bestLoadKg == null ? set.loadKg : Math.max(bests.bestLoadKg, set.loadKg)
    }
    if (set.reps != null && set.reps > 0) {
      bests.bestReps = bests.bestReps == null ? set.reps : Math.max(bests.bestReps, set.reps)
    }
    if (set.meters != null && set.meters > 0) {
      bests.bestMeters =
        bests.bestMeters == null ? set.meters : Math.max(bests.bestMeters, set.meters)
    }
    if (set.seconds != null && set.seconds > 0) {
      bests.bestSeconds =
        bests.bestSeconds == null ? set.seconds : Math.min(bests.bestSeconds, set.seconds)
    }
    if (set.loadKg != null && set.reps != null && set.loadKg > 0 && set.reps > 0) {
      const score = set.loadKg * set.reps
      bests.bestLoadRepsScore =
        bests.bestLoadRepsScore == null ? score : Math.max(bests.bestLoadRepsScore, score)
    }
  }

  return bests
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
      drafts.push({ loadKg: load.loadKg, reps: load.reps, meters: load.meters, seconds: load.seconds })
    }
  }
  return drafts
}

/**
 * Détecte un PR lors de la validation d'une série en séance.
 * Compare à toutes les séries passées (séances précédentes + tours déjà validés
 * dans la séance en cours). Ne célèbre pas la toute première série loguée.
 */
export function detectLiveSetPR(params: {
  setLogs: readonly ExerciseSetLog[]
  exerciseId: string
  metricType: ExerciseMetricType
  draft: LiveSetPRDraft
  validatingSet: ValidatingSetRef
  /** Tours précédents déjà saisis dans sessionRun (filet si setLogs en retard). */
  priorSessionDrafts?: readonly LiveSetPRDraft[]
}): DetectedPR | null {
  const { setLogs, exerciseId, metricType, draft, validatingSet, priorSessionDrafts = [] } =
    params

  const baselineDrafts: LiveSetPRDraft[] = []

  for (const set of setLogs) {
    if (set.exerciseId !== exerciseId) continue
    if (!setHasLoggableData(set)) continue
    if (isSameValidatingSet(set, validatingSet)) continue
    baselineDrafts.push({
      loadKg: set.loadKg,
      reps: set.reps,
      meters: set.meters,
      seconds: set.seconds,
    })
  }

  for (const prior of priorSessionDrafts) {
    if (setHasLoggableData(prior)) baselineDrafts.push(prior)
  }

  if (baselineDrafts.length === 0) return null

  const previousBest = aggregateBests(baselineDrafts)
  const [pr] = detectPRs([{ exerciseId, metricType, draft, previousBest }])
  if (!pr || pr.previousValue === undefined) return null
  return pr
}
