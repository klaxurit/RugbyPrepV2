import { buildExerciseTourKey } from '../../contexts/SessionRunContext'
import type { Block, MotherSession } from '../../types/motherSession'
import {
  parseBlockRestSeconds,
  parseBlockTourCount,
  parseExerciseSets,
} from '../ui/blockPresentation'
import { isDirectiveText, resolveExerciseIdForSessionRun } from './motherSessionExerciseMap'

export interface InterTourRestSchedule {
  restSeconds: number
  /** Tour terminé (1-based) — pour le libellé du timer. */
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

/**
 * Indique si un repos inter-tours doit démarrer après validation d'un exo.
 * Retourne null si le tour n'est pas encore complet, si c'était le dernier
 * tour du dernier bloc, ou s'il n'y a pas de repos configuré.
 */
export function getInterTourRestAfterMarking(
  session: MotherSession,
  blockNumber: number,
  tourIndex: number,
  exerciseIndex: number,
  completedExercises: Set<string>,
): InterTourRestSchedule | null {
  const blockIndex = session.blocks.findIndex((b) => b.number === blockNumber)
  if (blockIndex < 0) return null

  const block = session.blocks[blockIndex]
  const loggable = collectLoggableExercises(block)
  const tourCount = parseBlockTourCount(block)
  const tourExos = loggable.filter(({ exoTours }) => tourIndex < exoTours)
  if (tourExos.length === 0) return null

  const lastInTour = tourExos[tourExos.length - 1]
  if (lastInTour.originalIndex !== exerciseIndex) return null

  for (const { originalIndex } of tourExos) {
    const key = buildExerciseTourKey(blockNumber, tourIndex, originalIndex)
    if (!completedExercises.has(key)) return null
  }

  const isLastTour = tourIndex === tourCount - 1
  const isLastBlock = blockIndex === session.blocks.length - 1
  if (isLastTour && isLastBlock) return null

  const restSeconds = parseBlockRestSeconds(block)
  if (restSeconds <= 0) return null

  return { restSeconds, tourOneBased: tourIndex + 1 }
}
