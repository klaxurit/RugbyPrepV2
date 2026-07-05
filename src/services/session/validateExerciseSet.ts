import type { Block, MotherSession } from '../../types/motherSession'
import { buildExerciseTourKey } from '../../contexts/SessionRunContext'
import type { ExerciseTourLoad } from '../../contexts/SessionRunContext'
import type { Lang } from '../motherSession/localizeMotherSessionExerciseName'
import { resolveExerciseIdForSessionRun } from '../motherSession/motherSessionExerciseMap'
import { getRestAfterExerciseSet } from '../motherSession/resolveExerciseRestAfterSet'
import { parseExerciseInputNumber } from '../ui/parseExerciseInputNumber'
import { parseExerciseSetSpec } from '../ui/exerciseSetSpec'
import { getExerciseMetricType } from '../ui/exerciseMetrics'
import { restTimerAfterSetLine } from '../../i18n/sessionRunUi'
import type { LoadSuggestion } from '../loadSuggestion'
import type { PreviousSessionSetRef } from './buildPreviousSessionSetMap'
import type { BlockCompletionSnapshot, ExerciseLoadPrefill } from './collectBlockSetUpserts'

export interface SessionRunValidationApi {
  completedExercises: Set<string>
  exerciseTourLoads: Record<string, ExerciseTourLoad>
  restTimer: unknown
  skipRestTimer: () => void
  markExerciseDone: (key: string) => void
  unmarkExerciseDone: (key: string) => void
  setExerciseTourLoad: (key: string, load: ExerciseTourLoad) => void
  startRestTimer: (seconds: number, label: string) => void
}

export interface ValidateExerciseSetArgs {
  session: MotherSession
  blockNumber: number
  tourIndex: number
  exerciseIndex: number
  sessionRun: SessionRunValidationApi
  block: Block
  lang: Lang
  onBlockCompleted?: (blockNumber: number, snapshot?: BlockCompletionSnapshot) => void
  loadPrefill?: ExerciseLoadPrefill
  onLiveSetValidated?: (payload: {
    exerciseId: string
    loadKg?: number
    reps?: number
    blockNumber: number
    tourIndex: number
    exerciseIndex: number
  }) => void
}

function mergeExerciseTourLoad(
  loads: Record<string, ExerciseTourLoad>,
  key: string,
  patch: ExerciseTourLoad,
): Record<string, ExerciseTourLoad> {
  return { ...loads, [key]: { ...loads[key], ...patch } }
}

export function buildCompletionSnapshot(
  sessionRun: SessionRunValidationApi,
  key: string,
  loadPatch?: ExerciseTourLoad,
  markKeyDone = false,
): BlockCompletionSnapshot {
  const completedExercises = new Set(sessionRun.completedExercises)
  if (markKeyDone) completedExercises.add(key)
  const hasLoadData = loadPatch != null && (loadPatch.loadKg != null || loadPatch.reps != null)
  const exerciseTourLoads = hasLoadData
    ? mergeExerciseTourLoad(sessionRun.exerciseTourLoads, key, loadPatch)
    : sessionRun.exerciseTourLoads
  return { completedExercises, exerciseTourLoads }
}

function prefillToLoadPatch(prefill?: ExerciseLoadPrefill): ExerciseTourLoad | undefined {
  if (!prefill) return undefined
  const loadKg = prefill.kg !== undefined ? parseExerciseInputNumber(prefill.kg) : undefined
  const reps = prefill.reps !== undefined ? parseExerciseInputNumber(prefill.reps) : undefined
  if (loadKg == null && reps == null) return undefined
  return { loadKg, reps }
}

/** Pré-remplit kg/reps vides depuis dernière séance, suggestion AI ou carry-forward. */
export function buildExerciseValidatePrefill(params: {
  hasLoadInputs: boolean
  showKgInput: boolean
  showRepsInput: boolean
  kg: string
  reps: string
  previousSession?: PreviousSessionSetRef
  kgPlaceholder?: string
  repsPlaceholder?: string
}): ExerciseLoadPrefill | undefined {
  const {
    hasLoadInputs,
    showKgInput,
    showRepsInput,
    kg,
    reps,
    previousSession,
    kgPlaceholder,
    repsPlaceholder,
  } = params
  if (!hasLoadInputs) return undefined
  if (!((showKgInput ? kg === '' : true) && (showRepsInput ? reps === '' : true))) {
    return undefined
  }

  const prefill: ExerciseLoadPrefill = {}
  if (showKgInput && kg === '') {
    if (previousSession?.loadKg != null) prefill.kg = String(previousSession.loadKg)
    else if (kgPlaceholder != null) prefill.kg = kgPlaceholder
  }
  if (showRepsInput && reps === '') {
    if (previousSession?.reps != null) prefill.reps = String(previousSession.reps)
    else if (repsPlaceholder != null) prefill.reps = repsPlaceholder
  }
  if (prefill.kg === undefined && prefill.reps === undefined) return undefined
  return prefill
}

/** Contexte de pré-remplissage pour le sticky CTA ou la validation inline. */
export function resolveExerciseSetValidatePrefill(params: {
  block: Block
  blockNumber: number
  tourIndex: number
  exerciseIndex: number
  exerciseTourLoads: Record<string, ExerciseTourLoad>
  premium: boolean
  getPreviousSessionSet?: (exerciseId: string, tourIndex: number) => PreviousSessionSetRef | undefined
  getLoadSuggestion?: (exerciseId: string) => LoadSuggestion | undefined
}): ExerciseLoadPrefill | undefined {
  const {
    block,
    blockNumber,
    tourIndex,
    exerciseIndex,
    exerciseTourLoads,
    premium,
    getPreviousSessionSet,
    getLoadSuggestion,
  } = params

  const exercise = block.exercises[exerciseIndex]
  if (!exercise) return undefined

  const exerciseId = resolveExerciseIdForSessionRun(exercise.name, exercise.exerciseId) ?? ''
  const metricType = exerciseId ? getExerciseMetricType({ exerciseId }) : 'load_reps'
  const spec = parseExerciseSetSpec(exercise.prescription)
  const hasRepScheme = spec.kind === 'reps'
  const hasLoadInputs =
    hasRepScheme &&
    premium &&
    (metricType === 'load_reps' || metricType === 'reps')
  const showKgInput = hasLoadInputs && metricType === 'load_reps'
  const showRepsInput = hasLoadInputs && (metricType === 'load_reps' || metricType === 'reps')

  const key = buildExerciseTourKey(blockNumber, tourIndex, exerciseIndex)
  const load = exerciseTourLoads[key]
  const kg = load?.loadKg != null ? String(load.loadKg) : ''
  const reps = load?.reps != null ? String(load.reps) : ''

  const showCarryForward = tourIndex > 0
  const previousSession =
    !showCarryForward && exerciseId && getPreviousSessionSet
      ? getPreviousSessionSet(exerciseId, tourIndex)
      : undefined
  const suggestion =
    !showCarryForward && exerciseId && premium ? getLoadSuggestion?.(exerciseId) : undefined
  const showSuggestionPlaceholder =
    suggestion?.confidence === 'high' &&
    suggestion?.suggestedWeight != null &&
    suggestion.decision !== 'no_suggestion' &&
    (suggestion.decision !== 'no_data' || suggestion.suggestedWeight != null)

  let kgPlaceholder: string | undefined
  let repsPlaceholder: string | undefined

  if (showCarryForward) {
    const prevKey = buildExerciseTourKey(blockNumber, tourIndex - 1, exerciseIndex)
    const prevLoad = exerciseTourLoads[prevKey]
    kgPlaceholder = prevLoad?.loadKg != null ? String(prevLoad.loadKg) : undefined
    repsPlaceholder = prevLoad?.reps != null ? String(prevLoad.reps) : undefined
  } else {
    kgPlaceholder =
      previousSession?.loadKg != null
        ? String(previousSession.loadKg)
        : showSuggestionPlaceholder
          ? String(suggestion!.suggestedWeight)
          : undefined
    repsPlaceholder =
      previousSession?.reps != null
        ? String(previousSession.reps)
        : showSuggestionPlaceholder && suggestion?.suggestedReps != null
          ? String(suggestion.suggestedReps)
          : undefined
  }

  return buildExerciseValidatePrefill({
    hasLoadInputs,
    showKgInput,
    showRepsInput,
    kg,
    reps,
    previousSession,
    kgPlaceholder,
    repsPlaceholder,
  })
}

/**
 * Valide (ou dé-valide) une série — utilisé par ToursBlock et le sticky CTA running.
 * Déclenche PR live, repos inter-tours et autosave incrémental des sets loggés.
 */
export function validateExerciseSetFromBlock({
  session,
  blockNumber,
  tourIndex,
  exerciseIndex,
  sessionRun,
  block,
  lang,
  onBlockCompleted,
  loadPrefill,
  onLiveSetValidated,
}: ValidateExerciseSetArgs): void {
  const key = buildExerciseTourKey(blockNumber, tourIndex, exerciseIndex)
  const wasValidated = sessionRun.completedExercises.has(key)
  if (wasValidated) {
    sessionRun.unmarkExerciseDone(key)
    return
  }

  if (sessionRun.restTimer) sessionRun.skipRestTimer()

  const loadPatch = prefillToLoadPatch(loadPrefill)
  if (loadPatch) sessionRun.setExerciseTourLoad(key, loadPatch)
  sessionRun.markExerciseDone(key)

  const snapshot = buildCompletionSnapshot(sessionRun, key, loadPatch, true)

  const exercise = block.exercises[exerciseIndex]
  if (exercise && onLiveSetValidated) {
    const exerciseId = resolveExerciseIdForSessionRun(exercise.name, exercise.exerciseId)
    const effective = snapshot.exerciseTourLoads[key]
    if (exerciseId && effective && (effective.loadKg != null || effective.reps != null)) {
      onLiveSetValidated({
        exerciseId,
        loadKg: effective.loadKg,
        reps: effective.reps,
        blockNumber,
        tourIndex,
        exerciseIndex,
      })
    }
  }

  onBlockCompleted?.(blockNumber, snapshot)

  const rest = getRestAfterExerciseSet(session, blockNumber, tourIndex, exerciseIndex)
  if (rest) {
    const exercise = block.exercises[exerciseIndex]
    sessionRun.startRestTimer(
      rest.restSeconds,
      restTimerAfterSetLine({
        kind: rest.kind,
        tourOneBased: rest.tourOneBased,
        exerciseName: exercise?.name,
        lang,
      }),
    )
  }
}
