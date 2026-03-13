import { sessionRecipesV1 } from '../../data/sessionRecipes.v1';
import type { UserProfile } from '../../types/training';
import type { BuiltSession } from './buildSessionFromRecipe';

type FatigueLevel = 'underload' | 'optimal' | 'caution' | 'danger' | 'critical';

export interface QualityGateResult {
  events: string[];
  warnings: string[];
  invalidSessionIndexes: number[];
  requiredSlotsTotal: number;
  requiredSlotsSatisfied: number;
  degradedSessions: number;
}

const FULL_OR_COND_PREFIXES = ['FULL_', 'COND_'];
const MAJOR_FULL_INTENTS = new Set(['neural', 'force', 'contrast', 'hypertrophy']);
const UPPER_BLUEPRINT_RECIPES = new Set(['UPPER_V1', 'UPPER_HYPER_V1', 'UPPER_BUILDER_V1']);
const LOWER_BLUEPRINT_RECIPES = new Set(['LOWER_V1', 'LOWER_HYPER_V1', 'LOWER_BUILDER_V1']);

const hasMissingRequiredIntent = (session: BuiltSession): boolean =>
  session.warnings.some((warning) => warning.startsWith("Missing required intent '"));

const getMissingRequiredCount = (session: BuiltSession): number =>
  session.warnings.filter((warning) => warning.startsWith("Missing required intent '")).length;

const isFullOrConditioning = (recipeId: BuiltSession['recipeId']): boolean =>
  FULL_OR_COND_PREFIXES.some((prefix) => recipeId.startsWith(prefix));

const isRehabRecipe = (recipeId: BuiltSession['recipeId']): boolean =>
  recipeId.startsWith('REHAB_');

const hasUpperTag = (tags: string[]): boolean =>
  tags.includes('upper') || tags.includes('full');

const hasLowerTag = (tags: string[]): boolean =>
  tags.includes('lower') || tags.includes('full');

const hasPushTag = (tags: string[]): boolean =>
  tags.includes('push') || tags.includes('push_pull');

const hasPullTag = (tags: string[]): boolean =>
  tags.includes('pull') || tags.includes('push_pull');

export const evaluateQualityGates = (
  profile: UserProfile,
  sessions: BuiltSession[],
  options?: {
    fatigueLevel?: FatigueLevel;
    enforceMatchProximity?: boolean;
  }
): QualityGateResult => {
  const events: string[] = [];
  const warnings: string[] = [];
  const invalidSessionIndexes = new Set<number>();
  let requiredSlotsTotal = 0;
  let requiredSlotsSatisfied = 0;
  let degradedSessions = 0;

  sessions.forEach((session, index) => {
    const recipe = sessionRecipesV1[session.recipeId];
    const requiredSlots = recipe.sequence.filter((slot) => slot.required).length;
    const missingRequired = getMissingRequiredCount(session);
    requiredSlotsTotal += requiredSlots;
    requiredSlotsSatisfied += Math.max(0, requiredSlots - missingRequired);

    if (hasMissingRequiredIntent(session)) {
      degradedSessions += 1;
      invalidSessionIndexes.add(index);
      events.push(`quality:missing-required-slot:${session.recipeId}:${index}`);
      warnings.push(
        `${session.recipeId}: bloc requis manquant détecté, remplacement sécurité requis.`
      );
    }

    if (session.blocks.length === 0) {
      degradedSessions += 1;
      invalidSessionIndexes.add(index);
      events.push(`quality:empty-session:${session.recipeId}:${index}`);
      warnings.push(`${session.recipeId}: séance vide, remplacement sécurité requis.`);
    }

    if (
      options?.enforceMatchProximity &&
      session.identity?.matchDayOffset === 'MD-1' &&
      session.identity.sessionIntensity === 'heavy'
    ) {
      invalidSessionIndexes.add(index);
      events.push(`quality:heavy-on-md1:${session.recipeId}:${index}`);
      warnings.push(`${session.recipeId}: intensité heavy interdite en MD-1.`);
    }

    if (session.recipeId.startsWith('FULL_')) {
      const majorBlocks = session.blocks.filter((sessionBlock) =>
        MAJOR_FULL_INTENTS.has(sessionBlock.block.intent)
      );
      const hasUpperMajor = majorBlocks.some((sessionBlock) =>
        hasUpperTag(sessionBlock.block.tags)
      );
      const hasLowerMajor = majorBlocks.some((sessionBlock) =>
        hasLowerTag(sessionBlock.block.tags)
      );
      const hasUpperOnlyCarry = session.blocks.some(
        (sessionBlock) =>
          sessionBlock.block.intent === 'carry' &&
          sessionBlock.block.tags.includes('upper') &&
          !sessionBlock.block.tags.includes('lower') &&
          !sessionBlock.block.tags.includes('full')
      );

      if (!hasUpperMajor || !hasLowerMajor) {
        invalidSessionIndexes.add(index);
        events.push(`quality:full-body-imbalance:${session.recipeId}:${index}`);
        warnings.push(
          `${session.recipeId}: full body déséquilibrée (upper/lower incomplet), remplacement sécurité requis.`
        );
      }

      if (hasUpperOnlyCarry && hasUpperMajor && !hasLowerMajor) {
        invalidSessionIndexes.add(index);
        events.push(`quality:full-body-redundancy:${session.recipeId}:${index}`);
        warnings.push(
          `${session.recipeId}: redondance upper détectée (carry overhead ne remplace pas un stimulus lower).`
        );
      }
    }

    if (UPPER_BLUEPRINT_RECIPES.has(session.recipeId)) {
      const majorBlocks = session.blocks.filter((sessionBlock) =>
        MAJOR_FULL_INTENTS.has(sessionBlock.block.intent)
      );
      const hasUpperMajor = majorBlocks.some((sessionBlock) =>
        hasUpperTag(sessionBlock.block.tags)
      );
      const hasPush = majorBlocks.some((sessionBlock) =>
        hasPushTag(sessionBlock.block.tags)
      );
      const hasPull = majorBlocks.some((sessionBlock) =>
        hasPullTag(sessionBlock.block.tags)
      );

      if (!hasUpperMajor) {
        invalidSessionIndexes.add(index);
        events.push(`quality:upper-missing-major:${session.recipeId}:${index}`);
        warnings.push(
          `${session.recipeId}: blueprint upper invalide (aucun bloc majeur upper).`
        );
      }

      if (majorBlocks.length >= 2 && (!hasPush || !hasPull)) {
        invalidSessionIndexes.add(index);
        events.push(`quality:upper-push-pull-imbalance:${session.recipeId}:${index}`);
        warnings.push(
          `${session.recipeId}: blueprint upper déséquilibré (push/pull incomplet).`
        );
      }
    }

    if (LOWER_BLUEPRINT_RECIPES.has(session.recipeId)) {
      const majorBlocks = session.blocks.filter((sessionBlock) =>
        MAJOR_FULL_INTENTS.has(sessionBlock.block.intent)
      );
      const hasLowerMajor = majorBlocks.some((sessionBlock) =>
        hasLowerTag(sessionBlock.block.tags)
      );
      const hasSquat = majorBlocks.some((sessionBlock) =>
        sessionBlock.block.tags.includes('squat')
      );
      const hasHinge = majorBlocks.some((sessionBlock) =>
        sessionBlock.block.tags.includes('hinge')
      );
      const hasUnilateral = majorBlocks.some((sessionBlock) =>
        sessionBlock.block.tags.includes('unilateral')
      );
      const lowerPatternCount = [hasSquat, hasHinge, hasUnilateral].filter(Boolean).length;

      if (!hasLowerMajor) {
        invalidSessionIndexes.add(index);
        events.push(`quality:lower-missing-major:${session.recipeId}:${index}`);
        warnings.push(
          `${session.recipeId}: blueprint lower invalide (aucun bloc majeur lower).`
        );
      }

      if (majorBlocks.length >= 2 && lowerPatternCount < 2) {
        invalidSessionIndexes.add(index);
        events.push(`quality:lower-pattern-redundancy:${session.recipeId}:${index}`);
        warnings.push(
          `${session.recipeId}: blueprint lower redondant (squat/hinge/unilatéral insuffisamment variés).`
        );
      }
    }
  });

  // H10 — Minimum quality threshold: sessions with 0 main work blocks are replaced
  // Exempt: RECOVERY_MOBILITY, COND_*, REHAB_P1, SPEED_FIELD_PRE
  const MAIN_WORK_EXEMPT = new Set([
    'RECOVERY_MOBILITY_V1',
    'COND_OFF_V1',
    'COND_PRE_V1',
    'SPEED_FIELD_PRE_V1',
    'REHAB_UPPER_P1_V1',
    'REHAB_LOWER_P1_V1',
  ]);
  sessions.forEach((session, index) => {
    if (MAIN_WORK_EXEMPT.has(session.recipeId)) return;
    const hasMainWork = session.blocks.some((b) =>
      MAJOR_FULL_INTENTS.has(b.block.intent)
    );
    if (!hasMainWork && session.blocks.length > 0) {
      invalidSessionIndexes.add(index);
      events.push(`quality:no-main-work:${session.recipeId}:${index}`);
      warnings.push(
        `${session.recipeId}: aucun bloc de travail principal (force/contrast/hypertrophy/neural), remplacement sécurité.`
      );
    }
  });

  // H6 volume budget moved to buildWeekProgram (always-on, independent of qualityGatesV2)

  if ((profile.trainingLevel ?? 'starter') === 'starter' && sessions.length !== 2) {
    events.push('quality:starter-session-count-mismatch');
    warnings.push('Starter doit générer exactement 2 séances.');
  }

  if (profile.rehabInjury) {
    sessions.forEach((session, index) => {
      if (isFullOrConditioning(session.recipeId)) {
        invalidSessionIndexes.add(index);
        events.push(`quality:rehab-incompatible-recipe:${session.recipeId}:${index}`);
        warnings.push(
          `${session.recipeId}: recette non compatible rehab, remplacement sécurité requis.`
        );
      }
    });

    if (options?.fatigueLevel === 'critical' && !sessions.some((session) => isRehabRecipe(session.recipeId))) {
      events.push('quality:critical-rehab-missing');
      warnings.push('Fatigue critique + rehab: aucune séance rehab détectée.');
      if (sessions.length > 0) {
        invalidSessionIndexes.add(0);
      }
    }
  }

  return {
    events,
    warnings,
    invalidSessionIndexes: [...invalidSessionIndexes].sort((a, b) => a - b),
    requiredSlotsTotal,
    requiredSlotsSatisfied,
    degradedSessions,
  };
};
