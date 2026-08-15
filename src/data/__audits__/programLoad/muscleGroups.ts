/**
 * Registre exercice → groupes musculaires.
 *
 * Sert à compter le volume par groupe, seule unité qui permette de juger si un
 * muscle reçoit un stimulus suffisant. Un total de séries « toutes zones
 * confondues » ne distingue pas 60 séries bien concentrées de 60 séries
 * étalées sur huit groupes.
 *
 * Pondération : méthode « fractionnelle » de Pelland et al. 2025 (Sports Med,
 * méta-régressions volume/fréquence). Une série compte 1 pour le muscle
 * moteur principal et 0,5 pour un muscle sollicité de façon significative mais
 * secondaire. C'est la quantification pour laquelle leur modèle dose-réponse
 * s'ajuste le mieux.
 */

export type MuscleGroup =
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'calves'
  | 'trunk'
  | 'neck'
  | 'adductors'

/**
 * Groupes pour lesquels un plancher de volume a du sens. Les bras, mollets,
 * tronc, cou et adducteurs reçoivent l'essentiel de leur stimulus en indirect
 * ou relèvent de la prévention : leur imposer un plancher produirait du bruit.
 */
export const PRIMARY_MUSCLE_GROUPS: readonly MuscleGroup[] = [
  'quads',
  'hamstrings',
  'glutes',
  'chest',
  'back',
  'shoulders',
]

type Contribution = Partial<Record<MuscleGroup, 1 | 0.5>>

/** Normalise un nom d'exercice : casse, espaces, et alternatives « A or B ». */
export function normalizeExerciseName(name: string): string {
  const lowered = name.trim().toLowerCase().replace(/\s+/g, ' ')
  const [first] = lowered.split(' or ')
  return first
}

/**
 * Squat et fentes sont quadriceps-dominants : le fessier travaille réellement
 * mais n'est pas le moteur principal, il compte donc en fractionnel. Lui
 * donner 1 sur chaque flexion de jambe gonflait artificiellement son total
 * jusqu'à en faire le groupe le plus chargé de tout le programme.
 */
const SQUAT_PATTERN: Contribution = { quads: 1, glutes: 0.5 }
const HINGE_PATTERN: Contribution = { hamstrings: 1, glutes: 0.5 }
const HIP_DOMINANT: Contribution = { glutes: 1, hamstrings: 0.5 }
const HORIZONTAL_PUSH: Contribution = { chest: 1, triceps: 0.5, shoulders: 0.5 }
const VERTICAL_PUSH: Contribution = { shoulders: 1, triceps: 0.5 }
const ROW_PATTERN: Contribution = { back: 1, biceps: 0.5 }

/**
 * Exercices hors périmètre du volume d'hypertrophie : sprint, agilité,
 * mobilité, pliométrie, lancers de médecine-ball, poussées de traîneau.
 *
 * Les travaux balistiques produisent peu de stimulus hypertrophique et se
 * prescrivent à volume délibérément bas ; les compter ici ferait passer une
 * séance de puissance pour une séance de volume. Leur coût réel est neural, et
 * il est déjà suivi par `ballisticSets` dans `weeklyLoad.ts`.
 *
 * Ces exercices restent listés pour que le test d'exhaustivité les couvre.
 */
const NOT_HYPERTROPHY_VOLUME: Contribution = {}

export const EXERCISE_MUSCLE_MAP: Readonly<Record<string, Contribution>> = {
  // ── Sprint / agilité / mobilité ─────────────────────────────
  '5-10-5 shuttle': NOT_HYPERTROPHY_VOLUME,
  'a-skip': NOT_HYPERTROPHY_VOLUME,
  'acceleration to lateral shuffle to sprint': NOT_HYPERTROPHY_VOLUME,
  'free acceleration sprint': NOT_HYPERTROPHY_VOLUME,
  'reactive start to 45-degree cut': NOT_HYPERTROPHY_VOLUME,
  'resisted acceleration': NOT_HYPERTROPHY_VOLUME,
  'short acceleration sprint': NOT_HYPERTROPHY_VOLUME,
  "world's greatest stretch": NOT_HYPERTROPHY_VOLUME,

  // ── Squat ───────────────────────────────────────────────────
  'back squat': SQUAT_PATTERN,
  'box squat': SQUAT_PATTERN,
  'pin back squat': SQUAT_PATTERN,
  'front squat': { quads: 1, glutes: 0.5, trunk: 0.5 },
  'goblet squat': SQUAT_PATTERN,
  'bodyweight squat': SQUAT_PATTERN,
  'bulgarian split squat': SQUAT_PATTERN,
  'rear-foot elevated split squat': SQUAT_PATTERN,
  'reverse lunge': SQUAT_PATTERN,
  'reverse lunge bodyweight': SQUAT_PATTERN,
  'leg extension': { quads: 1 },

  // ── Hinge / chaîne postérieure ──────────────────────────────
  'barbell romanian deadlift': HINGE_PATTERN,
  'db romanian deadlift': HINGE_PATTERN,
  'single-leg rdl': HINGE_PATTERN,
  'single-leg romanian deadlift': HINGE_PATTERN,
  'kickstand rdl': HINGE_PATTERN,
  'trap bar deadlift': { quads: 1, glutes: 0.5, hamstrings: 0.5, back: 0.5 },
  'good morning': HINGE_PATTERN,
  'lying leg curl': { hamstrings: 1 },
  'nordic curl': { hamstrings: 1 },
  'nordic eccentric': { hamstrings: 1 },
  'barbell hip thrust': HIP_DOMINANT,
  'glute bridge': HIP_DOMINANT,
  'single-leg glute bridge': HIP_DOMINANT,
  'banded kb swing': HIP_DOMINANT,
  'banded kettlebell swing': HIP_DOMINANT,

  // ── Pliométrie / balistique bas du corps ────────────────────
  'box jump': NOT_HYPERTROPHY_VOLUME,
  'squat jump': NOT_HYPERTROPHY_VOLUME,
  'countermovement jump': NOT_HYPERTROPHY_VOLUME,
  'broad jump': NOT_HYPERTROPHY_VOLUME,
  'lateral bound': NOT_HYPERTROPHY_VOLUME,
  'band-assisted split jump': NOT_HYPERTROPHY_VOLUME,
  'low pogo hops': NOT_HYPERTROPHY_VOLUME,
  'light sled push': NOT_HYPERTROPHY_VOLUME,
  'sled push': NOT_HYPERTROPHY_VOLUME,

  // ── Poussée horizontale ─────────────────────────────────────
  'bench press': HORIZONTAL_PUSH,
  'db bench press': HORIZONTAL_PUSH,
  'football bar bench press': HORIZONTAL_PUSH,
  'incline db bench press': HORIZONTAL_PUSH,
  'decline push-up': HORIZONTAL_PUSH,
  'incline push-up': HORIZONTAL_PUSH,
  'archer push-up': HORIZONTAL_PUSH,
  'plyo push-up': NOT_HYPERTROPHY_VOLUME,
  'parallel bar dip': { chest: 1, triceps: 1 },
  'chair dip': { triceps: 1, chest: 0.5 },

  // ── Poussée verticale ───────────────────────────────────────
  'strict standing overhead press': VERTICAL_PUSH,
  'seated db overhead press': VERTICAL_PUSH,
  'push press': { shoulders: 1, triceps: 0.5, quads: 0.5 },
  'half-kneeling landmine press': VERTICAL_PUSH,
  'pike push-up': VERTICAL_PUSH,
  'pike push-up feet elevated': VERTICAL_PUSH,

  // ── Tirage ──────────────────────────────────────────────────
  'chest-supported row': ROW_PATTERN,
  'seated cable row': ROW_PATTERN,
  'half-kneeling cable row': ROW_PATTERN,
  'single-arm db row': ROW_PATTERN,
  'pendlay row': ROW_PATTERN,
  't-bar row': ROW_PATTERN,
  'inverted row': ROW_PATTERN,
  'inverted row standard': ROW_PATTERN,
  'rowing inversé pieds surélevés': ROW_PATTERN,
  'neutral-grip lat pulldown': ROW_PATTERN,
  'neutral-grip pull-up': ROW_PATTERN,

  // ── Épaules / santé d'épaule ────────────────────────────────
  'lateral raise': { shoulders: 1 },
  'face pull': { back: 1, shoulders: 0.5 },
  'face pull band': { back: 1, shoulders: 0.5 },
  'band external rotation': { shoulders: 1 },
  't-y-i incline bench': { shoulders: 1, back: 0.5 },
  'scap push-up': { shoulders: 0.5, back: 0.5 },
  'serratus reach': { shoulders: 0.5, trunk: 0.5 },

  // ── Bras ────────────────────────────────────────────────────
  'hammer curl': { biceps: 1 },
  'alternating db curl': { biceps: 1 },
  'rope pressdown': { triceps: 1 },
  'skull crusher': { triceps: 1 },
  'french press': { triceps: 1 },

  // ── Mollets / bas de jambe ──────────────────────────────────
  'seated calf raise': { calves: 1 },
  'single-leg calf raise': { calves: 1 },
  'weighted calf raise': { calves: 1 },
  'leg press calf press': { calves: 1 },
  'tibialis raise': { calves: 1 },
  'wall tibialis raise': { calves: 1 },

  // ── Tronc / portés ──────────────────────────────────────────
  'pallof press hold': { trunk: 1 },
  'dead bug': { trunk: 1 },
  'bird dog': { trunk: 1 },
  'side plank': { trunk: 1 },
  'cable chop': { trunk: 1 },
  'landmine rotation': { trunk: 1 },
  'bear crawl': { trunk: 1, shoulders: 0.5 },
  'farmer carry': { trunk: 1, back: 0.5 },
  'zercher carry': { trunk: 1, back: 0.5 },
  'front rack carry': { trunk: 1, shoulders: 0.5 },
  'suitcase carry': { trunk: 1 },
  'med ball throw': NOT_HYPERTROPHY_VOLUME,
  'med ball rotational throw': NOT_HYPERTROPHY_VOLUME,
  'med ball slam': NOT_HYPERTROPHY_VOLUME,
  'supine med ball throw': NOT_HYPERTROPHY_VOLUME,
  'med ball chest pass': NOT_HYPERTROPHY_VOLUME,
  'band rotation explosive': NOT_HYPERTROPHY_VOLUME,
  'explosive landmine press': NOT_HYPERTROPHY_VOLUME,

  // ── Adducteurs / cou (prévention) ───────────────────────────
  'copenhagen hold': { adductors: 1, trunk: 0.5 },
  'short copenhagen hold': { adductors: 1, trunk: 0.5 },
  'copenhagen plank': { adductors: 1, trunk: 0.5 },
  'adductor rock-back': { adductors: 1 },
  'supine adductor squeeze': { adductors: 1 },
  'neck isometric': { neck: 1 },
  'neck flexion isometric': { neck: 1 },
  'neck flexion isometric (hand)': { neck: 1 },
  'neck extension isometric': { neck: 1 },
  'neck extension isometric (hand)': { neck: 1 },
  'neck lateral flexion isometric (hand)': { neck: 1 },
  'isométrie flexion cou (main)': { neck: 1 },
  'isométrie extension cou (main)': { neck: 1 },
  'isométrie latéral cou (main)': { neck: 1 },
  'banded neck isometric': { neck: 1 },
  'banded neck extension': { neck: 1 },
}

/** Contribution d'un exercice, ou `undefined` s'il n'est pas au registre. */
export function contributionFor(exerciseName: string): Contribution | undefined {
  return EXERCISE_MUSCLE_MAP[normalizeExerciseName(exerciseName)]
}
