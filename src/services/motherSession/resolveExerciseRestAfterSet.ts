import { buildExerciseTourKey } from '../../contexts/SessionRunContext'
import type { Block, MotherSession } from '../../types/motherSession'
import {
  parseBlockRestSeconds,
  parseBlockTourCount,
  parseExerciseSets,
  parseIntraTourRestSeconds,
  parseRestSecondsFromText,
} from '../ui/blockPresentation'
import { isDirectiveText, resolveExerciseIdForSessionRun } from './motherSessionExerciseMap'

/** Repos court entre exos d'un même tour (superset / finisher). */
export const DEFAULT_INTRA_TOUR_REST_SECONDS = 15

export type RestAfterSetKind = 'intra_tour' | 'inter_tour'

export interface RestAfterSetSchedule {
  restSeconds: number
  kind: RestAfterSetKind
  /** Tour terminé ou en cours (1-based) — libellé chrono. */
  tourOneBased: number
}

interface LoggableExercise {
  originalIndex: number
  exoTours: number
}

function collectLoggableExercises(block: Block): LoggableExercise[] {
  const tourCount = parseBlockTourCount(block)
  const out: LoggableExercise[] = []
  block.exercises.forEach((ex, idx) => {
    if (isDirectiveText(ex.name)) return
    const exerciseId = resolveExerciseIdForSessionRun(ex.name, ex.exerciseId) ?? ''
    if (!exerciseId) return
    const exoTours = parseExerciseSets(ex.prescription) ?? tourCount
    out.push({ originalIndex: idx, exoTours })
  })
  return out
}

function isLastExerciseInTour(
  loggable: LoggableExercise[],
  tourIndex: number,
  exerciseIndex: number,
): boolean {
  const tourExos = loggable.filter(({ exoTours }) => tourIndex < exoTours)
  if (tourExos.length === 0) return true
  return tourExos[tourExos.length - 1].originalIndex === exerciseIndex
}

function isSessionEnd(
  session: MotherSession,
  blockIndex: number,
  tourIndex: number,
): boolean {
  const block = session.blocks[blockIndex]
  const tourCount = parseBlockTourCount(block)
  const isLastTour = tourIndex >= tourCount - 1
  const isLastBlock = blockIndex >= session.blocks.length - 1
  return isLastTour && isLastBlock
}

/**
 * Repos à lancer après validation d'une série (exo/tour).
 * Hevy-like : repos par exercice, court entre exos d'un tour, long entre tours.
 */
export function getRestAfterExerciseSet(
  session: MotherSession,
  blockNumber: number,
  tourIndex: number,
  exerciseIndex: number,
): RestAfterSetSchedule | null {
  const blockIndex = session.blocks.findIndex((b) => b.number === blockNumber)
  if (blockIndex < 0) return null

  const block = session.blocks[blockIndex]
  const exercise = block.exercises[exerciseIndex]
  if (!exercise || isDirectiveText(exercise.name)) return null

  const loggable = collectLoggableExercises(block)
  const tourExos = loggable.filter(({ exoTours }) => tourIndex < exoTours)
  if (tourExos.length === 0) return null

  const lastInTour = isLastExerciseInTour(loggable, tourIndex, exerciseIndex)
  if (isSessionEnd(session, blockIndex, tourIndex) && lastInTour) return null

  let restSeconds: number
  let kind: RestAfterSetKind

  if (exercise.restAfterSetSeconds != null) {
    restSeconds = exercise.restAfterSetSeconds
    kind = lastInTour ? 'inter_tour' : 'intra_tour'
  } else if (!lastInTour) {
    restSeconds =
      parseIntraTourRestSeconds(block.format) ??
      parseRestSecondsFromText(exercise.prescription) ??
      DEFAULT_INTRA_TOUR_REST_SECONDS
    kind = 'intra_tour'
  } else {
    restSeconds = parseBlockRestSeconds(block)
    kind = 'inter_tour'
  }

  if (restSeconds <= 0) return null

  return { restSeconds, kind, tourOneBased: tourIndex + 1 }
}

/** @deprecated Préférer getRestAfterExerciseSet — conservé pour tests de migration. */
export function getInterTourRestAfterMarking(
  session: MotherSession,
  blockNumber: number,
  tourIndex: number,
  exerciseIndex: number,
  completedExercises: Set<string>,
): RestAfterSetSchedule | null {
  const blockIndex = session.blocks.findIndex((b) => b.number === blockNumber)
  if (blockIndex < 0) return null

  const block = session.blocks[blockIndex]
  const loggable = collectLoggableExercises(block)
  const tourExos = loggable.filter(({ exoTours }) => tourIndex < exoTours)
  if (tourExos.length === 0) return null

  const lastInTour = tourExos[tourExos.length - 1]
  if (lastInTour.originalIndex !== exerciseIndex) return null

  for (const { originalIndex } of tourExos) {
    const key = buildExerciseTourKey(blockNumber, tourIndex, originalIndex)
    if (!completedExercises.has(key)) return null
  }

  return getRestAfterExerciseSet(session, blockNumber, tourIndex, exerciseIndex)
}
