import { useMemo, useState, useCallback } from 'react'
import { ClipboardCheck } from 'lucide-react'
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
}

function ExerciseRow({ exercise, frName }: { exercise: Block['exercises'][0]; frName?: string }) {
  return (
    <li className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
      {exercise.slotLabel ? (
        <div className="mb-1.5">
          <span className="inline-flex rounded-full border border-[#ff6b35]/45 bg-[#ff6b35]/10 px-2 py-0.5 text-xs font-medium text-[#ff6b35]">
            {exercise.slotLabel}
          </span>
        </div>
      ) : null}
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-white">
          {exercise.role ? (
            <span className="mr-1.5 text-xs font-normal uppercase text-[#ff6b35]/90">
              ({exercise.role})
            </span>
          ) : null}
          {frName ?? exercise.name}
        </span>
        {exercise.prescription ? (
          <span className="text-sm text-white/70">{stripBackticks(exercise.prescription)}</span>
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
}: MotherSessionBlockProps) {
  const blockName = frBlock?.name ?? block.name
  const blockFormat = frBlock?.format ?? block.format
  const coachingNotes = frBlock?.coachingNotes ?? block.coachingNotes

  // Resolve which exercises are loggable
  const loggableExercises = useMemo(() => {
    return block.exercises
      .map((ex, idx) => {
        if (isDirectiveText(ex.name)) return null
        const exerciseId = resolveExerciseId(ex.name)
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
  }, [onSaveBlock, motherSessionId, sessionType, week, loggableExercises, drafts, block.number, block.name])

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#ff6b35]">
            {msLabel('block', lang)} {block.number}
            {block.isOptional ? (
              <span className="ml-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                {msLabel('optional', lang)}
              </span>
            ) : null}
          </p>
          <h2 className="mt-1 text-base font-semibold leading-snug text-white">{blockName}</h2>
        </div>
      </div>

      {blockFormat ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{msLabel('format', lang)}</p>
          <p className="mt-1 text-sm text-white/70">{stripBackticks(blockFormat)}</p>
        </div>
      ) : null}

      {block.exercises.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {block.exercises.map((ex, i) => (
            <ExerciseRow
              key={`${block.number}-${i}`}
              exercise={ex}
              frName={frBlock?.exercises[i]?.name}
            />
          ))}
        </ul>
      ) : null}

      {coachingNotes.length > 0 ? (
        <div className="mt-4">
          <MotherSessionCollapsible title={msLabel('coaching_notes', lang)} defaultOpen={false} variant="nested">
            <ul className="space-y-1.5">
              {coachingNotes.map((note, i) => (
                <li key={i} className="text-sm text-white/40">
                  {stripBackticks(note)}
                </li>
              ))}
            </ul>
          </MotherSessionCollapsible>
        </div>
      ) : null}

      {block.fallbackOptions && block.fallbackOptions.length > 0 ? (
        <div className="mt-4">
          <MotherSessionCollapsible title={msLabel('alternatives', lang)} defaultOpen={false} variant="nested">
            <ul className="list-disc space-y-1.5 pl-4">
              {block.fallbackOptions.map((opt, i) => (
                <li key={i} className="text-sm text-white/70">
                  {stripBackticks(opt)}
                </li>
              ))}
            </ul>
          </MotherSessionCollapsible>
        </div>
      ) : null}

      {/* ── Logger toggle — only if at least 1 exercise is loggable ── */}
      {hasLoggable && onSaveBlock && (
        <div className="mt-4">
          <button
            type="button"
            data-testid="block-log-toggle"
            onClick={openLogger}
            className="flex items-center gap-2 text-xs font-bold text-[#ff6b35] hover:text-[#e55a2b] transition-colors"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            {loggerOpen ? 'Fermer le log' : 'Logger mes perfs'}
          </button>

          {loggerOpen && (
            <div className="mt-3 space-y-2">
              {loggableExercises.map(({ exercise, exerciseId }) => {
                const metricType = getExerciseMetricType({ exerciseId })
                const lastEntry = getLastEntryForExercise?.(exerciseId)
                const suggestion = week && fatigue
                  ? getExerciseSuggestion({ exerciseId, week, fatigue, lastEntry })
                  : undefined

                return (
                  <MotherSessionExerciseLogger
                    key={exerciseId}
                    exerciseId={exerciseId}
                    exerciseName={exercise.name}
                    metricType={metricType}
                    lastEntry={lastEntry}
                    suggestion={suggestion}
                    draft={drafts[exerciseId] ?? {}}
                    onDraftChange={(patch) => handleDraftChange(exerciseId, patch)}
                  />
                )
              })}

              {hasUnmapped && (
                <p className="text-white/30 text-[10px]">
                  Certains exercices de ce bloc ne sont pas encore loggables
                </p>
              )}

              <button
                type="button"
                data-testid="block-save-btn"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3 rounded-xl bg-[#ff6b35] hover:bg-[#e55a2b] text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    </article>
  )
}
