import { useState } from 'react'
import {
  ChevronDown,
  Trophy,
  AlertTriangle,
  Clock,
  CheckCircle2,
  BookOpen,
  ClipboardList,
} from 'lucide-react'
import { posthog } from '../services/analytics/posthog'
import { getExerciseName } from '../data/exercises'
import { useFatigue } from '../hooks/useFatigue'
import { useBlockLogs } from '../hooks/useBlockLogs'
import type { ViewMode } from '../hooks/useViewMode'
import type { BuiltSession } from '../services/program'
import { getRerCue } from '../services/ui/coachCues'
import { formatBlockVolume, formatEmomDetail, getEmomDisplay } from '../services/ui/formatTraining'
import { getExerciseSuggestion } from '../services/ui/suggestions'
import { getExerciseMetricType } from '../services/ui/exerciseMetrics'
import { getExerciseRecentHistory } from '../services/ui/progression'
import type {
  BlockLog,
  Equipment,
  ExerciseLogEntry,
  SessionType,
  TrainingBlock,
} from '../types/training'

interface SessionViewProps {
  session: BuiltSession
  availableEquipment: Equipment[]
  sessionType?: SessionType
  viewMode?: ViewMode
  isDeload?: boolean
  isValid?: boolean
  warnings?: string[]
  onMarkComplete?: () => void
  statusLabel?: string
}

interface EntryDraft {
  loadKg: string
  reps: string
  seconds: string
  meters: string
  note: string
}

const DEFAULT_DRAFT: EntryDraft = {
  loadKg: '',
  reps: '',
  seconds: '',
  meters: '',
  note: ''
}

const getBlockLabel = (index: number) => String.fromCharCode(65 + index)
const toIntentLabel = (intent: TrainingBlock['intent']) =>
  intent.charAt(0).toUpperCase() + intent.slice(1)
const restClock = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const leftSeconds = seconds % 60
  return `${minutes}:${String(leftSeconds).padStart(2, '0')}`
}

const estimateSessionMinutes = (session: BuiltSession): number => {
  const estimatedSeconds = session.blocks.reduce((sum, { block, version }) => {
    let workSeconds = 0
    if (version.scheme.kind === 'emom') {
      workSeconds = version.scheme.minutes * 60
    } else if (version.scheme.kind === 'time') {
      workSeconds = version.sets * version.scheme.seconds
    } else {
      // Heavier blocks (long rest = hypertrophy/force) take ~75s per set including transitions.
      // Lighter blocks (short rest = activation/core) take ~45s per set.
      const secsPerSet = version.restSeconds >= 90 ? 75 : version.restSeconds >= 60 ? 60 : 45
      workSeconds = version.sets * secsPerSet
    }

    // Rest is between sets (sets - 1), not after every set including the last.
    const restSeconds = Math.max(0, version.sets - 1) * version.restSeconds
    const hasLoadSetup = block.exercises.some(
      (exercise) => getExerciseMetricType({ exerciseId: exercise.exerciseId }) === 'load_reps'
    )
    // Overhead: introduction + per-exercise setup + plate loading.
    const overheadSeconds =
      90 + block.exercises.length * 30 + (hasLoadSetup ? 150 : 0)

    return sum + workSeconds + restSeconds + overheadSeconds
  }, 0)

  const estimatedMinutes = estimatedSeconds / 60
  return Math.max(10, Math.round(estimatedMinutes / 5) * 5)
}

const getMissingEquipment = (
  block: TrainingBlock,
  availableEquipment: Equipment[]
): Equipment[] =>
  block.equipment.filter(
    (equipment): equipment is Equipment =>
      equipment !== 'none' && !availableEquipment.includes(equipment)
  )

export function SessionView({
  session,
  availableEquipment,
  sessionType = 'UPPER',
  viewMode = 'compact',
  isDeload = false,
  isValid = true,
  onMarkComplete,
  statusLabel
}: SessionViewProps) {
  const { fatigue } = useFatigue()
  const {
    addBlockLog,
    logs,
    getBestForExercise,
    getBestForExerciseByMetric,
    getLastEntryForExercise,
    getLastLogForBlock
  } = useBlockLogs()
  const [entryDrafts, setEntryDrafts] = useState<Record<string, Record<string, EntryDraft>>>({})
  const [savedBlockId, setSavedBlockId] = useState<string | null>(null)
  const [openLogBlock, setOpenLogBlock] = useState<string | null>(null)
  const [openNotesBlock, setOpenNotesBlock] = useState<string | null>(null)

  const estimatedMinutes = estimateSessionMinutes(session)
  const isIncomplete = !isValid

  const updateEntryDraft = (
    blockId: string,
    exerciseId: string,
    patch: Partial<EntryDraft>
  ) => {
    setEntryDrafts((current) => ({
      ...current,
      [blockId]: {
        ...(current[blockId] ?? {}),
        [exerciseId]: {
          ...(current[blockId]?.[exerciseId] ?? DEFAULT_DRAFT),
          ...patch
        }
      }
    }))
  }

  const isDraftEmpty = (draft?: EntryDraft) =>
    !draft ||
    (!draft.loadKg.trim() &&
      !draft.reps.trim() &&
      !draft.seconds.trim() &&
      !draft.meters.trim() &&
      !draft.note.trim())

  const getPatchFromSuggestion = (
    metricType: ReturnType<typeof getExerciseMetricType>,
    suggestion: ReturnType<typeof getExerciseSuggestion>
  ): Partial<EntryDraft> => {
    if (metricType === 'load_reps') {
      return {
        loadKg:
          suggestion.suggestedLoadKg !== undefined
            ? String(suggestion.suggestedLoadKg)
            : undefined,
        reps:
          suggestion.suggestedReps !== undefined
            ? String(suggestion.suggestedReps)
            : undefined
      }
    }
    if (metricType === 'reps') {
      return {
        reps:
          suggestion.suggestedReps !== undefined
            ? String(suggestion.suggestedReps)
            : undefined
      }
    }
    if (metricType === 'seconds') {
      return {
        seconds:
          suggestion.suggestedSeconds !== undefined
            ? String(suggestion.suggestedSeconds)
            : undefined
      }
    }
    return {
      meters:
        suggestion.suggestedMeters !== undefined
          ? String(suggestion.suggestedMeters)
          : undefined
    }
  }

  const formatLastEntryByMetric = (
    metricType: ReturnType<typeof getExerciseMetricType>,
    lastEntry?: ReturnType<typeof getLastEntryForExercise>
  ): string | null => {
    if (!lastEntry) return null
    if (metricType === 'load_reps') {
      const load = lastEntry.loadKg !== undefined ? `${lastEntry.loadKg} kg` : '? kg'
      const reps = lastEntry.reps !== undefined ? `${lastEntry.reps}` : '?'
      return `Dernière fois : ${load} × ${reps}`
    }
    if (metricType === 'reps') {
      if (lastEntry.reps === undefined) return null
      return `Dernière fois : ${lastEntry.reps} reps`
    }
    if (metricType === 'seconds') {
      if (lastEntry.seconds === undefined) return null
      return `Dernière fois : ${lastEntry.seconds} s`
    }
    if (metricType === 'meters') {
      if (lastEntry.meters === undefined) return null
      return `Dernière fois : ${lastEntry.meters} m`
    }
    return null
  }

  const hasNumericSuggestion = (
    metricType: ReturnType<typeof getExerciseMetricType>,
    suggestion: ReturnType<typeof getExerciseSuggestion>
  ) => {
    if (metricType === 'load_reps') {
      return (
        suggestion.suggestedLoadKg !== undefined ||
        suggestion.suggestedReps !== undefined
      )
    }
    if (metricType === 'reps') return suggestion.suggestedReps !== undefined
    if (metricType === 'seconds') return suggestion.suggestedSeconds !== undefined
    if (metricType === 'meters') return suggestion.suggestedMeters !== undefined
    return false
  }

  const getPatchFromLastEntry = (
    metricType: ReturnType<typeof getExerciseMetricType>,
    lastEntry?: ReturnType<typeof getLastEntryForExercise>
  ): Partial<EntryDraft> => {
    if (!lastEntry) return {}
    if (metricType === 'load_reps') {
      return {
        loadKg:
          lastEntry.loadKg !== undefined ? String(lastEntry.loadKg) : undefined,
        reps: lastEntry.reps !== undefined ? String(lastEntry.reps) : undefined
      }
    }
    if (metricType === 'reps') {
      return {
        reps: lastEntry.reps !== undefined ? String(lastEntry.reps) : undefined
      }
    }
    if (metricType === 'seconds') {
      return {
        seconds:
          lastEntry.seconds !== undefined ? String(lastEntry.seconds) : undefined
      }
    }
    return {
      meters: lastEntry.meters !== undefined ? String(lastEntry.meters) : undefined
    }
  }

  const getPatchFromPrefill = (
    metricType: ReturnType<typeof getExerciseMetricType>,
    suggestion: ReturnType<typeof getExerciseSuggestion>,
    lastEntry?: ReturnType<typeof getLastEntryForExercise>
  ): Partial<EntryDraft> => {
    const fromSuggestion = getPatchFromSuggestion(metricType, suggestion)
    const hasSuggestion = Object.values(fromSuggestion).some(
      (value) => value !== undefined
    )
    if (hasSuggestion) return fromSuggestion
    return getPatchFromLastEntry(metricType, lastEntry)
  }

  const applyPrefillIfEmpty = (
    blockId: string,
    exerciseId: string,
    metricType: ReturnType<typeof getExerciseMetricType>,
    suggestion: ReturnType<typeof getExerciseSuggestion>,
    lastEntry?: ReturnType<typeof getLastEntryForExercise>
  ) => {
    const existingDraft = entryDrafts[blockId]?.[exerciseId]
    if (!isDraftEmpty(existingDraft)) return
    const fromLast = getPatchFromLastEntry(metricType, lastEntry)
    const hasLast = Object.values(fromLast).some((value) => value !== undefined)
    const patch = hasLast ? fromLast : getPatchFromSuggestion(metricType, suggestion)
    const hasPatch = Object.values(patch).some((value) => value !== undefined)
    if (!hasPatch) return
    updateEntryDraft(blockId, exerciseId, patch)
  }

  const parseNumberOrUndefined = (value: string) => {
    if (!value.trim()) return undefined
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  const hasAnyValue = (entry: ExerciseLogEntry) =>
    entry.loadKg !== undefined ||
    entry.reps !== undefined ||
    entry.seconds !== undefined ||
    entry.meters !== undefined ||
    !!entry.note

  const isCurrentEntryPr = (
    exerciseId: string,
    draft: EntryDraft,
    metricType: ReturnType<typeof getExerciseMetricType>
  ) => {
    const best = getBestForExercise(exerciseId)
    const currentLoad = parseNumberOrUndefined(draft.loadKg)
    const currentReps = parseNumberOrUndefined(draft.reps)
    const currentMeters = parseNumberOrUndefined(draft.meters)
    const currentSeconds = parseNumberOrUndefined(draft.seconds)

    if (
      metricType === 'load_reps' &&
      currentLoad !== undefined &&
      currentReps !== undefined &&
      best.bestLoadRepsScore !== undefined &&
      currentLoad * currentReps > best.bestLoadRepsScore
    ) {
      return true
    }
    if (
      metricType === 'reps' &&
      currentReps !== undefined &&
      best.bestReps !== undefined &&
      currentReps > best.bestReps
    ) {
      return true
    }
    if (
      metricType === 'meters' &&
      currentMeters !== undefined &&
      best.bestMeters !== undefined &&
      currentMeters > best.bestMeters
    ) {
      return true
    }
    if (
      metricType === 'seconds' &&
      currentSeconds !== undefined &&
      best.bestSeconds !== undefined &&
      currentSeconds < best.bestSeconds
    ) {
      return true
    }
    return false
  }

  const saveBlockLog = (
    blockId: string,
    blockName: string,
    exerciseIds: string[]
  ) => {
    const blockDrafts = entryDrafts[blockId] ?? {}
    const entries = exerciseIds
      .map((exerciseId): ExerciseLogEntry => {
        const draft = blockDrafts[exerciseId]
        const metricType = getExerciseMetricType({ exerciseId })
        return {
          exerciseId,
          loadKg:
            metricType === 'load_reps'
              ? parseNumberOrUndefined(draft?.loadKg ?? '')
              : undefined,
          reps:
            metricType === 'load_reps' || metricType === 'reps'
              ? parseNumberOrUndefined(draft?.reps ?? '')
              : undefined,
          seconds:
            metricType === 'seconds'
              ? parseNumberOrUndefined(draft?.seconds ?? '')
              : undefined,
          meters:
            metricType === 'meters'
              ? parseNumberOrUndefined(draft?.meters ?? '')
              : undefined,
          note: draft?.note?.trim() || undefined
        }
      })
      .filter(hasAnyValue)

    if (entries.length === 0) return

    const log: Omit<BlockLog, 'id'> = {
      dateISO: new Date().toISOString(),
      week: session.week,
      sessionType,
      blockId,
      blockName,
      entries
    }
    addBlockLog(log)
    posthog.capture('session_logged', { blockId })
    setSavedBlockId(blockId)
  }

  const inputClass =
    'w-full px-3 py-2 rounded-2xl border border-white/20 bg-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#ff6b35]/20 focus:border-[#ff6b35]/40 transition-all [color-scheme:dark]'

  return (
    <div className="p-5 space-y-4">

      {/* Session header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <h2 className="text-lg font-extrabold text-white">{session.title}</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-white/50">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">≈ {estimatedMinutes} min</span>
            </div>
            {statusLabel && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                isValid ? 'bg-emerald-900/30 text-emerald-400' : 'bg-rose-900/30 text-rose-400'
              }`}>
                {statusLabel}
              </span>
            )}
          </div>
        </div>
        {onMarkComplete && (
          <button
            type="button"
            onClick={onMarkComplete}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#ff6b35] hover:bg-[#e55a2b] text-white text-xs font-black uppercase tracking-wide transition-all shadow-lg shadow-[#ff6b35]/20"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Fait
          </button>
        )}
      </div>

      {/* Incomplete warning */}
      {isIncomplete && (
        <div className="flex items-start gap-2 p-3 bg-rose-900/20 rounded-2xl border border-rose-500/20">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-rose-400">Séance incomplète — vérifie ton matériel et tes blessures.</p>
        </div>
      )}

      {/* Blocks */}
      <div className="space-y-4">
        {session.blocks.map(({ block, version }, index) => {
          const missingEquipment = getMissingEquipment(block, availableEquipment)
          const schemeLabel = formatBlockVolume(version)
          const emomDisplay = getEmomDisplay(block, version)
          // For single-exercise EMOM, prefer schemeLabel which includes the work detail (e.g. "EMOM 6' · 1/side reps")
          // For multi-exercise EMOM, keep emomDisplay.label which has "alterne X exos (N tours)" info
          const summaryLabel = emomDisplay
            ? (emomDisplay.exoCount <= 1 ? schemeLabel : emomDisplay.label)
            : schemeLabel
          const emomDetail = formatEmomDetail(version)
          const summaryLine = emomDisplay
            ? `${toIntentLabel(block.intent)} · ${summaryLabel} · RER ${version.rer ?? '-'}`
            : `${toIntentLabel(block.intent)} · ${summaryLabel} · RER ${version.rer ?? '-'} · ⏱ ${restClock(version.restSeconds)}`

          const isLogOpen = openLogBlock === block.blockId
          const isNotesOpen = openNotesBlock === block.blockId

          return (
            <div key={block.blockId} className="pt-4 first:pt-0">

              {/* Block header */}
              <div className="space-y-3">
                {/* Block label + name */}
                <div className="flex items-center gap-2.5">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#ff6b35] text-white text-[11px] font-black flex items-center justify-center">
                    {getBlockLabel(index)}
                  </span>
                  <h3 className="text-sm font-black text-white leading-tight">{block.name}</h3>
                </div>

                {/* Summary pill */}
                <div className="px-3 py-2 bg-white/10 rounded-2xl">
                  <p className="text-[11px] text-white/70 leading-relaxed">{summaryLine}</p>
                </div>

                {/* Coach cue */}
                <p className="text-xs text-white/50 italic leading-snug">
                  {isDeload
                    ? 'Allège la charge et garde la qualité.'
                    : getRerCue(block.intent, version.rer)}
                </p>

                {/* Missing equipment */}
                {missingEquipment.length > 0 && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-amber-900/20 rounded-2xl border border-amber-500/20">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-400">
                      <span className="font-bold">Manquant :</span> {missingEquipment.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Exercise list */}
              <div className="mt-3 space-y-2">
                {block.exercises.map((exercise, exerciseIndex) => {
                  const metricType = getExerciseMetricType({ exerciseId: exercise.exerciseId })
                  const draft = entryDrafts[block.blockId]?.[exercise.exerciseId] ?? DEFAULT_DRAFT
                  const lastEntry = getLastEntryForExercise(exercise.exerciseId)
                  const suggestion = getExerciseSuggestion({
                    exerciseId: exercise.exerciseId,
                    week: session.week,
                    fatigue,
                    targetRer: version.rer,
                    schemeLabel,
                    lastEntry
                  })
                  const isPR = isCurrentEntryPr(exercise.exerciseId, draft, metricType)
                  const lastText = formatLastEntryByMetric(metricType, lastEntry)

                  return (
                    <div key={`${exercise.exerciseId}-${exerciseIndex}`} className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 space-y-1.5">
                      {/* Name + PR badge */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white flex-1 leading-snug">
                          {getExerciseName(exercise.exerciseId)}
                        </span>
                        {isPR && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-white text-[9px] font-black tracking-wider flex-shrink-0">
                            PR
                          </span>
                        )}
                      </div>

                      {/* Exercise ID in detail mode */}
                      {viewMode === 'detail' && (
                        <p className="text-[10px] text-white/40 font-mono">{exercise.exerciseId}</p>
                      )}

                      {/* Exercise notes always visible (key instruction for EMOM, unilateral, etc.) */}
                      {exercise.notes && (
                        <p className="text-[11px] text-white/50 italic">{exercise.notes}</p>
                      )}

                      {/* EMOM detail in detail mode only (redundant with block summary) */}
                      {viewMode === 'detail' && emomDetail && (
                        <p className="text-[11px] text-white/50 italic">{emomDetail}</p>
                      )}

                      {/* Last entry */}
                      {lastText && (
                        <p className="text-[10px] text-white/50 italic">{lastText}</p>
                      )}

                      {/* Mini history row */}
                      {(() => {
                        const history = getExerciseRecentHistory(logs, exercise.exerciseId, 4)
                        if (history.length < 2) return null
                        return (
                          <div className="flex items-center gap-1 flex-wrap">
                            {history.map((h, i) => (
                              <span key={h.dateISO} className="text-[10px] text-white/50 font-mono">
                                {h.text}{i < history.length - 1 ? <span className="text-white/30 mx-0.5">→</span> : null}
                              </span>
                            ))}
                          </div>
                        )
                      })()}

                      {/* Suggestion stylée */}
                      {(() => {
                        const suggestionPill = (() => {
                          if (metricType === 'load_reps' && suggestion.suggestedLoadKg !== undefined) {
                            const delta = lastEntry?.loadKg !== undefined
                              ? suggestion.suggestedLoadKg - lastEntry.loadKg
                              : null
                            return {
                              target: `${suggestion.suggestedLoadKg} kg${suggestion.suggestedReps ? ` × ${suggestion.suggestedReps}` : ''}`,
                              delta: delta !== null ? (delta > 0 ? `+${delta}kg` : delta < 0 ? `${delta}kg` : '=') : null,
                              direction: delta !== null ? (delta > 0 ? 'up' : delta < 0 ? 'down' : 'same') : 'none',
                            }
                          }
                          return null
                        })()

                        if (suggestionPill) {
                          return (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                                suggestionPill.direction === 'up'
                                  ? 'bg-[#10b981]/20 text-[#10b981]'
                                  : suggestionPill.direction === 'down'
                                    ? 'bg-[#ff6b35]/20 text-[#ff6b35]'
                                    : 'bg-white/10 text-white/50'
                              }`}>
                                {suggestionPill.direction === 'up' ? '↑' : suggestionPill.direction === 'down' ? '↓' : '·'}
                                {' '}{suggestionPill.target}
                                {suggestionPill.delta && (
                                  <span className="opacity-70 font-medium text-[10px]">({suggestionPill.delta})</span>
                                )}
                              </span>
                            </div>
                          )
                        }
                        return (
                          <p className="text-xs text-white/50 leading-snug">{suggestion.suggestionText}</p>
                        )
                      })()}

                      {/* Rationale in detail mode */}
                      {viewMode === 'detail' && suggestion.rationale && (
                        <p className="text-[11px] text-white/50 leading-snug">{suggestion.rationale}</p>
                      )}

                      {/* Apply suggestion */}
                      <button
                        type="button"
                        className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 text-[10px] font-bold transition-colors"
                        onClick={() => {
                          const patch = getPatchFromPrefill(metricType, suggestion, lastEntry)
                          const hasPatch = Object.values(patch).some((value) => value !== undefined)
                          if (!hasPatch) return
                          updateEntryDraft(block.blockId, exercise.exerciseId, patch)
                        }}
                      >
                        {hasNumericSuggestion(metricType, suggestion) ? 'Appliquer le conseil' : 'Pré-remplir'}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Coaching notes (detail mode) */}
              {viewMode === 'detail' && (
                <div className="mt-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenNotesBlock(isNotesOpen ? null : block.blockId)}
                    className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-white/50 hover:bg-white/10 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Notes coaching
                    </span>
                    <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${isNotesOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isNotesOpen && (
                    <div className="px-4 pb-4">
                      <p className="text-xs text-white/50 leading-relaxed">{block.coachingNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Log section */}
              <div className="mt-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    if (!isLogOpen) {
                      for (const exercise of block.exercises) {
                        const metricType = getExerciseMetricType({ exerciseId: exercise.exerciseId })
                        const lastEntry = getLastEntryForExercise(exercise.exerciseId)
                        const suggestion = getExerciseSuggestion({
                          exerciseId: exercise.exerciseId,
                          week: session.week,
                          fatigue,
                          targetRer: version.rer,
                          schemeLabel,
                          lastEntry
                        })
                        applyPrefillIfEmpty(block.blockId, exercise.exerciseId, metricType, suggestion, lastEntry)
                      }
                    }
                    setOpenLogBlock(isLogOpen ? null : block.blockId)
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span className="flex items-center gap-1.5 text-xs font-bold text-white/50">
                    <ClipboardList className="w-3.5 h-3.5" />
                    {viewMode === 'compact' ? 'Log' : 'Log du bloc'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${isLogOpen ? 'rotate-180' : ''}`} />
                </button>

                {isLogOpen && (
                  <div className="p-4 space-y-4 border-t border-white/10">
                    {/* Apply all suggestions */}
                    <button
                      type="button"
                      className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 text-[10px] font-bold transition-colors"
                      onClick={() => {
                        setEntryDrafts((current) => {
                          let changed = false
                          const nextBlockDrafts = { ...(current[block.blockId] ?? {}) }

                          for (const exercise of block.exercises) {
                            const metricType = getExerciseMetricType({ exerciseId: exercise.exerciseId })
                            const draft = nextBlockDrafts[exercise.exerciseId]
                            if (!isDraftEmpty(draft)) continue
                            const lastEntry = getLastEntryForExercise(exercise.exerciseId)
                            const suggestion = getExerciseSuggestion({
                              exerciseId: exercise.exerciseId,
                              week: session.week,
                              fatigue,
                              targetRer: version.rer,
                              schemeLabel,
                              lastEntry
                            })
                            const patch = getPatchFromSuggestion(metricType, suggestion)
                            const hasPatch = Object.values(patch).some((value) => value !== undefined)
                            if (!hasPatch) continue
                            nextBlockDrafts[exercise.exerciseId] = {
                              ...(draft ?? DEFAULT_DRAFT),
                              ...patch
                            }
                            changed = true
                          }

                          if (!changed) return current
                          return { ...current, [block.blockId]: nextBlockDrafts }
                        })
                      }}
                    >
                      Appliquer tous les conseils
                    </button>

                    {/* Log rows */}
                    <div className="space-y-4">
                      {block.exercises.map((exercise) => {
                        const metricType = getExerciseMetricType({ exerciseId: exercise.exerciseId })
                        const draft = entryDrafts[block.blockId]?.[exercise.exerciseId] ?? DEFAULT_DRAFT

                        return (
                          <div key={exercise.exerciseId} className="space-y-2">
                            <p className="text-xs font-bold text-white/70">
                              {getExerciseName(exercise.exerciseId)}
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              {metricType === 'load_reps' && (
                                <>
                                  <div className="flex-1 min-w-[70px]">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1">kg</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={draft.loadKg}
                                      onChange={(e) =>
                                        updateEntryDraft(block.blockId, exercise.exerciseId, {
                                          loadKg: e.target.value
                                        })
                                      }
                                      placeholder="0"
                                      className={inputClass}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-[70px]">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1">reps</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={draft.reps}
                                      onChange={(e) =>
                                        updateEntryDraft(block.blockId, exercise.exerciseId, {
                                          reps: e.target.value
                                        })
                                      }
                                      placeholder="0"
                                      className={inputClass}
                                    />
                                  </div>
                                </>
                              )}
                              {metricType === 'reps' && (
                                <div className="flex-1 min-w-[70px]">
                                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1">reps</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={draft.reps}
                                    onChange={(e) =>
                                      updateEntryDraft(block.blockId, exercise.exerciseId, {
                                        reps: e.target.value
                                      })
                                    }
                                    placeholder="0"
                                    className={inputClass}
                                  />
                                </div>
                              )}
                              {metricType === 'seconds' && (
                                <div className="flex-1 min-w-[70px]">
                                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1">sec</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={draft.seconds}
                                    onChange={(e) =>
                                      updateEntryDraft(block.blockId, exercise.exerciseId, {
                                        seconds: e.target.value
                                      })
                                    }
                                    placeholder="0"
                                    className={inputClass}
                                  />
                                </div>
                              )}
                              {metricType === 'meters' && (
                                <div className="flex-1 min-w-[70px]">
                                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1">m</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={draft.meters}
                                    onChange={(e) =>
                                      updateEntryDraft(block.blockId, exercise.exerciseId, {
                                        meters: e.target.value
                                      })
                                    }
                                    placeholder="0"
                                    className={inputClass}
                                  />
                                </div>
                              )}
                              <div className="flex-[2] min-w-[120px]">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1">note</label>
                                <input
                                  type="text"
                                  value={draft.note}
                                  onChange={(e) =>
                                    updateEntryDraft(block.blockId, exercise.exerciseId, {
                                      note: e.target.value
                                    })
                                  }
                                  placeholder="Optionnel"
                                  className={inputClass}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Save block */}
                    <button
                      type="button"
                      onClick={() =>
                        saveBlockLog(
                          block.blockId,
                          block.name,
                          block.exercises.map((exercise) => exercise.exerciseId)
                        )
                      }
                      className="w-full py-3 rounded-2xl bg-[#ff6b35] hover:bg-[#e55a2b] text-white font-black text-xs uppercase tracking-wide transition-all shadow-lg shadow-[#ff6b35]/20"
                    >
                      Enregistrer ce bloc
                    </button>
                  </div>
                )}
              </div>

              {/* Saved confirmation */}
              {savedBlockId === block.blockId && (
                <div className="mt-2 flex items-center gap-2 px-4 py-3 bg-emerald-900/20 border border-emerald-500/20 rounded-2xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-xs text-emerald-400 font-bold">Bloc enregistré !</p>
                </div>
              )}

              {/* Personal best */}
              {(() => {
                const latestEntry = getLastLogForBlock(block.blockId)
                if (!latestEntry) return null
                const bestLabels = latestEntry.entries
                  .map((entry) => {
                    const metricType = getExerciseMetricType({ exerciseId: entry.exerciseId })
                    return getBestForExerciseByMetric(entry.exerciseId, metricType)
                  })
                  .filter((label): label is string => !!label)
                if (bestLabels.length === 0) return null
                return (
                  <div className="mt-2 flex items-center gap-2 px-4 py-2.5 bg-amber-900/20 border border-amber-500/20 rounded-2xl">
                    <Trophy className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <p className="text-[11px] text-amber-400 font-medium">
                      Perso : {bestLabels.join(' · ')}
                    </p>
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>
    </div>
  )
}
