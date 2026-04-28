import type { MotherSession, Block } from '../../types/motherSession'
import type { BlockLog, ExerciseLogEntry, SessionType, CycleWeek, FatigueStatus, Equipment, TrainingLevel } from '../../types/training'
import type { AppLang } from '../../services/motherSession/motherSessionLabels'
import { msLabel, stripBackticks } from '../../services/motherSession/motherSessionLabels'
import { getSessionFrOrFallback } from '../../services/motherSession/motherSessionContentFr'
import { adaptMotherSessionForFoundations, adaptSessionContentFrForFoundations, isFoundationsLevel } from '../../services/motherSession/foundationsSessionAdaptations'
import {
  adaptMotherSessionForEquipmentAlternatives,
  adaptSessionContentFrForEquipmentAlternatives,
} from '../../services/motherSession/equipmentAlternativeAdaptations'
import { MotherSessionBlock } from './MotherSessionBlock'
import { MotherSessionCollapsible } from './MotherSessionCollapsible'
import { MotherSessionHeader } from './MotherSessionHeader'
import { MotherSessionInjurySubs } from './MotherSessionInjurySubs'
import { MotherSessionWarmUp } from './MotherSessionWarmUp'
import { SessionBlockCard } from './SessionBlockCard'
import { classifyBlock, parseBlockTourCount } from '../../services/ui/blockPresentation'
import { resolveExerciseId, isDirectiveText } from '../../services/motherSession/motherSessionExerciseMap'
import { useSessionRun, buildExerciseTourKey } from '../../contexts/SessionRunContext'
import { useMemo } from 'react'

type MotherSessionViewProps = {
  session: MotherSession
  lang?: AppLang
  injuries?: string[]
  sessionType?: SessionType
  week?: CycleWeek
  fatigue?: FatigueStatus
  onSaveBlock?: (log: Omit<BlockLog, 'id'>) => void
  getLastEntryForExercise?: (exerciseId: string) => ExerciseLogEntry | undefined
  getBestForExercise?: (exerciseId: string) => {
    bestLoadKg?: number; bestReps?: number; bestMeters?: number; bestSeconds?: number
    bestLabel?: string; bestLoadRepsScore?: number
  }
  isPremium?: boolean
  acwr?: number | null
  isRehabActive?: boolean
  trainingLevel?: TrainingLevel
  equipment?: Equipment[]
  /** Cette séance est-elle en cours ? Passé par l'hôte (vérifié via isRunningFor(sessionKey)). */
  isRunning?: boolean
  /** Appelé quand tous les tours d'un bloc sont validés. Utilisé pour l'autosave par bloc. */
  onBlockCompleted?: (blockNumber: number) => void
}

function collectLoggableIndices(block: Block): number[] {
  const indices: number[] = []
  block.exercises.forEach((ex, i) => {
    if (isDirectiveText(ex.name)) return
    if (!(ex.exerciseId || resolveExerciseId(ex.name))) return
    indices.push(i)
  })
  return indices
}

function isBlockRunComplete(block: Block, completed: Set<string>): boolean {
  const exIdx = collectLoggableIndices(block)
  if (exIdx.length === 0) return false
  const tours = parseBlockTourCount(block)
  for (let t = 0; t < tours; t++) {
    for (const i of exIdx) {
      if (!completed.has(buildExerciseTourKey(block.number, t, i))) return false
    }
  }
  return true
}

export function MotherSessionView({
  session,
  lang = 'fr',
  injuries,
  sessionType,
  week,
  fatigue,
  onSaveBlock,
  getLastEntryForExercise,
  getBestForExercise,
  isPremium,
  acwr,
  isRehabActive,
  trainingLevel,
  equipment,
  isRunning,
  onBlockCompleted,
}: MotherSessionViewProps) {
  const isFoundations = isFoundationsLevel(trainingLevel)
  const foundationsSession = isFoundations ? adaptMotherSessionForFoundations(session, equipment) : session
  const adaptedSession = adaptMotherSessionForEquipmentAlternatives(foundationsSession, equipment)
  const rawFrContent = lang === 'fr' ? getSessionFrOrFallback(session) : undefined
  const foundationsFrContent =
    lang === 'fr' && isFoundations
      ? adaptSessionContentFrForFoundations(session, rawFrContent, equipment)
      : rawFrContent
  const frContent =
    lang === 'fr'
      ? adaptSessionContentFrForEquipmentAlternatives(foundationsSession, foundationsFrContent, equipment)
      : undefined

  const hasProgressionRules = (frContent?.progressionRules ?? adaptedSession.progressionRules).length > 0
  const hasPositionAccent = (frContent?.positionAccent ?? adaptedSession.positionAccent).length > 0
  const showUnderstand = hasProgressionRules || hasPositionAccent
  const showInjurySubs = injuries != null && injuries.length > 0

  const sessionRun = useSessionRun()

  // Calcule l'état run de chaque bloc (terminé ? actif ?). Actif = premier non-terminé
  // parmi les blocs loggables. Hors mode running, tous les blocs sont "neutres".
  const blockRunStates = useMemo(() => {
    if (!isRunning) {
      return adaptedSession.blocks.map(() => ({ isCompleted: false, isActive: false }))
    }
    let activeAssigned = false
    return adaptedSession.blocks.map((b) => {
      const isCompleted = isBlockRunComplete(b, sessionRun.completedExercises)
      const hasLoggable = collectLoggableIndices(b).length > 0
      let isActive = false
      if (!activeAssigned && hasLoggable && !isCompleted) {
        isActive = true
        activeAssigned = true
      }
      return { isCompleted, isActive }
    })
  }, [adaptedSession.blocks, sessionRun.completedExercises, isRunning])

  return (
    <div className="min-w-0 max-w-[min(100%,28rem)] space-y-4 p-3 text-fg sm:p-4">
      <MotherSessionHeader metadata={adaptedSession.metadata} lang={lang} compact={isRunning} />

      <MotherSessionWarmUp
        warmUp={adaptedSession.warmUp}
        lang={lang}
        frWarmUp={frContent ? { exercises: frContent.warmUpExercises, notes: frContent.warmUpNotes } : undefined}
      />

      <section className="space-y-3" aria-label="Training blocks">
        {adaptedSession.blocks.map((block, i) => {
          const kind = classifyBlock(block)
          const runState = blockRunStates[i]
          // En mode preview : Bloc 1 + warmups ouverts par défaut. En mode running :
          // SessionBlockCard force l'état via runModeActive (plus de toggle utilisateur).
          const previewDefaultOpen = i === 0 || kind === 'warmup'
          return (
            <SessionBlockCard
              key={block.number}
              block={block}
              lang={lang}
              displayName={frContent?.blocks[i]?.name ?? block.name}
              defaultOpen={previewDefaultOpen}
              isRunning={isRunning}
              runModeActive={runState.isActive}
              runModeCompleted={runState.isCompleted}
            >
              <MotherSessionBlock
                block={block}
                lang={lang}
                frBlock={frContent?.blocks[i]}
                motherSessionId={session.metadata.id}
                sessionType={sessionType}
                week={week}
                fatigue={fatigue}
                onSaveBlock={onSaveBlock}
                getLastEntryForExercise={getLastEntryForExercise}
                getBestForExercise={getBestForExercise}
                isPremium={isPremium}
                acwr={acwr}
                isRehabActive={isRehabActive}
                hideHeader
                expandCoaching={previewDefaultOpen || runState.isActive}
                isRunning={isRunning}
                onBlockCompleted={onBlockCompleted ? () => onBlockCompleted(block.number) : undefined}
              />
            </SessionBlockCard>
          )
        })}
      </section>

      {showUnderstand && (
        <MotherSessionCollapsible title={msLabel('understand_session', lang)} defaultOpen={false}>
          {hasProgressionRules && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted mb-2">
                {msLabel('progression_rules', lang)}
              </p>
              <ul className="space-y-2 mb-4">
                {(frContent?.progressionRules ?? adaptedSession.progressionRules).map((rule, i) => (
                  <li key={i} className="text-sm text-fg-secondary">
                    {stripBackticks(rule)}
                  </li>
                ))}
              </ul>
            </>
          )}
          {hasPositionAccent && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted mb-2">
                {msLabel('position_accent', lang)}
              </p>
              <ul className="space-y-2">
                {(frContent?.positionAccent ?? adaptedSession.positionAccent).map((line, i) => (
                  <li key={i} className="text-sm text-fg-secondary">
                    {stripBackticks(line)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </MotherSessionCollapsible>
      )}

      {showInjurySubs && (
        <MotherSessionInjurySubs injurySubstitutions={adaptedSession.injurySubstitutions} lang={lang} />
      )}

      {(frContent?.coachingWarnings ?? adaptedSession.coachingWarnings).length > 0 ? (
        <MotherSessionCollapsible title={msLabel('coaching_warnings', lang)} defaultOpen={false}>
          <ul className="space-y-2">
            {(frContent?.coachingWarnings ?? adaptedSession.coachingWarnings).map((w, i) => (
              <li key={i} className="text-sm text-fg-secondary">
                {stripBackticks(w)}
              </li>
            ))}
          </ul>
        </MotherSessionCollapsible>
      ) : null}
    </div>
  )
}
