import type { ExerciseLogEntry } from '../../types/training'
import type { ExerciseMetricType } from '../../services/ui/exerciseMetrics'
import type { Suggestion } from '../../services/ui/suggestions'

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

export function MotherSessionExerciseLogger({
  exerciseName,
  metricType,
  lastEntry,
  suggestion,
  draft,
  onDraftChange,
}: Props) {
  const showLoad = metricType === 'load_reps'
  const showReps = metricType === 'load_reps' || metricType === 'reps'
  const showSeconds = metricType === 'seconds'
  const showMeters = metricType === 'meters'

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs font-semibold text-white/80">{exerciseName}</p>

      {suggestion?.lastText && (
        <p className="text-[10px] text-white/30">{suggestion.lastText}</p>
      )}

      {suggestion?.rationale && (
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
