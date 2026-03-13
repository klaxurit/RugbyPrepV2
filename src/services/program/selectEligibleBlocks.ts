import type { TrainingBlock, UserProfile } from '../../types/training';
import { getExerciseById } from '../../data/exercises';

const hasRequiredEquipment = (
  requiredEquipment: TrainingBlock['equipment'],
  availableEquipment: UserProfile['equipment']
): boolean =>
  // `none` means bodyweight-compatible, so we ignore it in hard requirements.
  requiredEquipment
    .filter((equipment) => equipment !== 'none')
    .every((equipment) => availableEquipment.includes(equipment));

/**
 * Level-based block visibility:
 * - 'starter'     → only blocks tagged "starter"
 * - 'builder'     → blocks NOT tagged "starter" (can be "builder" or untagged)
 * - 'performance' → blocks NOT tagged "starter" AND NOT tagged "builder"
 */
const getEffectiveTrainingLevel = (profile: UserProfile): NonNullable<UserProfile['trainingLevel']> =>
  profile.trainingLevel ?? 'starter';

// Health/safety intents are universal — not level-gated.
// prehab = injury prevention and rehab exercises (medical, not training-level specific).
// warmup, cooldown, mobility = structural/prep roles universal to all levels.
const LEVEL_EXEMPT_INTENTS = new Set<TrainingBlock['intent']>(['warmup', 'cooldown', 'mobility', 'prehab']);

const isLevelEligible = (block: TrainingBlock, profile: UserProfile): boolean => {
  if (LEVEL_EXEMPT_INTENTS.has(block.intent)) return true;
  const level = getEffectiveTrainingLevel(profile);
  const hasStarterTag = block.tags.includes('starter');
  const hasBuilderTag = block.tags.includes('builder');
  if (level === 'starter') return hasStarterTag;
  if (level === 'builder') return !hasStarterTag;
  return !hasStarterTag && !hasBuilderTag;
};

export const selectEligibleBlocks = (
  profile: UserProfile,
  blocks: TrainingBlock[]
): TrainingBlock[] =>
  blocks.filter((block) => {
    const injuries = Array.isArray(profile.injuries) ? profile.injuries : [];
    const equipment = Array.isArray(profile.equipment) ? profile.equipment : [];
    const equipmentOk = hasRequiredEquipment(block.equipment, equipment);
    const contraindicationHit = block.contraindications.some((contra) =>
      injuries.includes(contra)
    );
    const exerciseContraindicationHit = block.exercises.some((exercise) => {
      const details = getExerciseById(exercise.exerciseId);
      if (!details) return false;
      return details.contraindications.some((contra) => injuries.includes(contra));
    });
    const levelOk = isLevelEligible(block, profile);

    return equipmentOk && !contraindicationHit && !exerciseContraindicationHit && levelOk;
  });
