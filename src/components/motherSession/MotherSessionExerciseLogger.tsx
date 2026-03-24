import type { ExerciseLogEntry } from '../../types/training'
import type { ExerciseMetricType } from '../../services/ui/exerciseMetrics'
import type { Suggestion } from '../../services/ui/suggestions'
import type { LoadSuggestion } from '../../services/loadSuggestion'

// ─── Progression indicator ──────────────────────────────────

type ProgressionIndicator = {
  icon: string
  color: string
  label: string
}

export function getProgressionIndicator(
  currentEntry: ExerciseLogEntry | undefined,
  lastEntry: ExerciseLogEntry | undefined,
): ProgressionIndicator | null {
  if (!currentEntry || !lastEntry) return null

  const currentLoad = currentEntry.loadKg
  const lastLoad = lastEntry.loadKg
  const currentReps = currentEntry.reps
  const lastReps = lastEntry.reps
  const currentRir = currentEntry.rir
  const lastRir = lastEntry.rir

  // Bodyweight: compare reps
  if (currentLoad === undefined && lastLoad === undefined && currentReps !== undefined && lastReps !== undefined) {
    if (currentReps > lastReps) {
      // Check RPE cost: if RIR dropped by more than 2, it's costly progression
      if (currentRir !== undefined && lastRir !== undefined && (lastRir - currentRir) > 2) {
        return { icon: '⚠', color: 'text-amber-400', label: 'Progression couteuse' }
      }
      return { icon: '↑', color: 'text-emerald-400', label: 'Progression' }
    }
    if (currentReps < lastReps) return { icon: '↓', color: 'text-red-400', label: 'Regression' }
    return { icon: '→', color: 'text-white/40', label: 'Stable' }
  }

  // Weighted: compare load
  if (currentLoad !== undefined && lastLoad !== undefined) {
    if (currentLoad > lastLoad) {
      // Check RPE cost
      if (currentRir !== undefined && lastRir !== undefined && (lastRir - currentRir) > 2) {
        return { icon: '⚠', color: 'text-amber-400', label: 'Progression couteuse' }
      }
      return { icon: '↑', color: 'text-emerald-400', label: 'Progression' }
    }
    if (currentLoad < lastLoad) return { icon: '↓', color: 'text-red-400', label: 'Regression' }
    return { icon: '→', color: 'text-white/40', label: 'Stable' }
  }

  return { icon: '○', color: 'text-white/20', label: 'Pas de comparaison' }
}

export type EntryDraft = {
  loadKg?: number
  reps?: number
  seconds?: number
  meters?: number
  setsCompleted?: number
  rir?: number
  note?: string
}

type Props = {
  exerciseId: string | undefined
  exerciseName: string
  metricType: ExerciseMetricType
  lastEntry?: ExerciseLogEntry
  suggestion?: Suggestion
  premiumSuggestion?: LoadSuggestion
  showProgressionIndicator?: boolean
  draft: EntryDraft
  onDraftChange: (patch: Partial<EntryDraft>) => void
}

const RIR_OPTIONS = [0, 1, 2, 3, 4, 5] as const

function NumberInput({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  placeholder,
}: {
  label: string
  value: number | undefined
  onChange: (v: number | undefined) => void
  step?: number
  min?: number
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') { onChange(undefined); return }
          const n = Number(raw)
          if (Number.isNaN(n)) return // ignore invalid input
          onChange(Math.max(min, n))
        }}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-[#ff6b35] focus:outline-none transition-colors [color-scheme:dark]"
      />
    </div>
  )
}

const DECISION_STYLES: Record<string, { icon: string; color: string }> = {
  increase: { icon: '↑', color: 'text-emerald-400' },
  decrease: { icon: '↓', color: 'text-red-400' },
  maintain: { icon: '→', color: 'text-white/50' },
  no_data: { icon: '○', color: 'text-white/30' },
  bodyweight: { icon: '●', color: 'text-blue-400' },
  no_suggestion: { icon: '', color: '' },
}

export function MotherSessionExerciseLogger({
  exerciseName,
  metricType,
  lastEntry,
  suggestion,
  premiumSuggestion,
  showProgressionIndicator,
  draft,
  onDraftChange,
}: Props) {
  // Progression indicator: compute from current draft vs lastEntry
  const progressionIndicator = showProgressionIndicator && lastEntry
    ? getProgressionIndicator(
        { exerciseId: '', loadKg: draft.loadKg, reps: draft.reps, rir: draft.rir },
        lastEntry,
      )
    : null
  const showLoad = metricType === 'load_reps'
  const showReps = metricType === 'load_reps' || metricType === 'reps'
  const showSeconds = metricType === 'seconds'
  const showMeters = metricType === 'meters'

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-white/80">{exerciseName}</p>
        {progressionIndicator && (draft.loadKg !== undefined || draft.reps !== undefined) && (
          <span className={`text-sm font-bold ${progressionIndicator.color}`} title={progressionIndicator.label}>
            {progressionIndicator.icon}
          </span>
        )}
      </div>

      {/* Premium suggestion badge */}
      {premiumSuggestion && premiumSuggestion.decision !== 'no_suggestion' && (
        <div className="flex items-start gap-2 rounded-lg bg-[#ff6b35]/8 border border-[#ff6b35]/15 px-2.5 py-1.5">
          {DECISION_STYLES[premiumSuggestion.decision] && (
            <span className={`text-sm font-bold ${DECISION_STYLES[premiumSuggestion.decision].color}`}>
              {DECISION_STYLES[premiumSuggestion.decision].icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-white/80">
              {premiumSuggestion.suggestedWeight !== null
                ? `${premiumSuggestion.suggestedWeight} kg`
                : premiumSuggestion.suggestedReps !== null
                  ? `${premiumSuggestion.suggestedReps} reps`
                  : ''}
              {premiumSuggestion.suggestedWeight !== null && premiumSuggestion.suggestedReps !== null
                ? ` × ${premiumSuggestion.suggestedReps}`
                : ''}
            </p>
            <p className="text-[10px] text-white/50">{premiumSuggestion.justification}</p>
            {premiumSuggestion.nextTarget && (
              <p className="text-[10px] text-[#ff6b35]/60 mt-0.5">{premiumSuggestion.nextTarget}</p>
            )}
          </div>
        </div>
      )}

      {/* Existing suggestion (shown when no premium suggestion) */}
      {!premiumSuggestion && suggestion?.lastText && (
        <p className="text-[10px] text-white/30">{suggestion.lastText}</p>
      )}

      {!premiumSuggestion && suggestion?.rationale && (
        <p className="text-[10px] text-[#ff6b35]/70">{suggestion.rationale}</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {showLoad && (
          <NumberInput
            label="Charge (kg)"
            value={draft.loadKg}
            onChange={(v) => onDraftChange({ loadKg: v })}
            step={1.25}
            placeholder={lastEntry?.loadKg?.toString() ?? suggestion?.suggestedLoadKg?.toString()}
          />
        )}

        {showReps && (
          <NumberInput
            label="Reps"
            value={draft.reps}
            onChange={(v) => onDraftChange({ reps: v })}
            placeholder={lastEntry?.reps?.toString() ?? suggestion?.suggestedReps?.toString()}
          />
        )}

        {showSeconds && (
          <NumberInput
            label="Durée (s)"
            value={draft.seconds}
            onChange={(v) => onDraftChange({ seconds: v })}
            placeholder={lastEntry?.seconds?.toString() ?? suggestion?.suggestedSeconds?.toString()}
          />
        )}

        {showMeters && (
          <NumberInput
            label="Distance (m)"
            value={draft.meters}
            onChange={(v) => onDraftChange({ meters: v })}
            placeholder={lastEntry?.meters?.toString() ?? suggestion?.suggestedMeters?.toString()}
          />
        )}

        <NumberInput
          label="Séries"
          value={draft.setsCompleted}
          onChange={(v) => onDraftChange({ setsCompleted: v })}
          min={1}
        />

        {(showLoad || showReps) && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">RIR</label>
            <select
              value={draft.rir ?? ''}
              onChange={(e) => {
                const v = e.target.value
                onDraftChange({ rir: v === '' ? undefined : Number(v) })
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#ff6b35] focus:outline-none transition-colors [color-scheme:dark]"
            >
              <option value="">—</option>
              {RIR_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r} {r === 0 ? '(échec)' : r === 5 ? '(facile)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
