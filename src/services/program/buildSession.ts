// src/services/program/buildSession.ts
import type {
  TrainingBlock,
  UserProfile,
  WeekVersion,
  BlockIntent,
  Contra,
  Equipment
} from '../../types/training';
import type { SessionRecipe } from '../../data/sessionRecipes.v1';

export interface BuiltBlock {
  block: TrainingBlock;
  version: TrainingBlock['versions'][number];
}

export interface BuildSessionResult {
  title: string;
  week: WeekVersion;
  blocks: BuiltBlock[];
  warnings: string[];
}

/** util: true si A est subset de B */
const isSubset = <T>(required: T[], available: T[]) =>
  required.every((x) => available.includes(x));

const intersects = <T>(a: T[], b: T[]) => a.some((x) => b.includes(x));

/**
 * Étape 1 : Filtrer les blocs compatibles (matériel + blessures).
 * Décision simple MVP : si le bloc a 1 contra qui match -> on le retire.
 */
export const selectEligibleBlocks = (profile: UserProfile, blocks: TrainingBlock[]) => {
  const availableEquipment: Equipment[] = profile.equipment;
  const injuries: Contra[] = profile.injuries;

  return blocks.filter((b) => {
    // matériel : autorise "none" même si pas listé côté user
    const required = b.equipment.filter((e) => e !== 'none');
    const equipmentOk = isSubset(required, availableEquipment);

    // blessures
    const safe = !intersects(b.contraindications, injuries);

    return equipmentOk && safe;
  });
};

const pickVersion = (block: TrainingBlock, week: WeekVersion) => {
  const v = block.versions.find((x) => x.versionId === week);
  if (!v) throw new Error(`Missing version ${week} for block ${block.blockId}`);
  return v;
};

/**
 * Score très simple :
 * +2 si block.tags contient un preferredTag
 * +1 si block.intent == intent (normalement filtré)
 */
const scoreBlock = (block: TrainingBlock, intent: BlockIntent, preferredTags: string[]) => {
  let score = 0;
  if (block.intent === intent) score += 1;
  for (const t of preferredTags) {
    if (block.tags.includes(t)) score += 2;
  }
  return score;
};

const chooseBestBlock = (
  candidates: TrainingBlock[],
  intent: BlockIntent,
  preferredTags: string[],
  usedIds: Set<string>
): TrainingBlock | null => {
  const filtered = candidates
    .filter((b) => b.intent === intent)
    .filter((b) => !usedIds.has(b.blockId));

  if (filtered.length === 0) return null;

  filtered.sort((a, b) => scoreBlock(b, intent, preferredTags) - scoreBlock(a, intent, preferredTags));
  return filtered[0] ?? null;
};

const fallbackIntent = (intent: BlockIntent): BlockIntent[] => {
  // règles MVP : si contrast absent -> force, si prehab absent -> core, etc
  switch (intent) {
    case 'contrast':
      return ['force'];
    case 'force':
      return ['contrast'];
    case 'prehab':
      return ['core'];
    case 'neck':
      return ['core'];
    default:
      return [];
  }
};

export const buildSessionFromRecipe = (
  profile: UserProfile,
  allBlocks: TrainingBlock[],
  recipe: SessionRecipe,
  week: WeekVersion
): BuildSessionResult => {
  const eligible = selectEligibleBlocks(profile, allBlocks);

  const used = new Set<string>();
  const built: BuiltBlock[] = [];
  const warnings: string[] = [];

  for (const step of recipe.sequence) {
    // candidates by intent
    let chosen =
      chooseBestBlock(eligible, step.intent, recipe.preferredTags, used);

    // fallback chain
    if (!chosen) {
      for (const fb of fallbackIntent(step.intent)) {
        chosen = chooseBestBlock(eligible, fb, recipe.preferredTags, used);
        if (chosen) {
          warnings.push(`Fallback: intent '${step.intent}' remplacé par '${fb}' (${chosen.blockId}).`);
          break;
        }
      }
    }

    if (!chosen) {
      if (step.required) {
        warnings.push(`Missing required intent '${step.intent}' — séance incomplète.`);
      }
      continue;
    }

    used.add(chosen.blockId);
    built.push({ block: chosen, version: pickVersion(chosen, week) });
  }

  // Validation finale (garde-fous MVP)
  const intents = built.map((b) => b.block.intent);
  const activationCount = intents.filter((i) => i === 'activation').length;
  if (activationCount > 1) warnings.push('Validation: plus d’un bloc activation détecté (vérifier recipe).');

  const contrastOrForceCount = intents.filter((i) => i === 'contrast' || i === 'force').length;
  if (contrastOrForceCount === 0) warnings.push('Validation: aucun bloc principal (contrast/force).');

  return {
    title: recipe.title,
    week,
    blocks: built,
    warnings
  };
};
