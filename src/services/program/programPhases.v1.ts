import type { CycleWeek, ProgramPhase } from '../../types/training'

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

export const getPhasePreferences = (week: CycleWeek): PhasePreferences => {
  const phase = getPhaseForWeek(week)
  if (!phase) return PHASE_PREFERENCES.FORCE
  return PHASE_PREFERENCES[phase]
}
