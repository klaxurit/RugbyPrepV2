import { getExerciseById, getExerciseName } from '../../data/exercises'
import type { Equipment, TrainingLevel } from '../../types/training'
import type { MotherSession, Exercise as MotherSessionExercise } from '../../types/motherSession'
import type { SessionContentFr } from './motherSessionContentFr'
import { normalizeExerciseName } from './motherSessionExerciseMap'

type AdaptedExercise = {
  sourceName: string
  sourceNameFr?: string
  replacementId: string
  replacementName: string
  replacementNameFr: string
}

const FOUNDATIONS_BLOCK_NOTE_FR =
  'Version Fondations : variante plus guidée pour garder une exécution propre et facile à reproduire.'

const FOUNDATIONS_BLOCK_NOTE_EN =
  'Foundations version: a more guided variation keeps the pattern clean and easier to repeat.'

function hasAny(equipmentSet: Set<Equipment>, expected: Equipment[]): boolean {
  return expected.some((item) => equipmentSet.has(item))
}

function pickFoundationsReplacementId(
  exerciseName: string,
  equipmentSet: Set<Equipment>,
): string | undefined {
  const name = normalizeExerciseName(exerciseName)
  const hasDumbbellPattern = hasAny(equipmentSet, ['dumbbell', 'kettlebell'])

  if (name === 'pin back squat' || name === 'banded anderson box squat') {
    if (equipmentSet.has('machine')) return 'squat__leg_press__machine'
    if (hasDumbbellPattern) return 'squat__goblet_squat__dumbbell'
    return undefined
  }

  if (name === 'box squat') {
    if (hasDumbbellPattern) return 'squat__goblet_squat__dumbbell'
    if (equipmentSet.has('machine')) return 'squat__leg_press__machine'
    return undefined
  }

  if (name === 'barbell romanian deadlift' && equipmentSet.has('dumbbell')) {
    return 'hinge__rdl__dumbbell'
  }

  if (name === 'nordic curl' && equipmentSet.has('machine')) {
    return 'hamstring__leg_curl__machine'
  }

  if (name === 'ghd rotations' && equipmentSet.has('cable')) {
    return 'core_rotation__cable_chop'
  }

  if (name === 'push press') {
    if (equipmentSet.has('machine')) return 'push_vertical__shoulder_press__machine'
    if (equipmentSet.has('landmine')) return 'push_vertical__landmine_press__kneeling'
    return undefined
  }

  if (name === 'strict standing overhead press') {
    if (equipmentSet.has('machine')) return 'push_vertical__shoulder_press__machine'
    if (equipmentSet.has('dumbbell')) return 'push_vertical__dumbbell_press__seated'
    return undefined
  }

  if (name === 't-bar row') {
    if (equipmentSet.has('cable')) return 'pull_horizontal__cable_row__seated'
    if (equipmentSet.has('machine')) return 'pull_horizontal__chest_supported_row__machine'
    if (hasAny(equipmentSet, ['dumbbell']) && hasAny(equipmentSet, ['bench'])) {
      return 'pull_horizontal__chest_supported_row__dumbbell'
    }
    return undefined
  }

  // Trap Bar / Hex Bar → DB RDL (same hinge pattern, standard equipment)
  if (name === 'trap bar deadlift' || name === 'hex bar rdl') {
    if (hasDumbbellPattern) return 'hinge__rdl__dumbbell'
    return undefined
  }

  // Football Bar Bench Press → DB Bench Press (same push pattern, no special bar needed)
  if (name === 'football bar bench press') {
    if (equipmentSet.has('dumbbell') && equipmentSet.has('bench')) return 'push_horizontal__bench_press__dumbbell'
    return undefined
  }

  // Front Squat → Goblet Squat (same front-loaded position, auto-limiting)
  if (name === 'front squat') {
    if (hasDumbbellPattern) return 'squat__goblet_squat__dumbbell'
    if (equipmentSet.has('machine')) return 'squat__leg_press__machine'
    return undefined
  }

  // Back Squat → Goblet Squat or Leg Press
  if (name === 'back squat') {
    if (hasDumbbellPattern) return 'squat__goblet_squat__dumbbell'
    if (equipmentSet.has('machine')) return 'squat__leg_press__machine'
    return undefined
  }

  return undefined
}

function applyStringReplacements(
  value: string,
  replacements: AdaptedExercise[],
  mode: 'en' | 'fr',
): string {
  return replacements.reduce((next, replacement) => {
    const source = mode === 'fr' ? replacement.sourceNameFr : replacement.sourceName
    const target = mode === 'fr' ? replacement.replacementNameFr : replacement.replacementName
    if (!source) return next
    return next.split(source).join(target)
  }, value)
}

function adaptExercise(
  exercise: MotherSessionExercise,
  sourceNameFr: string | undefined,
  equipmentSet: Set<Equipment>,
): {
  exercise: MotherSessionExercise
  replacement?: AdaptedExercise
} {
  const replacementId = pickFoundationsReplacementId(exercise.name, equipmentSet)
  if (!replacementId) {
    return { exercise }
  }

  const replacementExercise = getExerciseById(replacementId)
  if (!replacementExercise) {
    return { exercise }
  }

  return {
    exercise: {
      ...exercise,
      name: replacementExercise.name ?? exercise.name,
      exerciseId: replacementId,
    },
    replacement: {
      sourceName: exercise.name,
      sourceNameFr,
      replacementId,
      replacementName: replacementExercise.name ?? exercise.name,
      replacementNameFr: getExerciseName(replacementId, 'fr'),
    },
  }
}

function withFoundationsNote(
  notes: string[],
  lang: 'fr' | 'en',
  replacements: AdaptedExercise[],
): string[] {
  if (replacements.length === 0) return notes
  const note = lang === 'fr' ? FOUNDATIONS_BLOCK_NOTE_FR : FOUNDATIONS_BLOCK_NOTE_EN
  if (notes.includes(note)) return notes
  return [...notes, note]
}

export function isFoundationsLevel(trainingLevel: TrainingLevel | undefined): boolean {
  return trainingLevel === 'starter'
}

export function adaptMotherSessionForFoundations(
  session: MotherSession,
  equipment: Equipment[] | undefined,
): MotherSession {
  const equipmentSet = new Set(equipment ?? [])
  const blocks = session.blocks.map((block) => {
    const replacements: AdaptedExercise[] = []
    const exercises = block.exercises.map((exercise) => {
      const adapted = adaptExercise(exercise, undefined, equipmentSet)
      if (adapted.replacement) replacements.push(adapted.replacement)
      return adapted.exercise
    })

    if (replacements.length === 0) {
      return block
    }

    return {
      ...block,
      exercises,
      coachingNotes: withFoundationsNote(
        block.coachingNotes.map((note) => applyStringReplacements(note, replacements, 'en')),
        'en',
        replacements,
      ),
      fallbackOptions: block.fallbackOptions?.map((opt) =>
        applyStringReplacements(opt, replacements, 'en'),
      ),
    }
  })

  return {
    ...session,
    metadata: {
      ...session.metadata,
      targetLevel: 'starter',
    },
    blocks,
  }
}

export function adaptSessionContentFrForFoundations(
  session: MotherSession,
  content: SessionContentFr | undefined,
  equipment: Equipment[] | undefined,
): SessionContentFr | undefined {
  if (!content) return undefined

  const equipmentSet = new Set(equipment ?? [])

  return {
    ...content,
    blocks: content.blocks.map((block, blockIndex) => {
      const sourceBlock = session.blocks[blockIndex]
      if (!sourceBlock) return block

      const replacements: AdaptedExercise[] = []
      const exercises = block.exercises.map((exercise, exerciseIndex) => {
        const sourceExercise = sourceBlock.exercises[exerciseIndex]
        if (!sourceExercise) return exercise

        const adapted = adaptExercise(sourceExercise, exercise.name, equipmentSet)
        if (!adapted.replacement) return exercise
        replacements.push(adapted.replacement)
        return {
          ...exercise,
          name: adapted.replacement.replacementNameFr,
        }
      })

      if (replacements.length === 0) {
        return block
      }

      return {
        ...block,
        exercises,
        coachingNotes: withFoundationsNote(
          block.coachingNotes.map((note) => applyStringReplacements(note, replacements, 'fr')),
          'fr',
          replacements,
        ),
        fallbackOptions: block.fallbackOptions?.map((opt) =>
          applyStringReplacements(opt, replacements, 'fr'),
        ),
      }
    }),
  }
}
