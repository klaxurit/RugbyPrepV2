/**
 * Chaînes de substitution salle (même pattern / setup).
 * Tous les membres d’une famille pointent vers la même liste ordonnée.
 * Kind dans le picker = `same` (alternative équipement/setup, pas progression BW).
 */

export type GymVariantChain = readonly string[]

function indexChains(families: readonly GymVariantChain[]): Readonly<Record<string, GymVariantChain>> {
  const out: Record<string, GymVariantChain> = {}
  for (const chain of families) {
    for (const id of chain) {
      out[id] = chain
    }
  }
  return out
}

const SQUAT_BILATERAL = [
  'squat__pin_squat__barbell',
  'squat__front_squat__barbell',
  'squat__box_squat__barbell',
  'squat__back_squat__barbell',
  'squat__anderson_box_squat__banded',
  'squat__hack_squat__machine',
  'squat__leg_press__machine',
  'squat__goblet_squat__dumbbell',
] as const

const HINGE_BILATERAL = [
  'hinge__deadlift__trap_bar',
  'hinge__rdl__hex_bar',
  'hinge__rdl__barbell',
  'hinge__rdl__dumbbell',
  'hinge__hip_thrust__barbell',
  'hamstring__leg_curl__machine',
] as const

const HINGE_UNI = [
  'hinge__rdl__single_leg__dumbbell',
  'hinge__single_leg_rdl__bodyweight',
  'hinge__rdl__dumbbell',
] as const

const PUSH_HORIZONTAL = [
  'push_horizontal__bench_press__barbell',
  'push_horizontal__bench_press__football_bar',
  'push_horizontal__bench_press__dumbbell',
  'push_horizontal__bench_press__incline__dumbbell',
  'push_horizontal__board_press__barbell',
  'push_horizontal__dip__parallel',
] as const

const PUSH_VERTICAL = [
  'push_vertical__overhead_press__barbell',
  'power__push_press__barbell',
  'push_vertical__dumbbell_press__seated',
  'push_vertical__landmine_press__kneeling',
  'push_vertical__shoulder_press__machine',
] as const

const PULL_HORIZONTAL = [
  'pull_horizontal__pendlay_row__barbell',
  'pull_horizontal__tbar_row',
  'pull_horizontal__chest_supported_row__dumbbell',
  'pull_horizontal__one_arm_row__dumbbell',
  'pull_horizontal__landmine_row',
  'pull_horizontal__cable_row__seated',
] as const

const PULL_VERTICAL = [
  'pull_vertical__pull_up__neutral',
  'pull_vertical__pull_up__supinated',
  'pull_vertical__pull_up__band_assisted',
  'pull_vertical__lat_pulldown__machine',
] as const

const LOWER_UNI = [
  'lower_squat__bulgarian_split_squat__dumbbell',
  'lower_squat__split_squat__dumbbell',
  'lower_lunge__reverse_lunge__barbell',
  'lower_lunge__reverse_lunge__dumbbell',
  'lower_squat__bulgarian_split_squat__bodyweight',
  'lower_squat__split_squat__bodyweight',
] as const

const NORDIC_HAM = [
  'hamstring__nordic__eccentric_solo',
  'hamstring__nordic__band_assist',
  'hamstring__nordic__partner',
  'hamstring__leg_curl__machine',
  'hinge__rdl__dumbbell',
] as const

const CARRY = [
  'carry__farmer_walk__dumbbell',
  'carry__suitcase_walk__dumbbell',
  'carry__zercher_carry__barbell',
  'carry__sled_push__light',
  'carry__farmer_walk__backpack',
] as const

const POWER_JUMP = [
  'power__squat_jump__bodyweight',
  'power__jump__broad_jump',
  'lower_jump__broad_jump__seated',
  'power__split_jump__bodyweight',
] as const

const MEDBALL_UPPER = [
  'power__medball_chest_pass__wall',
  'power__cable_press__explosive',
  'power__landmine_press__speed',
  'push_horizontal__push_up__plyo',
] as const

const MEDBALL_ROTATION = [
  'power__medball_rotational_throw__wall',
  'core_rotation__cable_rotation__explosive',
  'core_rotation__cable_chop',
  'core_rotation__landmine_rotation',
] as const

const CORE_ANTI = [
  'core_anti_rotation__side_plank',
  'core_anti_rotation__pallof_press__band',
  'activation__bird_dog__bodyweight',
] as const

const NECK_ISO = [
  'neck__flexion_iso__bodyweight',
  'neck__extension_iso__bodyweight',
  'neck__lateral_flexion_iso__bodyweight',
  'neck__isometric__band',
  'neck__flexion_iso__band',
  'neck__extension_iso__band',
] as const

/** Accel salle/maison ↔ piste. La piste n’est pas un kit profil : toujours proposable. */
const SPEED_ACCEL = [
  'sprint__falling_start_short',
  'warmup__wall_drill_march',
  'sprint__short_acceleration',
  'sprint__free_acceleration',
  'sprint__resisted_acceleration',
] as const

export const GYM_VARIANT_CHAINS: Readonly<Record<string, GymVariantChain>> = indexChains([
  SQUAT_BILATERAL,
  HINGE_BILATERAL,
  HINGE_UNI,
  PUSH_HORIZONTAL,
  PUSH_VERTICAL,
  PULL_HORIZONTAL,
  PULL_VERTICAL,
  LOWER_UNI,
  NORDIC_HAM,
  CARRY,
  POWER_JUMP,
  MEDBALL_UPPER,
  MEDBALL_ROTATION,
  CORE_ANTI,
  SPEED_ACCEL,
  NECK_ISO,
])

export function resolveGymVariantChain(exerciseId: string): GymVariantChain | null {
  return GYM_VARIANT_CHAINS[exerciseId] ?? null
}
