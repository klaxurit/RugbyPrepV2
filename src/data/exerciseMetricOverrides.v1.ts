export type ProgressionHint = 'load' | 'distance' | 'height' | 'quality' | 'speed'

export interface ExerciseMetricOverride {
  metricType: 'load_reps' | 'reps' | 'seconds' | 'meters'
  progressionHint: ProgressionHint
  suggestionTemplate: string
}

export const EXERCISE_METRIC_OVERRIDES: Record<string, ExerciseMetricOverride> = {
  // Plyo / jumps / bounds
  'push_horizontal__push_up__plyo': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Reps explosives, stop si la vitesse chute.'
  },
  'push_horizontal__push_up__oscillation': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Rythme rapide, qualité avant fatigue.'
  },
  'lower_jump__broad_jump__seated': {
    metricType: 'meters',
    progressionHint: 'distance',
    suggestionTemplate: 'Cherche la distance avec réception propre.'
  },
  'power__jump__broad_jump': {
    metricType: 'meters',
    progressionHint: 'distance',
    suggestionTemplate: 'Distance ou qualité, pas de grind.'
  },
  'power__jump__box_jump': {
    metricType: 'reps',
    progressionHint: 'height',
    suggestionTemplate: 'Sauts propres, hauteur stable ou légère hausse.'
  },
  'power__jump__vertical_jump': {
    metricType: 'reps',
    progressionHint: 'height',
    suggestionTemplate: 'Reps propres, cherche la hauteur sans fatigue.'
  },
  'lower_jump__box_squat_jump': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Explosif, stop si la vitesse baisse.'
  },
  'unilateral__jump_step_up': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Reps propres par jambe, vitesse avant volume.'
  },
  'power__bound__single_leg': {
    metricType: 'meters',
    progressionHint: 'distance',
    suggestionTemplate: 'Distance avec stabilité du bassin.'
  },

  // Med ball
  'power__medball_chest_pass__wall': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Lancer explosif, relâche total.'
  },
  'power__medball_slam__overhead': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Slam rapide, gainage fort.'
  },
  'power__medball_rotational_throw__wall': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Rotation rapide, contrôle du tronc.'
  },

  // Carries
  'carry__farmer_walk__dumbbell': {
    metricType: 'meters',
    progressionHint: 'distance',
    suggestionTemplate: 'Posture haute, distance propre.'
  },
  'carry__suitcase_walk__dumbbell': {
    metricType: 'meters',
    progressionHint: 'distance',
    suggestionTemplate: 'Tronc gainé, pas d’inclinaison.'
  },
  'carry__overhead_carry__dumbbell': {
    metricType: 'meters',
    progressionHint: 'quality',
    suggestionTemplate: 'Bras verrouillé, posture stable.'
  },
  'carry__overhead_hold__dumbbell': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Tenue propre, épaule stable.'
  },
  'carry__farmer_hold__dumbbell': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Posture haute, grip solide.'
  },
  'carry__zercher_carry__barbell': {
    metricType: 'meters',
    progressionHint: 'distance',
    suggestionTemplate: 'Tronc solide, respiration calme.'
  },

  // Isometrics (core / neck)
  'core_anti_extension__ghd_iso': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Tenue propre, pas de cambrure.'
  },
  'core_anti_extension__front_plank': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Ribs down, posture stable.'
  },
  'core_anti_rotation__side_plank': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Bassin stable, respiration calme.'
  },
  'core_anti_extension__hollow_hold': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Dos plaqué, contrôle.'
  },
  'groin_adductors__copenhagen_plank__short': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Hanche stable, pas de douleur.'
  },
  'groin_adductors__copenhagen_plank__long': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Tenue propre, stop si douleur.'
  },
  'hamstring__bridge_iso__single_leg': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Bassin stable, ischios engagés.'
  },
  'neck__flexion_iso__band': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Tête neutre, résistance progressive.'
  },
  'neck__extension_iso__band': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Contrôle, pas d’hyperextension.'
  },
  'neck__lateral_flexion_iso__band': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Tenue propre, appuis stables.'
  },
  'neck__rotation_iso__band': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Oppose la rotation sans bouger.'
  },

  // Strength lifts (explicit overrides for clarity)
  'push_horizontal__bench_press__barbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Charge progressive, vitesse propre.'
  },
  'push_horizontal__board_press__barbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Lourd contrôlé, priorité vitesse.'
  },
  'squat__front_squat__barbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Tronc solide, monte léger si propre.'
  },
  'hinge__rdl__barbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Dos neutre, charge stable.'
  },
  'pull_horizontal__tbar_row': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Tirage puissant, contrôle.'
  }
}
