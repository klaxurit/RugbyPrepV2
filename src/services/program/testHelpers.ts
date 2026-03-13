import type { CycleWeek, Equipment, UserProfile } from '../../types/training'

// ── Equipment presets ──────────────────────────────────────────

export const FULL_GYM: Equipment[] = [
  'barbell',
  'dumbbell',
  'bench',
  'band',
  'landmine',
  'tbar_row',
  'ghd',
  'med_ball',
  'box',
  'pullup_bar',
  'machine',
  'sprint_track',
  'ab_wheel',
]

export const LIMITED_GYM: Equipment[] = ['dumbbell', 'band', 'bench', 'pullup_bar']

export const BW_ONLY: Equipment[] = []

// ── Factory ────────────────────────────────────────────────────

const DEFAULTS: UserProfile = {
  level: 'intermediate',
  trainingLevel: 'performance',
  weeklySessions: 3,
  equipment: FULL_GYM,
  injuries: [],
  rugbyPosition: 'BACK_ROW',
  seasonMode: 'in_season',
  performanceFocus: 'balanced',
}

export function createProfile(overrides?: Partial<UserProfile>): UserProfile {
  return { ...DEFAULTS, ...overrides }
}

// ── 17 Simulation profiles ─────────────────────────────────────
// Matrix: trainingLevel × equipment × injuries × weeklySessions
// Naming: S = starter, B = builder, P = performance

export const SIMULATION_PROFILES: Record<string, UserProfile> = {
  // ── Starter (always 2 sessions) ──
  S1: createProfile({ trainingLevel: 'starter', weeklySessions: 2, equipment: BW_ONLY }),
  S2: createProfile({ trainingLevel: 'starter', weeklySessions: 2, equipment: LIMITED_GYM }),
  S3: createProfile({ trainingLevel: 'starter', weeklySessions: 2, equipment: BW_ONLY, injuries: ['knee_pain'] }),
  S4: createProfile({ trainingLevel: 'starter', weeklySessions: 2, equipment: LIMITED_GYM, injuries: ['low_back_pain'] }),
  S5: createProfile({ trainingLevel: 'starter', weeklySessions: 2, equipment: BW_ONLY, injuries: ['shoulder_pain'] }),

  // ── U18 (RG-03 : vérification VC-01 et cap version) ──
  U18_FILLE: createProfile({
    trainingLevel: 'starter',
    weeklySessions: 2,
    equipment: ['band'],
    populationSegment: 'u18_female',
    ageBand: 'u18',
  }),
  U18_GARCON: createProfile({
    trainingLevel: 'starter',
    weeklySessions: 2,
    equipment: ['band'],
    populationSegment: 'u18_male',
    ageBand: 'u18',
  }),

  // ── Builder ──
  B1: createProfile({ trainingLevel: 'builder', weeklySessions: 2, equipment: LIMITED_GYM }),
  B2: createProfile({ trainingLevel: 'builder', weeklySessions: 3, equipment: FULL_GYM }),
  B3: createProfile({ trainingLevel: 'builder', weeklySessions: 3, equipment: FULL_GYM, injuries: ['shoulder_pain'] }),
  B4: createProfile({ trainingLevel: 'builder', weeklySessions: 2, equipment: LIMITED_GYM, injuries: ['knee_pain'] }),
  B5: createProfile({ trainingLevel: 'builder', weeklySessions: 3, equipment: LIMITED_GYM }),

  // ── Female senior (F-FINAL-H02: ACL prehab + volume cap regression guard) ──
  F_SENIOR: createProfile({ weeklySessions: 3, equipment: FULL_GYM, populationSegment: 'female_senior' }),

  // ── Performance ──
  P1: createProfile({ weeklySessions: 3, equipment: FULL_GYM }),
  P2: createProfile({ weeklySessions: 2, equipment: FULL_GYM }),
  P3: createProfile({ weeklySessions: 3, equipment: FULL_GYM, injuries: ['shoulder_pain'] }),
  P4: createProfile({ weeklySessions: 3, equipment: FULL_GYM, injuries: ['knee_pain'] }),
  P5: createProfile({ weeklySessions: 2, equipment: LIMITED_GYM }),
  P6: createProfile({ weeklySessions: 3, equipment: LIMITED_GYM, injuries: ['low_back_pain'] }),
  P7: createProfile({ weeklySessions: 3, equipment: BW_ONLY }),
}

// ── Critical weeks (phase transitions + deload boundaries) ────

export const CRITICAL_WEEKS: CycleWeek[] = ['H1', 'H4', 'W1', 'W4', 'W5', 'W8']
