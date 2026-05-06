import type { ExerciseSetLog } from '../../types/training'
import { isBodyweightExercise } from './isBodyweightExercise'

/**
 * Calcule la charge totale soulevée sur le mois (kg).
 *
 * Modèle : `tonnage = Σ(loadKg × reps)` pour chaque set validé du mois.
 *
 * Exos sans charge externe (poids du corps, plyo, conditioning) :
 *  - si `bodyweightKg` est renseigné → on utilise le poids du corps comme
 *    "charge soulevée" (convention type Strong) → `bodyweightKg × reps`
 *  - sinon (profile sans poids) → on ignore (contribution = 0)
 *
 * Tous les sets de l'utilisateur sont considérés (pas de filtrage par
 * `sessionLogId` car certains sets sont validés sans session_log final).
 * Le filtrage temporel se fait sur `createdAt` (ou `updatedAt` en fallback).
 */
export interface ComputeMonthlyTonnageInputs {
  sets: readonly ExerciseSetLog[]
  yearMonth: string // 'YYYY-MM'
  bodyweightKg: number | null | undefined
}

export function computeMonthlyTonnage({
  sets,
  yearMonth,
  bodyweightKg,
}: ComputeMonthlyTonnageInputs): number {
  let total = 0
  for (const set of sets) {
    if (!isInMonth(set, yearMonth)) continue
    if (typeof set.reps !== 'number' || set.reps <= 0) continue

    if (typeof set.loadKg === 'number' && set.loadKg > 0) {
      total += set.loadKg * set.reps
      continue
    }

    // Pas de loadKg → exo BW. On utilise le bodyweight si dispo.
    if (isBodyweightExercise(set.exerciseId) && bodyweightKg != null && bodyweightKg > 0) {
      total += bodyweightKg * set.reps
    }
  }
  return Math.round(total)
}

function isInMonth(set: ExerciseSetLog, yearMonth: string): boolean {
  const stamp = set.createdAt ?? set.updatedAt
  if (!stamp) return false
  return stamp.slice(0, 7) === yearMonth
}
