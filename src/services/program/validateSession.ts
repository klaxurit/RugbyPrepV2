import type { BuiltSession } from './buildSessionFromRecipe';

export interface SessionValidationResult {
  isValid: boolean;
  warnings: string[];
}

const MAX_BLOCKS = 5;
const MAX_FINISHERS = 1;
const MAX_FINISHERS_FULL = 2;

export const validateSession = (session: BuiltSession): SessionValidationResult => {
  const warnings: string[] = [];
  const blockIds = session.blocks.map((sessionBlock) => sessionBlock.block.blockId);
  const intents = session.blocks.map((sessionBlock) => sessionBlock.block.intent);

  const activationCount = intents.filter((intent) => intent === 'activation').length;
  if (activationCount !== 1) {
    warnings.push(`Session must include exactly 1 activation block (found ${activationCount}).`);
  }

  const hasMainBlock = intents.some((intent) => intent === 'contrast' || intent === 'force');
  if (!hasMainBlock) {
    warnings.push('Session must include at least 1 main block (contrast or force).');
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
  const maxFinishers =
    session.recipeId === 'FULL_V1' ? MAX_FINISHERS_FULL : MAX_FINISHERS;
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
