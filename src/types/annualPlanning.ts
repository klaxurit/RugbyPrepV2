import type { CalendarEvent, Equipment, TrainingLevel } from './training'

export type AnnualCycle = 'off_season' | 'pre_season' | 'in_season' | 'playoffs'

/** Charge de contact club déclarée pour la semaine (pas de GPS, pas de 15 min). */
export type ClubContactProxy = 'light' | 'normal' | 'hard'

export type OffSeasonPhase = 1 | 2 | 3 | 4 | 5
export type PreSeasonPhase = 1 | 2 | 3

export type InSeasonSubMode =
  | 'competition'
  | 'treve_deep'
  | 'treve_return'
  | 'treve_rampup'
  | 'end_of_season'
export type PlayoffTaperPhase = 'taper_1' | 'taper_2' | 'match_week'

/**
 * Fitness baseline déclaré à l'onboarding — KB: src/knowledge/population-specific.md §3.
 * Module la rampe de reprise via l'onboarding hint.
 */
export type TrainingBaselineInput = 'restart' | 'active' | 'peak'

export interface AthleteIdentityContext {
  athleteId?: string
  clubId?: string
  squadId?: string
  source?: 'self' | 'staff' | 'system'
}

export interface AthletePlanningInputs {
  events: Array<Pick<CalendarEvent, 'date' | 'type' | 'match_kind'>>
  today: Date | string

  weeklyFrequency: 2 | 3 | 4
  positionGroup: 'front_row' | 'back_three'
  /**
   * Famille mother Lower/Upper in-season (6).
   * Distincte du binôme `positionGroup` (calendrier / Primer / Full).
   */
  contentFamily?:
    | 'front_row'
    | 'second_row'
    | 'back_row'
    | 'half_backs'
    | 'centers'
    | 'back_three'
  /** Niveau S&C — cadence de variété in-season (Fondations vs Performance). */
  trainingLevel?: TrainingLevel
  /** Matériel déclaré — pilote mother sessions BW vs full_gym. */
  equipment?: Equipment[]

  fatigueLevel?: 'normal' | 'high' | 'very_high'

  /**
   * Choix joueur face à une zone ACWR caution/danger/critical
   * (`self_manage` | `lighten_volume` | `drop_session`).
   * Absent = pas encore décidé ; le resolver n'applique pas de swap récup auto.
   */
  fatigueLoadChoice?: 'self_manage' | 'lighten_volume' | 'drop_session'

  /**
   * Bypass joueur : volume normal malgré reprise / absence / ramp-up trêve.
   * Rails match / décharge 3:1 inchangés.
   */
  volumeConfidenceBypass?: boolean

  /**
   * Raisons d'allègement volume détectées en amont (bandeau + resolver).
   * Recalculées après `detectAnnualPlanningContext` si absentes.
   */
  volumeLighteningReasons?: Array<'restart_ramp' | 'long_absence' | 'treve_rampup'>

  /** Proxy contact club pour la semaine de `today`. Défaut runtime = normal. */
  clubContactProxy?: ClubContactProxy

  /** État de forme déclaré à l'onboarding. Module la rampe de reprise (cf. onboardingCycleHint). */
  trainingBaseline?: TrainingBaselineInput
  /** ISO d'activation du baseline — pour détecter la rampe restart active. */
  trainingBaselineSetAt?: string | null

  identity?: AthleteIdentityContext

  planningAnchors?: {
    firstMatchDateOverride?: string
    offSeasonStartAt?: string
    seasonEndedAt?: string
    returnToTeamTrainingAt?: string
    manualCycleOverride?: AnnualCycle
    manualOffSeasonWeekOverride?: number
    manualPreSeasonWeekOverride?: number
    manualPlayoffs?: boolean
    /**
     * Bootstrap first-run : cycle suggéré par l'onboarding.
     * Sans calendrier de match, l'horloge amateur FFR situe la semaine dans
     * l'année ; le hint ne reset à S1 que s'il contredit cette horloge.
     * Priorité inférieure au calendrier réel et aux ancres explicites.
     */
    onboardingCycleHint?: AnnualCycle
    /**
     * Si true : pour les semaines calendaires S1–S2 (phase Récupération), le programme
     * démarre comme S3–S4 (Transition). Ignoré si manualOffSeasonWeekOverride est défini.
     */
    skipOffSeasonRecoveryIntro?: boolean
    /** Origine de la date de fin de saison (manuelle vs dérivée calendrier). */
    seasonEndedSource?: 'manual' | 'derived'
  }

  monitoringSnapshot?: {
    completedSessionsLast7d?: number
    completedSessionsLast28d?: number
    readinessScore?: number
    jumpTrend?: 'up' | 'flat' | 'down'
    /** Déclaratif / staff uniquement — ne doit pas piloter le cycle (stores). */
    painFlags?: string[]
    latestRpeLoad?: number
    /** True if the athlete has any session logs in history (distinguishes long absence from first-run). */
    hasHistoricalLogs?: boolean
  }
}

export interface AnnualPlanningContext {
  cycle: AnnualCycle

  offSeasonPhase?: OffSeasonPhase
  preSeasonPhase?: PreSeasonPhase

  weekNumber?: number
  weekLabel: string

  isDeloadWeek: boolean
  mesocycleWeek?: 1 | 2 | 3 | 4
  mesocycleBlock?: number
  isMatchWeek: boolean

  firstMatchDate: string | null
  lastMatchDate: string | null
  offSeasonStartAt: string | null

  daysUntilNextMatch: number | null
  daysSinceLastMatch: number | null

  fatigueLevel: 'normal' | 'high' | 'very_high'
  /** Proxy contact club (léger / normal / dur). Absent = normal. */
  clubContactProxy?: ClubContactProxy
  /**
   * Legacy : recovery swap auto (very_high). Conservé pour tests / staff view,
   * mais le chemin joueur passe désormais par `fatigueLoadChoice`.
   */
  loadManagementOverride?: 'recovery'
  /** Choix joueur appliqué cette semaine (ACWR). */
  fatigueLoadChoiceApplied?: 'self_manage' | 'lighten_volume' | 'drop_session'
  /**
   * Raisons qui allègent le volume (reprise / absence / trêve).
   * Vide si décharge 3:1 (rail) ou aucune cause bypassable.
   */
  volumeLighteningReasons?: Array<'restart_ramp' | 'long_absence' | 'treve_rampup'>
  /** Bypass volume actif (joueur a choisi « repasser en normal »). */
  volumeConfidenceBypassApplied?: boolean
  weeklyFrequency: 2 | 3 | 4
  positionGroup: 'front_row' | 'back_three'
  /** Famille mother (6) — sélection Lower/Upper in-season. */
  contentFamily?:
    | 'front_row'
    | 'second_row'
    | 'back_row'
    | 'half_backs'
    | 'centers'
    | 'back_three'

  /**
   * Sous-mode in-season (trêve, compétition normale, fin de saison). Absent si cycle ≠ in_season.
   * `end_of_season` : dernier match passé, aucun match futur, avant la bascule auto en inter-saison
   * (fenêtre de décompression).
   */
  inSeasonSubMode?: InSeasonSubMode

  /** Phase de taper en playoffs. Absent si cycle ≠ playoffs. */
  playoffTaperPhase?: PlayoffTaperPhase

  /** Durée effective de la pré-saison en semaines (6-12). */
  effectivePreSeasonWeeks?: number

  /** Durée effective de l'off-season en semaines (6-12). */
  effectiveOffSeasonWeeks?: number

  identity?: AthleteIdentityContext
  monitoringSnapshot?: AthletePlanningInputs['monitoringSnapshot']

  planningTrace: {
    resolutionMode:
      | 'manual_override'
      | 'explicit_anchors'
      | 'calendar_inferred'
      | 'onboarding_hint'
      | 'default_ffr_clock'
      | 'backfilled'
    rulesApplied: string[]
    warnings: string[]
  }
}
