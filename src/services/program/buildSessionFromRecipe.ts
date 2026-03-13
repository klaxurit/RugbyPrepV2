import type { SessionRecipe } from '../../data/sessionRecipes.v1';
import type {
  CycleWeek,
  SessionIdentity,
  SessionIntensity,
  TrainingBlock,
  UserProfile,
  WeekVersion
} from '../../types/training';
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
  intensity?: SessionIntensity;
  identity?: SessionIdentity;
  blocks: BuiltSessionBlock[];
  warnings: string[];
  isSafetyAdapted?: boolean;
  safetyAdjustments?: string[];
}

interface BuildSessionOptions {
  priorityIntents?: TrainingBlock['intent'][];
  /** Blocs déjà utilisés dans d'autres sessions de la semaine (exclusion cross-session) */
  excludedBlockIds?: Set<string>;
  /** Intensity profile for intra-week undulation (P1c) */
  intensity?: SessionIntensity;
  /** Extra prefer tags from intensity profile (merged with position/phase tags) */
  intensityPreferTags?: string[];
  /** Extra avoid tags from intensity profile */
  intensityAvoidTags?: string[];
  /** Override phase preferences for DUP (per-session phase instead of per-week) */
  phasePreferencesOverride?: import('./programPhases.v1').PhasePreferences;
}

const FALLBACK_INTENTS: Record<
  SessionRecipe['sequence'][number]['intent'],
  SessionRecipe['sequence'][number]['intent'][]
> = {
  warmup: [],
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
  mobility: [],
  cooldown: []
};

// Fallbacks "sécurité" : utilisés uniquement quand un intent requis est introuvable.
// On privilégie d'abord les intents principaux, puis des options stables (prehab/core).
const SAFETY_FALLBACK_INTENTS: Record<
  SessionRecipe['sequence'][number]['intent'],
  SessionRecipe['sequence'][number]['intent'][]
> = {
  warmup: [],
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
  mobility: [],
  cooldown: []
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

const isFullRecipeId = (recipeId: SessionRecipe['id']) =>
  recipeId === 'FULL_V1' || recipeId === 'FULL_HYPER_V1' || recipeId === 'FULL_BUILDER_V1';

const pickVersion = (block: TrainingBlock, week: WeekVersion) =>
  block.versions.find((version) => version.versionId === week) ?? null;

const scoreBlock = (
  block: TrainingBlock,
  preferredTags: SessionRecipe['preferredTags'],
  positionPreferTags: string[],
  positionAvoidTags: string[],
  phasePreferTags: string[],
  phaseAvoidTags: string[],
  intensityPreferTags: string[] = [],
  intensityAvoidTags: string[] = []
) => {
  // Recipe-level preferred tags: +1 per match (slot relevance)
  const preferredScore = preferredTags.reduce(
    (score, preferredTag) => score + (block.tags.includes(preferredTag) ? 1 : 0),
    0
  );
  // H8 (P1, F-B01 fix): Position scoring at +5, separate from phase at +3.
  // Position must outrank phase to ensure position-specific blocks are selected
  // (Duthie 2003: position demands differ significantly in rugby).
  const positionPreferScore = positionPreferTags.reduce(
    (score, tag) => score + (block.tags.includes(tag) ? 5 : 0),
    0
  );
  const positionAvoidScore = positionAvoidTags.reduce(
    (score, tag) => score + (block.tags.includes(tag) ? -2 : 0),
    0
  );
  // Phase scoring: +3/-2 (unchanged from original design)
  const phasePreferScore = phasePreferTags.reduce(
    (score, tag) => score + (block.tags.includes(tag) ? 3 : 0),
    0
  );
  const phaseAvoidScore = phaseAvoidTags.reduce(
    (score, tag) => score + (block.tags.includes(tag) ? -2 : 0),
    0
  );
  // H10: Intensity scoring +2/-2 to meaningfully differentiate DUP sessions
  const intensityPrefer = intensityPreferTags.reduce(
    (score, tag) => score + (block.tags.includes(tag) ? 2 : 0),
    0
  );
  const intensityAvoid = intensityAvoidTags.reduce(
    (score, tag) => score + (block.tags.includes(tag) ? -2 : 0),
    0
  );
  return preferredScore + positionPreferScore + positionAvoidScore +
    phasePreferScore + phaseAvoidScore + intensityPrefer + intensityAvoid;
};

const getExerciseIds = (block: TrainingBlock): string[] =>
  block.exercises.map((exercise) => exercise.exerciseId);

const hasExerciseOverlap = (block: TrainingBlock, usedExerciseIds: Set<string>) =>
  getExerciseIds(block).some((exerciseId) => usedExerciseIds.has(exerciseId));

const canUseBlock = (
  block: TrainingBlock,
  usedExerciseIds: Set<string>
): boolean => {
  // Warmup, activation et cooldown : toujours acceptés (overlap volontaire)
  if (block.intent === 'activation' || block.intent === 'warmup' || block.intent === 'cooldown') {
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

// KB strength-methods.md §7.1: neural adaptations need 4+ weeks on same movement pattern.
// KB beginner-intermediate-training.md Q4: change exercises every 4–6 weeks max.
// Main work intents (force, contrast, neural, hypertrophy) stay FIXED within a cycle —
// only RER/load progresses via versions (W1→W4).
// Accessory/finisher intents rotate by week index for variety.
const shouldRotateIntent = (
  intent: TrainingBlock['intent'],
  required: boolean
): boolean => {
  void required;
  if (intent === 'neck' || intent === 'core' || intent === 'carry') return true;
  return false;
};

const HIGH_DEMAND_INTENTS: TrainingBlock['intent'][] = ['neural', 'contrast', 'force'];

// HIGH_DEMAND_INTENTS reserved for future shouldIncludeOptionalPrepIntent enhancement
void HIGH_DEMAND_INTENTS;

// H3: Warmup is mandatory for all sessions except pure mobility and REHAB P1.
// KB injury-prevention.md §9: warmup reduces injuries 20-50% (Emery 2015, evidence level A).
const WARMUP_EXEMPT_RECIPES = new Set<string>([
  'RECOVERY_MOBILITY_V1',
  'REHAB_UPPER_P1_V1',
  'REHAB_LOWER_P1_V1',
]);

const shouldIncludeOptionalPrepIntent = (
  intent: TrainingBlock['intent'],
  recipe: SessionRecipe,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _profile: UserProfile,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _sessionIntensity?: SessionIntensity
): boolean => {
  if (intent !== 'warmup' && intent !== 'cooldown') return true;
  // Mobility-only and REHAB P1 sessions are too light for warmup
  if (WARMUP_EXEMPT_RECIPES.has(recipe.id)) return false;
  return true;
};

const chooseBlockByIntent = (
  blocks: TrainingBlock[],
  intent: TrainingBlock['intent'],
  required: boolean,
  focusTagsAny: SessionRecipe['focusTagsAny'],
  preferredTags: SessionRecipe['preferredTags'],
  positionPreferTags: string[],
  positionAvoidTags: string[],
  phasePreferTags: string[],
  phaseAvoidTags: string[],
  usedBlockIds: Set<string>,
  usedExerciseIds: Set<string>,
  recipeId: SessionRecipe['id'],
  builtBlocks: BuiltSessionBlock[],
  week: CycleWeek,
  anchorBlockId?: string,
  excludedBlockIds?: Set<string>,
  focusMode: 'auto' | 'force' | 'off' = 'auto',
  intensityPreferTags: string[] = [],
  intensityAvoidTags: string[] = []
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
        scoreBlock(b, preferredTags, positionPreferTags, positionAvoidTags, phasePreferTags, phaseAvoidTags, intensityPreferTags, intensityAvoidTags) -
          scoreBlock(a, preferredTags, positionPreferTags, positionAvoidTags, phasePreferTags, phaseAvoidTags, intensityPreferTags, intensityAvoidTags) ||
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
  const phasePreferences = options.phasePreferencesOverride ?? getPhasePreferences(week);
  const phase = getPhaseForWeek(week);
  const baseWeek = getBaseWeekVersion(week);
  const priorityIntents = options.priorityIntents ?? [];
  const excludedBlockIds = options.excludedBlockIds;
  const intensityPreferTags = options.intensityPreferTags ?? [];
  const intensityAvoidTags = options.intensityAvoidTags ?? [];
  const sessionIntensity = options.intensity;
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

    if (
      (step.intent === 'warmup' || step.intent === 'cooldown') &&
      !step.required &&
      !shouldIncludeOptionalPrepIntent(step.intent, recipe, profile, sessionIntensity)
    ) {
      continue;
    }

    // Per-slot focus tags override recipe-level focusTagsAny (null = no filter for this slot)
    const effectiveFocusTags: string[] | undefined =
      recipe.slotFocusTags != null
        ? (recipe.slotFocusTags[slotIndex] ?? undefined)
        : recipe.focusTagsAny;

    const maxFinishers = isFullRecipeId(recipe.id) ? 2 : 1;
    const finisherCount = builtBlocks.filter((builtBlock) =>
      isFinisherIntent(builtBlock.block.intent)
    ).length;
    if (isFinisherIntent(step.intent) && finisherCount >= maxFinishers) {
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

    const fallbackIntents = FALLBACK_INTENTS[step.intent];
    // Primary intent always first; priorityIntents only reorder the fallback chain
    const orderedFallbacks = [
      ...priorityIntents.filter((intent) => fallbackIntents.includes(intent)),
      ...fallbackIntents.filter((intent) => !priorityIntents.includes(intent))
    ].filter((intent, index, list) => list.indexOf(intent) === index);
    const orderedIntents = [step.intent, ...orderedFallbacks.filter((intent) => intent !== step.intent)];

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
        positionPreferences.preferTags,
        positionPreferences.avoidTags ?? [],
        phasePreferences.preferTags,
        phasePreferences.avoidTags ?? [],
        usedBlockIds,
        usedExerciseIds,
        recipe.id,
        builtBlocks,
        week,
        anchorBlockId,
        excludedBlockIds,
        'auto',
        intensityPreferTags,
        intensityAvoidTags
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
          positionPreferences.preferTags,
          positionPreferences.avoidTags ?? [],
          phasePreferences.preferTags,
          phasePreferences.avoidTags ?? [],
          usedBlockIds,
          usedExerciseIds,
          recipe.id,
          builtBlocks,
          week,
          undefined,
          excludedBlockIds,
          'force',
          intensityPreferTags,
          intensityAvoidTags
        );
        if (!chosenBlock) {
          chosenBlock = chooseBlockByIntent(
            eligibleBlocks,
            intent,
            step.required,
            effectiveFocusTags,
            recipe.preferredTags,
            positionPreferences.preferTags,
            positionPreferences.avoidTags ?? [],
            phasePreferences.preferTags,
            phasePreferences.avoidTags ?? [],
            usedBlockIds,
            usedExerciseIds,
            recipe.id,
            builtBlocks,
            week,
            undefined,
            excludedBlockIds,
            'off',
            intensityPreferTags,
            intensityAvoidTags
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
    intensity: sessionIntensity,
    blocks: builtBlocks,
    warnings,
    isSafetyAdapted,
    safetyAdjustments
  };
};
