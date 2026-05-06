import type { ExerciseSetLog } from '../../types/training'
import { isBodyweightExercise } from '../home/isBodyweightExercise'

export interface ComputeSessionTonnageInputs {
  sets: readonly ExerciseSetLog[]
  /** Identifie la séance courante (slotSignature concaténé week+session+...). */
  slotSignature: string
  /** Poids du corps de l'utilisateur — utilisé pour les exos BW. */
  bodyweightKg: number | null | undefined
}

/**
 * Tonnage total soulevé sur la séance (kg) — Σ(loadKg × reps).
 *
 * Convention : pour un exo identifié BW (push-up, dip, plyo, etc.), on
 * utilise `bodyweightKg` comme charge si dispo. Sinon contribution = 0.
 *
 * Filtre les sets par `slotSignature` (clé d'idempotence d'une séance).
 */
export function computeSessionTonnage({
  sets,
  slotSignature,
  bodyweightKg,
}: ComputeSessionTonnageInputs): number {
  let total = 0
  for (const set of sets) {
    if (set.slotSignature !== slotSignature) continue
    if (typeof set.reps !== 'number' || set.reps <= 0) continue

    if (typeof set.loadKg === 'number' && set.loadKg > 0) {
      total += set.loadKg * set.reps
      continue
    }

    if (isBodyweightExercise(set.exerciseId) && bodyweightKg != null && bodyweightKg > 0) {
      total += bodyweightKg * set.reps
    }
  }
  return Math.round(total)
}
