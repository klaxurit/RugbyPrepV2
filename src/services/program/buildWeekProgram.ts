import blocksData from '../../data/blocks.v1.json';
import {
  type SessionRecipeId,
  sessionRecipesV1
} from '../../data/sessionRecipes.v1';
import type { CycleWeek, TrainingBlock, UserProfile } from '../../types/training';
import { buildSessionFromRecipe, type BuiltSession } from './buildSessionFromRecipe';
import { validateSession } from './validateSession';

const recipeIdsByWeeklySessions: Record<UserProfile['weeklySessions'], SessionRecipeId[]> = {
  // Fixed ordering keeps week output deterministic.
  2: ['UPPER_V1', 'LOWER_V1'],
  3: ['UPPER_V1', 'LOWER_V1', 'FULL_V1']
};

export interface WeekProgramResult {
  week: CycleWeek;
  sessions: BuiltSession[];
  warnings: string[];
}

const allBlocks = blocksData as TrainingBlock[];

export const buildWeekProgram = (
  profile: UserProfile,
  week: CycleWeek
): WeekProgramResult => {
  const warnings: string[] = [];
  const sessions = recipeIdsByWeeklySessions[profile.weeklySessions].map((recipeId) => {
    const session = buildSessionFromRecipe(profile, allBlocks, sessionRecipesV1[recipeId], week);
    const validation = validateSession(session);
    if (!validation.isValid) {
      warnings.push(`${recipeId}: ${validation.warnings.join(' ')}`);
    }
    return session;
  });

  return { week, sessions, warnings };
};
