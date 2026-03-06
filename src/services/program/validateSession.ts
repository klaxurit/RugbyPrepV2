import type { BuiltSession } from './buildSessionFromRecipe';

export interface SessionValidationResult {
  isValid: boolean;
  warnings: string[];
}

const MAX_BLOCKS = 5;
const MAX_FINISHERS = 1;
const MAX_FINISHERS_FULL = 2;

const EXEMPT_FROM_ACTIVATION = new Set([
  'RECOVERY_MOBILITY_V1',
]);

// Recettes qui n'ont pas de bloc principal (contrast/force/hypertrophy) par conception.
// Les valider avec les critères standard génère des faux positifs.
const EXEMPT_FROM_MAIN_BLOCK = new Set([
  'COND_OFF_V1',
  'COND_PRE_V1',
  'REHAB_UPPER_P1_V1',
  'REHAB_LOWER_P1_V1',
  'RECOVERY_MOBILITY_V1',
]);

export const validateSession = (session: BuiltSession): SessionValidationResult => {
  const warnings: string[] = [];
  const blockIds = session.blocks.map((sessionBlock) => sessionBlock.block.blockId);
  const intents = session.blocks.map((sessionBlock) => sessionBlock.block.intent);
  const isSafetyAdapted = session.isSafetyAdapted === true;

  const activationCount = intents.filter((intent) => intent === 'activation').length;
  const prehabCount = intents.filter((intent) => intent === 'prehab').length;
  const coreCount = intents.filter((intent) => intent === 'core').length;

  if (!isSafetyAdapted && activationCount !== 1 && !EXEMPT_FROM_ACTIVATION.has(session.recipeId)) {
    warnings.push(`Session must include exactly 1 activation block (found ${activationCount}).`);
  }
  if (isSafetyAdapted && activationCount + prehabCount + coreCount === 0) {
    warnings.push('Safety-adapted session must include at least one prep block (activation/prehab/core).');
  }

  const hasMainBlock = intents.some(
    (intent) => intent === 'contrast' || intent === 'force' || intent === 'hypertrophy'
  );
  if (!isSafetyAdapted && !hasMainBlock && !EXEMPT_FROM_MAIN_BLOCK.has(session.recipeId)) {
    warnings.push('Session must include at least 1 main block (contrast, force or hypertrophy).');
  }
  if (isSafetyAdapted && session.blocks.length === 0) {
    warnings.push('Safety-adapted session must include at least one block.');
  }

  const duplicateCount = blockIds.length - new Set(blockIds).size;
  if (duplicateCount > 0) {
    warnings.push(`Session has duplicate blockId entries (${duplicateCount} duplicate(s)).`);
  }

  for (const sessionBlock of session.blocks) {
    const scheme = sessionBlock.version.scheme;
    if (scheme.kind === 'emom' && !scheme.work) {
      warnings.push(`EMOM incomplet : ajoute reps ou temps (${sessionBlock.block.blockId}).`);
    }
    if (
      scheme.kind === 'emom' &&
      sessionBlock.block.exercises.length > 1 &&
      scheme.minutes < sessionBlock.block.exercises.length
    ) {
      warnings.push(
        `EMOM trop court pour alterner tous les exos (${sessionBlock.block.blockId}).`
      );
    }
  }

  if (session.blocks.length > MAX_BLOCKS) {
    warnings.push(`Session exceeds max blocks (${session.blocks.length}/${MAX_BLOCKS}).`);
  }

  const finisherCount = intents.filter(
    (intent) => intent === 'neck' || intent === 'core' || intent === 'carry'
  ).length;
  const fullRecipes = ['FULL_V1', 'FULL_HYPER_V1'];
  const maxFinishers = fullRecipes.includes(session.recipeId) ? MAX_FINISHERS_FULL : MAX_FINISHERS;
  if (finisherCount > maxFinishers) {
    warnings.push(
      `Session exceeds max finishers (${finisherCount}/${maxFinishers}) in neck/core/carry.`
    );
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
};
