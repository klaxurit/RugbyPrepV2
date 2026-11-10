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

export interface ShareNextMatch {
  /** Jours avant le match (1 à 7 pour être affiché). */
  daysUntil: number
  opponent: string | null
  isHome: boolean | null
}

export type ShareProgression =
  | { kind: 'load'; percent: number; weeks: number; exerciseName?: string | null }
  | { kind: 'streak'; weeks: number }

/** Formats d’export carte (Story 9:16 ou carré feed 1:1). */
export type ShareCardFormat = 'story' | 'square'

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
  /** Photo de profil (URL publique). Si absente / échec chargement → illustration Rufo. */
  avatarUrl?: string | null
  /** Prénom affiché sur le libellé d’intensité (ex. « Belle intensité, Jean »). */
  firstName?: string | null
  /** Nom complet sous l’avatar. */
  displayName?: string | null
  /** Poste / groupe de poste (ex. « 1ère ligne »). */
  positionLabel?: string | null
  /** Club (ex. « JO Pradéenne… »). */
  clubName?: string | null
  /** Code FFR du club (clé des logos déjà stockés). */
  clubCode?: string | null
  /** Compétition choisie à la synchro FFR (ex. « Régionale 2 - Poule 3 »). */
  competitionName?: string | null
  /** Toggle « Afficher mon club » (défaut true). false → ni logo, ni club, ni niveau. */
  showClub?: boolean
  /** Prochain match à J-1…J-7 (calendrier). Héros b si aucun record. */
  nextMatch?: ShareNextMatch | null
  /** Progression charge / régularité (héros c) — optionnel tant que non calculé. */
  progression?: ShareProgression | null
  /** Photo de séance choisie par le joueur (fond de carte). Absente → fond de marque. */
  photoUrl?: string | null
  /**
   * Préférence format carte (UI). Résolue avec le héros via `resolveShareCardFormat`
   * (carré seulement pour record / séance par défaut).
   */
  cardFormat?: ShareCardFormat | null
  /** Date ISO YYYY-MM-DD (tampon RECORD « DD · MM · YY »). */
  sessionDateISO?: string | null
  /** Date longue (ex. « Vendredi 8 mai »). */
  dateLabel?: string | null
  /** Semaine programme (ex. « Semaine 19 »). */
  weekLabel?: string | null
  /** Rang dans la semaine (ex. « Séance 3/5 »). */
  sessionOrdinalLabel?: string | null
}

export type SessionShareTarget = 'system' | 'download'

/** Ce qui a réellement été rendu sur l’image (analytics). */
export interface SessionShareImageMeta {
  clubShown: boolean
  logoSource: 'ffr' | 'fallback' | 'none'
}

export type SessionShareOutcome =
  | {
      status: 'shared'
      method: 'web-share' | 'download'
      target: SessionShareTarget
      meta?: SessionShareImageMeta
    }
  | { status: 'cancelled' }
  | { status: 'unsupported' }
  | { status: 'failed'; reason: string }

export const SESSION_SHARE_LANDING_URL =
  'https://rugbyforge.fr/?utm_source=session_share&utm_medium=social&utm_campaign=post_workout'

/** Format Stories / Snap / IG — standard industrie fitness. */
export const SESSION_SHARE_WIDTH = 1080
export const SESSION_SHARE_HEIGHT = 1920
/** Format carré feed (record / séance par défaut). */
export const SESSION_SHARE_SQUARE_HEIGHT = 1080
