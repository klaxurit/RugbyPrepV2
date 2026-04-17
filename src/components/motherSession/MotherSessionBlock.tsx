import { useMemo, useState, useCallback } from 'react'
import { ClipboardCheck, Eye, Check } from 'lucide-react'
import { useSessionRun } from '../../contexts/SessionRunContext'
import type { Block } from '../../types/motherSession'
import type { BlockLog, ExerciseLogEntry, SessionType, CycleWeek, FatigueStatus } from '../../types/training'
import type { AppLang } from '../../services/motherSession/motherSessionLabels'
import type { SessionContentFr } from '../../services/motherSession/motherSessionContentFr'
import { msLabel, stripBackticks } from '../../services/motherSession/motherSessionLabels'
import { MotherSessionCollapsible } from './MotherSessionCollapsible'
import { MotherSessionExerciseLogger, type EntryDraft } from './MotherSessionExerciseLogger'
import { resolveExerciseId, isDirectiveText } from '../../services/motherSession/motherSessionExerciseMap'
import { getExerciseMetricType } from '../../services/ui/exerciseMetrics'
import { getExerciseSuggestion } from '../../services/ui/suggestions'
import { getLoadSuggestion } from '../../services/loadSuggestion'
import type { LoadSuggestionContext } from '../../services/loadSuggestion'
import { getExerciseName, hasExerciseDemo } from '../../data/exercises'
import { ExerciseDemoSheet } from './ExerciseDemoSheet'
import { detectPRs, type DetectedPR } from '../../services/pr/detectPRs'
import { PRCelebrationOverlay } from '../pr/PRCelebrationOverlay'
import { PremiumSheet } from '../modals/PremiumSheet'

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
  motherSessionId,
  sessionType,
  week,
  fatigue,
  onSaveBlock,
  getLastEntryForExercise,
  getBestForExercise,
  isPremium,
  acwr,
  isRehabActive,
}: MotherSessionBlockProps) {
  const sessionRun = useSessionRun()
  const runMode = sessionRun.status === 'running'
  const blockName = frBlock?.name ?? block.name
  const blockFormat = frBlock?.format ?? block.format
  const coachingNotes = frBlock?.coachingNotes ?? block.coachingNotes
  const fallbackOptions = frBlock?.fallbackOptions ?? block.fallbackOptions
  const getDisplayExerciseName = useCallback(
    (exerciseId: string) => getExerciseName(exerciseId, lang),
    [lang],
  )

  // Resolve which exercises are loggable
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
  const hasUnmapped = hasLoggable && loggableExercises.length < block.exercises.filter(e => !isDirectiveText(e.name)).length

  const [loggerOpen, setLoggerOpen] = useState(false)
  const [draftsInitialized, setDraftsInitialized] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, EntryDraft>>({})
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [demoExerciseId, setDemoExerciseId] = useState<string | null>(null)
  const [celebratePRs, setCelebratePRs] = useState<DetectedPR[]>([])
  const [premiumSheetOpen, setPremiumSheetOpen] = useState(false)

  // Pre-fill drafts from lastEntry on first open
  const openLogger = useCallback(() => {
    setLoggerOpen((prev) => {
      if (!prev && !draftsInitialized && getLastEntryForExercise) {
        const initial: Record<string, EntryDraft> = {}
        for (const { exerciseId } of loggableExercises) {
          const last = getLastEntryForExercise(exerciseId)
          if (last) {
            initial[exerciseId] = {
              loadKg: last.loadKg,
              reps: last.reps,
              seconds: last.seconds,
              meters: last.meters,
              setsCompleted: last.setsCompleted,
              rir: last.rir,
            }
          }
        }
        setDrafts(initial)
        setDraftsInitialized(true)
      }
      return !prev
    })
  }, [draftsInitialized, getLastEntryForExercise, loggableExercises])

  const handleDraftChange = useCallback((exerciseId: string, patch: Partial<EntryDraft>) => {
    setDrafts((prev) => ({
      ...prev,
      [exerciseId]: { ...(prev[exerciseId] ?? {}), ...patch },
    }))
  }, [])

  const handleSave = useCallback(() => {
    if (!onSaveBlock || !motherSessionId || !sessionType || !week) return

    const entries: ExerciseLogEntry[] = loggableExercises
      .map(({ exerciseId }) => {
        const d = drafts[exerciseId]
        if (!d) return null
        const entry: ExerciseLogEntry = { exerciseId }
        if (d.loadKg !== undefined) entry.loadKg = d.loadKg
        if (d.reps !== undefined) entry.reps = d.reps
        if (d.seconds !== undefined) entry.seconds = d.seconds
        if (d.meters !== undefined) entry.meters = d.meters
        if (d.setsCompleted !== undefined) entry.setsCompleted = d.setsCompleted
        if (d.rir !== undefined) entry.rir = d.rir
        if (d.note) entry.note = d.note
        // Only include entries with at least one metric
        if (entry.loadKg === undefined && entry.reps === undefined && entry.seconds === undefined && entry.meters === undefined) return null
        return entry
      })
      .filter((e): e is ExerciseLogEntry => e !== null)

    if (entries.length === 0) return

    // Detect PRs BEFORE saving (so getBestForExercise still reflects old bests)
    if (getBestForExercise) {
      const prInputs = entries.map((entry) => ({
        exerciseId: entry.exerciseId,
        metricType: getExerciseMetricType({ exerciseId: entry.exerciseId }),
        draft: { loadKg: entry.loadKg, reps: entry.reps, seconds: entry.seconds, meters: entry.meters },
        previousBest: getBestForExercise(entry.exerciseId),
      }))
      const prs = detectPRs(prInputs)
      if (prs.length > 0) setCelebratePRs(prs)
    }

    setIsSaving(true)
    const blockId = `${motherSessionId}_B${block.number}`
    onSaveBlock({
      dateISO: new Date().toISOString().slice(0, 10),
      week,
      sessionType,
      blockId,
      blockName: block.name,
      entries,
      motherSessionId,
      programSource: 'mother_session',
    })
    setSaved(true)
    setTimeout(() => { setSaved(false); setIsSaving(false) }, 3000)
  }, [onSaveBlock, motherSessionId, sessionType, week, loggableExercises, drafts, block.number, block.name, getBestForExercise])

  return (
    <article className="rounded-2xl border border-border-app bg-layer-5 p-4">
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

      {block.exercises.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {block.exercises.map((ex, i) => {
            const exerciseKey = `${block.number}_${i}`
            const isDone = runMode && sessionRun.completedExercises.has(exerciseKey)
            return (
              <ExerciseRow
                key={`${block.number}-${i}`}
                exercise={ex}
                frName={frBlock?.exercises[i]?.name}
                lang={lang}
                onOpenDemo={setDemoExerciseId}
                runMode={runMode}
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
          <MotherSessionCollapsible title={msLabel('coaching_notes', lang)} defaultOpen={false} variant="nested">
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

      {/* ── Logger toggle — free user : bouton visible qui déclenche une sheet contextuelle (pas d'encart répété par bloc) ── */}
      {hasLoggable && onSaveBlock && !isPremium && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setPremiumSheetOpen(true)}
            className="flex items-center gap-2 text-xs font-bold text-fg-muted hover:text-brand-tint transition-colors rf-focus-ring rounded-lg"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Logger mes perfs
            <span className="text-[9px] font-black uppercase tracking-wider text-brand-tint bg-brand-soft px-1.5 py-0.5 rounded-full">
              Premium
            </span>
          </button>
        </div>
      )}

      {hasLoggable && onSaveBlock && isPremium && (
        <div className="mt-4">
          <button
            type="button"
            data-testid="block-log-toggle"
            onClick={openLogger}
            className="flex items-center gap-2 text-xs font-bold text-brand-tint hover:text-brand-hover transition-colors"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            {loggerOpen ? 'Fermer le log' : 'Logger mes perfs'}
          </button>

          {loggerOpen && (
            <div className="mt-3 space-y-2">
              {loggableExercises.map(({ exerciseId }) => {
                const metricType = getExerciseMetricType({ exerciseId })
                const lastEntry = getLastEntryForExercise?.(exerciseId)
                const suggestion = week && fatigue
                  ? getExerciseSuggestion({ exerciseId, week, fatigue, lastEntry })
                  : undefined

                // Premium load suggestion
                const premiumSuggestion = week
                  ? getLoadSuggestion({
                      exerciseId,
                      lastEntry,
                      week,
                      acwr: acwr ?? null,
                      isRehabActive: isRehabActive ?? false,
                      fatigueLevel: fatigue === 'FATIGUE' ? 'high' : 'normal',
                    } satisfies LoadSuggestionContext)
                  : undefined

                return (
                  <MotherSessionExerciseLogger
                    key={exerciseId}
                    exerciseId={exerciseId}
                    exerciseName={getDisplayExerciseName(exerciseId)}
                    metricType={metricType}
                    lastEntry={lastEntry}
                    suggestion={suggestion}
                    premiumSuggestion={premiumSuggestion}
                    showProgressionIndicator
                    draft={drafts[exerciseId] ?? {}}
                    onDraftChange={(patch) => handleDraftChange(exerciseId, patch)}
                  />
                )
              })}

              {hasUnmapped && (
                <p className="text-fg-faint text-[10px]">
                  Certains exercices de ce bloc ne sont pas encore loggables
                </p>
              )}

              <button
                type="button"
                data-testid="block-save-btn"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-on-brand text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Enregistré !' : 'Enregistrer le bloc'}
              </button>

              {saved && (
                <p className="text-xs text-emerald-400 font-bold text-center">Bloc enregistré !</p>
              )}
            </div>
          )}
        </div>
      )}

      <ExerciseDemoSheet
        exerciseId={demoExerciseId}
        lang={lang}
        onClose={() => setDemoExerciseId(null)}
      />

      <PRCelebrationOverlay
        prs={celebratePRs}
        lang={lang}
        onDone={() => setCelebratePRs([])}
      />

      <PremiumSheet
        isOpen={premiumSheetOpen}
        onClose={() => setPremiumSheetOpen(false)}
        feature="Suivi des charges"
        benefit="Note tes charges, reps et séries pour chaque exercice. Visualise ta progression semaine après semaine et reçois des suggestions de charge adaptées à ton niveau."
      />
    </article>
  )
}
