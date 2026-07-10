import type { ExerciseSetLog } from '../../types/training'
import { isPRTrackableExercise } from '../pr/prEligibility'

export interface SessionPR {
  exerciseId: string
  /** Meilleur loadKg observé avant la séance courante (sur cet exo). */
  previousBest: number
  /** Nouveau record observé sur la séance courante. */
  newBest: number
}

export interface DetectSessionPRsInputs {
  /** Tous les set logs de l'utilisateur (séance courante + historique). */
  allSets: readonly ExerciseSetLog[]
  /** Identifie la séance courante. */
  currentSlotSignature: string
  /** Optionnel : minimum de logs historiques requis pour considérer un PR
   *  "fiable". Évite de flagger un PR au 1er log d'un exercice. Défaut : 2. */
  minHistoricalLogs?: number
}

/**
 * Détecte les nouveaux records de charge sur la séance courante.
 *
 * Règles :
 *  - On ne détecte que les PR de charge (loadKg) — pas de PR volume/reps
 *    pour rester lisible côté UI.
 *  - Un PR est compté seulement si on a `>= minHistoricalLogs` sets
 *    historiques sur l'exo avec un loadKg renseigné. Sinon on assume que
 *    l'utilisateur découvre l'exo et le "PR" n'a pas de sens.
 *  - Pour qu'un PR soit listé, le set du PR doit être marqué `completed`
 *    (sinon une charge tentée mais non finie créerait un faux PR).
 */
export function detectSessionPRs({
  allSets,
  currentSlotSignature,
  minHistoricalLogs = 2,
}: DetectSessionPRsInputs): readonly SessionPR[] {
  const currentSets = allSets.filter((s) => s.slotSignature === currentSlotSignature)
  const historicalSets = allSets.filter((s) => s.slotSignature !== currentSlotSignature)

  const exerciseIds = new Set<string>()
  for (const s of currentSets) {
    if (typeof s.loadKg === 'number' && s.loadKg > 0) exerciseIds.add(s.exerciseId)
  }

  const prs: SessionPR[] = []
  for (const exerciseId of exerciseIds) {
    if (!isPRTrackableExercise(exerciseId)) continue
    const historicalForExo = historicalSets.filter(
      (s) => s.exerciseId === exerciseId && typeof s.loadKg === 'number' && s.loadKg > 0,
    )
    if (historicalForExo.length < minHistoricalLogs) continue

    const previousBest = Math.max(...historicalForExo.map((s) => s.loadKg as number))

    const currentForExo = currentSets.filter(
      (s) =>
        s.exerciseId === exerciseId &&
        typeof s.loadKg === 'number' &&
        s.loadKg > 0 &&
        s.completed !== false,
    )
    if (currentForExo.length === 0) continue

    const newBest = Math.max(...currentForExo.map((s) => s.loadKg as number))
    if (newBest > previousBest) {
      prs.push({ exerciseId, previousBest, newBest })
    }
  }

  return prs
}
