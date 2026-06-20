import { useMemo, useState } from 'react'
import type { Block, MotherSession } from '../../types/motherSession'
import { tr } from '../../i18n/appLabels'
import { buildExerciseTourKey, useSessionRun } from '../../contexts/SessionRunContext'
import { detectBlockKind } from '../../services/session/detectBlockKind'
import { findCurrentPending } from '../../services/motherSession/findCurrentPending'
import {
  parseBlockTourCount,
  parseBlockRestSeconds,
  formatInterTourRest,
} from '../../services/ui/blockPresentation'
import { parseBlockFormat } from '../../services/ui/parseBlockFormat'
import { getLoggableExerciseIndices } from '../../services/session/resolveLoggableExercises'
import { isTimedBlockComplete } from '../../services/motherSession/findCurrentPending'
import { getInterTourRestAfterMarking } from '../../services/motherSession/interTourRest'
import { restTimerAfterTourLine } from '../../i18n/sessionRunUi'
import {
  WarmupBlock,
  ToursBlock,
  EmomBlock,
  PrehabBlock,
  type ExoTourData,
  type TourDataMap,
} from './blocks'
import type { BlockState } from './BlockStateChip'
import type { LoadSuggestion } from '../../services/loadSuggestion'
import type { Lang } from '../../services/motherSession/localizeMotherSessionExerciseName'

export type SessionPhase = 'idle' | 'running' | 'completed'

interface SessionBlocksProps {
  /** Session déjà adaptée (Foundations + équipement + injuries) — voir SessionDetailPage. */
  session: MotherSession
  phase: SessionPhase
  isPremium: boolean
  /** Notifie le parent qu'un bloc vient d'être validé (autosave par bloc). */
  onBlockCompleted?: (blockNumber: number) => void
  /** Demande au parent d'ouvrir l'overlay EMOM/Tabata/AMRAP/For Time pour ce bloc. */
  onStartEmomTimer?: (blockNumber: number) => void
  /** Bloc EMOM dont le chrono overlay est actif. */
  activeEmomBlockNumber?: number | null
  /** Demande au parent d'ouvrir l'overlay iso pour cet exo. */
  onStartIsoTimer?: (blockNumber: number, tourIndex: number, exerciseIndex: number) => void
  /** Demande au parent d'afficher la démo vidéo de l'exo. */
  onPlayDemo?: (blockNumber: number, exerciseIndex: number) => void
  /** Suggestion de charge Premium par exerciseId (undefined si non Premium ou no_data). */
  getLoadSuggestion?: (exerciseId: string) => LoadSuggestion | undefined
  /** Langue d'affichage des noms d'exercices (UserProfile.preferredLanguage). Défaut: 'fr'. */
  lang?: Lang
}

/**
 * Orchestre le rendu des 4 types de blocs (Warmup/Tours/Emom/Prehab) en lecture
 * et en mode running. Lit `sessionRun` pour calculer les états + données par tour.
 *
 * Architecture :
 *  - Les composants `WarmupBlock`/`ToursBlock`/`EmomBlock`/`PrehabBlock` restent
 *    stateless et reçoivent toutes leurs data via props.
 *  - Cet orchestrateur consomme `useSessionRun()` et déduit :
 *      - blockState (pending/active/done)
 *      - currentTourIdx / currentExoIdx via `findCurrentPending`
 *      - tourData (validated + kg + reps) par bloc
 *  - Les actions (validate, set kg/reps) appellent les méthodes sessionRun.
 */
export function SessionBlocks({
  session,
  phase,
  isPremium,
  onBlockCompleted,
  onStartEmomTimer,
  onStartIsoTimer,
  onPlayDemo,
  getLoadSuggestion,
  activeEmomBlockNumber = null,
  lang = 'fr',
}: SessionBlocksProps) {
  const sessionRun = useSessionRun()
  const blocks = session.blocks

  // ── Warm-up : synthétisé depuis session.warmUp (champ séparé des blocks). ─
  // Rendu en tête de séance, jamais "active" (pas de validation set-par-set).
  // Reste invisible pour findCurrentPending (qui n'itère que session.blocks).
  const warmupBlock: Block | null = useMemo(() => {
    const wu = session.warmUp
    if (!wu || wu.exercises.length === 0) return null
    return {
      number: 0,
      name: tr('warmup_block_title', lang),
      format: '',
      exercises: wu.exercises.map((e) => ({ name: e.name, prescription: e.prescription })),
      coachingNotes: wu.notes,
    }
  }, [session.warmUp, lang])

  // ── Curseur pendant : où en est le user ? ──────────────────────────────
  const cursor = useMemo(
    () => (phase === 'running' ? findCurrentPending(session, sessionRun.completedExercises) : null),
    [phase, session, sessionRun.completedExercises],
  )

  // ── État expand par bloc : par défaut, expand le bloc actif en running. ─
  const [expandedBlocks, setExpandedBlocks] = useState<Record<number, boolean>>({})
  const isExpanded = (blockNumber: number, defaultOpen: boolean): boolean => {
    if (blockNumber in expandedBlocks) return expandedBlocks[blockNumber]
    return defaultOpen
  }
  const toggleExpand = (blockNumber: number, defaultOpen: boolean) => {
    setExpandedBlocks((prev) => ({
      ...prev,
      [blockNumber]: !(blockNumber in prev ? prev[blockNumber] : defaultOpen),
    }))
  }

  const warmupExpanded = isExpanded(0, phase === 'idle')
  const onWarmupToggle = () => toggleExpand(0, phase === 'idle')

  return (
    <div className="flex flex-col gap-3.5">
      {warmupBlock && (
        <WarmupBlock
          key="warmup-synthetic"
          block={warmupBlock}
          number={0}
          state={phase === 'completed' ? 'done' : 'pending'}
          showStateChip={phase === 'idle'}
          expanded={warmupExpanded}
          onToggle={onWarmupToggle}
          lang={lang}
          onPlayDemo={onPlayDemo ? (i) => onPlayDemo(0, i) : undefined}
        />
      )}
      {blocks.map((block, i) => {
        const number = i + 1
        const blockState = computeBlockState({
          block,
          phase,
          cursor,
          completedExercises: sessionRun.completedExercises,
        })
        const defaultExpanded = phase === 'running' ? blockState === 'active' : i === 0
        const expanded = isExpanded(block.number, defaultExpanded)
        const onToggle = () => toggleExpand(block.number, defaultExpanded)
        const kind = detectBlockKind(block)
        const notes = block.coachingNotes
        const isCursorBlock = cursor?.blockNumber === block.number

        if (kind === 'warmup') {
          return (
            <WarmupBlock
              key={block.number}
              block={block}
              number={number}
              state={blockState}
              expanded={expanded}
              onToggle={onToggle}
              lang={lang}
              onPlayDemo={onPlayDemo ? (i) => onPlayDemo(block.number, i) : undefined}
            />
          )
        }

        if (kind === 'emom') {
          const fmt = parseBlockFormat(block.format)
          const totalMinutes =
            fmt.type === 'emom' || fmt.type === 'tabata' ? fmt.rounds : 0
          return (
            <EmomBlock
              key={block.number}
              block={block}
              number={number}
              state={blockState}
              expanded={expanded}
              onToggle={onToggle}
              totalMinutes={totalMinutes}
              timerActive={activeEmomBlockNumber === block.number}
              onStartTimer={() => onStartEmomTimer?.(block.number)}
              notes={notes}
              lang={lang}
              onPlayDemo={onPlayDemo ? (i) => onPlayDemo(block.number, i) : undefined}
            />
          )
        }

        if (kind === 'prehab') {
          const validatedByIdx = buildPrehabValidatedMap(block.number, block, sessionRun.completedExercises)
          const currentExoIdx = isCursorBlock ? cursor?.exerciseIndex : undefined
          return (
            <PrehabBlock
              key={block.number}
              block={block}
              number={number}
              state={blockState}
              expanded={expanded}
              onToggle={onToggle}
              currentExoIdx={currentExoIdx}
              validatedByIdx={validatedByIdx}
              lang={lang}
              onPlayDemo={onPlayDemo ? (i) => onPlayDemo(block.number, i) : undefined}
              onValidateExo={(exoIdx) => {
                handleValidateExoFromBlock({
                  session,
                  blockNumber: block.number,
                  tourIndex: 0,
                  exerciseIndex: exoIdx,
                  sessionRun,
                  block,
                  lang,
                  onBlockCompleted,
                })
              }}
              onStartIso={(exoIdx) => onStartIsoTimer?.(block.number, 0, exoIdx)}
              notes={notes}
            />
          )
        }

        // tours
        const totalTours = parseBlockTourCount(block)
        const restSeconds = parseBlockRestSeconds(block)
        const restLabel =
          restSeconds > 0 ? formatInterTourRest(restSeconds, lang) : undefined
        const tourData = buildToursTourData({
          block,
          totalTours,
          completedExercises: sessionRun.completedExercises,
          exerciseTourLoads: sessionRun.exerciseTourLoads,
        })
        const currentTourIdx = isCursorBlock ? cursor?.tourIndex : undefined
        const currentExoIdx = isCursorBlock ? cursor?.exerciseIndex : undefined
        return (
          <ToursBlock
            key={block.number}
            block={block}
            number={number}
            state={blockState}
            expanded={expanded}
            onToggle={onToggle}
            lang={lang}
            totalTours={totalTours}
            restLabel={restLabel}
            currentTourIdx={currentTourIdx}
            currentExoIdx={currentExoIdx}
            premium={isPremium}
            tourData={tourData}
            onValidateExo={(tourIdx, exoIdx) => {
              handleValidateExoFromBlock({
                session,
                blockNumber: block.number,
                tourIndex: tourIdx,
                exerciseIndex: exoIdx,
                sessionRun,
                block,
                lang,
                onBlockCompleted,
              })
            }}
            onSetExoData={(tourIdx, exoIdx, patch) => {
              const key = buildExerciseTourKey(block.number, tourIdx, exoIdx)
              const numKg = patch.kg !== undefined ? toNumberOrUndefined(patch.kg) : undefined
              const numReps = patch.reps !== undefined ? toNumberOrUndefined(patch.reps) : undefined
              sessionRun.setExerciseTourLoad(key, {
                ...(patch.kg !== undefined ? { loadKg: numKg } : {}),
                ...(patch.reps !== undefined ? { reps: numReps } : {}),
              })
              if (sessionRun.completedExercises.has(key)) {
                onBlockCompleted?.(block.number)
              }
            }}
            onPlayDemo={onPlayDemo ? (exoIdx) => onPlayDemo(block.number, exoIdx) : undefined}
            onStartIso={(tourIdx, exoIdx) => onStartIsoTimer?.(block.number, tourIdx, exoIdx)}
            notes={notes}
            getLoadSuggestion={getLoadSuggestion}
          />
        )
      })}
    </div>
  )
}

// ─── Helpers internes ────────────────────────────────────────────────────────

interface ComputeBlockStateArgs {
  block: MotherSession['blocks'][number]
  phase: SessionPhase
  cursor: ReturnType<typeof findCurrentPending>
  completedExercises: Set<string>
}

function computeBlockState({
  block,
  phase,
  cursor,
  completedExercises,
}: ComputeBlockStateArgs): BlockState {
  if (phase === 'completed') return 'done'
  if (phase === 'idle') return 'pending'

  // running : status calculé sur les exos loggables.
  const loggableIdx = getLoggableExerciseIndices(block)
  if (loggableIdx.length === 0) return 'pending'

  if (detectBlockKind(block) === 'emom') {
    if (isTimedBlockComplete(block, completedExercises)) return 'done'
    if (cursor?.blockNumber === block.number) return 'active'
    return 'pending'
  }

  const tourCount = parseBlockTourCount(block)
  // Bloc fini : tous les couples (tour, exoLoggable) sont validés.
  const allDone = loggableIdx.every((exoIdx) => {
    for (let t = 0; t < tourCount; t++) {
      if (!completedExercises.has(buildExerciseTourKey(block.number, t, exoIdx))) return false
    }
    return true
  })
  if (allDone) return 'done'

  // Bloc actif : c'est celui qui contient le cursor courant.
  if (cursor?.blockNumber === block.number) return 'active'
  // Sinon, bloc à venir.
  return 'pending'
}

interface BuildToursDataArgs {
  block: MotherSession['blocks'][number]
  totalTours: number
  completedExercises: Set<string>
  exerciseTourLoads: Record<string, { loadKg?: number; reps?: number }>
}

function buildToursTourData({
  block,
  totalTours,
  completedExercises,
  exerciseTourLoads,
}: BuildToursDataArgs): TourDataMap {
  const out: TourDataMap = {}
  for (let t = 0; t < totalTours; t++) {
    const tourMap: Record<number, ExoTourData> = {}
    for (let e = 0; e < block.exercises.length; e++) {
      const key = buildExerciseTourKey(block.number, t, e)
      const validated = completedExercises.has(key)
      const load = exerciseTourLoads[key]
      const kg = load?.loadKg != null ? String(load.loadKg) : ''
      const reps = load?.reps != null ? String(load.reps) : ''
      tourMap[e] = { validated, kg, reps }
    }
    out[t] = tourMap
  }
  return out
}

function buildPrehabValidatedMap(
  blockNumber: number,
  block: MotherSession['blocks'][number],
  completedExercises: Set<string>,
): Record<number, boolean> {
  const out: Record<number, boolean> = {}
  for (let e = 0; e < block.exercises.length; e++) {
    const key = buildExerciseTourKey(blockNumber, 0, e)
    out[e] = completedExercises.has(key)
  }
  return out
}

interface HandleValidateArgs {
  session: MotherSession
  blockNumber: number
  tourIndex: number
  exerciseIndex: number
  sessionRun: ReturnType<typeof useSessionRun>
  block: MotherSession['blocks'][number]
  lang: Lang
  onBlockCompleted?: (blockNumber: number) => void
}

function handleValidateExoFromBlock({
  session,
  blockNumber,
  tourIndex,
  exerciseIndex,
  sessionRun,
  block,
  lang,
  onBlockCompleted,
}: HandleValidateArgs) {
  const key = buildExerciseTourKey(blockNumber, tourIndex, exerciseIndex)
  const wasValidated = sessionRun.completedExercises.has(key)
  if (wasValidated) {
    sessionRun.unmarkExerciseDone(key)
    return
  }

  if (sessionRun.restTimer) sessionRun.skipRestTimer()
  sessionRun.markExerciseDone(key)

  const completed = new Set(sessionRun.completedExercises)
  completed.add(key)

  const rest = getInterTourRestAfterMarking(
    session,
    blockNumber,
    tourIndex,
    exerciseIndex,
    completed,
  )
  if (rest) {
    sessionRun.startRestTimer(
      rest.restSeconds,
      restTimerAfterTourLine(rest.tourOneBased, lang),
    )
  }

  // Notification "bloc fini" si TOUS les loggables × TOUS les tours sont marqués.
  const loggableIdx = getLoggableExerciseIndices(block)
  if (loggableIdx.length === 0) return
  const tourCount = parseBlockTourCount(block)
  const allDone = loggableIdx.every((exoIdx) => {
    for (let t = 0; t < tourCount; t++) {
      if (!completed.has(buildExerciseTourKey(blockNumber, t, exoIdx))) return false
    }
    return true
  })
  if (allDone) onBlockCompleted?.(blockNumber)
}

function toNumberOrUndefined(value: string): number | undefined {
  if (!value || value.trim() === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}
