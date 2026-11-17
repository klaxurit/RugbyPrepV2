/**
 * Feedback immédiat post-série (Weakley 2019/2020) — priorité :
 * 1) PR / record séance (meilleure charge de l’exo, toutes séries)
 * 2) Vs dernière séance — seulement si la charge ≥ max exo connu
 *    (évite un faux « record » quand on bat le même index de série
 *    sous le max déjà posé sur une autre série)
 * 3) Vs série précédente dans la séance (tour > 0)
 */

import type { ExerciseSetLog } from '../../types/training'
import type { ExerciseMetricType } from '../ui/exerciseMetrics'
import { getExerciseName } from '../../data/exercises'
import type { Lang } from '../motherSession/localizeMotherSessionExerciseName'
import type { PreviousSessionSetRef } from '../session/buildPreviousSessionSetMap'
import {
  collectPriorSessionDrafts,
  detectLiveSetPR,
  type LiveSetPRDraft,
  type ValidatingSetRef,
} from './detectLiveSetPR'
import {
  buildLivePRToastData,
  buildVsPreviousToastData,
  type LivePRToastData,
} from './formatLivePRToast'
import { shouldAnnounceLiveSetToast } from './shouldAnnounceLiveSetToast'

/** Meilleure charge déjà connue pour l’exo (historique + tours antérieurs séance). */
function exerciseBestLoadKg(
  historyLogs: readonly ExerciseSetLog[],
  exerciseId: string,
  validatingSet: ValidatingSetRef,
  priorSessionDrafts: readonly LiveSetPRDraft[],
): number | null {
  let best: number | null = null
  for (const set of historyLogs) {
    if (set.exerciseId !== exerciseId) continue
    if (set.loadKg == null || set.loadKg <= 0) continue
    if (set.completed === false) continue
    if (
      set.slotSignature === validatingSet.slotSignature &&
      set.blockNumber === validatingSet.blockNumber &&
      set.tourIndex === validatingSet.tourIndex
    ) {
      continue
    }
    best = best == null ? set.loadKg : Math.max(best, set.loadKg)
  }
  for (const draft of priorSessionDrafts) {
    if (draft.loadKg == null || draft.loadKg <= 0) continue
    best = best == null ? draft.loadKg : Math.max(best, draft.loadKg)
  }
  return best
}

export type LiveSetFeedbackResult = {
  toast: LivePRToastData
  /** Clé analytics PostHog */
  event: 'session_live_pr' | 'session_vs_previous' | 'session_vs_prior_tour'
  /** true si au moins vs dernière séance (insight fin de séance) */
  beatPreviousSession: boolean
}

function formatSetLabel(loadKg: number, reps: number | undefined): string {
  return reps != null ? `${loadKg} kg × ${reps}` : `${loadKg} kg`
}

export function resolveLiveSetFeedback(params: {
  exerciseId: string
  loadKg?: number
  reps?: number
  blockNumber: number
  tourIndex: number
  exerciseIndex: number
  slotSignature: string
  metricType: ExerciseMetricType
  lang: Lang
  historyLogs: readonly ExerciseSetLog[]
  exerciseTourLoads: Readonly<Record<string, LiveSetPRDraft>>
  buildTourKey: (blockNumber: number, tourIndex: number, exerciseIndex: number) => string
  getPreviousSessionSet?: (exerciseId: string, tourIndex: number) => PreviousSessionSetRef | undefined
  alreadyAnnouncedKg?: number | null
}): LiveSetFeedbackResult | null {
  const {
    exerciseId,
    loadKg,
    reps,
    blockNumber,
    tourIndex,
    exerciseIndex,
    slotSignature,
    metricType,
    lang,
    historyLogs,
    exerciseTourLoads,
    buildTourKey,
    getPreviousSessionSet,
    alreadyAnnouncedKg,
  } = params

  if (!shouldAnnounceLiveSetToast(loadKg, alreadyAnnouncedKg)) return null
  if (loadKg == null) return null

  const validatingSet: ValidatingSetRef = { slotSignature, blockNumber, tourIndex }
  const priorSessionDrafts = collectPriorSessionDrafts(
    exerciseTourLoads,
    blockNumber,
    tourIndex,
    exerciseIndex,
    buildTourKey,
  )

  const pr = detectLiveSetPR({
    setLogs: historyLogs,
    exerciseId,
    metricType,
    draft: { loadKg, reps },
    validatingSet,
    priorSessionDrafts,
  })

  if (pr) {
    const beatsPriorSessions = historyLogs.some(
      (s) =>
        s.exerciseId === exerciseId &&
        s.slotSignature !== slotSignature &&
        (s.loadKg != null || s.reps != null),
    )
    return {
      toast: buildLivePRToastData(pr, lang, { beatsPriorSessions }),
      event: 'session_live_pr',
      beatPreviousSession: beatsPriorSessions,
    }
  }

  const previous = getPreviousSessionSet?.(exerciseId, tourIndex)
  if (previous?.loadKg != null) {
    const beatLoad = loadKg > previous.loadKg
    const beatReps =
      loadKg === previous.loadKg && reps != null && previous.reps != null && reps > previous.reps
    const bestKnown = exerciseBestLoadKg(
      historyLogs,
      exerciseId,
      validatingSet,
      priorSessionDrafts,
    )
    // Sous le max exo (toutes séries) : battre le même n° de série ≠ toast « Vs dernière séance ».
    const underExerciseBest = bestKnown != null && loadKg <= bestKnown
    if ((beatLoad || beatReps) && !underExerciseBest) {
      const delta = beatLoad
        ? `+${Math.round((loadKg - previous.loadKg) * 10) / 10} kg`
        : `+${reps! - previous.reps!} reps`
      return {
        toast: buildVsPreviousToastData({
          exerciseId,
          lang,
          setLabel: formatSetLabel(loadKg, reps),
          delta,
        }),
        event: 'session_vs_previous',
        beatPreviousSession: true,
      }
    }
  }

  // Tour > 0 : battre la série précédente de la même séance
  if (tourIndex > 0) {
    const priorKey = buildTourKey(blockNumber, tourIndex - 1, exerciseIndex)
    const prior = exerciseTourLoads[priorKey]
    if (prior?.loadKg != null && prior.loadKg > 0) {
      const beatLoad = loadKg > prior.loadKg
      const beatReps =
        loadKg === prior.loadKg && reps != null && prior.reps != null && reps > prior.reps
      if (beatLoad || beatReps) {
        const delta = beatLoad
          ? `+${Math.round((loadKg - prior.loadKg) * 10) / 10} kg`
          : `+${reps! - prior.reps!} reps`
        return {
          toast: {
            kind: 'progress',
            title: lang === 'fr' ? 'Vs série précédente' : 'Vs previous set',
            exerciseName: getExerciseName(exerciseId, lang) ?? exerciseId,
            setLabel: formatSetLabel(loadKg, reps),
            delta,
          },
          event: 'session_vs_prior_tour',
          beatPreviousSession: false,
        }
      }
    }
  }

  return null
}
