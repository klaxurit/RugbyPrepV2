import { getExerciseById } from '../../data/exercises'
import { EXERCISE_METRIC_OVERRIDES } from '../../data/exerciseMetricOverrides.v1'

export type ExerciseMetricType = 'load_reps' | 'reps' | 'seconds' | 'meters'

const DISTANCE_HINTS = ['carry__', 'sled__', '_walk', '_march', '_run', '_sprint']
const TIME_HINTS = ['__iso', '_iso_', 'isometric', 'plank', 'copenhagen', 'hold']

export const getExerciseMetricType = (params: { exerciseId: string }): ExerciseMetricType => {
  const override = EXERCISE_METRIC_OVERRIDES[params.exerciseId]
  if (override) return override.metricType

  const exercise = getExerciseById(params.exerciseId)
  if (exercise?.metricType) return exercise.metricType

  const exerciseId = params.exerciseId.toLowerCase()

  if (DISTANCE_HINTS.some((hint) => exerciseId.includes(hint))) {
    return 'meters'
  }

  if (TIME_HINTS.some((hint) => exerciseId.includes(hint))) {
    return 'seconds'
  }

  return 'load_reps'
}

if (import.meta.env.DEV) {
  console.assert(
    getExerciseMetricType({ exerciseId: 'push_horizontal__board_press__barbell' }) ===
      'load_reps',
    'Metric detection failed for board press'
  )
  console.assert(
    getExerciseMetricType({ exerciseId: 'core_anti_rotation__pallof_press__band' }) ===
      'load_reps',
    'Metric detection failed for pallof press'
  )
  console.assert(
    getExerciseMetricType({ exerciseId: 'core_anti_extension__ghd_iso' }) === 'seconds',
    'Metric detection failed for ghd iso'
  )
  console.assert(
    getExerciseMetricType({ exerciseId: 'carry__farmer_walk__dumbbell' }) ===
      'meters',
    'Metric detection failed for farmer walk'
  )
}
