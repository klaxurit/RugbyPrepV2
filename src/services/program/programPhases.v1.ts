import type { CycleWeek, ProgramPhase } from '../../types/training'

export const getPhaseForWeek = (week: CycleWeek): ProgramPhase | null => {
  if (week === 'DELOAD') return null
  if (week === 'H1' || week === 'H2' || week === 'H3' || week === 'H4') return 'HYPERTROPHY'
  if (week === 'W1' || week === 'W2' || week === 'W3' || week === 'W4') return 'FORCE'
  return 'POWER'
}
