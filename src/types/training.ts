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
  | 'DELOAD_RECOVERY'
  | 'REHAB_UPPER'
  | 'REHAB_LOWER';

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
export type SeasonMode = 'in_season' | 'off_season' | 'pre_season';
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
  seasonMode?: SeasonMode
  performanceFocus?: PerformanceFocus
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
}

export type SessionType = 'UPPER' | 'LOWER' | 'FULL' | 'CONDITIONING' | 'RECOVERY';

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

export interface SessionLog {
  id: string;
  dateISO: string;
  week: CycleWeek;
  sessionType: SessionType;
  fatigue: FatigueStatus;
  notes?: string;
  rpe?: number;        // 1-10 (effort perçu)
  durationMin?: number; // durée en minutes
}

export type MetricType = ExerciseMetricType;

export interface ExerciseLogEntry {
  exerciseId: string;
  loadKg?: number;
  reps?: number;
  seconds?: number;
  meters?: number;
  note?: string;
}

export interface BlockLog {
  id: string;
  dateISO: string;
  week: CycleWeek;
  sessionType: SessionType;
  blockId: string;
  blockName: string;
  entries: ExerciseLogEntry[];
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
  notes?: string
  rpe?: number           // RPE 1-10 du match (pour ACWR)
  duration_min?: number  // Durée en minutes (pour ACWR)
  created_at?: string
}
