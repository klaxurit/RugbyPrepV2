import { getExerciseName } from '../../data/exercises'
import type { MotherSession, Exercise as MotherSessionExercise } from '../../types/motherSession'
import type { SessionContentFr } from './motherSessionContentFr'
import { normalizeExerciseName } from './motherSessionExerciseMap'

type EquipmentAlternative = {
  sourceName: string
  sourceNameFr?: string
  fallbackIds: string[]
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values))
}

function resolveAlternativeIds(exercise: MotherSessionExercise): string[] | undefined {
  const id = exercise.exerciseId
  const name = normalizeExerciseName(exercise.name)

  if (
    id === 'power__medball_chest_pass__wall' ||
    id === 'power__medball_throw__supine' ||
    name === 'med ball chest pass' ||
    name === 'supine med ball throw'
  ) {
    return [
      'power__cable_press__explosive',
      'power__landmine_press__speed',
      'push_horizontal__push_up__plyo',
    ]
  }

  if (
    id === 'power__medball_rotational_throw__wall' ||
    id === 'power__medball_slam__overhead' ||
    name === 'med ball rotational throw' ||
    name === 'med ball throw' ||
    name === 'med ball scoop throw' ||
    name === 'slam medecine ball'
  ) {
    const rotationFallbacks = [
      'core_rotation__cable_rotation__explosive',
      'core_rotation__cable_chop',
      'core_rotation__landmine_rotation',
    ]

    if (id === 'power__medball_slam__overhead' || name === 'slam medecine ball') {
      return ['power__cable_slam__high_to_low', ...rotationFallbacks]
    }

    return rotationFallbacks
  }

  return undefined
}

function formatFallbackOption(
  sourceExerciseName: string,
  fallbackIds: string[],
  lang: 'fr' | 'en',
): string {
  const labels = fallbackIds.map((fallbackId) => `\`${getExerciseName(fallbackId, lang)}\``)
  if (lang === 'fr') {
    return `Si pas de med ball pour \`${sourceExerciseName}\` : ${labels.join(' -> ')}.`
  }
  return `If no med ball is available for \`${sourceExerciseName}\`: ${labels.join(' -> ')}.`
}

function mergeFallbackOptions(
  existing: string[] | undefined,
  additions: string[],
): string[] | undefined {
  const current = existing ?? []
  const merged = uniqueStrings([...current, ...additions])
  return merged.length > 0 ? merged : undefined
}

function adaptExerciseForEquipment(
  exercise: MotherSessionExercise,
  sourceNameFr: string | undefined,
): {
  exercise: MotherSessionExercise
  alternative?: EquipmentAlternative
} {
  const fallbackIds = resolveAlternativeIds(exercise)
  if (!fallbackIds) return { exercise }

  return {
    exercise,
    alternative: {
      sourceName: exercise.name,
      sourceNameFr,
      fallbackIds,
    },
  }
}

export function adaptMotherSessionForEquipmentAlternatives(
  session: MotherSession,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _equipment: unknown,
): MotherSession {
  const blocks = session.blocks.map((block) => {
    const alternatives: EquipmentAlternative[] = []
    const exercises = block.exercises.map((exercise) => {
      const adapted = adaptExerciseForEquipment(exercise, undefined)
      if (adapted.alternative) alternatives.push(adapted.alternative)
      return adapted.exercise
    })

    if (alternatives.length === 0) return block

    const fallbackAdditions = alternatives.map((alternative) =>
      formatFallbackOption(alternative.sourceName, alternative.fallbackIds, 'en'),
    )

    return {
      ...block,
      exercises,
      coachingNotes: block.coachingNotes,
      fallbackOptions: mergeFallbackOptions(
        block.fallbackOptions,
        fallbackAdditions,
      ),
    }
  })

  return {
    ...session,
    blocks,
  }
}

export function adaptSessionContentFrForEquipmentAlternatives(
  session: MotherSession,
  content: SessionContentFr | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _equipment: unknown,
): SessionContentFr | undefined {
  if (!content) return undefined

  return {
    ...content,
    blocks: content.blocks.map((block, blockIndex) => {
      const sourceBlock = session.blocks[blockIndex]
      if (!sourceBlock) return block

      const alternatives: EquipmentAlternative[] = []

      const exercises = block.exercises.map((exercise, exerciseIndex) => {
        const sourceExercise = sourceBlock.exercises[exerciseIndex]
        if (!sourceExercise) return exercise

        const adapted = adaptExerciseForEquipment(sourceExercise, exercise.name)
        if (!adapted.alternative) return exercise

        alternatives.push(adapted.alternative)
        return exercise
      })

      if (alternatives.length === 0) return block

    const fallbackAdditions = alternatives.map((alternative) =>
      formatFallbackOption(alternative.sourceNameFr ?? alternative.sourceName, alternative.fallbackIds, 'fr'),
    )

      return {
        ...block,
        exercises,
        coachingNotes: block.coachingNotes,
        fallbackOptions: mergeFallbackOptions(
          block.fallbackOptions,
          fallbackAdditions,
        ),
      }
    }),
  }
}
