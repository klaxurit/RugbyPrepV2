import { getProgressionFamily } from '../ui/suggestions'

/**
 * Exercices éligibles aux records personnels (onglet Records + toasts PR).
 * Réservé aux polyarticulaires — aligné Strong/Hevy et la logique de progression RugbyForge.
 */
export function isPRTrackableExercise(exerciseId: string): boolean {
  const family = getProgressionFamily(exerciseId)
  if (family === 'upper_compound' || family === 'lower_compound') return true

  const id = exerciseId.toLowerCase()

  if (
    id.includes('leg_curl') ||
    id.includes('leg_ext') ||
    id.includes('calf') ||
    id.includes('curl') ||
    id.includes('lateral') ||
    id.includes('tricep') ||
    id.includes('fly') ||
    id.includes('raise') ||
    id.includes('face_pull') ||
    id.includes('shrug')
  ) {
    return false
  }

  if (
    id.includes('squat') ||
    id.includes('deadlift') ||
    id.includes('hip_thrust') ||
    id.includes('rdl') ||
    id.includes('lunge')
  ) {
    return true
  }

  if (
    id.includes('bench') ||
    id.includes('overhead') ||
    id.includes('press') ||
    id.includes('row') ||
    id.includes('pull_up') ||
    id.includes('pullup') ||
    id.includes('chin_up') ||
    id.includes('chinup') ||
    id.includes('dip')
  ) {
    return true
  }

  return false
}
