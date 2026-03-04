import type { SessionRecipe } from '../../data/sessionRecipes.v1';
import type { CycleWeek, TrainingBlock, UserProfile, WeekVersion } from '../../types/training';
import { getPositionPreferences } from './positionPreferences.v1';
import { getBaseWeekVersion, getPhaseForWeek, getPhasePreferences, getPhaseWeekIndex } from './programPhases.v1';
import { selectEligibleBlocks } from './selectEligibleBlocks';

export interface BuiltSessionBlock {
  block: TrainingBlock;
  version: TrainingBlock['versions'][number];
}

export interface BuiltSession {
  recipeId: SessionRecipe['id'];
  title: string;
  week: CycleWeek;
  blocks: BuiltSessionBlock[];
  warnings: string[];
  isSafetyAdapted?: boolean;
  safetyAdjustments?: string[];
}

interface BuildSessionOptions {
  priorityIntents?: TrainingBlock['intent'][];
  /** Blocs déjà utilisés dans d'autres sessions de la semaine (exclusion cross-session) */
  excludedBlockIds?: Set<string>;
}

const FALLBACK_INTENTS: Record<
  SessionRecipe['sequence'][number]['intent'],
  SessionRecipe['sequence'][number]['intent'][]
> = {
  activation: [],
  prehab: ['core'],
  neural: [],
  force: ['contrast'],
  contrast: ['force'],
  hypertrophy: [],
  core: [],
  neck: ['core'],
  carry: [],
  conditioning: [],
  mobility: []
};

// Fallbacks "sécurité" : utilisés uniquement quand un intent requis est introuvable.
// On privilégie d'abord les intents principaux, puis des options stables (prehab/core).
const SAFETY_FALLBACK_INTENTS: Record<
  SessionRecipe['sequence'][number]['intent'],
  SessionRecipe['sequence'][number]['intent'][]
> = {
  activation: ['core', 'prehab'],
  prehab: ['core'],
  neural: ['core', 'prehab', 'activation', 'contrast', 'force', 'hypertrophy'],
  force: ['core', 'prehab', 'activation', 'contrast', 'hypertrophy', 'neural'],
  contrast: ['core', 'prehab', 'activation', 'force', 'hypertrophy', 'neural'],
  hypertrophy: ['core', 'prehab', 'activation', 'neural', 'force', 'contrast'],
  core: [],
  neck: ['core'],
  carry: ['core'],
  conditioning: [],
  mobility: []
};

const FINISHER_INTENTS: TrainingBlock['intent'][] = ['neck', 'core', 'carry'];
const FOCUS_FILTERED_INTENTS: TrainingBlock['intent'][] = [
  'activation',
  'prehab',
  'neural',
  'contrast',
  'force',
  'hypertrophy',
  'conditioning'
];

const isFinisherIntent = (intent: TrainingBlock['intent']) =>
  FINISHER_INTENTS.includes(intent);

const isFocusFilteredIntent = (intent: TrainingBlock['intent']) =>
  FOCUS_FILTERED_INTENTS.includes(intent);

const pickVersion = (block: TrainingBlock, week: WeekVersion) =>
  block.versions.find((version) => version.versionId === week) ?? null;

const scoreBlock = (
  block: TrainingBlock,
  preferredTags: SessionRecipe['preferredTags'],
  preferTags: string[],
  avoidTags: string[]
) => {
  const preferredScore = preferredTags.reduce(
    (score, preferredTag) => score + (block.tags.includes(preferredTag) ? 1 : 0),
    0
  );
  const preferScore = preferTags.reduce(
    (score, tag) => score + (block.tags.includes(tag) ? 3 : 0),
    0
  );
  const avoidScore = avoidTags.reduce(
    (score, tag) => score + (block.tags.includes(tag) ? -2 : 0),
    0
  );
  return preferredScore + preferScore + avoidScore;
};

const getExerciseIds = (block: TrainingBlock): string[] =>
  block.exercises.map((exercise) => exercise.exerciseId);

const hasExerciseOverlap = (block: TrainingBlock, usedExerciseIds: Set<string>) =>
  getExerciseIds(block).some((exerciseId) => usedExerciseIds.has(exerciseId));

const canUseBlock = (
  block: TrainingBlock,
  usedExerciseIds: Set<string>
): boolean => {
  // Activation est toujours accepté (échauffement, overlap volontaire parfois)
  // Prehab EST vérifié : on ne veut pas répéter un exercice déjà fait en activation
  if (block.intent === 'activation') {
    return true;
  }
  return !hasExerciseOverlap(block, usedExerciseIds);
};

const collectUpperNeuralContextExerciseIds = (builtBlocks: BuiltSessionBlock[]) => {
  const ids = new Set<string>();
  for (const builtBlock of builtBlocks) {
    if (builtBlock.block.intent !== 'activation' && builtBlock.block.intent !== 'contrast') {
      continue;
    }
    for (const exercise of builtBlock.block.exercises) {
      ids.add(exercise.exerciseId);
    }
  }
  return ids;
};

const getWeekRotationIndex = (week: CycleWeek): number => getPhaseWeekIndex(week);

const selectCandidateWithRotation = <T>(
  candidates: T[],
  week: CycleWeek,
  topN = 3
): T | null => {
  if (candidates.length === 0) return null;
  const capped = candidates.slice(0, Math.min(topN, candidates.length));
  const index = getWeekRotationIndex(week) % capped.length;
  return capped[index] ?? capped[0] ?? null;
};

const shouldRotateIntent = (
  intent: TrainingBlock['intent'],
  required: boolean
): boolean => {
  void required;
  if (intent === 'neural') return true;
  if (intent === 'neck' || intent === 'core' || intent === 'carry') return true;
  return false;
};

const chooseBlockByIntent = (
  blocks: TrainingBlock[],
  intent: TrainingBlock['intent'],
  required: boolean,
  focusTagsAny: SessionRecipe['focusTagsAny'],
  preferredTags: SessionRecipe['preferredTags'],
  preferTags: string[],
  avoidTags: string[],
  usedBlockIds: Set<string>,
  usedExerciseIds: Set<string>,
  recipeId: SessionRecipe['id'],
  builtBlocks: BuiltSessionBlock[],
  week: CycleWeek,
  anchorBlockId?: string,
  excludedBlockIds?: Set<string>,
  focusMode: 'auto' | 'force' | 'off' = 'auto'
): TrainingBlock | null => {
  const normalizedFocusTags = focusTagsAny ?? [];
  const hasFocusTags = normalizedFocusTags.length > 0;
  const shouldApplyFocusFilter =
    focusMode === 'force'
      ? hasFocusTags
      : focusMode === 'off'
        ? false
        : isFocusFilteredIntent(intent) && hasFocusTags;

  const scoredCandidates = blocks
    .filter(
      (block) =>
        block.intent === intent &&
        !usedBlockIds.has(block.blockId) &&
        !(excludedBlockIds?.has(block.blockId)) &&
        (!shouldApplyFocusFilter ||
          block.tags.some((tag) => normalizedFocusTags.includes(tag)))
    )
    .sort(
      (a, b) =>
        scoreBlock(b, preferredTags, preferTags, avoidTags) -
          scoreBlock(a, preferredTags, preferTags, avoidTags) ||
        a.blockId.localeCompare(b.blockId)
    );

  const candidates =
    recipeId === 'UPPER_V1' && intent === 'neural'
      ? (() => {
          const contextExerciseIds = collectUpperNeuralContextExerciseIds(builtBlocks);
          const nonOverlapping = scoredCandidates.filter(
            (candidate) => !hasExerciseOverlap(candidate, contextExerciseIds)
          );
          const overlapping = scoredCandidates.filter((candidate) =>
            hasExerciseOverlap(candidate, contextExerciseIds)
          );
          return [...nonOverlapping, ...overlapping];
        })()
      : scoredCandidates;

  const usableCandidates = candidates.filter((candidate) =>
    canUseBlock(candidate, usedExerciseIds)
  );

  if (anchorBlockId) {
    const anchorMatch = usableCandidates.find(
      (candidate) => candidate.blockId === anchorBlockId
    );
    if (anchorMatch) return anchorMatch;
  }

  if (shouldRotateIntent(intent, required)) {
    return selectCandidateWithRotation(usableCandidates, week, 3);
  }

  return usableCandidates[0] ?? null;
};

export const buildSessionFromRecipe = (
  profile: UserProfile,
  blocks: TrainingBlock[],
  recipe: SessionRecipe,
  week: CycleWeek,
  options: BuildSessionOptions = {}
): BuiltSession => {
  const eligibleBlocks = selectEligibleBlocks(profile, blocks);
  const positionPreferences = getPositionPreferences(profile);
  const phasePreferences = getPhasePreferences(week);
  const phase = getPhaseForWeek(week);
  const baseWeek = getBaseWeekVersion(week);
  const priorityIntents = options.priorityIntents ?? [];
  const excludedBlockIds = options.excludedBlockIds;
  const usedBlockIds = new Set<string>();
  const usedExerciseIds = new Set<string>();
  const builtBlocks: BuiltSessionBlock[] = [];
  const warnings: string[] = [];
  const safetyAdjustments: string[] = [];
  let isSafetyAdapted = false;

  const anchorKeyBase = (() => {
    if (typeof window === 'undefined') return null;
    const equipment = [...profile.equipment].sort().join(',');
    const injuries = [...profile.injuries].sort().join(',');
    const position = profile.rugbyPosition ?? profile.position ?? 'BACK_ROW';
    const level = profile.level;
    const goal = profile.goal ?? 'none';
    const phaseKey = phase ?? 'DELOAD';
    // Hash sensitive data (injuries, equipment, goal) to avoid exposing them in DevTools
    const sensitive = `${goal}:${equipment}:${injuries}`;
    let h = 5381;
    for (let i = 0; i < sensitive.length; i++) {
      h = ((h << 5) + h) ^ sensitive.charCodeAt(i);
    }
    const hash = (h >>> 0).toString(36);
    return `rugbyprep.anchor.v2:${position}:${level}:${hash}:${phaseKey}:${recipe.id}`;
  })();

  const getAnchor = (intent: TrainingBlock['intent']): string | undefined => {
    if (!anchorKeyBase) return undefined;
    try {
      const raw = window.localStorage.getItem(`${anchorKeyBase}:${intent}`);
      return raw || undefined;
    } catch {
      return undefined;
    }
  };

  const setAnchor = (intent: TrainingBlock['intent'], blockId: string) => {
    if (!anchorKeyBase) return;
    try {
      window.localStorage.setItem(`${anchorKeyBase}:${intent}`, blockId);
    } catch {
      // ignore
    }
  };

  for (let slotIndex = 0; slotIndex < recipe.sequence.length; slotIndex++) {
    const step = recipe.sequence[slotIndex];

    // Per-slot focus tags override recipe-level focusTagsAny (null = no filter for this slot)
    const effectiveFocusTags: string[] | undefined =
      recipe.slotFocusTags != null
        ? (recipe.slotFocusTags[slotIndex] ?? undefined)
        : recipe.focusTagsAny;

    const isUpperRecipe = recipe.id === 'UPPER_V1' || recipe.id === 'UPPER_HYPER_V1';
    if (
      isUpperRecipe &&
      isFinisherIntent(step.intent) &&
      builtBlocks.some((builtBlock) => isFinisherIntent(builtBlock.block.intent))
    ) {
      continue;
    }
    const isLowerRecipe = recipe.id === 'LOWER_V1' || recipe.id === 'LOWER_HYPER_V1';
    if (
      isLowerRecipe &&
      step.intent === 'core' &&
      builtBlocks.some((builtBlock) => builtBlock.block.intent === 'prehab')
    ) {
      continue;
    }

    const intentsToTry = [step.intent, ...FALLBACK_INTENTS[step.intent]];
    const orderedIntents = [
      ...priorityIntents.filter((intent) => intentsToTry.includes(intent)),
      ...intentsToTry.filter((intent) => !priorityIntents.includes(intent))
    ].filter((intent, index, list) => list.indexOf(intent) === index);

    let chosenBlock: TrainingBlock | null = null;
    let chosenIntent = step.intent;
    let usedSafetyFallback = false;

    const anchorIntent =
      step.required && ['activation', 'contrast', 'force'].includes(step.intent)
        ? step.intent
        : null;

    for (const intent of orderedIntents) {
      const anchorBlockId = anchorIntent ? getAnchor(anchorIntent) : undefined;

      chosenBlock = chooseBlockByIntent(
        eligibleBlocks,
        intent,
        step.required,
        effectiveFocusTags,
        recipe.preferredTags,
        [...positionPreferences.preferTags, ...phasePreferences.preferTags],
        [
          ...(positionPreferences.avoidTags ?? []),
          ...(phasePreferences.avoidTags ?? [])
        ],
        usedBlockIds,
        usedExerciseIds,
        recipe.id,
        builtBlocks,
        week,
        anchorBlockId,
        excludedBlockIds,
        'auto'
      );
      chosenIntent = intent;
      if (chosenBlock) break;
    }

    if (!chosenBlock && step.required) {
      const safetyIntents = SAFETY_FALLBACK_INTENTS[step.intent].filter(
        (intent) => !orderedIntents.includes(intent)
      );

      for (const intent of safetyIntents) {
        chosenBlock = chooseBlockByIntent(
          eligibleBlocks,
          intent,
          step.required,
          effectiveFocusTags,
          recipe.preferredTags,
          [...positionPreferences.preferTags, ...phasePreferences.preferTags],
          [
            ...(positionPreferences.avoidTags ?? []),
            ...(phasePreferences.avoidTags ?? [])
          ],
          usedBlockIds,
          usedExerciseIds,
          recipe.id,
          builtBlocks,
          week,
          undefined,
          excludedBlockIds,
          'force'
        );
        if (!chosenBlock) {
          chosenBlock = chooseBlockByIntent(
            eligibleBlocks,
            intent,
            step.required,
            effectiveFocusTags,
            recipe.preferredTags,
            [...positionPreferences.preferTags, ...phasePreferences.preferTags],
            [
              ...(positionPreferences.avoidTags ?? []),
              ...(phasePreferences.avoidTags ?? [])
            ],
            usedBlockIds,
            usedExerciseIds,
            recipe.id,
            builtBlocks,
            week,
            undefined,
            excludedBlockIds,
            'off'
          );
        }
        chosenIntent = intent;
        if (chosenBlock) {
          usedSafetyFallback = true;
          break;
        }
      }
    }

    if (!chosenBlock) {
      if (step.required) {
        warnings.push(`Missing required intent '${step.intent}'.`);
      }
      continue;
    }

    const version = pickVersion(chosenBlock, baseWeek);
    if (!version) {
      warnings.push(
        `Block '${chosenBlock.blockId}' skipped because version '${baseWeek}' is missing.`
      );
      continue;
    }

    if (chosenIntent !== step.intent && usedSafetyFallback) {
      const message = `Safety fallback: required intent '${step.intent}' replaced with '${chosenIntent}' (${chosenBlock.blockId}).`;
      warnings.push(message);
      safetyAdjustments.push(message);
      isSafetyAdapted = true;
    } else if (chosenIntent !== step.intent) {
      warnings.push(
        `Fallback: intent '${step.intent}' replaced with '${chosenIntent}' (${chosenBlock.blockId}).`
      );
    }

    usedBlockIds.add(chosenBlock.blockId);
    for (const exerciseId of getExerciseIds(chosenBlock)) {
      usedExerciseIds.add(exerciseId);
    }
    builtBlocks.push({ block: chosenBlock, version });

    if (anchorIntent && chosenBlock.blockId) {
      setAnchor(anchorIntent, chosenBlock.blockId);
    }
  }

  return {
    recipeId: recipe.id,
    title: recipe.title,
    week,
    blocks: builtBlocks,
    warnings,
    isSafetyAdapted,
    safetyAdjustments
  };
};
