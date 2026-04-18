import { useMemo, useState, useCallback } from 'react'
import { Eye, Check } from 'lucide-react'
import { useSessionRun } from '../../contexts/SessionRunContext'
import type { Block } from '../../types/motherSession'
import type { BlockLog, ExerciseLogEntry, SessionType, CycleWeek, FatigueStatus } from '../../types/training'
import type { AppLang } from '../../services/motherSession/motherSessionLabels'
import type { SessionContentFr } from '../../services/motherSession/motherSessionContentFr'
import { msLabel, stripBackticks } from '../../services/motherSession/motherSessionLabels'
import { MotherSessionCollapsible } from './MotherSessionCollapsible'
import { resolveExerciseId, isDirectiveText } from '../../services/motherSession/motherSessionExerciseMap'
import { getExerciseMetricType } from '../../services/ui/exerciseMetrics'
import { getExerciseName, hasExerciseDemo } from '../../data/exercises'
import { ExerciseDemoSheet } from './ExerciseDemoSheet'
import { SessionSetTracker } from './SessionSetTracker'

export type MotherSessionBlockProps = {
  block: Block
  lang?: AppLang
  frBlock?: SessionContentFr['blocks'][0]
  // Logging
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
  // Premium load suggestion
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
}

function ExerciseRow({
  exercise,
  frName,
  lang,
  onOpenDemo,
  runMode,
  isDone,
  onToggleDone,
}: {
  exercise: Block['exercises'][0]
  frName?: string
  lang: AppLang
  onOpenDemo?: (exerciseId: string) => void
  /** Quand true, affiche une case à cocher + style "terminé" quand isDone. */
  runMode?: boolean
  isDone?: boolean
  onToggleDone?: () => void
}) {
  const displayExerciseId = exercise.exerciseId ?? resolveExerciseId(exercise.name)
  const displayName = displayExerciseId ? getExerciseName(displayExerciseId, lang) : (frName ?? exercise.name)
  const canShowDemo = Boolean(displayExerciseId && hasExerciseDemo(displayExerciseId))
  const canCheck = runMode && !isDirectiveText(exercise.name)

  return (
    <li className={`border-b border-border-app pb-3 last:border-0 last:pb-0 transition-opacity ${isDone ? 'opacity-50' : ''}`}>
      {exercise.slotLabel ? (
        <div className="mb-1.5">
          <span className="inline-flex rounded-full border border-brand-border-strong bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-tint">
            {exercise.slotLabel}
          </span>
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        {canCheck && (
          <button
            type="button"
            onClick={onToggleDone}
            aria-pressed={isDone}
            aria-label={isDone ? `Annuler ${displayName}` : `Marquer ${displayName} comme fait`}
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border-2 transition-colors rf-focus-ring ${
              isDone
                ? 'bg-ok-strong border-ok-strong text-white'
                : 'border-border-app bg-layer-5 text-fg-ghost hover:border-brand-border-strong hover:text-brand-tint'
            }`}
          >
            {isDone && <Check className="h-4 w-4" strokeWidth={3} />}
          </button>
        )}
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <span className={`text-sm font-medium text-fg ${isDone ? 'line-through' : ''}`}>
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
}: MotherSessionBlockProps) {
  const sessionRun = useSessionRun()
  // Ne s'appuie PAS sur `sessionRun.status` seul : un run résiduel d'une autre séance
  // ne doit pas forcer l'ouverture ici. L'hôte passe la valeur scoped via isRunningFor.
  const runMode = isRunning ?? false
  const blockName = frBlock?.name ?? block.name
  const blockFormat = frBlock?.format ?? block.format
  const coachingNotes = frBlock?.coachingNotes ?? block.coachingNotes
  const fallbackOptions = frBlock?.fallbackOptions ?? block.fallbackOptions
  const getDisplayExerciseName = useCallback(
    (exerciseId: string) => getExerciseName(exerciseId, lang),
    [lang],
  )

  // Resolve which exercises are loggable (cochables en mode En cours)
  const loggableExercises = useMemo(() => {
    return block.exercises
      .map((ex, idx) => {
        if (isDirectiveText(ex.name)) return null
        const exerciseId = ex.exerciseId ?? resolveExerciseId(ex.name)
        if (!exerciseId) return null
        return { exercise: ex, exerciseId, idx }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }, [block.exercises])

  const hasLoggable = loggableExercises.length > 0
  const [demoExerciseId, setDemoExerciseId] = useState<string | null>(null)

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

      {hideHeader && blockFormat ? (
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">{msLabel('format', lang)}</p>
          <p className="mt-1 text-sm text-fg-secondary">{stripBackticks(blockFormat)}</p>
        </div>
      ) : null}

      {block.exercises.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {block.exercises.map((ex, i) => {
            const exerciseKey = `${block.number}_${i}`
            const isDone = runMode && sessionRun.completedExercises.has(exerciseKey)
            // En mode running, les exos loggables ont leur SessionSetTracker ci-dessous
            // qui auto-coche — on masque la checkbox redondante ici pour ces exos.
            const hasTrackerBelow = Boolean(
              runMode && loggableExercises.some((le) => le.idx === i),
            )
            return (
              <ExerciseRow
                key={`${block.number}-${i}`}
                exercise={ex}
                frName={frBlock?.exercises[i]?.name}
                lang={lang}
                onOpenDemo={setDemoExerciseId}
                runMode={runMode && !hasTrackerBelow}
                isDone={isDone}
                onToggleDone={() =>
                  isDone
                    ? sessionRun.unmarkExerciseDone(exerciseKey)
                    : sessionRun.markExerciseDone(exerciseKey)
                }
              />
            )
          })}
        </ul>
      ) : null}

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

      {/* ── Mode "En cours" : set tracker inline par exercice, Free comme Premium ──
          Free = juste les cases ✓ par série (+ CTA "Logger mes kg/reps avec Premium →").
          Premium = + inputs kg/reps pré-remplis depuis la dernière séance. */}
      {runMode && hasLoggable && (
        <div className="mt-4 space-y-2">
          {loggableExercises.map(({ exerciseId, idx }) => {
            const exerciseKey = `${block.number}_${idx}`
            const metricType = getExerciseMetricType({ exerciseId })
            const lastEntry = getLastEntryForExercise?.(exerciseId)
            const exercise = block.exercises[idx]
            return (
              <SessionSetTracker
                key={exerciseId}
                exerciseKey={exerciseKey}
                exerciseName={getDisplayExerciseName(exerciseId)}
                prescription={exercise?.prescription}
                lastEntry={lastEntry}
                showLoad={metricType === 'load_reps'}
                showReps={metricType === 'load_reps' || metricType === 'reps'}
                isPremium={isPremium ?? false}
              />
            )
          })}
        </div>
      )}

      <ExerciseDemoSheet
        exerciseId={demoExerciseId}
        lang={lang}
        onClose={() => setDemoExerciseId(null)}
      />
    </article>
  )
}
