/**
 * Exercise Variant Map — substitution chains for equipment adaptation.
 *
 * When a block's exercise requires equipment the user doesn't have,
 * the engine walks the variant chain to find the best accessible alternative.
 *
 * Principles (aligned with KB periodization.md + strength-methods.md):
 * - Same movement pattern (push_horizontal → push_horizontal)
 * - Minimal quality loss (DB bench > machine press > push-up)
 * - Safety-first for beginners (guided > free weight)
 * - Barbell → Dumbbell → Machine → Bodyweight (general cascade)
 *
 * Order matters: first match wins (preferred alternative first).
 */

export const exerciseVariants: Record<string, string[]> = {
  // ── Push Horizontal ──────────────────────────────────────────
  'push_horizontal__bench_press__barbell': [
    'push_horizontal__bench_press__dumbbell',           // DB = same ROM, slightly safer
    'push_horizontal__bench_press__incline__dumbbell',  // Incline DB = accessible alternative
    'push_horizontal__push_up__standard',               // BW fallback
  ],
  'push_horizontal__board_press__barbell': [
    'push_horizontal__bench_press__dumbbell',           // DB bench replaces board press
    'push_horizontal__push_up__standard',               // BW fallback
  ],
  'push_horizontal__bench_press__football_bar': [
    'push_horizontal__bench_press__dumbbell',
    'push_horizontal__push_up__standard',
  ],

  // ── Push Vertical ────────────────────────────────────────────
  'push_vertical__overhead_press__barbell': [
    'push_vertical__dumbbell_press__seated',            // DB seated = safe overhead
    'push_vertical__shoulder_press__machine',            // Machine = guided
  ],
  'push_vertical__push_press__barbell': [
    'push_vertical__dumbbell_press__seated',            // DB seated (no explosive BB needed)
    'push_vertical__shoulder_press__machine',
  ],
  'push_vertical__ohp__seated': [
    'push_vertical__dumbbell_press__seated',
    'push_vertical__shoulder_press__machine',
  ],
  'push_vertical__landmine_press__kneeling': [
    'push_vertical__dumbbell_press__seated',
    'push_vertical__shoulder_press__machine',
  ],

  // ── Pull Horizontal ─────────────────────────────────────────
  'pull_horizontal__pendlay_row__barbell': [
    'pull_horizontal__one_arm_row__dumbbell',            // DB row = unilateral, safe
    'pull_horizontal__incline_bench_row__dumbbell',      // Chest-supported = back safe
    'pull_horizontal__chest_supported_row__machine',     // Machine
    'pull_horizontal__band_row',                         // Band fallback
  ],
  'pull_horizontal__tbar_row': [
    'pull_horizontal__one_arm_row__dumbbell',
    'pull_horizontal__incline_bench_row__dumbbell',
    'pull_horizontal__chest_supported_row__machine',
    'pull_horizontal__band_row',
  ],
  'pull_horizontal__landmine_row': [
    'pull_horizontal__one_arm_row__dumbbell',
    'pull_horizontal__chest_supported_row__machine',
    'pull_horizontal__band_row',
  ],
  'pull_horizontal__seal_row__barbell': [
    'pull_horizontal__incline_bench_row__dumbbell',
    'pull_horizontal__chest_supported_row__machine',
    'pull_horizontal__band_row',
  ],

  // ── Squat ────────────────────────────────────────────────────
  'squat__back_squat__barbell': [
    'squat__goblet_squat__dumbbell',                    // Goblet = auto-limiting, safe
    'squat__leg_press__machine',                        // Machine = guided
    'squat__hack_squat__machine',                       // Hack squat = guided
    'squat__bodyweight_squat',                           // BW fallback
  ],
  'squat__front_squat__barbell': [
    'squat__goblet_squat__dumbbell',                    // Goblet mimics front squat position
    'squat__leg_press__machine',
    'squat__hack_squat__machine',
    'squat__bodyweight_squat',
  ],
  'squat__box_squat__barbell': [
    'squat__goblet_squat__dumbbell',
    'squat__leg_press__machine',
    'squat__bodyweight_squat',
  ],
  'squat__pin_squat__barbell': [
    'squat__goblet_squat__dumbbell',
    'squat__leg_press__machine',
  ],
  'squat__anderson_box_squat__banded': [
    'squat__goblet_squat__dumbbell',
    'squat__leg_press__machine',
  ],

  // ── Hinge ────────────────────────────────────────────────────
  'hinge__rdl__barbell': [
    'hinge__rdl__dumbbell',                             // DB RDL = same pattern, lighter
    'hinge__rdl__single_leg__dumbbell',                 // Single-leg DB = unilateral
    'hinge__hip_thrust__bodyweight',                    // BW hip thrust
    'hinge__glute_bridge__bodyweight',                  // BW bridge fallback
  ],
  'hinge__drop_rdl': [
    'hinge__rdl__dumbbell',
    'hinge__rdl__single_leg__dumbbell',
    'hinge__good_morning__bodyweight',
  ],
  'hinge__hip_thrust__barbell': [
    'hinge__hip_thrust__bodyweight',                    // BW hip thrust
    'hinge__glute_bridge__bodyweight',
  ],
  'hinge__deadlift__trap_bar': [
    'hinge__rdl__dumbbell',
    'hinge__rdl__barbell',                              // BB RDL as fallback if no trap bar
    'hinge__hip_thrust__bodyweight',
  ],
  'hinge__rdl__hex_bar': [
    'hinge__rdl__dumbbell',
    'hinge__rdl__barbell',
    'hinge__hip_thrust__bodyweight',
  ],
  'hinge__kb_swing__banded': [
    'hinge__rdl__dumbbell',
    'hinge__glute_bridge__bodyweight',
  ],

  // ── Olympic Variants ─────────────────────────────────────────
  // KB: Olympic lifts need barbell. DB snatch is the accessible equivalent.
  'olympic_variant__hang_high_pull': [
    'full_power__db_snatch__single_arm',                // DB snatch = explosive, accessible
    'power__jump__vertical_jump',                       // Vertical jump = pure power
  ],
  'olympic_variant__clean_high_pull': [
    'full_power__db_snatch__single_arm',
    'power__jump__vertical_jump',
  ],
  'olympic_variant__power_clean__hang': [
    'full_power__db_snatch__single_arm',
    'power__jump__vertical_jump',
  ],

  // ── Power / Explosive ────────────────────────────────────────
  'power__push_press__barbell': [
    'push_vertical__dumbbell_press__seated',
    'power__medball_chest_pass__wall',                  // Med ball = explosive alternative
  ],
  'power__hang_clean_pull__barbell': [
    'full_power__db_snatch__single_arm',
    'power__jump__broad_jump',
  ],
  'power__landmine_press__speed': [
    'push_vertical__dumbbell_press__seated',
    'power__medball_chest_pass__wall',
  ],

  // ── Core ─────────────────────────────────────────────────────
  'core_anti_extension__ghd_iso': [
    'core_anti_extension__ab_wheel__kneeling',          // Ab wheel = anti-extension
    'core_anti_extension__front_plank',                 // Plank = BW anti-extension
    'core_anti_extension__dead_bug',                    // Dead bug = BW
  ],
  'core_rotation__ghd_rotations': [
    'core_rotation__cable_chop',                        // Cable chop
    'core_anti_rotation__pallof_press__band',           // Pallof press = band
    'core_anti_rotation__side_plank',                   // Side plank = BW
  ],
  'core_rotation__landmine_rotation': [
    'core_rotation__cable_chop',
    'core_anti_rotation__pallof_press__band',
  ],
  'core_anti_extension__ab_wheel__kneeling': [
    'core_anti_extension__front_plank',
    'core_anti_extension__dead_bug',
  ],

  // ── Lunge / Unilateral ───────────────────────────────────────
  'lower_lunge__reverse_lunge__barbell': [
    'lower_lunge__reverse_lunge__dumbbell',
    'lower_lunge__reverse_lunge__bodyweight',
  ],

  // ── Carry ────────────────────────────────────────────────────
  'carry__zercher_carry__barbell': [
    'carry__farmer_walk__dumbbell',
    'carry__suitcase_walk__dumbbell',
    'carry__farmer_hold__dumbbell',
  ],

  // ── Calf ─────────────────────────────────────────────────────
  'calf__weighted_raise__barbell': [
    'calf__seated_raise__machine',
    'calf__standing_raise__bodyweight',
  ],

  // ── Arm Extension ────────────────────────────────────────────
  'arm_extension__french_press__ez_bar': [
    'arm_extension__pressdown__cable_rope',
  ],
  'arm_extension__skull_crusher__ez_bar': [
    'arm_extension__pressdown__cable_rope',
  ],

  // ── Trap / Shrug ─────────────────────────────────────────────
  'upper_trap__shrug__barbell': [
    'upper_trap__shrug__dumbbell',
  ],
}
