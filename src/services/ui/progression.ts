import type { BuiltSession } from '../program'
import type { BlockLog, CycleWeek, ExerciseLogEntry, SessionType } from '../../types/training'

interface ExerciseWeekBest {
  kind: 'load_reps' | 'distance' | 'time' | 'none'
  score: number
  entry: ExerciseLogEntry
  text: string
}

const formatEntry = (entry: ExerciseLogEntry): string => {
  if (entry.loadKg !== undefined || entry.reps !== undefined) {
    return `${entry.loadKg ?? '?'} kg × ${entry.reps ?? '?'}`
  }
  if (entry.meters !== undefined) return `${entry.meters} m`
  if (entry.seconds !== undefined) return `${entry.seconds}s`
  return 'n/a'
}

const getEntryKind = (entry: ExerciseLogEntry): ExerciseWeekBest['kind'] => {
  if (entry.loadKg !== undefined || entry.reps !== undefined) return 'load_reps'
  if (entry.meters !== undefined) return 'distance'
  if (entry.seconds !== undefined) return 'time'
  return 'none'
}

const getEntryScore = (entry: ExerciseLogEntry): number => {
  if (entry.loadKg !== undefined && entry.reps !== undefined) {
    return entry.loadKg * entry.reps
  }
  if (entry.meters !== undefined) {
    return entry.meters
  }
  // Time semantics may evolve; currently we treat iso/time holds as "more is better".
  if (entry.seconds !== undefined) {
    return entry.seconds
  }
  return 0
}

export const getExerciseBestByWeek = (
  logs: BlockLog[],
  exerciseId: string,
  week: CycleWeek
): ExerciseWeekBest | undefined => {
  const entries = logs
    .filter((log) => log.week === week)
    .flatMap((log) => log.entries)
    .filter((entry) => entry.exerciseId === exerciseId)

  if (entries.length === 0) return undefined

  const bestEntry = entries.reduce((best, current) =>
    getEntryScore(current) > getEntryScore(best) ? current : best
  )

  return {
    kind: getEntryKind(bestEntry),
    score: getEntryScore(bestEntry),
    entry: bestEntry,
    text: formatEntry(bestEntry)
  }
}

export const getExerciseDeltaW1W4 = (
  logs: BlockLog[],
  exerciseId: string
): {
  status: 'up' | 'down' | 'same' | 'unknown'
  deltaText: string
  fromText: string
  toText: string
  deltaValue: number
} => {
  const from = getExerciseBestByWeek(logs, exerciseId, 'W1')
  const to = getExerciseBestByWeek(logs, exerciseId, 'W4')

  if (!from || !to || from.kind === 'none' || to.kind === 'none' || from.kind !== to.kind) {
    return {
      status: 'unknown',
      deltaText: 'unknown',
      fromText: from?.text ?? 'n/a',
      toText: to?.text ?? 'n/a',
      deltaValue: 0
    }
  }

  const deltaValue = to.score - from.score
  const status = deltaValue > 0 ? 'up' : deltaValue < 0 ? 'down' : 'same'

  if (from.kind === 'load_reps') {
    const loadDelta = (to.entry.loadKg ?? 0) - (from.entry.loadKg ?? 0)
    const repsRef = to.entry.reps ?? from.entry.reps ?? 0
    return {
      status,
      deltaText:
        loadDelta === 0
          ? `${deltaValue > 0 ? '+' : ''}${Math.round(deltaValue)} score`
          : `${loadDelta > 0 ? '+' : ''}${loadDelta} kg @ ${repsRef} reps`,
      fromText: from.text,
      toText: to.text,
      deltaValue
    }
  }

  if (from.kind === 'distance') {
    return {
      status,
      deltaText: `${deltaValue > 0 ? '+' : ''}${Math.round(deltaValue)} m`,
      fromText: from.text,
      toText: to.text,
      deltaValue
    }
  }

  return {
    status,
    deltaText: `${deltaValue > 0 ? '+' : ''}${Math.round(deltaValue)} s`,
    fromText: from.text,
    toText: to.text,
    deltaValue
  }
}

export const getSessionRecap = (
  logs: BlockLog[],
  session: BuiltSession,
  sessionType: SessionType,
  week: CycleWeek
): { loggedExercises: number; totalExercises: number; loadProxy: number } => {
  const sessionExerciseIds = session.blocks.flatMap((block) =>
    block.block.exercises.map((exercise) => exercise.exerciseId)
  )
  const uniqueExerciseIds = new Set(sessionExerciseIds)
  const totalExercises = uniqueExerciseIds.size

  const logsForSession = logs.filter(
    (log) => log.week === week && log.sessionType === sessionType
  )

  const loggedIds = new Set<string>()
  let loadProxy = 0
  for (const block of session.blocks) {
    for (const exercise of block.block.exercises) {
      const entry = logsForSession
        .find((log) => log.blockId === block.block.blockId)
        ?.entries.find((candidate) => candidate.exerciseId === exercise.exerciseId)

      if (!entry) continue
      loggedIds.add(exercise.exerciseId)

      if (entry.loadKg !== undefined && entry.reps !== undefined) {
        loadProxy += entry.loadKg * entry.reps * block.version.sets
      }
    }
  }

  return {
    loggedExercises: loggedIds.size,
    totalExercises,
    loadProxy: Math.round(loadProxy)
  }
}
