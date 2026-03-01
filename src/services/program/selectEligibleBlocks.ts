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
const isLevelEligible = (block: TrainingBlock, trainingLevel: UserProfile['trainingLevel']): boolean => {
  const level = trainingLevel ?? 'performance';
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
    const equipmentOk = hasRequiredEquipment(block.equipment, profile.equipment);
    const contraindicationHit = block.contraindications.some((contra) =>
      profile.injuries.includes(contra)
    );
    const exerciseContraindicationHit = block.exercises.some((exercise) => {
      const details = getExerciseById(exercise.exerciseId);
      if (!details) return false;
      return details.contraindications.some((contra) => profile.injuries.includes(contra));
    });
    const levelOk = isLevelEligible(block, profile.trainingLevel);

    return equipmentOk && !contraindicationHit && !exerciseContraindicationHit && levelOk;
  });
