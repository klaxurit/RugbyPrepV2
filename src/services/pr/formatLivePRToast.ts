import type { Lang } from '../motherSession/localizeMotherSessionExerciseName'
import { getExerciseName } from '../../data/exercises'
import type { DetectedPR } from './detectPRs'

export type LivePRToastData = {
  kind: 'personal' | 'session'
  title: string
  exerciseName: string
  setLabel: string
  delta?: string
}

export function buildLivePRToastData(
  pr: DetectedPR,
  lang: Lang,
  options?: { beatsPriorSessions?: boolean },
): LivePRToastData {
  const exerciseName = getExerciseName(pr.exerciseId, lang) ?? pr.exerciseId
  const kind = options?.beatsPriorSessions === true ? 'personal' : 'session'
  const title =
    kind === 'personal'
      ? lang === 'fr'
        ? 'Record personnel'
        : 'Personal record'
      : lang === 'fr'
        ? 'Record séance'
        : 'Session best'
  const delta =
    pr.improvement && pr.improvement !== 'Premier record' ? pr.improvement : undefined

  return { kind, title, exerciseName, setLabel: pr.label, delta }
}

/** @deprecated Préférer buildLivePRToastData + SessionPRToast structuré */
export function formatLivePRMessage(
  pr: DetectedPR,
  lang: Lang,
  options?: { beatsPriorSessions?: boolean },
): string {
  const data = buildLivePRToastData(pr, lang, options)
  const delta = data.delta ? ` · ${data.delta}` : ''
  return `${data.title} · ${data.exerciseName} · ${data.setLabel}${delta}`
}
