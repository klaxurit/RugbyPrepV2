/**
 * Blocs d'accent positionnel pour le programme poids de corps.
 * Aligné sur `docs/training/bodyweight-program-review.md` §4.
 *
 * Le resolver matériel choisit l'exerciseId concret ; ce registre définit
 * les slots intentionnels par poste.
 */

export type PositionGroup = 'front_row' | 'back_three'

export type PositionAccentSlot = {
  slotId: string
  labelFr: string
  pattern: string
  prescription: string
  /** exerciseIds ordonnés par préférence (résolution matériel ensuite) */
  exerciseIds: string[]
  /** back_three only / front_row only / both */
  forGroup?: PositionGroup
}

export type PositionAccentBlock = {
  id: string
  format: string
  rest: string
  slots: PositionAccentSlot[]
}

const NECK_FR: PositionAccentSlot[] = [
  {
    slotId: 'neck_flexion',
    labelFr: 'Nuque — flexion',
    pattern: 'neck',
    prescription: '10s',
    exerciseIds: ['neck__flexion', 'neck__flexion_iso__band'],
    forGroup: 'front_row',
  },
  {
    slotId: 'neck_extension',
    labelFr: 'Nuque — extension',
    pattern: 'neck',
    prescription: '10s',
    exerciseIds: ['neck__extension_iso__bodyweight', 'neck__extension_iso__band', 'neck__extension__band'],
    forGroup: 'front_row',
  },
  {
    slotId: 'neck_lateral',
    labelFr: 'Nuque — latéral',
    pattern: 'neck',
    prescription: '10s/côté',
    exerciseIds: [
      'neck__lateral_flexion_iso__bodyweight',
      'neck__lateral_flexion_iso__band',
    ],
    forGroup: 'front_row',
  },
]

export const BLOC_POSITION_FRONT_ROW: PositionAccentBlock = {
  id: 'BLOC_POSITION_FRONT_ROW',
  format: '2 tours',
  rest: '45–60s',
  slots: [
    ...NECK_FR,
    {
      slotId: 'adductors',
      labelFr: 'Adducteurs',
      pattern: 'groin_adductors',
      prescription: '15–20s/côté',
      exerciseIds: [
        'groin_adductors__copenhagen_plank__knee',
        'groin_adductors__copenhagen_plank__short',
        'groin_adductors__copenhagen_plank__long',
        'groin_adductors__supine_squeeze',
      ],
    },
    {
      slotId: 'carry_contact',
      labelFr: 'Grip / contact',
      pattern: 'carry',
      prescription: '20m',
      exerciseIds: [
        'carry__farmer_walk__backpack',
        'carry__farmer_walk__dumbbell',
        'push_horizontal__dip__parallel',
        'push_horizontal__dip__chair',
        'locomotion__bear_crawl',
      ],
    },
  ],
}

export const BLOC_POSITION_BACK_THREE: PositionAccentBlock = {
  id: 'BLOC_POSITION_BACK_THREE',
  format: '2 tours',
  rest: '45–60s',
  slots: [
    {
      slotId: 'cod_speed',
      labelFr: 'COD / vitesse',
      pattern: 'agility',
      prescription: '5m shuffle ou 3/côté bound',
      exerciseIds: ['power__lateral_bound', 'power__split_jump__bodyweight'],
    },
    {
      slotId: 'trunk_anti_rot',
      labelFr: 'Trunk anti-rotation',
      pattern: 'core_anti_rotation',
      prescription: '15s/côté',
      exerciseIds: [
        'core_anti_rotation__pallof_press__band',
        'core_anti_rotation__side_plank',
      ],
    },
    {
      slotId: 'pull_tackle',
      labelFr: 'Pull plaquage',
      pattern: 'pull_vertical',
      prescription: '5 reps qualité',
      exerciseIds: [
        'pull_vertical__pull_up__neutral',
        'pull_vertical__pull_up__feet_assisted',
        'pull_vertical__pull_up__band_assisted',
        'pull_horizontal__inverted_row__feet_elevated',
        'pull_horizontal__inverted_row__standard',
      ],
    },
  ],
}

/** Nuque optionnelle 1 tour pour arrières plaquage lourd */
export const BLOC_POSITION_BACK_THREE_NECK_OPTIONAL: PositionAccentSlot[] = NECK_FR.map(
  (s) => ({ ...s, forGroup: undefined }),
)

export function getPositionAccentBlock(group: PositionGroup): PositionAccentBlock {
  return group === 'front_row' ? BLOC_POSITION_FRONT_ROW : BLOC_POSITION_BACK_THREE
}

/** Séances où le bloc position complet est recommandé */
export const POSITION_ACCENT_SESSION_TYPES = new Set([
  'lower',
  'upper',
  'full',
  'full_light_primer',
])
