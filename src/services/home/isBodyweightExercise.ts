/**
 * Détecte si un exercice est principalement en poids du corps (push-up, dips,
 * pull-up, plyo squat jump, etc.) — utilisé pour la convention de tonnage Strong
 * où le poids du corps compte comme charge soulevée.
 *
 * Heuristique : pattern matching sur l'exerciseId. Pas exhaustif mais couvre
 * les cas courants. Les exos avec haltère / barbell / machine ont un loadKg
 * explicite donc cette fonction n'est jamais appelée pour eux.
 */
const BW_PATTERNS = [
  '__bw',
  '__bodyweight',
  'push_up',
  'pull_up',
  'chin_up',
  'dip',
  'pistol',
  'plyo',
  'jump',
  'sprint',
  'burpee',
  'lunge_walk',
  'mountain_climber',
  'bear_crawl',
  'crab_walk',
] as const

export function isBodyweightExercise(exerciseId: string): boolean {
  const id = exerciseId.toLowerCase()
  return BW_PATTERNS.some((p) => id.includes(p))
}
