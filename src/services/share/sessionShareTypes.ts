import type { Lang } from '../../i18n/appLabels'
import type { FatigueStatus } from '../../types/training'

/** Record affiché sur la carte (max ~3 côté générateur). */
export interface SessionSharePR {
  exerciseName: string
  newBestKg: number
  previousBestKg: number
}

/** Max charge atteinte sur un exo de la séance (premium). */
export interface SessionShareExerciseMax {
  exerciseId: string
  exerciseName: string
  maxKg: number
}

/** Données pour générer / partager une carte post-séance. */
export interface SessionSharePayload {
  sessionLabel: string
  durationMin: number
  completedSets: number
  totalSets: number
  tonnageKg: number | null
  /** Effort ressenti 1–10 (slider fin de séance). */
  rpe: number
  /** Forme du jour déclarée en fin de séance. */
  fatigue: FatigueStatus
  prs: readonly SessionSharePR[]
  lang: Lang
  /** Premium = charges / tonnage / max par exo. Free = stats sans kg. */
  isPremium: boolean
  /** Max kg par exo (premium only). */
  exerciseMaxLoads: readonly SessionShareExerciseMax[]
  /** Félicitation hors-image. */
  congratLine: string
  /** Recap objectif de la séance (hors-image + free on-image). */
  purposeLine: string
}

export type SessionShareTarget = 'system' | 'download'

export type SessionShareOutcome =
  | { status: 'shared'; method: 'web-share' | 'download'; target: SessionShareTarget }
  | { status: 'cancelled' }
  | { status: 'unsupported' }
  | { status: 'failed'; reason: string }

export const SESSION_SHARE_LANDING_URL =
  'https://rugbyforge.fr/?utm_source=session_share&utm_medium=social&utm_campaign=post_workout'

/** Format Stories / Snap / IG — standard industrie fitness. */
export const SESSION_SHARE_WIDTH = 1080
export const SESSION_SHARE_HEIGHT = 1920
