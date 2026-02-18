import { buildWeekProgram } from '../buildWeekProgram'
import type { CycleWeek, UserProfile } from '../../../types/training'

const BASE_PROFILE: UserProfile = {
  level: 'intermediate',
  weeklySessions: 3,
  equipment: ['barbell', 'bench', 'band', 'pullup_bar', 'dumbbell', 'box', 'ghd', 'landmine', 'tbar_row', 'med_ball'],
  injuries: [],
  rugbyPosition: 'BACK_ROW'
}

const toIds = (program: ReturnType<typeof buildWeekProgram>) =>
  program.sessions.map((session) => session.blocks.map((block) => block.block.blockId))

export const positionDiffCheck = (week: CycleWeek = 'W1') => {
  const frontRow = buildWeekProgram({ ...BASE_PROFILE, rugbyPosition: 'FRONT_ROW' }, week)
  const halfBacks = buildWeekProgram({ ...BASE_PROFILE, rugbyPosition: 'HALF_BACKS' }, week)
  const backThree = buildWeekProgram({ ...BASE_PROFILE, rugbyPosition: 'BACK_THREE' }, week)

  return {
    FRONT_ROW: toIds(frontRow),
    HALF_BACKS: toIds(halfBacks),
    BACK_THREE: toIds(backThree)
  }
}
