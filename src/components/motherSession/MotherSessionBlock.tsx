import { useMemo, useState } from 'react'
import { Eye, Timer } from 'lucide-react'
import type { Block } from '../../types/motherSession'
import type { BlockLog, ExerciseLogEntry, SessionType, CycleWeek, FatigueStatus } from '../../types/training'
import type { AppLang } from '../../services/motherSession/motherSessionLabels'
import type { SessionContentFr } from '../../services/motherSession/motherSessionContentFr'
import { msLabel, stripBackticks } from '../../services/motherSession/motherSessionLabels'
import { MotherSessionCollapsible } from './MotherSessionCollapsible'
import { resolveExerciseId, isDirectiveText } from '../../services/motherSession/motherSessionExerciseMap'
import { getExerciseName, hasExerciseDemo } from '../../data/exercises'
import { ExerciseDemoSheet } from './ExerciseDemoSheet'
import { SessionTourTracker } from './SessionTourTracker'
import { TimedBlockOverlay, type TimedBlockResult } from './TimedBlockOverlay'
import { parseBlockFormat, isTimedFormat } from '../../services/ui/parseBlockFormat'

export type MotherSessionBlockProps = {
  block: Block
  lang?: AppLang
  frBlock?: SessionContentFr['blocks'][0]
  motherSessionId?: string
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
  /** Si true, le composant saute son entête (nom / format) — l'hôte le rend lui-même. */
  hideHeader?: boolean
  /** Si true, ouvre par défaut les "Notes de coaching" du bloc (utile sur le premier bloc). */
  expandCoaching?: boolean
  /** La séance courante est-elle actuellement en cours ? Passé depuis l'hôte qui peut
   *  vérifier le matching sessionKey — évite d'interpréter un run résiduel global. */
  isRunning?: boolean
  /** Déclenché quand tous les tours du bloc ont été validés en mode running. */
  onBlockCompleted?: () => void
}

function ExerciseRow({
  exercise,
  frName,
  lang,
  onOpenDemo,
}: {
  exercise: Block['exercises'][0]
  frName?: string
  lang: AppLang
  onOpenDemo?: (exerciseId: string) => void
}) {
  const displayExerciseId = exercise.exerciseId ?? resolveExerciseId(exercise.name)
  const displayName = displayExerciseId ? getExerciseName(displayExerciseId, lang) : (frName ?? exercise.name)
  const canShowDemo = Boolean(displayExerciseId && hasExerciseDemo(displayExerciseId))

  return (
    <li className="border-b border-border-app pb-3 last:border-0 last:pb-0">
      {exercise.slotLabel ? (
        <div className="mb-1.5">
          <span className="inline-flex rounded-full border border-brand-border-strong bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-tint">
            {exercise.slotLabel}
          </span>
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <span className="text-sm font-medium text-fg">
            {exercise.role ? (
              <span className="mr-1.5 text-xs font-normal uppercase text-brand-tint">
                ({exercise.role})
              </span>
            ) : null}
            {displayName}
          </span>
          {exercise.prescription ? (
            <span className="text-sm text-fg-secondary">{stripBackticks(exercise.prescription)}</span>
          ) : null}
        </div>

        {canShowDemo && displayExerciseId ? (
          <button
            type="button"
            onClick={() => onOpenDemo?.(displayExerciseId)}
            aria-label={lang === 'fr' ? `Voir l'exécution de ${displayName}` : `View execution for ${displayName}`}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border-app bg-layer-5 text-fg-muted transition-colors hover:border-brand-border-strong hover:text-brand-tint"
          >
            <Eye className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </li>
  )
}

export function MotherSessionBlock({
  block,
  lang = 'fr',
  frBlock,
  hideHeader,
  expandCoaching,
  isRunning,
  isPremium,
  getLastEntryForExercise,
  onBlockCompleted,
}: MotherSessionBlockProps) {
  const runMode = isRunning ?? false
  const blockName = frBlock?.name ?? block.name
  const blockFormat = frBlock?.format ?? block.format
  const coachingNotes = frBlock?.coachingNotes ?? block.coachingNotes
  const fallbackOptions = frBlock?.fallbackOptions ?? block.fallbackOptions

  const hasLoggable = useMemo(
    () =>
      block.exercises.some(
        (ex) => !isDirectiveText(ex.name) && (ex.exerciseId || resolveExerciseId(ex.name)),
      ),
    [block.exercises],
  )

  // Format temporel détecté depuis `block.format` ("EMOM 8'", "Tabata 8x 20/10s"…).
  const parsedFormat = useMemo(() => parseBlockFormat(blockFormat), [blockFormat])
  const isTimed = isTimedFormat(parsedFormat)

  const [demoExerciseId, setDemoExerciseId] = useState<string | null>(null)
  const [timedOverlayOpen, setTimedOverlayOpen] = useState(false)

  const handleTimedFinish = (_result: TimedBlockResult) => {
    setTimedOverlayOpen(false)
    // Notifie le parent que le bloc est considéré terminé.
    // Le résultat détaillé (temps, tours AMRAP) pourra être persisté plus tard.
    onBlockCompleted?.()
  }

  return (
    <article className={hideHeader ? '' : 'rounded-2xl border border-border-app bg-layer-5 p-4'}>
      {!hideHeader && (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-brand-tint">
                {msLabel('block', lang)} {block.number}
                {block.isOptional ? (
                  <span className="ml-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                    {msLabel('optional', lang)}
                  </span>
                ) : null}
              </p>
              <h2 className="mt-1 text-base font-semibold leading-snug text-fg">{blockName}</h2>
            </div>
          </div>

          {blockFormat ? (
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">{msLabel('format', lang)}</p>
              <p className="mt-1 text-sm text-fg-secondary">{stripBackticks(blockFormat)}</p>
            </div>
          ) : null}
        </>
      )}

      {/* Mode Aperçu (pas running) OU bloc non loggable : on affiche la liste simple des exos. */}
      {(!runMode || !hasLoggable) && block.exercises.length > 0 ? (
        <ul className={`${hideHeader ? 'mt-2' : 'mt-4'} space-y-3`}>
          {block.exercises.map((ex, i) => (
            <ExerciseRow
              key={`${block.number}-${i}`}
              exercise={ex}
              frName={frBlock?.exercises[i]?.name}
              lang={lang}
              onOpenDemo={setDemoExerciseId}
            />
          ))}
        </ul>
      ) : null}

      {/* Mode En cours — format temporel (EMOM, Tabata, AMRAP, For Time) :
          bouton "Démarrer le bloc" qui ouvre l'overlay chrono en bas d'écran. */}
      {runMode && isTimed && (
        <div className="mt-4 rounded-2xl border border-brand-border bg-brand-soft/40 p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-brand-tint">
              Bloc chronométré
            </p>
            <p className="text-xs text-fg-secondary mt-0.5">
              Le chrono guide automatiquement chaque intervalle — pose ton téléphone.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTimedOverlayOpen(true)}
            disabled={timedOverlayOpen}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-xl bg-brand text-on-brand text-xs font-black uppercase tracking-wide rf-focus-ring disabled:opacity-50"
          >
            <Timer className="w-3.5 h-3.5" />
            Démarrer
          </button>
        </div>
      )}

      {/* Mode En cours — format classique : tracker par TOURS. */}
      {runMode && !isTimed && hasLoggable && (
        <SessionTourTracker
          block={block}
          lang={lang}
          frExerciseNames={frBlock?.exercises.map((e) => e.name)}
          isPremium={isPremium ?? false}
          getLastEntryForExercise={getLastEntryForExercise}
          onBlockCompleted={onBlockCompleted}
        />
      )}

      {coachingNotes.length > 0 ? (
        <div className="mt-4">
          <MotherSessionCollapsible title={msLabel('coaching_notes', lang)} defaultOpen={expandCoaching ?? false} variant="nested">
            <ul className="space-y-1.5">
              {coachingNotes.map((note, i) => (
                <li key={i} className="text-sm text-fg-muted">
                  {stripBackticks(note)}
                </li>
              ))}
            </ul>
          </MotherSessionCollapsible>
        </div>
      ) : null}

      {fallbackOptions && fallbackOptions.length > 0 ? (
        <div className="mt-4">
          <MotherSessionCollapsible title={msLabel('alternatives', lang)} defaultOpen={false} variant="nested">
            <ul className="list-disc space-y-1.5 pl-4">
              {fallbackOptions.map((opt, i) => (
                <li key={i} className="text-sm text-fg-secondary">
                  {stripBackticks(opt)}
                </li>
              ))}
            </ul>
          </MotherSessionCollapsible>
        </div>
      ) : null}

      <ExerciseDemoSheet
        exerciseId={demoExerciseId}
        lang={lang}
        onClose={() => setDemoExerciseId(null)}
      />

      {isTimed && (
        <TimedBlockOverlay
          block={block}
          format={parsedFormat}
          frExerciseNames={frBlock?.exercises.map((e) => e.name)}
          isOpen={timedOverlayOpen}
          onFinish={handleTimedFinish}
          onCancel={() => setTimedOverlayOpen(false)}
        />
      )}
    </article>
  )
}
