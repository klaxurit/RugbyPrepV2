import { buildWeekProgram } from '../buildWeekProgram'
import type { UserProfile } from '../../../types/training'

const BASE_PROFILE: UserProfile = {
  level: 'intermediate',
  weeklySessions: 3,
  equipment: ['barbell', 'bench', 'band', 'pullup_bar', 'dumbbell', 'box', 'ghd', 'landmine', 'tbar_row', 'med_ball'],
  injuries: [],
  rugbyPosition: 'BACK_ROW'
}

const getMainIds = (program: ReturnType<typeof buildWeekProgram>, recipeId: string) => {
  const session = program.sessions.find((item) => item.recipeId === recipeId)
  if (!session) return []
  return session.blocks
    .filter((block) =>
      block.block.intent === 'activation' ||
      block.block.intent === 'contrast' ||
      block.block.intent === 'force'
    )
    .map((block) => block.block.blockId)
}

const diffCount = (a: string[], b: string[]) => {
  const setB = new Set(b)
  return a.filter((id) => !setB.has(id)).length
}

export const cycleDiffCheck = () => {
  const w1 = buildWeekProgram(BASE_PROFILE, 'W1')
  const w2 = buildWeekProgram(BASE_PROFILE, 'W2')
  const w4 = buildWeekProgram(BASE_PROFILE, 'W4')
  const w5 = buildWeekProgram(BASE_PROFILE, 'W5')

  const upperW1 = getMainIds(w1, 'UPPER_V1')
  const upperW2 = getMainIds(w2, 'UPPER_V1')
  const lowerW1 = getMainIds(w1, 'LOWER_V1')
  const lowerW2 = getMainIds(w2, 'LOWER_V1')

  const upperW4 = getMainIds(w4, 'UPPER_V1')
  const upperW5 = getMainIds(w5, 'UPPER_V1')

  return {
    sameWithinPhase: {
      upper: diffCount(upperW1, upperW2) === 0,
      lower: diffCount(lowerW1, lowerW2) === 0
    },
    phaseShift: {
      upperChanged: diffCount(upperW4, upperW5) >= 1
    },
    details: {
      upper: { W1: upperW1, W2: upperW2, W4: upperW4, W5: upperW5 },
      lower: { W1: lowerW1, W2: lowerW2 }
    }
  }
}
