import blocksData from '../../data/blocks.v1.json';
import {
  type SessionRecipeId,
  sessionRecipesV1
} from '../../data/sessionRecipes.v1';
import type { CycleWeek, ProgramPhase, TrainingBlock, UserProfile } from '../../types/training';
import { buildSessionFromRecipe, type BuiltSession } from './buildSessionFromRecipe';
import { validateSession } from './validateSession';
import { getPhaseForWeek } from './programPhases.v1';

/**
 * Overrides phase based on seasonMode for Performance-level users:
 * - off_season  → HYPERTROPHY (H1-H4 off-season rebuild)
 * - pre_season  → FORCE (force-puissance ramp-up)
 * - in_season   → phase naturelle du cycle (aucun override)
 */
const getEffectivePhase = (
  rawPhase: ProgramPhase,
  seasonMode: UserProfile['seasonMode']
): ProgramPhase => {
  if (seasonMode === 'off_season') return 'HYPERTROPHY'
  if (seasonMode === 'pre_season') return 'FORCE'
  return rawPhase
}

const recipeIdsByPhase: Record<ProgramPhase, Record<UserProfile['weeklySessions'], SessionRecipeId[]>> = {
  FORCE: {
    2: ['UPPER_V1', 'LOWER_V1'],
    3: ['UPPER_V1', 'LOWER_V1', 'FULL_V1']
  },
  POWER: {
    2: ['UPPER_V1', 'LOWER_V1'],
    3: ['UPPER_V1', 'LOWER_V1', 'FULL_V1']
  },
  HYPERTROPHY: {
    2: ['UPPER_HYPER_V1', 'LOWER_HYPER_V1'],
    3: ['UPPER_HYPER_V1', 'LOWER_HYPER_V1', 'FULL_HYPER_V1']
  }
};

// Starter : toujours 2 sessions Full Body (la cross-session exclusion assure la variété)
const STARTER_RECIPE_IDS: SessionRecipeId[] = ['UPPER_STARTER_V1', 'LOWER_STARTER_V1'];

// Builder : Upper/Lower split avec supersets, 2 ou 3 sessions/semaine
const BUILDER_RECIPE_IDS: Record<UserProfile['weeklySessions'], SessionRecipeId[]> = {
  2: ['UPPER_BUILDER_V1', 'LOWER_BUILDER_V1'],
  3: ['UPPER_BUILDER_V1', 'LOWER_BUILDER_V1', 'FULL_BUILDER_V1']
};

// Intents dont les blocs doivent être exclus des sessions suivantes
// (évite qu'Upper, Lower et Full Body partagent les mêmes blocs de travail ou de core)
const CROSS_SESSION_EXCLUSION_INTENTS: TrainingBlock['intent'][] = [
  'hypertrophy', 'force', 'contrast', 'neural', 'core'
];

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
  const trainingLevel = profile.trainingLevel ?? 'performance';
  const rawPhase = getPhaseForWeek(week) ?? 'FORCE';
  // For performance users, season mode overrides phase selection
  const phase: ProgramPhase =
    trainingLevel === 'performance'
      ? getEffectivePhase(rawPhase, profile.seasonMode)
      : rawPhase;

  // Routing par niveau d'entraînement
  const recipeIds: SessionRecipeId[] =
    trainingLevel === 'starter'
      ? STARTER_RECIPE_IDS
      : trainingLevel === 'builder'
        ? BUILDER_RECIPE_IDS[profile.weeklySessions]
        : recipeIdsByPhase[phase][profile.weeklySessions];

  // Accumule les blockIds des blocs "de travail" déjà attribués dans la semaine
  const usedMainBlockIds = new Set<string>();
  const sessions: BuiltSession[] = [];

  for (const recipeId of recipeIds) {
    const session = buildSessionFromRecipe(
      profile,
      allBlocks,
      sessionRecipesV1[recipeId]!,
      week,
      { excludedBlockIds: new Set(usedMainBlockIds) }
    );

    // Enregistrer les blocs de travail pour les sessions suivantes
    for (const { block } of session.blocks) {
      if (CROSS_SESSION_EXCLUSION_INTENTS.includes(block.intent)) {
        usedMainBlockIds.add(block.blockId);
      }
    }

    const validation = validateSession(session);
    if (!validation.isValid) {
      warnings.push(`${recipeId}: ${validation.warnings.join(' ')}`);
    }
    sessions.push(session);
  }

  return { week, sessions, warnings };
};
