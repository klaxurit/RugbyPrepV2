import { buildSessionFromRecipe } from '../buildSessionFromRecipe'
import blocksData from '../../../data/blocks.v1.json'
import { sessionRecipesV1 } from '../../../data/sessionRecipes.v1'
import type { TrainingBlock, UserProfile } from '../../../types/training'

const BASE_PROFILE: UserProfile = {
  level: 'intermediate',
  weeklySessions: 3,
  equipment: ['barbell', 'bench', 'band', 'pullup_bar', 'dumbbell', 'box', 'ghd', 'landmine', 'tbar_row', 'med_ball'],
  injuries: [],
  rugbyPosition: 'BACK_ROW'
}

const allBlocks = blocksData as TrainingBlock[]

const mainBlockIds = (session: ReturnType<typeof buildSessionFromRecipe>) =>
  session.blocks
    .filter((block) => block.block.intent === 'activation' || block.block.intent === 'contrast' || block.block.intent === 'force')
    .map((block) => block.block.blockId)

export const rotationStabilityCheck = () => {
  const upperW1 = buildSessionFromRecipe(BASE_PROFILE, allBlocks, sessionRecipesV1.UPPER_V1, 'W1')
  const upperW2 = buildSessionFromRecipe(BASE_PROFILE, allBlocks, sessionRecipesV1.UPPER_V1, 'W2')
  const lowerW1 = buildSessionFromRecipe(BASE_PROFILE, allBlocks, sessionRecipesV1.LOWER_V1, 'W1')
  const lowerW2 = buildSessionFromRecipe(BASE_PROFILE, allBlocks, sessionRecipesV1.LOWER_V1, 'W2')

  const upperMainSame =
    JSON.stringify(mainBlockIds(upperW1)) === JSON.stringify(mainBlockIds(upperW2))
  const lowerMainSame =
    JSON.stringify(mainBlockIds(lowerW1)) === JSON.stringify(mainBlockIds(lowerW2))

  return {
    upperMainSame,
    lowerMainSame,
    upperMain: {
      W1: mainBlockIds(upperW1),
      W2: mainBlockIds(upperW2)
    },
    lowerMain: {
      W1: mainBlockIds(lowerW1),
      W2: mainBlockIds(lowerW2)
    }
  }
}
