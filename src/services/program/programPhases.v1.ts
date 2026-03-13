import type { CycleWeek, ProgramPhase, SeasonMode, TrainingLevel } from '../../types/training'

export type PhasePreferences = {
  preferTags: string[]
  avoidTags?: string[]
}

export const PHASE_PREFERENCES: Record<ProgramPhase, PhasePreferences> = {
  FORCE: {
    preferTags: ['force', 'hinge', 'squat', 'posterior_chain', 'contact', 'trunk', 'shoulder_health']
  },
  POWER: {
    preferTags: ['neural', 'contrast', 'speed', 'power', 'unilateral', 'plyo', 'med_ball', 'carry']
  },
  HYPERTROPHY: {
    preferTags: ['hypertrophy', 'push', 'pull', 'squat', 'hinge', 'unilateral', 'upper', 'lower']
  }
}

// ── DUP (Daily Undulating Periodization) — In-season model ──────────────
// KB periodization.md §2.2 + §4.2: each WEEK mixes force + power + maintenance.
// KB strength-methods.md §9.2: force max (85-90%), puissance (70-75%), endurance (60-65%).
//
// Session 0 (LOWER): Force max — heavy compound lifts, squat/hinge dominant
// Session 1 (UPPER): Power — contrast, neural, explosive, speed
// Session 2 (FULL):  Maintenance/Endurance — hypertrophy, volume, moderate load
//
// For 2 sessions/week: Force + Power only (KB §4.2: 2x/sem in-season).
// The maintenance quality is maintained through the match itself.

const DUP_SESSION_PHASES: Record<2 | 3, ProgramPhase[]> = {
  2: ['FORCE', 'POWER'],
  3: ['FORCE', 'POWER', 'HYPERTROPHY'],
}

/**
 * Returns the effective phase for a specific session position within a week.
 *
 * For in-season DUP (performance level): each session gets its own training quality.
 * For off-season / pre-season: all sessions share the same block phase.
 * For starter/builder: no DUP (consistent moderate load per KB).
 */
export const getSessionPhase = (
  sessionIndex: number,
  week: CycleWeek,
  seasonMode: SeasonMode | undefined,
  trainingLevel: TrainingLevel,
  weeklySessions: 2 | 3
): ProgramPhase => {
  const effectiveSeasonMode = seasonMode ?? 'in_season'

  // DUP only applies to performance-level athletes during in-season
  // KB periodization.md §2.2: DUP supérieur pour intermédiaires+ en compétition
  if (trainingLevel === 'performance' && effectiveSeasonMode === 'in_season') {
    const dupPhases = DUP_SESSION_PHASES[weeklySessions]
    return dupPhases[sessionIndex] ?? dupPhases[dupPhases.length - 1]!
  }

  // Off-season / pre-season: block periodization (all sessions same phase)
  const weekPhase = getPhaseForWeek(week)
  return weekPhase ?? 'FORCE'
}

export const getPhaseForWeek = (week: CycleWeek): ProgramPhase | null => {
  if (week === 'DELOAD') return null
  if (week === 'H1' || week === 'H2' || week === 'H3' || week === 'H4') return 'HYPERTROPHY'
  if (week === 'W1' || week === 'W2' || week === 'W3' || week === 'W4') return 'FORCE'
  return 'POWER'
}

export const getPhaseWeekIndex = (week: CycleWeek): number => {
  if (week === 'W1' || week === 'W5' || week === 'H1') return 0
  if (week === 'W2' || week === 'W6' || week === 'H2') return 1
  if (week === 'W3' || week === 'W7' || week === 'H3') return 2
  if (week === 'W4' || week === 'W8' || week === 'H4') return 3
  return 0
}

export const getBaseWeekVersion = (week: CycleWeek): 'W1' | 'W2' | 'W3' | 'W4' => {
  if (week === 'W1' || week === 'W5' || week === 'H1') return 'W1'
  if (week === 'W2' || week === 'W6' || week === 'H2') return 'W2'
  if (week === 'W3' || week === 'W7' || week === 'H3') return 'W3'
  return 'W4'
}

export const getCycleWeekNumber = (week: CycleWeek): number | null => {
  if (week === 'DELOAD') return null
  if (week === 'W1' || week === 'H1') return 1
  if (week === 'W2' || week === 'H2') return 2
  if (week === 'W3' || week === 'H3') return 3
  if (week === 'W4' || week === 'H4') return 4
  if (week === 'W5') return 5
  if (week === 'W6') return 6
  if (week === 'W7') return 7
  return 8
}

export const getNextWeek = (week: CycleWeek): CycleWeek => {
  if (week === 'H1') return 'H2'
  if (week === 'H2') return 'H3'
  if (week === 'H3') return 'H4'
  if (week === 'H4') return 'DELOAD'
  if (week === 'W1') return 'W2'
  if (week === 'W2') return 'W3'
  if (week === 'W3') return 'W4'
  if (week === 'W4') return 'DELOAD'
  if (week === 'W5') return 'W6'
  if (week === 'W6') return 'W7'
  if (week === 'W7') return 'W8'
  if (week === 'W8') return 'DELOAD'
  return 'W1'
}

// H9 (F-B02/F-B10 fix): In-season 3:1 cycle skips W4/W8/H4 (auto-deload at W3/W7/H3 replaces them).
// Off-season / pre-season / starter / builder use the standard 4:1 progression.
const IN_SEASON_3_1_SKIP: Partial<Record<CycleWeek, CycleWeek>> = {
  W3: 'W5',   // W3 is deload → skip W4, jump to next block
  W7: 'W1',   // W7 is deload → skip W8, start new cycle
  H3: 'W1',   // H3 is deload → skip H4, move to force block
}

export const getNextWeekForProfile = (
  week: CycleWeek,
  seasonMode: SeasonMode | undefined,
  trainingLevel: TrainingLevel
): CycleWeek => {
  const isInSeason3_1 =
    trainingLevel === 'performance' &&
    (seasonMode ?? 'in_season') === 'in_season'

  if (isInSeason3_1) {
    const skip = IN_SEASON_3_1_SKIP[week]
    if (skip) return skip
  }

  return getNextWeek(week)
}

export const getPhasePreferences = (week: CycleWeek): PhasePreferences => {
  const phase = getPhaseForWeek(week)
  if (!phase) return PHASE_PREFERENCES.FORCE
  return PHASE_PREFERENCES[phase]
}
