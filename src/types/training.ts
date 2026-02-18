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
  | 'none';

export type BlockIntent =
  | 'activation'
  | 'prehab'
  | 'neural'
  | 'force'
  | 'contrast'
  | 'hypertrophy'
  | 'core'
  | 'neck'
  | 'carry';

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
  | 'DELOAD';

export type ProgramPhase = 'FORCE' | 'POWER';

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

export type Role = 'prime' | 'contrast' | 'stability' | 'accessory';

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

export type SessionType = 'UPPER' | 'LOWER' | 'FULL';
export type FatigueStatus = 'OK' | 'FATIGUE';

export interface SessionLog {
  id: string;
  dateISO: string;
  week: CycleWeek;
  sessionType: SessionType;
  fatigue: FatigueStatus;
  notes?: string;
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
