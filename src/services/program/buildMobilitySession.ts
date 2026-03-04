// src/services/program/buildMobilitySession.ts
import blocksData from '../../data/blocks.v1.json';
import { sessionRecipesV1 } from '../../data/sessionRecipes.v1';
import type { TrainingBlock, UserProfile } from '../../types/training';
import { buildSessionFromRecipe, type BuiltSession } from './buildSessionFromRecipe';

const allBlocks = blocksData as TrainingBlock[];

export function buildMobilitySession(profile: UserProfile): BuiltSession {
  return buildSessionFromRecipe(
    profile,
    allBlocks,
    sessionRecipesV1['RECOVERY_MOBILITY_V1'],
    'W1',
    {} // pas d'exclusion cross-session
  );
}
