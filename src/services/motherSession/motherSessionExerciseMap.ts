/**
 * Mapping explicite : nom d'exercice mother-session → exerciseId catalogue.
 *
 * Seuls les exercices présents ici sont loggables en V1.
 * Les directives textuelles et exercices "or" sont exclus.
 */

/**
 * Normalise un nom d'exercice MS vers une forme canonique pour le lookup.
 * lowercase → trim → collapse whitespace → normaliser tirets/apostrophes.
 */
export function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\u2018\u2019\u0060\u00B4]/g, "'")
    .replace(/[–—]/g, '-')
}

const MS_EXERCISE_MAP: Record<string, string> = {
  // ── Main Lifts ──────────────────────────────────────────────
  'bench press': 'push_horizontal__bench_press__barbell',
  'back squat': 'squat__back_squat__barbell',
  'front squat': 'squat__front_squat__barbell',
  'trap bar deadlift': 'hinge__deadlift__trap_bar',
  'football bar bench press': 'push_horizontal__bench_press__football_bar',
  'box squat': 'squat__box_squat__barbell',
  'pin back squat': 'squat__pin_squat__barbell',
  'pin squat': 'squat__pin_squat__barbell',
  'pin squat barre': 'squat__pin_squat__barbell',
  'front squat barre': 'squat__front_squat__barbell',
  'box squat barre': 'squat__box_squat__barbell',
  'push press': 'power__push_press__barbell',
  'push-up': 'push_horizontal__push_up__standard',
  'push up': 'push_horizontal__push_up__standard',
  'strict standing overhead press': 'push_vertical__overhead_press__barbell',
  'machine shoulder press': 'push_vertical__shoulder_press__machine',
  'shoulder press machine': 'push_vertical__shoulder_press__machine',

  // ── Dumbbell / Incline ──────────────────────────────────────
  'db bench press': 'push_horizontal__bench_press__dumbbell',
  'db incline bench press': 'push_horizontal__bench_press__incline__dumbbell',
  'incline db bench press': 'push_horizontal__bench_press__incline__dumbbell',
  'seated db overhead press': 'push_vertical__dumbbell_press__seated',
  'incline push-up': 'push_horizontal__push_up__incline',
  'decline push-up': 'push_horizontal__push_up__decline',
  'pike push-up': 'push_vertical__pike_push_up__bodyweight',
  'pike push-up feet elevated': 'push_vertical__pike_push_up__feet_elevated',
  'parallel bar dip': 'push_horizontal__dip__parallel',
  'dips': 'push_horizontal__dip__parallel',
  'dip': 'push_horizontal__dip__parallel',
  'chair dip': 'push_horizontal__dip__chair',
  'archer push-up': 'push_horizontal__archer_push_up__bodyweight',

  // ── Pulls ───────────────────────────────────────────────────
  'chest-supported row': 'pull_horizontal__chest_supported_row__dumbbell',
  'pendlay row': 'pull_horizontal__pendlay_row__barbell',
  't-bar row': 'pull_horizontal__tbar_row',
  'landmine row': 'pull_horizontal__landmine_row',
  'inverted row': 'pull_horizontal__inverted_row__knees_bent',
  'inverted row standard': 'pull_horizontal__inverted_row__standard',
  'inverted row feet elevated': 'pull_horizontal__inverted_row__feet_elevated',
  'rowing inversé pieds surélevés': 'pull_horizontal__inverted_row__feet_elevated',
  'single-arm db row': 'pull_horizontal__one_arm_row__dumbbell',
  'one-arm row': 'pull_horizontal__one_arm_row__dumbbell',
  'half-kneeling cable row': 'pull_horizontal__cable_row__half_kneeling',
  'seated cable row': 'pull_horizontal__cable_row__seated',
  'chest-supported machine row': 'pull_horizontal__chest_supported_row__machine',
  'neutral-grip pull-up': 'pull_vertical__pull_up__neutral',
  'assisted neutral-grip pull-up': 'pull_vertical__pull_up__neutral__assisted',
  'assisted neutral grip pull-up': 'pull_vertical__pull_up__neutral__assisted',
  'assisted pull-up machine': 'pull_vertical__pull_up__neutral__assisted',
  'neutral-grip lat pulldown': 'pull_vertical__lat_pulldown__machine',
  'face pull': 'prehab_shoulder__face_pull__cable',
  'face pull cable': 'prehab_shoulder__face_pull__cable',
  'face pull band': 'prehab_shoulder__face_pull__band',
  'face pull élastique': 'prehab_shoulder__face_pull__band',
  't-y-i incline bench': 'prehab_shoulder__tyi__incline_bench',
  'tyi incline bench': 'prehab_shoulder__tyi__incline_bench',

  // ── Hinge / Hip ─────────────────────────────────────────────
  'barbell hip thrust': 'hinge__hip_thrust__barbell',
  'barbell romanian deadlift': 'hinge__rdl__barbell',
  'db romanian deadlift': 'hinge__rdl__dumbbell',
  'romanian deadlift': 'hinge__rdl__dumbbell',
  'hex bar rdl': 'hinge__rdl__hex_bar',
  'single-leg rdl': 'hinge__rdl__single_leg__dumbbell',
  'kickstand rdl': 'hinge__single_leg_rdl__bodyweight',
  'good morning': 'hinge__good_morning__bodyweight',
  'single-leg romanian deadlift': 'hinge__rdl__single_leg__dumbbell',
  'nordic curl': 'hamstring__nordic__partner',
  'lying leg curl': 'hamstring__leg_curl__machine',
  'leg curl machine': 'hamstring__leg_curl__machine',
  'glute bridge': 'hinge__glute_bridge__bodyweight',
  'single-leg glute bridge': 'hamstring__bridge_iso__single_leg',

  // ── Squat Variants ──────────────────────────────────────────
  'goblet squat': 'squat__goblet_squat__dumbbell',
  'rear-foot elevated split squat': 'lower_squat__bulgarian_split_squat__dumbbell',
  'bulgarian split squat': 'lower_squat__bulgarian_split_squat__bodyweight',
  'banded nordic': 'hamstring__nordic__band_assist',
  'nordic eccentric': 'hamstring__nordic__eccentric_solo',
  'reverse lunge': 'lower_lunge__reverse_lunge__barbell',
  'reverse lunge bodyweight': 'lower_lunge__reverse_lunge__bodyweight',
  'bodyweight squat': 'squat__bodyweight_squat',
  'bodyweight split squat': 'lower_squat__split_squat__bodyweight',
  'leg extension': 'knee_extension__leg_extension__machine',
  'hack squat': 'squat__hack_squat__machine',
  'machine hack squat': 'squat__hack_squat__machine',
  'leg press calf press': 'calf__leg_press_calf__machine',
  'banded anderson box squat': 'squat__anderson_box_squat__banded',

  // ── Arms ────────────────────────────────────────────────────
  'hammer curl': 'arm_curl__hammer_curl__dumbbell',
  'alternating db curl': 'arm_curl__alternating_curl__dumbbell',
  'french press': 'arm_extension__french_press__ez_bar',
  'skull crusher': 'arm_extension__skull_crusher__ez_bar',
  'rope pressdown': 'arm_extension__pressdown__cable_rope',
  'lateral raise': 'shoulder_isolation__lateral_raise__dumbbell',

  // ── Landmine / Press ────────────────────────────────────────
  'half-kneeling landmine press': 'push_vertical__landmine_press__kneeling',
  'single-arm landmine press': 'power__landmine_press__speed',
  'explosive landmine press': 'power__landmine_press__speed',
  'cable press explosif': 'power__cable_press__explosive',
  'explosive cable press': 'power__cable_press__explosive',

  // ── Core ────────────────────────────────────────────────────
  'landmine rotation': 'core_rotation__landmine_rotation',
  'cable chop': 'core_rotation__cable_chop',
  'cable rotation explosif': 'core_rotation__cable_rotation__explosive',
  'explosive cable rotation': 'core_rotation__cable_rotation__explosive',
  'cable chop explosif': 'core_rotation__cable_rotation__explosive',
  'band rotation explosive': 'core_rotation__band_rotation__explosive',
  'dead bug': 'core_anti_extension__dead_bug',
  'bird dog': 'activation__bird_dog__bodyweight',
  'side plank': 'core_anti_rotation__side_plank',
  'pallof press hold': 'core_anti_rotation__pallof_press__band',

  // ── Carries ─────────────────────────────────────────────────
  'farmer carry': 'carry__farmer_walk__dumbbell',
  'farmer walk (backpack)': 'carry__farmer_walk__backpack',
  'suitcase carry': 'carry__suitcase_walk__dumbbell',
  'zercher carry': 'carry__zercher_carry__barbell',
  'front rack carry': 'carry__front_rack_carry',
  'light sled push': 'carry__sled_push__light',
  'sled push': 'sled__push__standard',

  // ── Calves ──────────────────────────────────────────────────
  'single-leg calf raise': 'calf__standing_raise__single_leg__bodyweight',
  'seated calf raise': 'calf__seated_raise__machine',
  'weighted calf raise': 'calf__weighted_raise__barbell',

  // ── Power / Plyo ────────────────────────────────────────────
  'broad jump': 'power__jump__broad_jump',
  'box jump': 'power__jump__box_jump',
  'squat jump': 'power__squat_jump__bodyweight',
  'countermovement jump': 'power__countermovement_jump',
  'lateral bound': 'power__lateral_bound',
  'lateral squat jump': 'power__split_jump__bodyweight',
  'plyo push-up': 'push_horizontal__push_up__plyo',
  'med ball chest pass': 'power__medball_chest_pass__wall',
  'med ball slam': 'power__medball_slam__overhead',
  'med ball rotational throw': 'power__medball_rotational_throw__wall',
  'med ball throw': 'power__medball_slam__overhead',
  'supine med ball throw': 'power__medball_throw__supine',
  'cable slam haut vers bas': 'power__cable_slam__high_to_low',
  'high-to-low cable slam': 'power__cable_slam__high_to_low',
  'band-assisted split jump': 'power__split_jump__band_assisted',
  'banded kb swing': 'hinge__kb_swing__banded',
  'banded kettlebell swing': 'hinge__kb_swing__banded',
  'low pogo hops': 'power__pogo_hops__low',
  'pogo hops': 'power__pogo_hops__low',

  // ── Adductors / Groin ───────────────────────────────────────
  'short copenhagen hold': 'groin_adductors__copenhagen_plank__short',
  'copenhagen knee': 'groin_adductors__copenhagen_plank__knee',
  'copenhagen hold': 'groin_adductors__copenhagen_plank__foot_elevated',
  'copenhagen plank': 'groin_adductors__copenhagen_plank__foot_elevated',
  'supine adductor squeeze': 'groin_adductors__ball_squeeze__supine',

  // ── Neck ────────────────────────────────────────────────────
  'neck isometric': 'neck__isometric__band',
  'banded neck isometric': 'neck__isometric__band',
  'neck flexion isometric': 'neck__flexion_iso__bodyweight',
  'neck flexion isometric (hand)': 'neck__flexion_iso__bodyweight',
  'neck extension isometric': 'neck__extension_iso__bodyweight',
  'neck extension isometric (hand)': 'neck__extension_iso__bodyweight',
  'neck lateral flexion isometric (hand)': 'neck__lateral_flexion_iso__bodyweight',
  'banded neck extension': 'neck__extension__band',

  // ── Prehab / Shoulder ───────────────────────────────────────
  'scap push-up': 'prehab_shoulder__scap_pushup__bodyweight',
  'band external rotation': 'prehab_shoulder__external_rotation__band',
  'band pull-apart': 'activation__band_pull_apart__overhead',
  'serratus reach': 'prehab_shoulder__serratus_reach__supine',

  // ── Tibialis ────────────────────────────────────────────────
  'tibialis raise': 'tibialis__raise__bodyweight',
  'wall tibialis raise': 'tibialis__raise__bodyweight',

  // ── Warmup / Mobility ───────────────────────────────────────
  'ankle rocks': 'mobility__ankle_rocks',
  'adductor rock-back': 'mobility__adductor_rock_back',
  '90/90 hip switch': 'mobility__hip_90_90',
  "world's greatest stretch": 'mobility__worlds_greatest_stretch',
  'thoracic rotation': 'mobility__thoracic_rotation_seated',
  /* Échauffement : synonyme « TYI light » catalogue prehab band. */
  'tyi light': 'prehab_shoulder__band_tyi',

  // ── Sprint / Agility ────────────────────────────────────────
  'short acceleration sprint': 'sprint__short_acceleration',
  'free acceleration sprint': 'sprint__free_acceleration',
  'resisted acceleration': 'sprint__resisted_acceleration',
  'falling start sprint': 'sprint__falling_start_short',
  '5-10-5 shuttle': 'agility__shuttle_5_10_5',
  'acceleration to lateral shuffle to sprint': 'agility__lateral_shuffle_sprint',
  'reactive start to 45-degree cut': 'agility__reactive_cut_45',

  // ── Misc warm-up ────────────────────────────────────────────
  'wall drill march': 'warmup__wall_drill_march',
  'a-skip': 'warmup__a_skip',
  'bear crawl': 'locomotion__bear_crawl',
  'split squat isometric hold': 'lower_squat__split_squat_iso__bodyweight',
}

/** Résout un nom d'exercice MS vers un exerciseId. Normalise avant lookup. */
export function resolveExerciseId(msExerciseName: string): string | undefined {
  // Exercices "or" = non-loggable en V1
  if (msExerciseName.includes(' or ')) return undefined
  return MS_EXERCISE_MAP[normalizeExerciseName(msExerciseName)]
}

/**
 * Résolution pour démos vidéo : accepte les intitulés composites « X or Y »
 * en prenant le premier segment mappé (ex. band pull-apart + TYI light).
 * Ne doit pas être utilisé pour la log de séries (voir `resolveExerciseId`).
 */
export function resolveExerciseIdForDemo(msExerciseName: string): string | undefined {
  const trimmed = msExerciseName.trim()
  const direct = resolveExerciseId(trimmed)
  if (direct) return direct

  const orParts = trimmed
    .split(/\s+or\s+/i)
    .map((p) => p.trim())
    .filter(Boolean)
  if (orParts.length < 2) return undefined

  for (const part of orParts) {
    const id = resolveExerciseId(part)
    if (id) return id
  }
  return undefined
}

/**
 * Identifiant catalogue pour le moteur de séance (`sessionRun`, sticky « Valider »,
 * autosave séries). On applique d'abord la résolution stricte (`resolveExerciseId`),
 * puis le même recul que les démos (`resolveExerciseIdForDemo`) pour les intitulés
 * composites « X or Y », afin que le curseur ne tombe pas à `null` au démarrage.
 */
export function resolveExerciseIdForSessionRun(
  msExerciseName: string,
  explicitId?: string | null,
): string | undefined {
  const trimmed = explicitId?.trim()
  if (trimmed) return trimmed
  return resolveExerciseId(msExerciseName) ?? resolveExerciseIdForDemo(msExerciseName)
}

/** Vérifie si un nom est une directive textuelle (pas un exercice loggable).
 *  Patterns: "2 progressive prep sets", "1 easy prep round", "2-3 progressive ramp-up sets"
 *  NOT matched: "1-arm landmine press", "5-10-5 Shuttle"
 */
export function isDirectiveText(name: string): boolean {
  const n = name.toLowerCase()
  // Must start with a number followed by a space AND contain a directive keyword
  const startsWithCount = /^\d[\d-]*\s/.test(n)
  const hasDirectiveKeyword =
    n.includes('progressive') ||
    n.includes('ramp-up') ||
    n.includes('prep set') ||
    n.includes('prep round') ||
    n.includes('rehearsal') ||
    n.includes('warm-up set')
  return startsWithCount && hasDirectiveKeyword
}

/** Returns all entries in the map (for testing). */
export function getAllMapEntries(): ReadonlyArray<[string, string]> {
  return Object.entries(MS_EXERCISE_MAP)
}
