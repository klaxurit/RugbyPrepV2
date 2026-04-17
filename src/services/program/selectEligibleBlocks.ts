import type { TrainingBlock, UserProfile } from '../../types/training';
import { getExerciseById } from '../../data/exercises';
import { canAdaptBlock } from './adaptBlockExercises';

const hasRequiredEquipment = (
  requiredEquipment: TrainingBlock['equipment'],
  availableEquipment: UserProfile['equipment']
): boolean =>
  requiredEquipment
    .filter((equipment) => equipment !== 'none')
    .every((equipment) => availableEquipment.includes(equipment));

export const selectEligibleBlocks = (
  profile: UserProfile,
  blocks: TrainingBlock[]
): TrainingBlock[] =>
  blocks.filter((block) => {
    const injuries = Array.isArray(profile.injuries) ? profile.injuries : [];
    const equipment = Array.isArray(profile.equipment) ? profile.equipment : [];

    // Equipment: block fits directly OR all exercises have accessible variants
    const equipmentOk = hasRequiredEquipment(block.equipment, equipment) ||
      canAdaptBlock(block, equipment);

    const contraindicationHit = block.contraindications.some((contra) =>
      injuries.includes(contra)
    );
    const exerciseContraindicationHit = block.exercises.some((exercise) => {
      const details = getExerciseById(exercise.exerciseId);
      if (!details) return false;
      return details.contraindications.some((contra) => injuries.includes(contra));
    });

    return equipmentOk && !contraindicationHit && !exerciseContraindicationHit;
  });
