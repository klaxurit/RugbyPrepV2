export type ProgressionHint = 'load' | 'distance' | 'height' | 'quality' | 'speed'

export type ProgressionFamily = 'upper_compound' | 'lower_compound' | 'assistance' | 'ballistic_iso'

export interface ExerciseMetricOverride {
  metricType: 'load_reps' | 'reps' | 'seconds' | 'meters'
  progressionHint: ProgressionHint
  suggestionTemplate: string
  progressionFamily?: ProgressionFamily
}

export const EXERCISE_METRIC_OVERRIDES: Record<string, ExerciseMetricOverride> = {
  // ── Plyo / jumps / bounds ───────────────────────────────────
  'push_horizontal__push_up__plyo': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Reps explosives, stop si la vitesse chute.',
    progressionFamily: 'ballistic_iso'
  },
  'push_horizontal__push_up__oscillation': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Rythme rapide, qualité avant fatigue.',
    progressionFamily: 'ballistic_iso'
  },
  'lower_jump__broad_jump__seated': {
    metricType: 'meters',
    progressionHint: 'distance',
    suggestionTemplate: 'Cherche la distance avec réception propre.',
    progressionFamily: 'ballistic_iso'
  },
  'power__jump__broad_jump': {
    metricType: 'meters',
    progressionHint: 'distance',
    suggestionTemplate: 'Distance ou qualité, pas de grind.',
    progressionFamily: 'ballistic_iso'
  },
  'power__jump__box_jump': {
    metricType: 'reps',
    progressionHint: 'height',
    suggestionTemplate: 'Sauts propres, hauteur stable ou légère hausse.',
    progressionFamily: 'ballistic_iso'
  },
  'power__jump__vertical_jump': {
    metricType: 'reps',
    progressionHint: 'height',
    suggestionTemplate: 'Reps propres, cherche la hauteur sans fatigue.',
    progressionFamily: 'ballistic_iso'
  },
  'lower_jump__box_squat_jump': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Explosif, stop si la vitesse baisse.',
    progressionFamily: 'ballistic_iso'
  },
  'unilateral__jump_step_up': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Reps propres par jambe, vitesse avant volume.',
    progressionFamily: 'ballistic_iso'
  },
  'power__bound__single_leg': {
    metricType: 'meters',
    progressionHint: 'distance',
    suggestionTemplate: 'Distance avec stabilité du bassin.',
    progressionFamily: 'ballistic_iso'
  },
  'power__countermovement_jump': {
    metricType: 'reps',
    progressionHint: 'height',
    suggestionTemplate: 'Explosion verticale maximale.',
    progressionFamily: 'ballistic_iso'
  },
  'power__lateral_bound': {
    metricType: 'meters',
    progressionHint: 'distance',
    suggestionTemplate: 'Réception stable, relance explosive.',
    progressionFamily: 'ballistic_iso'
  },
  'power__split_jump__band_assisted': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Explosif, atterrissage doux.',
    progressionFamily: 'ballistic_iso'
  },
  'power__pogo_hops__low': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Contact sol court, rapide.',
    progressionFamily: 'ballistic_iso'
  },
  'power__split_jump__bodyweight': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Explosif, atterrissage doux.',
    progressionFamily: 'ballistic_iso'
  },
  'power__squat_jump__bodyweight': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Explosif, hauteur maximale.',
    progressionFamily: 'ballistic_iso'
  },

  // ── Préhab épaule (charge poulie / haltères légers) ─────────
  'prehab_shoulder__face_pull__cable': {
    metricType: 'load_reps',
    progressionHint: 'quality',
    suggestionTemplate: 'Charge légère, coudes hauts, tirage au visage.',
    progressionFamily: 'assistance',
  },
  'prehab_shoulder__tyi__incline_bench': {
    metricType: 'load_reps',
    progressionHint: 'quality',
    suggestionTemplate: 'Haltères très légers, tenue contrôlée par position.',
    progressionFamily: 'assistance',
  },

  // ── Med ball ────────────────────────────────────────────────
  'power__medball_chest_pass__wall': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Lancer explosif, relâche total.',
    progressionFamily: 'ballistic_iso'
  },
  'power__medball_slam__overhead': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Slam rapide, gainage fort.',
    progressionFamily: 'ballistic_iso'
  },
  'power__medball_rotational_throw__wall': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Rotation rapide, contrôle du tronc.',
    progressionFamily: 'ballistic_iso'
  },
  'power__medball_throw__supine': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Lancer explosif, relâche total.',
    progressionFamily: 'ballistic_iso'
  },

  // ── Carries ─────────────────────────────────────────────────
  'carry__farmer_walk__dumbbell': {
    metricType: 'meters',
    progressionHint: 'distance',
    suggestionTemplate: 'Posture haute, distance propre.',
    progressionFamily: 'ballistic_iso'
  },
  'carry__suitcase_walk__dumbbell': {
    metricType: 'meters',
    progressionHint: 'distance',
    suggestionTemplate: 'Tronc gainé, pas d\'inclinaison.',
    progressionFamily: 'ballistic_iso'
  },
  'carry__overhead_carry__dumbbell': {
    metricType: 'meters',
    progressionHint: 'quality',
    suggestionTemplate: 'Bras verrouillé, posture stable.',
    progressionFamily: 'ballistic_iso'
  },
  'carry__overhead_hold__dumbbell': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Tenue propre, épaule stable.',
    progressionFamily: 'ballistic_iso'
  },
  'carry__farmer_hold__dumbbell': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Posture haute, grip solide.',
    progressionFamily: 'ballistic_iso'
  },
  'carry__zercher_carry__barbell': {
    metricType: 'meters',
    progressionHint: 'distance',
    suggestionTemplate: 'Tronc solide, respiration calme.',
    progressionFamily: 'ballistic_iso'
  },
  'carry__front_rack_carry': {
    metricType: 'meters',
    progressionHint: 'distance',
    suggestionTemplate: 'Tronc gainé, posture haute.',
    progressionFamily: 'ballistic_iso'
  },

  // ── Isometrics (core / neck) ────────────────────────────────
  'core_anti_extension__ghd_iso': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Tenue propre, pas de cambrure.',
    progressionFamily: 'ballistic_iso'
  },
  'core_anti_extension__front_plank': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Ribs down, posture stable.',
    progressionFamily: 'ballistic_iso'
  },
  'core_anti_rotation__side_plank': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Bassin stable, respiration calme.',
    progressionFamily: 'ballistic_iso'
  },
  'core_anti_extension__hollow_hold': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Dos plaqué, contrôle.',
    progressionFamily: 'ballistic_iso'
  },
  'groin_adductors__copenhagen_plank__short': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Hanche stable, pas de douleur.',
    progressionFamily: 'ballistic_iso'
  },
  'groin_adductors__copenhagen_plank__long': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Tenue propre, stop si douleur.',
    progressionFamily: 'ballistic_iso'
  },
  'hamstring__bridge_iso__single_leg': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Bassin stable, ischios engagés.',
    progressionFamily: 'ballistic_iso'
  },
  'neck__flexion_iso__band': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Tête neutre, résistance progressive.',
    progressionFamily: 'ballistic_iso'
  },
  'neck__extension_iso__band': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Contrôle, pas d\'hyperextension.',
    progressionFamily: 'ballistic_iso'
  },
  'neck__lateral_flexion_iso__band': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Tenue propre, appuis stables.',
    progressionFamily: 'ballistic_iso'
  },
  'neck__rotation_iso__band': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Oppose la rotation sans bouger.',
    progressionFamily: 'ballistic_iso'
  },
  'neck__extension__band': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Isométrique contrôlé, augmente le temps si stable.',
    progressionFamily: 'ballistic_iso'
  },
  'neck__isometric__band': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Tenue propre, contrôle.',
    progressionFamily: 'ballistic_iso'
  },

  // ── Strength lifts — Upper Compound ─────────────────────────
  'push_horizontal__bench_press__barbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Charge progressive, vitesse propre.',
    progressionFamily: 'upper_compound'
  },
  'push_horizontal__board_press__barbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Lourd contrôlé, priorité vitesse.',
    progressionFamily: 'upper_compound'
  },
  'push_horizontal__bench_press__football_bar': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Prise neutre, charge progressive.',
    progressionFamily: 'upper_compound'
  },
  'push_horizontal__bench_press__dumbbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Charge progressive, amplitude complète.',
    progressionFamily: 'upper_compound'
  },
  'push_horizontal__bench_press__incline__dumbbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Incliné 30-45°, charge progressive.',
    progressionFamily: 'upper_compound'
  },
  'push_vertical__overhead_press__barbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Presse stricte, charge nette.',
    progressionFamily: 'upper_compound'
  },
  'push_vertical__dumbbell_press__seated': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Charge progressive, trajectoire libre.',
    progressionFamily: 'upper_compound'
  },
  'power__push_press__barbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Explosif, charge nette.',
    progressionFamily: 'upper_compound'
  },
  'pull_horizontal__pendlay_row__barbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Tirage explosif, retour au sol.',
    progressionFamily: 'upper_compound'
  },
  'pull_horizontal__tbar_row': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Tirage puissant, contrôle.',
    progressionFamily: 'upper_compound'
  },

  // ── Strength lifts — Lower Compound ─────────────────────────
  'squat__back_squat__barbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Charge progressive, technique solide.',
    progressionFamily: 'lower_compound'
  },
  'squat__front_squat__barbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Tronc solide, monte léger si propre.',
    progressionFamily: 'lower_compound'
  },
  'squat__box_squat__barbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Contrôle au box, explosion.',
    progressionFamily: 'lower_compound'
  },
  'squat__pin_squat__barbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Départ bas, explosion.',
    progressionFamily: 'lower_compound'
  },
  'hinge__deadlift__trap_bar': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Charge nette, pas de grind. +2.5-5 kg si toutes séries propres.',
    progressionFamily: 'lower_compound'
  },
  'hinge__rdl__barbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Dos neutre, charge stable.',
    progressionFamily: 'lower_compound'
  },
  'hinge__hip_thrust__barbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Hanches au plafond, charge progressive.',
    progressionFamily: 'lower_compound'
  },
  'lower_squat__bulgarian_split_squat__dumbbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Stabilité, profondeur, puis charge.',
    progressionFamily: 'lower_compound'
  },

  // ── Assistance — load-based ─────────────────────────────────
  'arm_curl__hammer_curl__dumbbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Progresse par reps d\'abord, puis charge.',
    progressionFamily: 'assistance'
  },
  'arm_curl__alternating_curl__dumbbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Contrôle la descente, pas de balancier.',
    progressionFamily: 'assistance'
  },
  'arm_extension__french_press__ez_bar': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Descente contrôlée, coudes fixes.',
    progressionFamily: 'assistance'
  },
  'arm_extension__skull_crusher__ez_bar': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Coudes fixes, descente au front.',
    progressionFamily: 'assistance'
  },
  'arm_extension__pressdown__cable_rope': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Coudes au corps, extension complète.',
    progressionFamily: 'assistance'
  },
  'shoulder_isolation__lateral_raise__dumbbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Léger, contrôle, pas de balancier.',
    progressionFamily: 'assistance'
  },
  'knee_extension__leg_extension__machine': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Extension complète, descente contrôlée.',
    progressionFamily: 'assistance'
  },
  'hamstring__leg_curl__machine': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Contrôle, pas de compensations.',
    progressionFamily: 'assistance'
  },
  'hamstring__nordic__partner': {
    metricType: 'reps',
    progressionHint: 'quality',
    suggestionTemplate: 'Descente la plus lente possible.',
    progressionFamily: 'assistance'
  },
  'core_rotation__landmine_rotation': {
    metricType: 'load_reps',
    progressionHint: 'quality',
    suggestionTemplate: 'Contrôle et amplitude, pas charge.',
    progressionFamily: 'assistance'
  },
  'core_rotation__cable_chop': {
    metricType: 'load_reps',
    progressionHint: 'quality',
    suggestionTemplate: 'Tronc gainé, rotation contrôlée.',
    progressionFamily: 'assistance'
  },
  'pull_horizontal__landmine_row': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Dos neutre, tirage puissant.',
    progressionFamily: 'assistance'
  },
  'pull_horizontal__cable_row__half_kneeling': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Tronc gainé, tirage contrôlé.',
    progressionFamily: 'assistance'
  },
  'pull_horizontal__chest_supported_row__dumbbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Tirage puissant, contrôle excentrique.',
    progressionFamily: 'assistance'
  },
  'pull_horizontal__one_arm_row__dumbbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Tirage puissant, tronc stable.',
    progressionFamily: 'assistance'
  },
  'hinge__rdl__single_leg__dumbbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Stabilité et contrôle, puis charge.',
    progressionFamily: 'assistance'
  },
  'hinge__rdl__hex_bar': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Prise neutre, dos verrouillé.',
    progressionFamily: 'assistance'
  },
  'hinge__rdl__dumbbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Dos neutre, descente contrôlée.',
    progressionFamily: 'assistance'
  },
  'power__landmine_press__speed': {
    metricType: 'load_reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Vitesse maximale, charge légère.',
    progressionFamily: 'assistance'
  },
  'push_vertical__landmine_press__kneeling': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Stabilité + charge progressive.',
    progressionFamily: 'assistance'
  },
  'squat__leg_press__machine': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Pieds largeur épaules, descente 90°.',
    progressionFamily: 'assistance'
  },
  'calf__seated_raise__machine': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Amplitude complète, 2s en bas.',
    progressionFamily: 'assistance'
  },
  'calf__weighted_raise__barbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Amplitude complète, pause en bas.',
    progressionFamily: 'assistance'
  },
  'calf__leg_press_calf__machine': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Extension complète, descente lente.',
    progressionFamily: 'assistance'
  },
  'lower_lunge__reverse_lunge__barbell': {
    metricType: 'load_reps',
    progressionHint: 'load',
    suggestionTemplate: 'Stabilité, profondeur, puis charge.',
    progressionFamily: 'assistance'
  },

  // ── Banded power (reps, no load tracking) ───────────────────
  'squat__anderson_box_squat__banded': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Explosion depuis le box, tension de bande.',
    progressionFamily: 'ballistic_iso'
  },
  'hinge__kb_swing__banded': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Extension explosive des hanches.',
    progressionFamily: 'ballistic_iso'
  },

  // ── Sprint / Agility ────────────────────────────────────────
  'sprint__short_acceleration': {
    metricType: 'meters',
    progressionHint: 'speed',
    suggestionTemplate: 'Qualité technique, repos complet.',
    progressionFamily: 'ballistic_iso'
  },
  'sprint__free_acceleration': {
    metricType: 'meters',
    progressionHint: 'speed',
    suggestionTemplate: 'Vitesse maximale progressive.',
    progressionFamily: 'ballistic_iso'
  },
  'sprint__resisted_acceleration': {
    metricType: 'meters',
    progressionHint: 'speed',
    suggestionTemplate: 'Qualité du mouvement, 10-20% BW.',
    progressionFamily: 'ballistic_iso'
  },
  'sprint__falling_start_short': {
    metricType: 'reps',
    progressionHint: 'speed',
    suggestionTemplate: 'Intention max, 3–5 pas. Repos complet.',
    progressionFamily: 'ballistic_iso'
  },

  // ── Sled ────────────────────────────────────────────────────
  'sled__push__standard': {
    metricType: 'meters',
    progressionHint: 'distance',
    suggestionTemplate: 'Poussée puissante, posture basse.',
    progressionFamily: 'ballistic_iso'
  },
  'carry__sled_push__light': {
    metricType: 'meters',
    progressionHint: 'distance',
    suggestionTemplate: 'Poussée légère, posture haute.',
    progressionFamily: 'ballistic_iso'
  },

  // ── Locomotion / Mobility / Warmup ──────────────────────────
  'locomotion__bear_crawl': {
    metricType: 'meters',
    progressionHint: 'distance',
    suggestionTemplate: 'Distance propre, pas de vitesse forcée.',
    progressionFamily: 'ballistic_iso'
  },
  'lower_squat__split_squat_iso__bodyweight': {
    metricType: 'seconds',
    progressionHint: 'quality',
    suggestionTemplate: 'Position basse, genou arrière proche du sol.',
    progressionFamily: 'ballistic_iso'
  },
}
