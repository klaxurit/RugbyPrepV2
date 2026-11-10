/**
 * Blocs d'accent par poste — packs fins (PROP / HOOKER / …).
 *
 * Science / métier :
 * - Cou multi-plans : Fownes-Walpole 2025 (BJSM) — `neck-training.md`
 * - Talonneur : extension coudes / lockout pour lancer touche (diamond + ext. chaise)
 * - 2e ligne : grip maul + intention saut vertical touche
 * - Avants : adducteurs / contact (Copenhagen, farmer)
 * - Arrières : COD, anti-rot, pull plaquage
 *
 * Runtime : `applyPositionAccentBlock` **ajoute** le bloc (ne retire rien).
 * Legacy `FRONT_ROW` → pack PROP jusqu'à resélection Pilier / Talonneur.
 */

import type { RugbyPositionGroup } from '../../types/training'
import type { PositionAccentTheme } from './positionAccentTheme'

export type PositionGroup = 'front_row' | 'back_three'

/** Packs fins utilisés par le bloc poste. */
export type PositionAccentPackId =
  | 'PROP'
  | 'HOOKER'
  | 'SECOND_ROW'
  | 'BACK_ROW'
  | 'HALF_BACKS'
  | 'CENTERS'
  | 'BACK_THREE'

export type PositionAccentSlot = {
  slotId: string
  labelFr: string
  labelEn: string
  pattern: string
  prescription: string
  /** Préférence BW / minimal (premier = choisi hors full_gym) */
  exerciseIds: string[]
  /**
   * Préférence salle (`equipment: full_gym`). Si défini, remplace exerciseIds[0]
   * sur les mothers full_gym — sinon on garde exerciseIds.
   */
  gymExerciseIds?: string[]
  /** Si true, omis quand la séance a déjà du travail de cou */
  isNeckSlot?: boolean
  /**
   * Si défini, le slot ne s’affiche que sur ces types de séance.
   * Ex. saut touche 2e ligne : Lower seulement.
   */
  onlySessionTypes?: Array<'upper' | 'lower'>
  /** Tags theme-week (contact / power / skill) — réordonnancement runtime. */
  themeTags?: PositionAccentTheme[]
}

export type PositionAccentBlock = {
  id: string
  packId: PositionAccentPackId
  format: string
  rest: string
  transferFr: string
  transferEn: string
  slots: PositionAccentSlot[]
}

const NECK_SLOTS: PositionAccentSlot[] = [
  {
    slotId: 'neck_triplanar',
    labelFr: 'Nuque — 3 plans',
    labelEn: 'Neck — 3 planes',
    pattern: 'neck',
    prescription: '10s/direction',
    isNeckSlot: true,
    themeTags: ['contact'],
    exerciseIds: [
      'neck__flexion',
      'neck__extension_iso__bodyweight',
      'neck__lateral_flexion_iso__bodyweight',
      'neck__flexion_iso__band',
      'neck__extension_iso__band',
      'neck__lateral_flexion_iso__band',
    ],
    gymExerciseIds: [
      'neck__flexion_iso__band',
      'neck__extension_iso__band',
      'neck__lateral_flexion_iso__band',
      'neck__flexion',
    ],
  },
]

export const BLOC_POSITION_PROP: PositionAccentBlock = {
  id: 'BLOC_POSITION_PROP',
  packId: 'PROP',
  format: '2 tours',
  rest: '45–60s',
  transferFr: 'Mêlée / contact — push Upper ; farmer surtout Lower',
  transferEn: 'Scrum / contact — push on Upper; farmer mainly Lower',
  slots: [
    ...NECK_SLOTS,
    {
      slotId: 'adductors',
      labelFr: 'Adducteurs',
      labelEn: 'Adductors',
      pattern: 'groin_adductors',
      prescription: '15–20s/côté',
      themeTags: ['contact'],
      exerciseIds: [
        'groin_adductors__copenhagen_plank__foot_elevated',
        'groin_adductors__copenhagen_plank__short',
        'groin_adductors__copenhagen_plank__long',
        'groin_adductors__supine_squeeze',
      ],
      gymExerciseIds: [
        'groin_adductors__copenhagen_plank__weighted',
        'groin_adductors__copenhagen_plank__long',
        'groin_adductors__copenhagen_plank__short',
      ],
    },
    // Upper : push mêlée (dips / décliné)
    {
      slotId: 'scrum_push',
      labelFr: 'Push mêlée',
      labelEn: 'Scrum push',
      pattern: 'push_horizontal',
      prescription: '8–10',
      onlySessionTypes: ['upper'],
      themeTags: ['contact'],
      exerciseIds: [
        'push_horizontal__dip__chair',
        'push_horizontal__push_up__decline',
        'push_horizontal__dip__parallel',
        'push_horizontal__push_up__standard',
      ],
      gymExerciseIds: [
        'push_horizontal__dip__parallel',
        'push_horizontal__bench_press__barbell',
        'push_vertical__landmine_press__kneeling',
      ],
    },
    // Lower : farmer / locomotion contact
    {
      slotId: 'carry_contact',
      labelFr: 'Grip / contact',
      labelEn: 'Grip / contact',
      pattern: 'carry',
      prescription: '20m ou 20–30s',
      onlySessionTypes: ['lower'],
      themeTags: ['contact'],
      exerciseIds: [
        'carry__farmer_walk__backpack',
        'carry__farmer_walk__dumbbell',
        'locomotion__bear_crawl',
        'push_horizontal__dip__chair',
      ],
      gymExerciseIds: [
        'sled__push__standard',
        'carry__sled_push__light',
        'carry__farmer_walk__dumbbell',
      ],
    },
  ],
}

export const BLOC_POSITION_HOOKER: PositionAccentBlock = {
  id: 'BLOC_POSITION_HOOKER',
  packId: 'HOOKER',
  format: '2 tours',
  rest: '45–60s',
  transferFr: 'Lancer touche — lockout, extension, overhead (pike)',
  transferEn: 'Lineout throw — lockout, extension, overhead (pike)',
  slots: [
    ...NECK_SLOTS,
    {
      slotId: 'lineout_lockout',
      labelFr: 'Lockout lancer (diamant)',
      labelEn: 'Throw lockout (diamond)',
      pattern: 'push_horizontal',
      prescription: '8–10',
      themeTags: ['skill'],
      exerciseIds: ['push_horizontal__push_up__diamond', 'push_horizontal__push_up__standard'],
      // Salle : dips parallèles = lockout triceps (pas de close-grip dédié au catalogue)
      gymExerciseIds: [
        'push_horizontal__dip__parallel',
        'push_horizontal__push_up__diamond',
        'push_horizontal__bench_press__dumbbell',
      ],
    },
    {
      slotId: 'lineout_extension',
      labelFr: 'Extension triceps chaise',
      labelEn: 'Chair triceps extension',
      pattern: 'arm_extension',
      prescription: '10–12',
      themeTags: ['skill'],
      exerciseIds: [
        'arm_extension__triceps_chair__bodyweight',
        'push_horizontal__dip__chair',
        'arm_extension__pressdown__cable_rope',
        'arm_extension__skull_crusher__ez_bar',
      ],
      gymExerciseIds: [
        'arm_extension__skull_crusher__ez_bar',
        'arm_extension__french_press__ez_bar',
        'arm_extension__pressdown__cable_rope',
      ],
    },
    // Si nuque déjà faite : diamant + chaise + pike (overhead throw)
    {
      slotId: 'lineout_overhead',
      labelFr: 'Overhead pike (lancer)',
      labelEn: 'Pike overhead (throw)',
      pattern: 'push_vertical',
      prescription: '6–8',
      themeTags: ['skill', 'power'],
      exerciseIds: [
        'push_vertical__pike_push_up__bodyweight',
        'push_vertical__pike_push_up__feet_elevated',
      ],
      gymExerciseIds: [
        'push_vertical__overhead_press__barbell',
        'push_vertical__push_press__barbell',
        'push_vertical__landmine_press__kneeling',
      ],
    },
  ],
}

export const BLOC_POSITION_SECOND_ROW: PositionAccentBlock = {
  id: 'BLOC_POSITION_SECOND_ROW',
  packId: 'SECOND_ROW',
  format: '2 tours',
  rest: '45–60s',
  transferFr: 'Maul + saut touche — poigne ; saut surtout en Lower',
  transferEn: 'Maul + lineout jump — grip; jump mainly on Lower',
  slots: [
    ...NECK_SLOTS,
    {
      slotId: 'maul_grip',
      labelFr: 'Poigne maul',
      labelEn: 'Maul grip',
      pattern: 'carry',
      prescription: '15–20s',
      themeTags: ['contact'],
      exerciseIds: [
        'grip__towel_isometric__bodyweight',
        'carry__farmer_walk__backpack',
        'carry__farmer_walk__dumbbell',
        'carry__farmer_hold__dumbbell',
      ],
      gymExerciseIds: [
        'carry__farmer_hold__dumbbell',
        'carry__farmer_walk__dumbbell',
        'carry__overhead_hold__dumbbell',
      ],
    },
    // Upper : adducteurs / contact (pas de saut en fin d’Upper)
    {
      slotId: 'adductors_upper',
      labelFr: 'Adducteurs',
      labelEn: 'Adductors',
      pattern: 'groin_adductors',
      prescription: '15–20s/côté',
      onlySessionTypes: ['upper'],
      themeTags: ['contact'],
      exerciseIds: [
        'groin_adductors__copenhagen_plank__foot_elevated',
        'groin_adductors__copenhagen_plank__short',
        'groin_adductors__copenhagen_plank__long',
        'groin_adductors__supine_squeeze',
      ],
      gymExerciseIds: [
        'groin_adductors__copenhagen_plank__weighted',
        'groin_adductors__copenhagen_plank__long',
        'groin_adductors__copenhagen_plank__short',
      ],
    },
    // Lower : intention saut touche
    {
      slotId: 'lineout_jump',
      labelFr: 'Intention saut vertical',
      labelEn: 'Vertical jump intent',
      pattern: 'power',
      prescription: '3×3 qualité',
      onlySessionTypes: ['lower'],
      themeTags: ['power'],
      exerciseIds: [
        'power__jump__vertical_jump',
        'power__squat_jump__bodyweight',
        'power__jump__broad_jump',
      ],
      gymExerciseIds: [
        'power__jump__box_jump',
        'power__countermovement_jump',
        'power__jump__vertical_jump',
      ],
    },
  ],
}

export const BLOC_POSITION_BACK_ROW: PositionAccentBlock = {
  id: 'BLOC_POSITION_BACK_ROW',
  packId: 'BACK_ROW',
  format: '2 tours',
  rest: '45–60s',
  transferFr: 'Plaquage / ruck — pull+T Upper ; farmer+COD Lower',
  transferEn: 'Tackle / ruck — pull+T Upper; farmer+COD Lower',
  slots: [
    {
      slotId: 'pull_tackle',
      labelFr: 'Pull plaquage',
      labelEn: 'Tackle pull',
      pattern: 'pull_vertical',
      prescription: '5 qualité',
      onlySessionTypes: ['upper'],
      themeTags: ['contact'],
      exerciseIds: [
        'pull_vertical__pull_up__neutral',
        'pull_vertical__pull_up__feet_assisted',
        'pull_horizontal__inverted_row__feet_elevated',
        'pull_horizontal__inverted_row__standard',
      ],
      gymExerciseIds: [
        'pull_vertical__pull_up__neutral',
        'pull_horizontal__one_arm_row__dumbbell',
        'pull_horizontal__cable_row__half_kneeling',
      ],
    },
    {
      slotId: 'push_rot_upper',
      labelFr: 'Push rotatif (T / archer)',
      labelEn: 'Rotational push (T / archer)',
      pattern: 'push_horizontal',
      prescription: '6–8/côté',
      onlySessionTypes: ['upper'],
      // Contact aussi : le « T » du transfer pull+T (landmine / archer).
      themeTags: ['contact', 'skill', 'power'],
      exerciseIds: [
        'push_horizontal__t_push_up__bodyweight',
        'push_horizontal__archer_push_up__bodyweight',
        'push_horizontal__push_up__standard',
      ],
      gymExerciseIds: [
        'core_rotation__landmine_rotation',
        'power__medball_rotational_throw__wall',
        'push_horizontal__t_push_up__bodyweight',
      ],
    },
    {
      // Filet Contact Upper si pull déjà saturé (tractions + rows dans la mother).
      slotId: 'carry_iso_upper',
      labelFr: 'Poigne / carry iso',
      labelEn: 'Grip / carry iso',
      pattern: 'carry',
      prescription: '20–30s',
      onlySessionTypes: ['upper'],
      themeTags: ['contact'],
      exerciseIds: [
        'carry__farmer_hold__dumbbell',
        'carry__farmer_walk__backpack',
        'grip__towel_isometric__bodyweight',
      ],
      gymExerciseIds: [
        'carry__farmer_hold__dumbbell',
        'carry__farmer_walk__dumbbell',
        'carry__suitcase_walk__dumbbell',
      ],
    },
    {
      slotId: 'carry_contact',
      labelFr: 'Carry / contact',
      labelEn: 'Carry / contact',
      pattern: 'carry',
      prescription: '20m',
      onlySessionTypes: ['lower'],
      themeTags: ['contact'],
      exerciseIds: [
        'carry__farmer_walk__backpack',
        'carry__suitcase_walk__backpack',
        'carry__farmer_walk__dumbbell',
        'locomotion__bear_crawl',
      ],
      gymExerciseIds: [
        'carry__farmer_walk__dumbbell',
        'carry__sled_drag__backward',
        'carry__farmer_hold__dumbbell',
      ],
    },
    {
      slotId: 'cod_speed',
      labelFr: 'COD',
      labelEn: 'COD',
      pattern: 'agility',
      prescription: '5m ou 3/côté',
      onlySessionTypes: ['lower'],
      themeTags: ['power'],
      exerciseIds: ['power__lateral_bound', 'power__split_jump__bodyweight'],
      gymExerciseIds: ['power__lateral_bound', 'power__jump__box_jump', 'power__split_jump__bodyweight'],
    },
  ],
}

export const BLOC_POSITION_HALF_BACKS: PositionAccentBlock = {
  id: 'BLOC_POSITION_HALF_BACKS',
  packId: 'HALF_BACKS',
  format: '2 tours',
  rest: '45–60s',
  transferFr: 'Passes / COD — anti-rot+rotation Upper ; COD+fente Lower',
  transferEn: 'Passing / COD — anti-rot+rotation Upper; COD+lunge Lower',
  slots: [
    {
      slotId: 'trunk_anti_rot',
      labelFr: 'Trunk anti-rotation',
      labelEn: 'Trunk anti-rotation',
      pattern: 'core_anti_rotation',
      prescription: '15s/côté',
      onlySessionTypes: ['upper'],
      themeTags: ['skill'],
      exerciseIds: [
        'core_anti_rotation__pallof_press__band',
        'core_anti_rotation__side_plank',
      ],
      gymExerciseIds: [
        'core_anti_rotation__pallof_press__band',
        'core_anti_rotation__side_plank',
      ],
    },
    {
      slotId: 'trunk_rotation',
      labelFr: 'Rotation / T-push',
      labelEn: 'Rotation / T-push',
      pattern: 'core_rotation',
      prescription: '6–8/côté',
      onlySessionTypes: ['upper'],
      themeTags: ['skill'],
      exerciseIds: [
        'push_horizontal__t_push_up__bodyweight',
        'core_rotation__floor_twist__bodyweight',
        'core_rotation__band_rotation__explosive',
        'core_anti_extension__dead_bug',
      ],
      gymExerciseIds: [
        'core_rotation__landmine_rotation',
        'power__medball_rotational_throw__wall',
        'core_rotation__band_rotation__explosive',
      ],
    },
    {
      slotId: 'pull_light',
      labelFr: 'Pull léger',
      labelEn: 'Light pull',
      pattern: 'pull_horizontal',
      prescription: '6–8',
      onlySessionTypes: ['upper'],
      themeTags: ['contact', 'skill'],
      exerciseIds: [
        'pull_horizontal__inverted_row__standard',
        'pull_horizontal__inverted_row__feet_elevated',
        'pull_vertical__pull_up__feet_assisted',
      ],
      gymExerciseIds: [
        'pull_horizontal__cable_row__seated',
        'pull_horizontal__one_arm_row__dumbbell',
        'pull_horizontal__cable_row__half_kneeling',
      ],
    },
    {
      slotId: 'cod_speed',
      labelFr: 'COD court',
      labelEn: 'Short COD',
      pattern: 'agility',
      prescription: '5m shuffle',
      onlySessionTypes: ['lower'],
      exerciseIds: [
        'power__lateral_bound',
        'agility__lateral_shuffle_sprint',
        'power__split_jump__bodyweight',
      ],
      gymExerciseIds: [
        'power__lateral_bound',
        'agility__lateral_shuffle_sprint',
        'power__jump__box_jump',
      ],
    },
    {
      slotId: 'lunge_explosive',
      labelFr: 'Fente / split jump',
      labelEn: 'Lunge / split jump',
      pattern: 'power',
      prescription: '6/côté ou 3–4 split',
      onlySessionTypes: ['lower'],
      themeTags: ['power'],
      exerciseIds: [
        'power__split_jump__bodyweight',
        'lower_lunge__reverse_lunge__bodyweight',
        'power__lateral_bound',
      ],
      gymExerciseIds: [
        'lower_lunge__reverse_lunge__dumbbell',
        'lower_squat__bulgarian_split_squat__dumbbell',
        'power__split_jump__bodyweight',
      ],
    },
  ],
}

export const BLOC_POSITION_CENTERS: PositionAccentBlock = {
  id: 'BLOC_POSITION_CENTERS',
  packId: 'CENTERS',
  format: '2 tours',
  rest: '45–60s',
  transferFr: 'Contact + offload — archer+pull Upper ; bound+fente Lower',
  transferEn: 'Contact + offload — archer+pull Upper; bound+lunge Lower',
  slots: [
    {
      slotId: 'push_unilat',
      labelFr: 'Push unilat / archer',
      labelEn: 'Unilateral / archer',
      pattern: 'push_horizontal',
      prescription: '6–8/côté',
      onlySessionTypes: ['upper'],
      themeTags: ['contact', 'skill'],
      exerciseIds: [
        'push_horizontal__archer_push_up__bodyweight',
        'push_horizontal__t_push_up__bodyweight',
        'push_horizontal__push_up__decline',
        'push_horizontal__push_up__standard',
      ],
      gymExerciseIds: [
        'push_horizontal__bench_press__dumbbell',
        'push_vertical__landmine_press__kneeling',
        'push_horizontal__archer_push_up__bodyweight',
      ],
    },
    {
      slotId: 'pull_tackle',
      labelFr: 'Pull (qualité)',
      labelEn: 'Pull (quality)',
      pattern: 'pull_horizontal',
      prescription: '6–8',
      onlySessionTypes: ['upper'],
      themeTags: ['contact'],
      exerciseIds: [
        'pull_horizontal__inverted_row__feet_elevated',
        'pull_horizontal__inverted_row__standard',
        'pull_vertical__pull_up__neutral',
      ],
      gymExerciseIds: [
        'pull_horizontal__one_arm_row__dumbbell',
        'pull_horizontal__cable_row__half_kneeling',
        'pull_vertical__pull_up__neutral',
      ],
    },
    {
      slotId: 'trunk_anti_rot',
      labelFr: 'Anti-rotation',
      labelEn: 'Anti-rotation',
      pattern: 'core_anti_rotation',
      prescription: '15s/côté',
      onlySessionTypes: ['upper'],
      themeTags: ['skill'],
      exerciseIds: [
        'core_anti_rotation__pallof_press__band',
        'core_anti_rotation__side_plank',
      ],
      gymExerciseIds: [
        'core_anti_rotation__pallof_press__band',
        'core_rotation__landmine_rotation',
      ],
    },
    {
      slotId: 'cod_bound',
      labelFr: 'Bound latéral',
      labelEn: 'Lateral bound',
      pattern: 'agility',
      prescription: '3–4/côté',
      onlySessionTypes: ['lower'],
      themeTags: ['power'],
      exerciseIds: ['power__lateral_bound', 'power__split_jump__bodyweight'],
      gymExerciseIds: ['power__lateral_bound', 'power__jump__box_jump'],
    },
    {
      slotId: 'lunge_carry',
      labelFr: 'Fente / carry sac',
      labelEn: 'Lunge / pack carry',
      pattern: 'carry',
      prescription: '6/côté ou 15–20m',
      onlySessionTypes: ['lower'],
      themeTags: ['contact', 'power'],
      exerciseIds: [
        'lower_lunge__reverse_lunge__bodyweight',
        'carry__farmer_walk__backpack',
        'carry__suitcase_walk__backpack',
        'power__split_jump__bodyweight',
      ],
      gymExerciseIds: [
        'lower_lunge__reverse_lunge__dumbbell',
        'carry__farmer_walk__dumbbell',
        'lower_squat__bulgarian_split_squat__dumbbell',
      ],
    },
  ],
}

export const BLOC_POSITION_BACK_THREE: PositionAccentBlock = {
  id: 'BLOC_POSITION_BACK_THREE',
  packId: 'BACK_THREE',
  format: '2 tours',
  rest: '45–60s',
  transferFr: 'Espace / plaquage — pull+T Upper ; bound+sprint Lower',
  transferEn: 'Space / tackle — pull+T Upper; bound+sprint Lower',
  slots: [
    {
      slotId: 'pull_tackle',
      labelFr: 'Pull plaquage',
      labelEn: 'Tackle pull',
      pattern: 'pull_vertical',
      prescription: '5 qualité',
      onlySessionTypes: ['upper'],
      themeTags: ['contact'],
      exerciseIds: [
        'pull_vertical__pull_up__neutral',
        'pull_vertical__pull_up__feet_assisted',
        'pull_vertical__pull_up__band_assisted',
        'pull_horizontal__inverted_row__feet_elevated',
        'pull_horizontal__inverted_row__standard',
      ],
      gymExerciseIds: [
        'pull_vertical__pull_up__neutral',
        'pull_horizontal__one_arm_row__dumbbell',
        'pull_horizontal__cable_row__seated',
      ],
    },
    {
      slotId: 'trunk_anti_rot',
      labelFr: 'Trunk anti-rotation',
      labelEn: 'Trunk anti-rotation',
      pattern: 'core_anti_rotation',
      prescription: '15s/côté',
      onlySessionTypes: ['upper'],
      themeTags: ['skill'],
      exerciseIds: [
        'core_anti_rotation__pallof_press__band',
        'core_anti_rotation__side_plank',
      ],
      gymExerciseIds: [
        'core_anti_rotation__pallof_press__band',
        'core_rotation__landmine_rotation',
      ],
    },
    {
      slotId: 'push_rot_upper',
      labelFr: 'Pompe en T',
      labelEn: 'T-push-up',
      pattern: 'push_horizontal',
      prescription: '6–8/côté',
      onlySessionTypes: ['upper'],
      themeTags: ['skill', 'power'],
      exerciseIds: [
        'push_horizontal__t_push_up__bodyweight',
        'push_horizontal__archer_push_up__bodyweight',
        'push_horizontal__push_up__plyo',
      ],
      gymExerciseIds: [
        'power__medball_rotational_throw__wall',
        'power__landmine_press__speed',
        'push_horizontal__t_push_up__bodyweight',
      ],
    },
    {
      slotId: 'cod_speed',
      labelFr: 'Bound / split jump',
      labelEn: 'Bound / split jump',
      pattern: 'agility',
      prescription: '3–4/côté',
      onlySessionTypes: ['lower'],
      themeTags: ['power'],
      exerciseIds: ['power__lateral_bound', 'power__split_jump__bodyweight'],
      gymExerciseIds: [
        'power__lateral_bound',
        'power__jump__box_jump',
        'power__countermovement_jump',
      ],
    },
    {
      slotId: 'sprint_prep',
      labelFr: 'Sprint prep court',
      labelEn: 'Short sprint prep',
      pattern: 'sprint',
      prescription: '2–3 × 5–10m',
      onlySessionTypes: ['lower'],
      themeTags: ['power'],
      exerciseIds: [
        'sprint__falling_start_short',
        'sprint__short_acceleration',
        'sprint__free_acceleration',
        'agility__lateral_shuffle_sprint',
      ],
      gymExerciseIds: [
        'sprint__short_acceleration',
        'sprint__falling_start_short',
        'agility__lateral_shuffle_sprint',
      ],
    },
  ],
}

/** @deprecated Alias — pack PROP (legacy avants génériques). */
export const BLOC_POSITION_FRONT_ROW = BLOC_POSITION_PROP

const PACKS: Record<PositionAccentPackId, PositionAccentBlock> = {
  PROP: BLOC_POSITION_PROP,
  HOOKER: BLOC_POSITION_HOOKER,
  SECOND_ROW: BLOC_POSITION_SECOND_ROW,
  BACK_ROW: BLOC_POSITION_BACK_ROW,
  HALF_BACKS: BLOC_POSITION_HALF_BACKS,
  CENTERS: BLOC_POSITION_CENTERS,
  BACK_THREE: BLOC_POSITION_BACK_THREE,
}

export function resolvePositionAccentPackId(
  rugbyPosition: RugbyPositionGroup | string | null | undefined,
): PositionAccentPackId | null {
  if (!rugbyPosition) return null
  const token = String(rugbyPosition).trim().toUpperCase().replace(/\s+/g, '_')
  switch (token) {
    case 'PROP':
      return 'PROP'
    case 'HOOKER':
      return 'HOOKER'
    case 'FRONT_ROW':
      // Legacy onboarding « 1ère ligne » → pilier jusqu'à resélection
      return 'PROP'
    case 'SECOND_ROW':
      return 'SECOND_ROW'
    case 'BACK_ROW':
      return 'BACK_ROW'
    case 'HALF_BACKS':
      return 'HALF_BACKS'
    case 'CENTERS':
      return 'CENTERS'
    case 'BACK_THREE':
      return 'BACK_THREE'
    default:
      return null
  }
}

export function getPositionAccentBlockForPack(
  packId: PositionAccentPackId,
): PositionAccentBlock {
  return PACKS[packId]
}

export function getPositionAccentBlockForRugbyPosition(
  rugbyPosition: RugbyPositionGroup | string | null | undefined,
): PositionAccentBlock | null {
  const packId = resolvePositionAccentPackId(rugbyPosition)
  return packId ? PACKS[packId] : null
}

/**
 * Binôme planning mothers (avants / arrières).
 * PROP + HOOKER + FRONT_ROW legacy + SECOND_ROW + BACK_ROW → front_row.
 */
export function toPlanningPositionGroup(
  rugbyPosition: RugbyPositionGroup | string | null | undefined,
): PositionGroup {
  const pack = resolvePositionAccentPackId(rugbyPosition)
  if (!pack) return 'back_three'
  if (pack === 'PROP' || pack === 'HOOKER' || pack === 'SECOND_ROW' || pack === 'BACK_ROW') {
    return 'front_row'
  }
  return 'back_three'
}

/** @deprecated Préférer `getPositionAccentBlockForRugbyPosition`. */
export function getPositionAccentBlock(group: PositionGroup): PositionAccentBlock {
  return group === 'front_row' ? BLOC_POSITION_PROP : BLOC_POSITION_BACK_THREE
}

/** Nuque optionnelle 1 tour pour arrières plaquage lourd */
export const BLOC_POSITION_BACK_THREE_NECK_OPTIONAL: PositionAccentSlot[] = NECK_SLOTS.map(
  (s) => ({ ...s, isNeckSlot: undefined }),
)

/** Séances où le bloc position complet est recommandé (doc). */
export const POSITION_ACCENT_SESSION_TYPES = new Set([
  'lower',
  'upper',
  'full',
  'full_light_primer',
])

/**
 * Upper BW — toutes les mothers upper poids de corps.
 * Le bloc poste est **ajouté** (jamais soustractif).
 */
const BW_IN_SEASON_FAMILIES = [
  'FRONT_ROW',
  'SECOND_ROW',
  'BACK_ROW',
  'HALF_BACKS',
  'CENTERS',
  'BACK_THREE',
] as const

function bwInSeasonIds(prefix: 'UPPER' | 'LOWER'): string[] {
  const ids: string[] = []
  for (const family of BW_IN_SEASON_FAMILIES) {
    for (const ab of ['A', 'B'] as const) {
      ids.push(`${prefix}_BW_IN_SEASON_${family}_${ab}_V1`)
    }
  }
  return ids
}

export const POSITION_ACCENT_UPPER_BW_SESSION_IDS = new Set([
  'UPPER_BW_OFFSEASON_TRANSITION_V1',
  'UPPER_BW_OFFSEASON_HYPERTROPHY_V1',
  'UPPER_BW_OFFSEASON_FORCE_BRIDGE_V1',
  'UPPER_BW_PRESEASON_FORCE_V1',
  'UPPER_BW_PRESEASON_FORCE_POWER_V1',
  'UPPER_BW_PRESEASON_POWER_V1',
  'UPPER_BW_PRESEASON_POWER_HALF_BACKS_V1',
  'UPPER_BW_PRESEASON_POWER_CENTERS_V1',
  'UPPER_BW_PRESEASON_POWER_BACK_THREE_V1',
  'UPPER_BW_IN_SEASON_V1',
  ...bwInSeasonIds('UPPER'),
])

/** Lower BW — même packs (saut 2e ligne surtout pertinent ici). */
export const POSITION_ACCENT_LOWER_BW_SESSION_IDS = new Set([
  'LOWER_BW_OFFSEASON_TRANSITION_V1',
  'LOWER_BW_OFFSEASON_HYPERTROPHY_V1',
  'LOWER_BW_OFFSEASON_FORCE_BRIDGE_V1',
  'LOWER_BW_PRESEASON_FORCE_V1',
  'LOWER_BW_PRESEASON_FORCE_POWER_V1',
  'LOWER_BW_PRESEASON_POWER_V1',
  'LOWER_BW_IN_SEASON_V1',
  ...bwInSeasonIds('LOWER'),
])

export const POSITION_ACCENT_BW_SESSION_IDS = new Set([
  ...POSITION_ACCENT_UPPER_BW_SESSION_IDS,
  ...POSITION_ACCENT_LOWER_BW_SESSION_IDS,
])

/**
 * Upper + Lower full_gym — tout le cycle annuel (off / pré / in),
 * y compris mothers FRONT_ROW et BACK_THREE (pack = poste profil, overlay).
 */
export const POSITION_ACCENT_UPPER_GYM_SESSION_IDS = new Set([
  'UPPER_OFFSEASON_TRANSITION_V1',
  'UPPER_OFFSEASON_HYPERTROPHY_V1',
  'UPPER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1',
  'UPPER_OFFSEASON_FORCE_BRIDGE_V1',
  'UPPER_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1',
  'UPPER_PRESEASON_FORCE_V1',
  'UPPER_PRESEASON_FORCE_POWER_V1',
  'UPPER_PRESEASON_POWER_FRONT_ROW_V1',
  'UPPER_PRESEASON_POWER_BACK_THREE_V1',
  'UPPER_IN_SEASON_FRONT_ROW_V1',
  'UPPER_IN_SEASON_FRONT_ROW_LANDMINE_V1',
  'UPPER_IN_SEASON_FRONT_ROW_SUPINE_V1',
  'UPPER_IN_SEASON_FRONT_ROW_CHESTPASS_V1',
  'UPPER_IN_SEASON_SECOND_ROW_V1',
  'UPPER_IN_SEASON_SECOND_ROW_CHESTPASS_V1',
  'UPPER_IN_SEASON_SECOND_ROW_LANDMINE_V1',
  'UPPER_IN_SEASON_SECOND_ROW_SUPINE_V1',
  'UPPER_IN_SEASON_BACK_ROW_V1',
  'UPPER_IN_SEASON_BACK_ROW_CHESTPASS_V1',
  'UPPER_IN_SEASON_BACK_ROW_LANDMINE_V1',
  'UPPER_IN_SEASON_BACK_ROW_SUPINE_V1',
  'UPPER_IN_SEASON_BACK_THREE_V1',
  'UPPER_IN_SEASON_BACK_THREE_LANDMINE_V1',
  'UPPER_IN_SEASON_BACK_THREE_PLYO_V1',
  'UPPER_IN_SEASON_BACK_THREE_PUSHPRESS_V1',
  'UPPER_IN_SEASON_BACK_THREE_ROTATIONAL_V1',
  'UPPER_IN_SEASON_HALF_BACKS_V1',
  'UPPER_IN_SEASON_HALF_BACKS_LANDMINE_V1',
  'UPPER_IN_SEASON_HALF_BACKS_PLYO_V1',
  'UPPER_IN_SEASON_HALF_BACKS_ROTATIONAL_V1',
  'UPPER_IN_SEASON_HALF_BACKS_PUSHPRESS_V1',
  'UPPER_IN_SEASON_CENTERS_V1',
  'UPPER_IN_SEASON_CENTERS_LANDMINE_V1',
  'UPPER_IN_SEASON_CENTERS_PLYO_V1',
  'UPPER_IN_SEASON_CENTERS_ROTATIONAL_V1',
  'UPPER_IN_SEASON_CENTERS_PUSHPRESS_V1',
])

export const POSITION_ACCENT_LOWER_GYM_SESSION_IDS = new Set([
  'LOWER_OFFSEASON_TRANSITION_V1',
  'LOWER_OFFSEASON_HYPERTROPHY_V1',
  'LOWER_OFFSEASON_HYPERTROPHY_BACK_THREE_V1',
  'LOWER_OFFSEASON_FORCE_BRIDGE_V1',
  'LOWER_OFFSEASON_FORCE_BRIDGE_BACK_THREE_V1',
  'LOWER_PRESEASON_FORCE_V1',
  'LOWER_PRESEASON_FORCE_POWER_V1',
  'LOWER_PRESEASON_POWER_FRONT_ROW_V1',
  'LOWER_PRESEASON_POWER_BACK_THREE_V1',
  'LOWER_IN_SEASON_FRONT_ROW_V1',
  'LOWER_IN_SEASON_FRONT_ROW_FRONTSQUAT_V1',
  'LOWER_IN_SEASON_FRONT_ROW_PAUSEJUMP_V1',
  'LOWER_IN_SEASON_FRONT_ROW_TBRDL_V1',
  'LOWER_IN_SEASON_SECOND_ROW_V1',
  'LOWER_IN_SEASON_SECOND_ROW_FRONTSQUAT_V1',
  'LOWER_IN_SEASON_SECOND_ROW_TBRDL_V1',
  'LOWER_IN_SEASON_SECOND_ROW_PAUSEJUMP_V1',
  'LOWER_IN_SEASON_BACK_ROW_V1',
  'LOWER_IN_SEASON_BACK_ROW_FRONTSQUAT_V1',
  'LOWER_IN_SEASON_BACK_ROW_TBRDL_V1',
  'LOWER_IN_SEASON_BACK_ROW_PAUSEJUMP_V1',
  'LOWER_IN_SEASON_BACK_THREE_V1',
  'LOWER_IN_SEASON_BACK_THREE_RDL_V1',
  'LOWER_IN_SEASON_BACK_THREE_SHRUG_V1',
  'LOWER_IN_SEASON_BACK_THREE_SLHIP_V1',
  'LOWER_IN_SEASON_HALF_BACKS_V1',
  'LOWER_IN_SEASON_HALF_BACKS_RDL_V1',
  'LOWER_IN_SEASON_HALF_BACKS_SLHIP_V1',
  'LOWER_IN_SEASON_HALF_BACKS_SHRUG_V1',
  'LOWER_IN_SEASON_CENTERS_V1',
  'LOWER_IN_SEASON_CENTERS_RDL_V1',
  'LOWER_IN_SEASON_CENTERS_SLHIP_V1',
  'LOWER_IN_SEASON_CENTERS_SHRUG_V1',
])

export const POSITION_ACCENT_GYM_SESSION_IDS = new Set([
  ...POSITION_ACCENT_UPPER_GYM_SESSION_IDS,
  ...POSITION_ACCENT_LOWER_GYM_SESSION_IDS,
])

export const POSITION_ACCENT_ALL_SESSION_IDS = new Set([
  ...POSITION_ACCENT_BW_SESSION_IDS,
  ...POSITION_ACCENT_GYM_SESSION_IDS,
])

/** @deprecated Prefer POSITION_ACCENT_BW_SESSION_IDS */
export const POSITION_ACCENT_V1_SESSION_IDS = POSITION_ACCENT_BW_SESSION_IDS

export type PositionAccentEquipmentMode = 'bodyweight' | 'full_gym'

/**
 * Familles à haute fatigue : si déjà présentes dans la séance principale,
 * l’accent ne les rejoue pas en finisher (KB product-decisions : pas de doublon).
 */
const FATIGUE_SENSITIVE_FAMILIES = new Set([
  'pull_vertical',
  'pull_horizontal',
  'squat',
  'hinge',
  'olympic',
  'deadlift',
])

/** Premiers segments d’un exerciseId (`pull_vertical__pull_up__neutral` → `pull_vertical`). */
export function positionAccentMovementFamily(exerciseId: string): string {
  const parts = exerciseId.split('__')
  return parts[0] ?? exerciseId
}

/**
 * Résout l’exercice d’un slot selon le mode matériel.
 * Évite les IDs déjà dans la séance et les familles lourdes déjà chargées.
 */
export function pickPositionAccentExerciseId(
  slot: PositionAccentSlot,
  mode: PositionAccentEquipmentMode = 'bodyweight',
  opts?: {
    usedExerciseIds?: ReadonlySet<string>
    usedFamilies?: ReadonlySet<string>
  },
): string | null {
  const pool =
    mode === 'full_gym' && slot.gymExerciseIds && slot.gymExerciseIds.length > 0
      ? slot.gymExerciseIds
      : slot.exerciseIds
  const usedIds = opts?.usedExerciseIds
  const usedFamilies = opts?.usedFamilies

  for (const id of pool) {
    if (usedIds?.has(id)) continue
    const family = positionAccentMovementFamily(id)
    if (
      FATIGUE_SENSITIVE_FAMILIES.has(family) &&
      usedFamilies?.has(family)
    ) {
      continue
    }
    return id
  }
  return null
}

function slotThemeScore(slot: PositionAccentSlot, theme: PositionAccentTheme | null | undefined): number {
  if (!theme || !slot.themeTags || slot.themeTags.length === 0) return 0
  return slot.themeTags.includes(theme) ? 1 : 0
}

/**
 * Filtre les slots selon nuque déjà faite + type de séance (upper/lower).
 * Theme-week : si au moins un slot matche le thème, on ne garde que les matchs
 * (sinon Focus A/B ne fait que réordonner et l’utilisateur ne voit aucun changement).
 */
export function filterPositionAccentSlots(
  block: PositionAccentBlock,
  opts: {
    skipNeck: boolean
    sessionType?: 'upper' | 'lower' | string
    theme?: PositionAccentTheme | null
    /** Cap slots (Full allégé = 2 ; Upper/Lower = 3). */
    maxSlots?: number
  },
): PositionAccentSlot[] {
  const cap = opts.maxSlots ?? 3
  const type = opts.sessionType === 'upper' || opts.sessionType === 'lower' ? opts.sessionType : undefined
  const filtered = block.slots
    .filter((s) => !(opts.skipNeck && s.isNeckSlot))
    .filter((s) => {
      if (!s.onlySessionTypes || s.onlySessionTypes.length === 0) return true
      if (!type) return true // full / inconnu → garder (filet)
      return s.onlySessionTypes.includes(type)
    })

  if (!opts.theme) return filtered.slice(0, cap)

  const themed = filtered.filter((s) => slotThemeScore(s, opts.theme) > 0)
  const pool = themed.length > 0 ? themed : filtered
  return [...pool]
    .sort((a, b) => slotThemeScore(b, opts.theme) - slotThemeScore(a, opts.theme))
    .slice(0, cap)
}
