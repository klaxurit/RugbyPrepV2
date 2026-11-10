/**
 * Progression séance (en-tête bloc / minute) — une seule dérivation pure.
 * Les blocs EMOM ne revendiquent plus « Minute 1/N » une fois terminés ou validés.
 */

import type { Block } from '../../types/motherSession'
import { buildExerciseTourKey } from '../../contexts/SessionRunContext'
import { isDirectiveText, resolveExerciseIdForSessionRun } from '../motherSession/motherSessionExerciseMap'
import { isTimedBlockComplete } from '../motherSession/findCurrentPending'
import { parseBlockFormat } from '../ui/parseBlockFormat'
import { parseBlockTourCount } from '../ui/blockPresentation'
import { localizeBlockName } from '../motherSession/motherSessionBlockLabels'
import type { Lang } from '../../i18n/appLabels'

export type SessionRunUnitLabel = 'Tour' | 'Minute' | 'Round' | 'For Time'

export type EmomLiveSnapshot = {
  blockNumber: number
  displayMinute: number
  totalMinutes: number
  emomFinished: boolean
}

export type SessionRunProgress = {
  totalTours: number
  completedTours: number
  /** 1-based index du bloc actif dans la liste ; 0 si aucun. */
  activeBlockIndex: number
  totalBlocks: number
  activeBlockName: string
  /** 1-based (Minute 3/8) ; null si pas d’unité à afficher. */
  activeTourIndex: number | null
  activeBlockTourCount: number
  activeBlockUnitLabel: SessionRunUnitLabel
}

function loggableIndexes(block: Block): number[] {
  const out: number[] = []
  block.exercises.forEach((ex, i) => {
    if (isDirectiveText(ex.name)) return
    if (!resolveExerciseIdForSessionRun(ex.name, ex.exerciseId)) return
    out.push(i)
  })
  return out
}

/**
 * Pure. En-tête + compteurs tours dérivés des sets validés + snapshot EMOM live.
 */
export function resolveSessionRunProgress(input: {
  blocks: readonly Block[]
  completedExercises: ReadonlySet<string>
  lang?: Lang
  emomLive?: EmomLiveSnapshot | null
  finishedEmomBlockNumber?: number | null
}): SessionRunProgress {
  const lang = input.lang ?? 'fr'
  const emomLive = input.emomLive ?? null
  const finishedEmomBlockNumber = input.finishedEmomBlockNumber ?? null
  const blocks = input.blocks

  let totalTours = 0
  let completedTours = 0
  let activeBlockIndex = 0
  let activeBlockName = ''
  let activeTourIndex: number | null = null
  let activeBlockTourCount = 0
  let activeBlockUnitLabel: SessionRunUnitLabel = 'Tour'

  for (let b = 0; b < blocks.length; b++) {
    const block = blocks[b]
    const loggableIdx = loggableIndexes(block)
    if (loggableIdx.length === 0) continue

    const fmt = parseBlockFormat(block.format)
    const unitCount =
      fmt.type === 'emom' || fmt.type === 'tabata' ? fmt.rounds : parseBlockTourCount(block)

    totalTours += unitCount
    let blockCompletedTours = 0
    let blockActiveTour: number | null = null
    let unitLabel: SessionRunUnitLabel = 'Tour'
    let displayTourIndex: number | null = null

    if (fmt.type === 'rounds') {
      for (let t = 0; t < unitCount; t++) {
        const allDone = loggableIdx.every((i) =>
          input.completedExercises.has(buildExerciseTourKey(block.number, t, i)),
        )
        if (allDone) blockCompletedTours += 1
        else if (blockActiveTour === null) blockActiveTour = t
      }
      if (blockActiveTour !== null) {
        displayTourIndex = blockActiveTour + 1
        unitLabel = 'Tour'
      }
    } else if (fmt.type === 'emom' || fmt.type === 'tabata') {
      unitLabel = fmt.type === 'emom' ? 'Minute' : 'Round'

      if (isTimedBlockComplete(block, input.completedExercises)) {
        blockCompletedTours = unitCount
        blockActiveTour = null
      } else if (
        emomLive?.blockNumber === block.number ||
        finishedEmomBlockNumber === block.number
      ) {
        const finished =
          emomLive?.blockNumber === block.number
            ? emomLive.emomFinished
            : finishedEmomBlockNumber === block.number
        if (finished) {
          blockCompletedTours = unitCount
          blockActiveTour = unitCount - 1
          displayTourIndex = unitCount
        } else {
          const minute = Math.max(1, emomLive?.displayMinute ?? 1)
          blockActiveTour = minute - 1
          displayTourIndex = minute
        }
      } else {
        // Chrono pas démarré : premier bloc incomplet = actif, sans « Minute 1/N ».
        blockActiveTour = 0
        displayTourIndex = null
      }
    } else if (fmt.type === 'for_time') {
      unitLabel = 'For Time'
      if (isTimedBlockComplete(block, input.completedExercises)) {
        blockCompletedTours = unitCount
      } else {
        blockActiveTour = 0
        displayTourIndex = null
      }
    } else {
      blockActiveTour = 0
      displayTourIndex = 1
    }

    completedTours += blockCompletedTours

    if (activeBlockIndex === 0 && blockActiveTour !== null) {
      activeBlockIndex = b + 1
      activeBlockName = localizeBlockName(block.name, lang)
      activeTourIndex = displayTourIndex
      activeBlockTourCount = unitCount
      activeBlockUnitLabel = unitLabel
    }
  }

  if (activeBlockIndex === 0 && blocks.length > 0) {
    activeBlockIndex = blocks.length
    activeBlockName = localizeBlockName(blocks[blocks.length - 1].name, lang)
  }

  return {
    totalTours,
    completedTours,
    activeBlockIndex,
    totalBlocks: blocks.length,
    activeBlockName,
    activeTourIndex,
    activeBlockTourCount,
    activeBlockUnitLabel,
  }
}
