import { getExerciseMetricType } from '../ui/exerciseMetrics'
import { isBodyweightExercise } from '../home/isBodyweightExercise'

/**
 * Fraction du poids corps effectivement « soulevée » sur l'exercice.
 * Ordre : règles les plus spécifiques en premier.
 * Références : Ebben et al. (push-up ~64 % BW) ; conventions Strong / calisthenics.
 */
const LOAD_FRACTION_RULES: ReadonlyArray<{ match: (id: string) => boolean; fraction: number }> = [
  { match: (id) => id.includes('incline') && id.includes('push'), fraction: 0.45 },
  { match: (id) => id.includes('decline') && id.includes('push'), fraction: 0.74 },
  { match: (id) => id.includes('pike_push'), fraction: 0.7 },
  { match: (id) => id.includes('push_up'), fraction: 0.64 },
  { match: (id) => id.includes('dip'), fraction: 0.9 },
  { match: (id) => id.includes('pull_up') || id.includes('chin_up'), fraction: 1.0 },
  { match: (id) => id.includes('inverted_row') || (id.includes('row') && id.includes('bodyweight')), fraction: 0.55 },
  { match: (id) => id.includes('bulgarian') || id.includes('split_squat'), fraction: 0.85 },
  { match: (id) => id.includes('lunge'), fraction: 0.8 },
  { match: (id) => id.includes('squat') && !id.includes('jump'), fraction: 1.0 },
  { match: (id) => id.includes('nordic'), fraction: 0.9 },
  { match: (id) => id.includes('rdl') || id.includes('kickstand'), fraction: 0.4 },
  { match: (id) => id.includes('glute_bridge') || id.includes('hip_thrust'), fraction: 0.35 },
  { match: (id) => id.includes('good_morning'), fraction: 0.45 },
]

const NO_LOAD_PATTERNS = [
  'jump',
  'plyo',
  'sprint',
  'bound',
  'hop',
  'skip',
  'crawl',
  'carry',
  'plank',
  'copenhagen',
  'iso',
  'rotation',
  'shuffle',
  'agility',
  'cmj',
  'pogo',
] as const

function roundLoadKg(kg: number): number {
  return Math.round(kg / 2.5) * 2.5
}

function loadFractionForExercise(exerciseId: string): number | null {
  const id = exerciseId.toLowerCase()
  if (!isBodyweightExercise(exerciseId) && !id.includes('__bodyweight') && !id.includes('__bw')) {
    return null
  }
  if (NO_LOAD_PATTERNS.some((p) => id.includes(p))) return null

  const metric = getExerciseMetricType({ exerciseId })
  if (metric === 'seconds' || metric === 'meters') return null

  for (const rule of LOAD_FRACTION_RULES) {
    if (rule.match(id)) return rule.fraction
  }

  return 0.65
}

/**
 * Charge d'entrée approximative (kg) pour un exo poids de corps,
 * dérivée du poids corps utilisateur (profil morphologie).
 */
export function estimateBodyweightEntryLoadKg(
  exerciseId: string,
  weightKg: number | null | undefined,
): number | null {
  if (weightKg == null || weightKg <= 0) return null
  const fraction = loadFractionForExercise(exerciseId)
  if (fraction == null) return null
  return roundLoadKg(weightKg * fraction)
}

export function exerciseSupportsBodyweightEntryLoad(exerciseId: string): boolean {
  return loadFractionForExercise(exerciseId) != null
}
