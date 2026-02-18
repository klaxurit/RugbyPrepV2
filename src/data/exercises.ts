import exercises from './exercices.v1.json'
import type { Exercise } from '../types/training'

export const exercisesList = exercises as Exercise[]

const exercisesById = new Map<string, Exercise>()

for (const exercise of exercisesList) {
  const primaryId = exercise.exerciseId ?? exercise.id
  if (primaryId) exercisesById.set(primaryId, exercise)
  if (exercise.id && exercise.exerciseId && exercise.id !== exercise.exerciseId) {
    exercisesById.set(exercise.id, exercise)
  }
}

export const getExerciseById = (id: string): Exercise | undefined => exercisesById.get(id)

export const getExerciseName = (id: string): string =>
  getExerciseById(id)?.nameFr ?? getExerciseById(id)?.name ?? id
