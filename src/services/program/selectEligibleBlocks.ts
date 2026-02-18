import type { TrainingBlock, UserProfile } from '../../types/training';

const hasRequiredEquipment = (
  requiredEquipment: TrainingBlock['equipment'],
  availableEquipment: UserProfile['equipment']
): boolean =>
  // `none` means bodyweight-compatible, so we ignore it in hard requirements.
  requiredEquipment
    .filter((equipment) => equipment !== 'none')
    .every((equipment) => availableEquipment.includes(equipment));

export const selectEligibleBlocks = (
  profile: UserProfile,
  blocks: TrainingBlock[]
): TrainingBlock[] =>
  blocks.filter((block) => {
    const equipmentOk = hasRequiredEquipment(block.equipment, profile.equipment);
    const contraindicationHit = block.contraindications.some((contra) =>
      profile.injuries.includes(contra)
    );

    return equipmentOk && !contraindicationHit;
  });
