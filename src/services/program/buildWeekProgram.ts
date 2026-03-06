import blocksData from '../../data/blocks.v1.json';
import {
  type SessionRecipeId,
  sessionRecipesV1
} from '../../data/sessionRecipes.v1';
import type { CycleWeek, ProgramPhase, TrainingBlock, UserProfile, RehabZone } from '../../types/training';
import { buildSessionFromRecipe, type BuiltSession } from './buildSessionFromRecipe';
import { validateSession } from './validateSession';
import { getPhaseForWeek } from './programPhases.v1';

/**
 * Pour les utilisateurs Performance : le seasonMode n'override plus la phase du cycle.
 * La phase suit toujours le cycle H1-H4 (hypertrophie) → W1-W4 (force) → W5-W8 (puissance).
 * Le seasonMode reste informatif (bannières, volume) mais ne force plus la même phase sur toutes les semaines.
 */

// Ordre 2 sessions : LOWER en premier (souvent mardi) puis UPPER (jeudi) — jambes loin du match, upper plus proche
const recipeIdsByPhase: Record<ProgramPhase, Record<UserProfile['weeklySessions'], SessionRecipeId[]>> = {
  FORCE: {
    2: ['LOWER_V1', 'UPPER_V1'],
    3: ['UPPER_V1', 'LOWER_V1', 'FULL_V1']
  },
  POWER: {
    2: ['LOWER_V1', 'UPPER_V1'],
    3: ['UPPER_V1', 'LOWER_V1', 'FULL_V1']
  },
  HYPERTROPHY: {
    2: ['LOWER_HYPER_V1', 'UPPER_HYPER_V1'],
    3: ['UPPER_HYPER_V1', 'LOWER_HYPER_V1', 'FULL_HYPER_V1']
  }
};

// Starter : toujours 2 sessions Full Body (la cross-session exclusion assure la variété)
const STARTER_RECIPE_IDS: SessionRecipeId[] = ['UPPER_STARTER_V1', 'LOWER_STARTER_V1'];

// Builder : LOWER avant UPPER pour 2 sessions (jambes mardi, upper jeudi)
const BUILDER_RECIPE_IDS: Record<UserProfile['weeklySessions'], SessionRecipeId[]> = {
  2: ['LOWER_BUILDER_V1', 'UPPER_BUILDER_V1'],
  3: ['UPPER_BUILDER_V1', 'LOWER_BUILDER_V1', 'FULL_BUILDER_V1']
};

// Recettes identifiées comme "upper" ou "lower" pour le routing rehab
const UPPER_RECIPE_IDS: SessionRecipeId[] = [
  'UPPER_V1', 'UPPER_HYPER_V1', 'UPPER_BUILDER_V1', 'UPPER_STARTER_V1'
]
const LOWER_RECIPE_IDS: SessionRecipeId[] = [
  'LOWER_V1', 'LOWER_HYPER_V1', 'LOWER_BUILDER_V1', 'LOWER_STARTER_V1'
]

const applyRehabRouting = (ids: SessionRecipeId[], zone: RehabZone, phase: 1 | 2 | 3): SessionRecipeId[] => {
  const rehabId = `REHAB_${zone.toUpperCase()}_P${phase}_V1` as SessionRecipeId
  const targetIds = zone === 'upper' ? UPPER_RECIPE_IDS : LOWER_RECIPE_IDS
  return ids.map((id) => targetIds.includes(id) ? rehabId : id)
}

// Intents dont les blocs doivent être exclus des sessions suivantes
// (évite qu'Upper, Lower et Full Body partagent les mêmes blocs de travail ou de core)
const CROSS_SESSION_EXCLUSION_INTENTS: TrainingBlock['intent'][] = [
  'hypertrophy', 'force', 'contrast', 'neural', 'core'
];

export type FatigueLevel = 'underload' | 'optimal' | 'caution' | 'danger' | 'critical'

export interface WeekProgramResult {
  week: CycleWeek;
  sessions: BuiltSession[];
  warnings: string[];
}

const allBlocks = blocksData as TrainingBlock[];

export const buildWeekProgram = (
  profile: UserProfile,
  week: CycleWeek,
  options?: { fatigueLevel?: FatigueLevel; hasSufficientACWRData?: boolean; ignoreAcwrOverload?: boolean }
): WeekProgramResult => {
  const warnings: string[] = [];
  const trainingLevel = profile.trainingLevel ?? 'starter';
  const rawPhase = getPhaseForWeek(week) ?? 'FORCE';
  const phase: ProgramPhase = rawPhase;

  // Routing par niveau d'entraînement
  const getPerformanceRecipeIds = (): SessionRecipeId[] => {
    const n = profile.weeklySessions
    if (n === 3) {
      if (profile.seasonMode === 'off_season') return ['UPPER_HYPER_V1', 'LOWER_HYPER_V1', 'COND_OFF_V1']
      if (profile.seasonMode === 'pre_season') return ['UPPER_V1', 'LOWER_V1', 'COND_PRE_V1']
    }
    return recipeIdsByPhase[phase][n]
  }

  const baseRecipeIds: SessionRecipeId[] =
    trainingLevel === 'starter'
      ? STARTER_RECIPE_IDS
      : trainingLevel === 'builder'
        ? BUILDER_RECIPE_IDS[profile.weeklySessions]
        : getPerformanceRecipeIds();

  const rehabRecipeIds: SessionRecipeId[] = profile.rehabInjury
    ? applyRehabRouting(baseRecipeIds, profile.rehabInjury.zone, profile.rehabInjury.phase)
    : baseRecipeIds;

  // ENH-1 — ACWR fatigue budget: adjust session count based on workload zone
  // Ne s'applique que si on a assez de données ACWR (2+ semaines)
  // ignoreAcwrOverload : le joueur choisit de garder le programme complet malgré la surcharge détectée
  const fatigueLevel = options?.fatigueLevel;
  const hasSufficientACWRData = options?.hasSufficientACWRData ?? false;
  const ignoreAcwrOverload = options?.ignoreAcwrOverload ?? false;
  let recipeIds: SessionRecipeId[];
  if (!ignoreAcwrOverload && hasSufficientACWRData && fatigueLevel === 'critical' && rehabRecipeIds.length > 1) {
    // Critical zone (ACWR > 2.0): keep only first session
    recipeIds = rehabRecipeIds.slice(0, 1);
    warnings.push('ACWR critique : programme réduit à 1 séance. Récupération prioritaire.');
  } else if (!ignoreAcwrOverload && hasSufficientACWRData && fatigueLevel === 'danger' && rehabRecipeIds.length > 1) {
    // Danger zone (ACWR 1.3–1.5): replace last session with mobility
    recipeIds = [...rehabRecipeIds.slice(0, rehabRecipeIds.length - 1), 'RECOVERY_MOBILITY_V1' as SessionRecipeId];
    warnings.push('ACWR surcharge : dernière séance remplacée par mobilité.');
  } else {
    recipeIds = rehabRecipeIds;
  }

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

    // Enregistrer les blocs de travail pour les sessions suivantes.
    // Pour Starter : la variété vient de l'inversion des slots (A: upper→lower, B: lower→upper),
    // pas de blocs différents. Avec 1 seul bloc BW par catégorie, l'exclusion viderait la session B.
    if (trainingLevel !== 'starter') {
      for (const { block } of session.blocks) {
        if (CROSS_SESSION_EXCLUSION_INTENTS.includes(block.intent)) {
          usedMainBlockIds.add(block.blockId);
        }
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
