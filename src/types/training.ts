// src/types/training.ts
export type Contra =
  | 'shoulder_pain'
  | 'elbow_pain'
  | 'wrist_pain'
  | 'low_back_pain'
  | 'knee_pain'
  | 'groin_pain'
  | 'neck_pain'
  | 'ankle_pain'; // tu l'as utilisé dans blocks, on l'ajoute

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'bench'
  | 'band'
  | 'landmine'
  | 'tbar_row'
  | 'ghd'
  | 'med_ball'
  | 'box'
  | 'pullup_bar'
  | 'machine'
  | 'sprint_track'
  | 'ab_wheel'
  | 'cable'
  | 'ez_bar'
  | 'kettlebell'
  | 'trap_bar'
  | 'sled'
  | 'none';

export type BlockIntent =
  | 'warmup'
  | 'activation'
  | 'prehab'
  | 'neural'
  | 'force'
  | 'contrast'
  | 'hypertrophy'
  | 'core'
  | 'neck'
  | 'carry'
  | 'conditioning'
  | 'mobility'
  | 'cooldown';

export type WeekVersion = 'W1' | 'W2' | 'W3' | 'W4';
export type CycleWeek =
  | 'W1'
  | 'W2'
  | 'W3'
  | 'W4'
  | 'W5'
  | 'W6'
  | 'W7'
  | 'W8'
  | 'H1'
  | 'H2'
  | 'H3'
  | 'H4'
  | 'DELOAD';

export type ProgramPhase = 'FORCE' | 'POWER' | 'HYPERTROPHY';

export type SessionIntensity = 'heavy' | 'medium' | 'light';
export type MatchDayOffset =
  | 'MD'
  | 'MD-1'
  | 'MD-2'
  | 'MD-3'
  | 'MD-4'
  | 'MD-5'
  | 'MD-6'
  | 'UNKNOWN';

export type MicrocycleArchetypeId =
  | 'LEGACY_V1'
  | 'IN_SEASON_2X_STD'
  | 'IN_SEASON_3X_STD'
  | 'DELOAD_RECOVERY';

export type SessionRole =
  | 'lower_strength'
  | 'upper_strength'
  | 'full_neural'
  | 'conditioning'
  | 'speed_field'
  | 'rehab'
  | 'recovery';

export interface SessionIdentity {
  archetypeId: MicrocycleArchetypeId;
  sessionRole: SessionRole;
  sessionIntensity: SessionIntensity | 'recovery';
  matchDayOffset: MatchDayOffset;
  objectiveLabel: string;
  whyTodayLabel: string;
}

export interface QualityScorecard {
  safety: number;
  microcycle: number;
  matchProximity: number;
  structure: number;
  identity: number;
  population: number;
  overall: number;
}

export type RugbyPositionGroup =
  | 'FRONT_ROW'
  | 'SECOND_ROW'
  | 'BACK_ROW'
  | 'HALF_BACKS'
  | 'CENTERS'
  | 'BACK_THREE';

export type RugbyPosition = RugbyPositionGroup;

export type Scheme =
  | { kind: 'reps'; reps: string }
  | { kind: 'time'; seconds: number }
  | {
      kind: 'emom';
      minutes: number;
      work?:
        | { kind: 'reps'; reps: string }
        | { kind: 'seconds'; seconds: string };
    };

export type Role = 'prime' | 'contrast' | 'stability' | 'accessory' | 'superset_partner';

export type TrainingLevel = 'starter' | 'builder' | 'performance';
export type LevelAxisState = TrainingLevel;
export type LevelPrimaryAxis =
  | 'exercise_complexity'
  | 'volume_tolerance'
  | 'explosive_readiness';
export type LevelDerivedAxis =
  | 'intensity_tolerance'
  | 'optional_block_tolerance';
export type LevelAxisName = LevelPrimaryAxis | LevelDerivedAxis;
export type LevelSafetyCapCode =
  | 'pain_caps_explosive'
  | 'true_beginner_caps_complexity'
  | 'inconsistent_recovery_caps_volume';
export type SeasonMode = 'in_season' | 'off_season' | 'pre_season';
/**
 * État de forme déclaré à l'onboarding — module la rampe de reprise.
 * - `restart` : ≥6 sem sans entraînement structuré → protocole retour progressif (volume 40-50% W1-W2).
 *   Source KB : `population-specific.md §3` (Return After Long Break).
 * - `active` : entraînement irrégulier (1-2×/sem) → ramp-up standard, pas d'override.
 * - `peak` : ≥3×/sem depuis ≥4 sem → skip hypertrophy intro (H1-H2), attaque direct phase cible.
 */
export type TrainingBaseline = 'restart' | 'active' | 'peak';
export type PerformanceFocus = 'balanced' | 'speed' | 'strength';
export type PopulationSegment =
  | 'male_senior'
  | 'female_senior'
  | 'u18_female'
  | 'u18_male'
  | 'unknown';
export type AgeBand = 'u18' | 'adult';
export type HealthConsentStatus = 'unknown' | 'granted' | 'revoked' | 'not_required';
export type HealthConsentSource = 'onboarding' | 'profile' | 'support' | 'system';
export type HealthDataRetentionState = 'active' | 'pending_purge' | 'purged';

export interface HealthConsentAuditEvent {
  at: string
  action: 'granted' | 'revoked' | 'not_required' | 'unknown'
  source: HealthConsentSource
  actor: 'user' | 'system'
  note?: string
}

export interface LevelOnboardingAnswersV1 {
  trainingAge: 1 | 2 | 3
  patternConfidence: 1 | 2 | 3
  recentConsistency: 1 | 2 | 3
  recoveryCapacity: 1 | 2 | 3
  explosiveExposure: 1 | 2 | 3
  currentPain: 1 | 2 | 3
}

export interface LevelAxisScore {
  average: 1 | 1.5 | 2 | 2.5 | 3
  state: LevelAxisState
  source: 'onboarding' | 'derived' | 'usage_refined'
}

export interface LevelSafetyCap {
  code: LevelSafetyCapCode
  appliedTo: LevelAxisName[]
  note: string
}

export interface LevelModifierProfileV1 {
  schemaVersion: 'v1'
  visibleLabel: TrainingLevel
  axes: {
    exerciseComplexity: LevelAxisScore
    volumeTolerance: LevelAxisScore
    explosiveReadiness: LevelAxisScore
    intensityTolerance: LevelAxisScore
    optionalBlockTolerance: LevelAxisScore
  }
  safetyCaps: LevelSafetyCap[]
  source: 'onboarding_only' | 'onboarding_plus_usage'
  scoredAt: string
  lastRefinedAt?: string
}

export interface BlockExercise {
  exerciseId: string;
  role: Role;
  notes?: string;
}

export interface BlockVersion {
  versionId: WeekVersion;
  sets: number;
  scheme: Scheme;
  restSeconds: number;
  rer?: number;
  tempo?: string;
}

export interface TrainingBlock {
  blockId: string;
  name: string;
  intent: BlockIntent;
  tags: string[];
  equipment: Equipment[];
  contraindications: Contra[];
  exercises: BlockExercise[];
  versions: BlockVersion[];
  coachingNotes: string;
}

export interface UserProfile {
  goal?: 'strength' | 'hypertrophy';
  avatarUrl?: string;
  avatarPath?: string;
  equipment: Equipment[];      // ce que l'utilisateur a
  injuries: Contra[];          // on mappe les blessures vers Contra
  weeklySessions: 2 | 3;
  level: 'beginner' | 'intermediate';
  position?: RugbyPositionGroup;
  rugbyPosition?: RugbyPosition;
  leagueLevel?: string;
  clubCode?: string;
  clubName?: string;
  clubLigue?: string;
  clubDepartmentCode?: string;
  heightCm?: number;           // taille en cm (pour IMC)
  weightKg?: number;           // poids en kg (pour IMC)
  clubSchedule?: ClubSchedule
  scSchedule?: SCSchedule
  trainingLevel?: TrainingLevel
  levelModifierProfile?: LevelModifierProfileV1
  seasonMode?: SeasonMode
  trainingBaseline?: TrainingBaseline
  /** ISO timestamp d'activation du baseline. Sert à expirer auto le mode 'restart' après 14j. */
  trainingBaselineSetAt?: string | null
  performanceFocus?: PerformanceFocus
  preferredLanguage?: 'fr' | 'en'
  rehabInjury?: RehabInjury
  populationSegment?: PopulationSegment
  ageBand?: AgeBand
  parentalConsentHealthData?: boolean
  adultPlayEligibilityApproved?: boolean
  maturityStatus?: 'pre_phv' | 'circa_phv' | 'post_phv' | 'unknown'
  cycleTrackingOptIn?: boolean
  cycleSymptomScoreToday?: 0 | 1 | 2 | 3
  preventionSessionsWeek?: number
  weeklyLoadContext?: WeeklyLoadContext
  healthConsentStatus?: HealthConsentStatus
  healthConsentGrantedAt?: string
  healthConsentRevokedAt?: string
  healthConsentSource?: HealthConsentSource
  healthConsentAuditTrail?: HealthConsentAuditEvent[]
  healthDataRetentionState?: HealthDataRetentionState
  ffrCompetitionId?: string
  ffrCompetitionName?: string
  ffrLastSyncAt?: string
  planningAnchors?: {
    seasonEndedAt?: string
    offSeasonStartAt?: string
    returnToTeamTrainingAt?: string
    manualPlayoffs?: boolean
    /**
     * Indication de cycle posée à l'onboarding (alignée sur AnnualCycle côté planning).
     * Évite une dépendance circulaire training → annualPlanning : mêmes littéraux.
     */
    onboardingCycleHint?: 'off_season' | 'pre_season' | 'in_season' | 'playoffs'
    seasonEndedSource?: 'manual' | 'derived'
  }
  seasonTransitionState?: SeasonTransitionState
}

export interface ActiveDeferral {
  eventId: string
  matchDateAtDefer: string
  deferredAt: string
  expiresAt: string
}

export interface TransitionEntry {
  id: string
  at: string
  trigger: 'user_manual' | 'banner_action' | 'auto_56d' | 'ffr_match' | 'profile_change'
  from: {
    cycle: 'off_season' | 'pre_season' | 'in_season' | 'playoffs'
    weekNumber: number
    phase?: number
    schedulingMode: 'calendar' | 'sequential'
  }
  anchorsSnapshot: NonNullable<UserProfile['planningAnchors']>
  to: 'off_season' | 'pre_season' | 'in_season' | 'playoffs'
}

export interface SeasonTransitionState {
  transitionJournal?: TransitionEntry[]
  activeDeferral?: ActiveDeferral
  /**
   * Après « Oui, ma saison reprend » sur la bannière match en inter-saison :
   * supprime la re-détection UC9 pour ce match tant qu’il reste le prochain match futur visible.
   */
  offseasonMatchResumeAckEventId?: string
}

export interface WeeklyLoadContext {
  playedMatchMinutesWeek?: number
  scheduledMatchMinutes?: number
  contactHighMinutesWeek?: number
  contactMediumMinutesWeek?: number
  matchesPlayedSeason?: number
  lastMatchAt?: string
  nextMatchAt?: string
  upcomingMatchDates?: string[]
  externalSessionsLoad?: number
}

export type ExerciseMetricType = 'load_reps' | 'reps' | 'seconds' | 'meters';

export interface Exercise {
  id?: string;
  name?: string;
  pattern?: string;
  equipment: Equipment[];
  contraindications: Contra[];
  level?: 'beginner' | 'intermediate';
  unilateral?: boolean;
  notes?: string;
  exerciseId?: string;
  nameFr?: string;
  metricType?: ExerciseMetricType;
  tags?: string[];
  defaultNotes?: string;
  /** YouTube demo URL for the exercise. */
  videoUrl?: string;
}

export type SessionType = 'UPPER' | 'LOWER' | 'FULL' | 'CONDITIONING' | 'RECOVERY' | 'ACTIVE_RECOVERY';

export type RehabZone = 'upper' | 'lower'
export type RehabPhase = 1 | 2 | 3

export interface RehabInjury {
  type?: Contra
  zone: RehabZone
  phase: RehabPhase
  startDate: string
  phaseStartDate: string
}
export type FatigueStatus = 'OK' | 'FATIGUE';

export type ProgramSource = 'legacy' | 'mother_session'

export interface SessionLogProgramContext {
  cycle?: 'off_season' | 'pre_season' | 'in_season' | 'playoffs'
  weekLabel?: string
  variant?: 'normal' | 'light'
  maxBlocks?: number
  /** Numéro de semaine dans le cycle annuel (ex: 2 pour la 2e semaine off-season). */
  annualWeekNumber?: number
  /**
   * Code stable et lisible de la semaine annuelle — source de vérité pour les mother sessions.
   * Format : OFF_S01, OFF_S06, PRE_S12, IN_W03, PO_W01.
   * Pour les mother sessions, cette valeur prime sur `SessionLog.week` (compat legacy).
   */
  annualWeekCode?: string
  offSeasonPhase?: 1 | 2 | 3 | 4 | 5
  preSeasonPhase?: 1 | 2 | 3
}

export interface SessionLog {
  id: string;
  dateISO: string;
  week: CycleWeek;
  sessionType: SessionType;
  fatigue: FatigueStatus;
  notes?: string;
  rpe?: number;        // 1-10 (effort perçu)
  durationMin?: number; // durée en minutes

  /** Tonnage total de la séance (kg × reps × sets) — calculé à partir des
   *  exerciseTourLoads lors de la finalisation mother-session. Optionnel car
   *  absent sur les logs legacy pré-tracking. */
  tonnageKg?: number;

  // ── Convergence legacy / mother-session ────────────────────
  programSource?: ProgramSource;
  legacyRecipeId?: string;
  motherSessionId?: string;
  sessionLabel?: string;
  programContext?: SessionLogProgramContext;
}

export type MetricType = ExerciseMetricType;

export interface ExerciseLogEntry {
  exerciseId: string;
  loadKg?: number;
  reps?: number;
  seconds?: number;
  meters?: number;
  note?: string;
  setsCompleted?: number;  // nombre de séries faites (vs prescrites)
  rir?: number;            // 0-5, reps in reserve estimé
}

export interface BlockLog {
  id: string;
  dateISO: string;
  week: CycleWeek;
  sessionType: SessionType;
  blockId: string;
  blockName: string;
  entries: ExerciseLogEntry[];
  motherSessionId?: string;
  programSource?: 'legacy' | 'mother_session';
}

// ─── Club Schedule ───────────────────────────────────────────

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0=Dim, 1=Lun, …, 6=Sam

export interface ClubTrainingDay {
  day: DayOfWeek
  time?: string  // "HH:MM" optionnel
}

export interface ClubSchedule {
  clubDays: ClubTrainingDay[]  // Jours d'entraînement club récurrents
  matchDay?: DayOfWeek          // Jour de match habituel (souvent 6=Samedi)
}

export interface SCSessionSlot {
  sessionIndex: 0 | 1 | 2  // Index dans le programme hebdo (0=UPPER/FULL, 1=LOWER, 2=UPPER)
  day: DayOfWeek
}

export interface SCSchedule {
  sessions: SCSessionSlot[]
  suggestedAt?: string  // ISO date de la dernière suggestion
  /** `manual` = l'user a choisi les jours explicitement → le scheduler doit les respecter
   *  même s'ils coïncident avec clubDays/J-1 match. `auto` = suggestion algorithmique,
   *  peut être réécrite si conflit. Défaut : `auto` (compat legacy). */
  source?: 'auto' | 'manual'
}

// ─── Calendar ────────────────────────────────────────────────

export type CalendarEventType = 'match' | 'rest' | 'unavailable'
export type SeasonPhase = 'off-season' | 'pre-season' | 'in-season' | 'playoffs'

export interface CalendarEvent {
  id: string
  date: string           // YYYY-MM-DD
  type: CalendarEventType
  kickoff_time?: string  // HH:MM
  opponent?: string
  opponent_code?: string // Code club FFR (ex: '4207Y') pour résolution logo
  is_home?: boolean
  /** Terrain neutre (ex: finale playoffs). Si true, prend priorité sur is_home. */
  is_neutral?: boolean
  notes?: string
  rpe?: number           // RPE 1-10 du match (pour ACWR)
  duration_min?: number  // Durée en minutes (pour ACWR)
  created_at?: string
  source?: 'manual' | 'ffr_import'
  external_id?: string
  competition_id?: string
  competition_name?: string
  match_day?: number
  venue?: string
  user_hidden?: boolean
  user_override?: {
    date?: string
    kickoff_time?: string
    notes?: string
  } | null
  synced_at?: string
}

export interface FfrCompetition {
  id: string
  name: string
  season: string
  level?: string
  pool?: string
}
