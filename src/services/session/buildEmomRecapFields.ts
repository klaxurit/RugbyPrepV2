import type { Block, Exercise } from '../../types/motherSession'
import { isDirectiveText, resolveExerciseIdForSessionRun } from '../motherSession/motherSessionExerciseMap'
import { getExerciseMetricType, type ExerciseMetricType } from '../ui/exerciseMetrics'
import type { PreviousSessionSetRef } from './buildPreviousSessionSetMap'

/**
 * Champ de saisie post-EMOM — une ligne par exercice unique du pattern
 * (pas une ligne par minute : Min 1/3/5 sled → une seule ligne Sled).
 */
export type EmomRecapField = {
  exerciseId: string
  /** Premier index dans `block.exercises` (clé tour 0). */
  exerciseIndex: number
  name: string
  prescription?: string
  metricType: ExerciseMetricType
  /**
   * Sled / carries : la métrique catalogue est souvent `meters`, mais la
   * progression utile est aussi la charge — on propose les deux.
   */
  alsoAskLoadKg: boolean
  previous?: PreviousSessionSetRef
}

function isWeightedDistanceExercise(exerciseId: string): boolean {
  const id = exerciseId.toLowerCase()
  return id.includes('sled') || id.includes('carry') || id.includes('farmer') || id.includes('suitcase')
}

/**
 * Construit les champs du récap finisher EMOM (dédupliqués par exerciseId).
 */
export function buildEmomRecapFields(
  block: Block,
  previousByExerciseId?: ReadonlyMap<string, PreviousSessionSetRef>,
): EmomRecapField[] {
  const seen = new Set<string>()
  const fields: EmomRecapField[] = []

  block.exercises.forEach((exo: Exercise, exerciseIndex) => {
    if (!exo?.name || isDirectiveText(exo.name)) return
    const exerciseId = resolveExerciseIdForSessionRun(exo.name, exo.exerciseId)
    if (!exerciseId || seen.has(exerciseId)) return
    seen.add(exerciseId)

    const metricType = getExerciseMetricType({ exerciseId })
    fields.push({
      exerciseId,
      exerciseIndex,
      name: exo.name,
      prescription: exo.prescription,
      metricType,
      alsoAskLoadKg: metricType === 'meters' && isWeightedDistanceExercise(exerciseId),
      previous: previousByExerciseId?.get(exerciseId),
    })
  })

  return fields
}
