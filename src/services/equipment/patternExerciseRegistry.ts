import type { Equipment } from '../../types/training'

/** Une étape de la chaîne BW → matériel (ordre croissant de « équipement requis »). */
export type ExerciseVariantStep = {
  exerciseId: string
  /** Tous les items requis doivent être présents dans le profil. `[]` = tier 0 pur. */
  requires: Equipment[]
}

/**
 * Chaînes de variantes pour le programme bodyweight_minimal.
 * Clé = exerciseId prescrit dans la mother session (tier 0 / cœur du programme).
 * On monte en difficulté / fidélité au pattern quand le matériel le permet — jamais de régression auto.
 */
export const BODYWEIGHT_VARIANT_CHAINS: Readonly<Record<string, readonly ExerciseVariantStep[]>> = {
  'push_horizontal__push_up__decline': [
    { exerciseId: 'push_horizontal__push_up__decline', requires: [] },
    { exerciseId: 'push_horizontal__dip__parallel', requires: ['pullup_bar'] },
    { exerciseId: 'push_horizontal__dip__chair', requires: ['bench'] },
    { exerciseId: 'push_horizontal__bench_press__dumbbell', requires: ['dumbbell', 'bench'] },
    { exerciseId: 'push_horizontal__bench_press__barbell', requires: ['barbell', 'bench'] },
  ],
  'push_horizontal__push_up__standard': [
    { exerciseId: 'push_horizontal__push_up__standard', requires: [] },
    { exerciseId: 'push_horizontal__dip__parallel', requires: ['pullup_bar'] },
    { exerciseId: 'push_horizontal__dip__chair', requires: ['bench'] },
    { exerciseId: 'push_horizontal__bench_press__dumbbell', requires: ['dumbbell', 'bench'] },
    { exerciseId: 'push_horizontal__bench_press__barbell', requires: ['barbell', 'bench'] },
  ],
  'pull_horizontal__inverted_row__standard': [
    { exerciseId: 'pull_horizontal__inverted_row__standard', requires: [] },
    { exerciseId: 'pull_vertical__pull_up__neutral', requires: ['pullup_bar'] },
    { exerciseId: 'pull_horizontal__one_arm_row__dumbbell', requires: ['dumbbell', 'bench'] },
  ],
  'pull_horizontal__inverted_row__feet_elevated': [
    { exerciseId: 'pull_horizontal__inverted_row__feet_elevated', requires: [] },
    { exerciseId: 'pull_vertical__pull_up__neutral', requires: ['pullup_bar'] },
    { exerciseId: 'pull_horizontal__one_arm_row__dumbbell', requires: ['dumbbell', 'bench'] },
  ],
  'push_vertical__pike_push_up__bodyweight': [
    { exerciseId: 'push_vertical__pike_push_up__bodyweight', requires: [] },
    { exerciseId: 'push_vertical__dumbbell_press__seated', requires: ['dumbbell', 'bench'] },
  ],
  'push_vertical__pike_push_up__feet_elevated': [
    { exerciseId: 'push_vertical__pike_push_up__feet_elevated', requires: [] },
    { exerciseId: 'push_vertical__dumbbell_press__seated', requires: ['dumbbell', 'bench'] },
  ],
  'lower_squat__bulgarian_split_squat__bodyweight': [
    { exerciseId: 'lower_squat__bulgarian_split_squat__bodyweight', requires: [] },
    { exerciseId: 'squat__goblet_squat__dumbbell', requires: ['dumbbell'] },
    { exerciseId: 'squat__back_squat__barbell', requires: ['squat_rack', 'barbell'] },
  ],
  'hamstring__nordic__eccentric_solo': [
    { exerciseId: 'hamstring__nordic__eccentric_solo', requires: [] },
    { exerciseId: 'hamstring__nordic__band_assist', requires: ['band'] },
    { exerciseId: 'hinge__rdl__dumbbell', requires: ['dumbbell'] },
  ],
  'hinge__single_leg_rdl__bodyweight': [
    { exerciseId: 'hinge__single_leg_rdl__bodyweight', requires: [] },
    { exerciseId: 'hinge__rdl__dumbbell', requires: ['dumbbell'] },
  ],
  'groin_adductors__copenhagen_plank__foot_elevated': [
    { exerciseId: 'groin_adductors__copenhagen_plank__foot_elevated', requires: [] },
    { exerciseId: 'groin_adductors__copenhagen_plank__short', requires: ['bench'] },
    { exerciseId: 'groin_adductors__copenhagen_plank__long', requires: ['bench'] },
  ],
  'groin_adductors__copenhagen_plank__short': [
    { exerciseId: 'groin_adductors__copenhagen_plank__foot_elevated', requires: [] },
    { exerciseId: 'groin_adductors__copenhagen_plank__short', requires: ['bench'] },
    { exerciseId: 'groin_adductors__copenhagen_plank__long', requires: ['bench'] },
  ],
  'core_anti_rotation__side_plank': [
    { exerciseId: 'core_anti_rotation__side_plank', requires: [] },
    { exerciseId: 'core_anti_rotation__pallof_press__band', requires: ['band'] },
  ],
  'activation__bird_dog__bodyweight': [
    { exerciseId: 'activation__bird_dog__bodyweight', requires: [] },
    { exerciseId: 'core_anti_rotation__pallof_press__band', requires: ['band'] },
  ],
  'locomotion__bear_crawl': [
    { exerciseId: 'locomotion__bear_crawl', requires: [] },
    { exerciseId: 'carry__farmer_walk__backpack', requires: [] },
    { exerciseId: 'carry__farmer_walk__dumbbell', requires: ['dumbbell'] },
  ],
  'prehab_shoulder__face_pull__band': [
    { exerciseId: 'prehab_shoulder__scap_pushup__bodyweight', requires: [] },
    { exerciseId: 'prehab_shoulder__face_pull__band', requires: ['band'] },
  ],
  'neck__extension_iso__bodyweight': [
    { exerciseId: 'neck__extension_iso__bodyweight', requires: [] },
    { exerciseId: 'neck__isometric__band', requires: ['band'] },
  ],
  'squat__bodyweight_squat': [
    { exerciseId: 'squat__bodyweight_squat', requires: [] },
    { exerciseId: 'squat__goblet_squat__dumbbell', requires: ['dumbbell'] },
    { exerciseId: 'squat__back_squat__barbell', requires: ['squat_rack', 'barbell'] },
  ],
  'push_horizontal__push_up__plyo': [
    { exerciseId: 'push_horizontal__push_up__plyo', requires: [] },
    { exerciseId: 'push_horizontal__dip__parallel', requires: ['pullup_bar'] },
  ],
  'power__squat_jump__bodyweight': [
    { exerciseId: 'power__squat_jump__bodyweight', requires: [] },
    { exerciseId: 'hinge__kb_swing__banded', requires: ['band'] },
  ],
  'core_rotation__band_rotation__explosive': [
    { exerciseId: 'core_rotation__cable_chop', requires: [] },
    { exerciseId: 'core_rotation__band_rotation__explosive', requires: ['band'] },
  ],
  'hamstring__bridge_iso__single_leg': [
    { exerciseId: 'hamstring__bridge_iso__single_leg', requires: [] },
    { exerciseId: 'hinge__rdl__dumbbell', requires: ['dumbbell'] },
  ],
  'carry__suitcase_walk__dumbbell': [
    { exerciseId: 'carry__farmer_walk__backpack', requires: [] },
    { exerciseId: 'carry__suitcase_walk__dumbbell', requires: ['dumbbell'] },
  ],
}

function equipmentSet(equipment: Equipment[] | undefined): Set<Equipment> {
  return new Set(equipment ?? [])
}

function stepIsAvailable(step: ExerciseVariantStep, available: Set<Equipment>): boolean {
  return step.requires.every((item) => available.has(item))
}

/**
 * Choisit la variante la plus équipée disponible pour un exerciseId prescrit (tier 0 par défaut).
 */
export function resolveExerciseVariantForEquipment(
  baseExerciseId: string,
  equipment: Equipment[] | undefined,
): string {
  const chain = BODYWEIGHT_VARIANT_CHAINS[baseExerciseId]
  if (!chain?.length) return baseExerciseId

  const available = equipmentSet(equipment)
  let resolved = chain[0].exerciseId
  for (const step of chain) {
    if (stepIsAvailable(step, available)) {
      resolved = step.exerciseId
    }
  }
  return resolved
}
