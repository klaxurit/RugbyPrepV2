import { getExerciseMetricType } from '../exerciseMetrics'

export const metricOverrideCheck = () => {
  return [
    {
      id: 'power__jump__broad_jump',
      metric: getExerciseMetricType({ exerciseId: 'power__jump__broad_jump' })
    },
    {
      id: 'power__bound__single_leg',
      metric: getExerciseMetricType({ exerciseId: 'power__bound__single_leg' })
    },
    {
      id: 'lower_jump__box_squat_jump',
      metric: getExerciseMetricType({ exerciseId: 'lower_jump__box_squat_jump' })
    },
    {
      id: 'carry__farmer_walk__dumbbell',
      metric: getExerciseMetricType({ exerciseId: 'carry__farmer_walk__dumbbell' })
    },
    {
      id: 'core_anti_extension__ghd_iso',
      metric: getExerciseMetricType({ exerciseId: 'core_anti_extension__ghd_iso' })
    },
    {
      id: 'push_horizontal__board_press__barbell',
      metric: getExerciseMetricType({ exerciseId: 'push_horizontal__board_press__barbell' })
    }
  ]
}
