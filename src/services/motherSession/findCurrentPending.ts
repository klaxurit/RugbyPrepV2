import type { Block, MotherSession } from '../../types/motherSession'
import { isDirectiveText, resolveExerciseIdForSessionRun } from './motherSessionExerciseMap'
import { buildExerciseTourKey } from '../../contexts/SessionRunContext'
import {
  parseBlockTourCount,
  parseBlockRestSeconds,
  parseExerciseSets,
} from '../ui/blockPresentation'
import { parseExerciseSetSpec, type ExerciseSetSpec } from '../ui/exerciseSetSpec'

export interface PendingCursor {
  blockNumber: number
  blockName: string
  blockIndex: number
  tourIndex: number
  /** Index in `block.exercises` (NOT in the loggable subset). */
  exerciseIndex: number
  exerciseName: string
  exerciseId: string
  prescription: string
  spec: ExerciseSetSpec
  /** True when this exo is the last loggable of its tour. */
  isLastOfTour: boolean
  /** True when this tour is the final tour of the block. */
  isLastTour: boolean
  /** True when this block is the final block of the session. */
  isLastBlock: boolean
  /** Inter-tour rest in seconds (from block format / first prescription). */
  restSeconds: number
}

/**
 * Find the next exercise the player should validate.
 *
 * Iteration order: blocks (in order), tours (0..N), then loggable exos in
 * declaration order. An exo is skipped for tours past its own per-exo set
 * count (e.g. "2×12-15" exo runs 2 tours even when the block runs 3).
 *
 * Returns null when every loggable exo of every block is marked done.
 */
export function findCurrentPending(
  session: MotherSession,
  completedExercises: Set<string>,
): PendingCursor | null {
  const blocks = session.blocks
  for (let b = 0; b < blocks.length; b++) {
    const block = blocks[b]
    const loggable = collectLoggableExercises(block)
    if (loggable.length === 0) continue

    const tourCount = parseBlockTourCount(block)
    const restSeconds = parseBlockRestSeconds(block)
    const isLastBlock = b === blocks.length - 1

    for (let t = 0; t < tourCount; t++) {
      // Determine which loggable exos belong to this tour (per-exo set count).
      const tourExos = loggable.filter(({ exoTours }) => t < exoTours)
      if (tourExos.length === 0) continue

      for (let i = 0; i < tourExos.length; i++) {
        const { ex, exerciseId, originalIndex } = tourExos[i]
        const key = buildExerciseTourKey(block.number, t, originalIndex)
        if (completedExercises.has(key)) continue
        return {
          blockNumber: block.number,
          blockName: block.name,
          blockIndex: b,
          tourIndex: t,
          exerciseIndex: originalIndex,
          exerciseName: ex.name,
          exerciseId,
          prescription: ex.prescription,
          spec: parseExerciseSetSpec(ex.prescription),
          isLastOfTour: i === tourExos.length - 1,
          isLastTour: t === tourCount - 1,
          isLastBlock,
          restSeconds,
        }
      }
    }
  }
  return null
}

interface LoggableExercise {
  ex: Block['exercises'][number]
  /** Index in the original block.exercises array. */
  originalIndex: number
  exerciseId: string
  /** Per-exo set count (falls back to block tour count). */
  exoTours: number
}

function collectLoggableExercises(block: Block): LoggableExercise[] {
  const tourCount = parseBlockTourCount(block)
  const out: LoggableExercise[] = []
  block.exercises.forEach((ex, idx) => {
    if (isDirectiveText(ex.name)) return
    const exerciseId =
      resolveExerciseIdForSessionRun(ex.name, ex.exerciseId) ?? ''
    if (!exerciseId) return
    const exoTours = parseExerciseSets(ex.prescription) ?? tourCount
    out.push({ ex, originalIndex: idx, exerciseId, exoTours })
  })
  return out
}
