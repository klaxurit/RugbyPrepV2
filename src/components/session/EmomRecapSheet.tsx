import { useState } from 'react'
import { BottomSheet } from '../ui/BottomSheet'
import { localizeMotherSessionExerciseName } from '../../services/motherSession/localizeMotherSessionExerciseName'
import type { EmomRecapField } from '../../services/session/buildEmomRecapFields'
import type { ExerciseTourLoad } from '../../contexts/SessionRunContext'
import type { Lang } from '../../i18n/appLabels'

export type EmomRecapDraft = Record<string, ExerciseTourLoad>

export interface EmomRecapSheetProps {
  open: boolean
  fields: readonly EmomRecapField[]
  isPremium: boolean
  lang?: Lang
  onConfirm: (draft: EmomRecapDraft) => void
  onSkip: () => void
}

function seedDraft(fields: readonly EmomRecapField[]): EmomRecapDraft {
  const draft: EmomRecapDraft = {}
  for (const field of fields) {
    const prev = field.previous
    draft[field.exerciseId] = {
      loadKg: prev?.loadKg,
      reps: prev?.reps,
      seconds: prev?.seconds,
      meters: prev?.meters,
    }
  }
  return draft
}

/**
 * Récap post-EMOM — saisie des perfs **après** le chrono (pattern SugarWOD).
 * Une ligne par exercice du pattern, pas par minute.
 *
 * Remount via `key` côté parent quand le bloc change pour re-seeder le draft
 * (évite setState dans un effect).
 */
export function EmomRecapSheet({
  open,
  fields,
  isPremium,
  lang = 'fr',
  onConfirm,
  onSkip,
}: EmomRecapSheetProps) {
  // Remount via `key` côté parent quand le bloc change → re-seed du draft.
  const [draft, setDraft] = useState(() => seedDraft(fields))

  const title = lang === 'fr' ? 'Récap finisher' : 'Finisher recap'

  const patchField = (exerciseId: string, patch: ExerciseTourLoad) => {
    setDraft((prev) => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], ...patch },
    }))
  }

  return (
    <BottomSheet
      open={open}
      onClose={onSkip}
      ariaLabel={title}
      eyebrow={lang === 'fr' ? 'EMOM terminé' : 'EMOM done'}
      title={title}
      disableBackdropDismiss
    >
      <div className="px-5 pb-2 space-y-4" data-testid="emom-recap-sheet">
        <p className="text-[13px] leading-relaxed text-fg-muted">
          {lang === 'fr'
            ? 'Note ce que tu as fait — pour progresser la prochaine fois. Tu peux passer si tu préfères.'
            : 'Log what you did — so next time you can progress. You can skip if you prefer.'}
        </p>

        {!isPremium && (
          <p className="rounded-xl border border-brand-border bg-brand-soft/50 px-3 py-2.5 text-[12px] leading-relaxed text-fg">
            {lang === 'fr' ? (
              <>
                Noter kg / temps tenu pour la prochaine fois — inclus dans{' '}
                <strong className="text-brand">Pro</strong>.
              </>
            ) : (
              <>
                Log kg / hold time for next time — included in{' '}
                <strong className="text-brand">Pro</strong>.
              </>
            )}
          </p>
        )}

        <ul className="space-y-3">
          {fields.map((field) => {
            const value = draft[field.exerciseId] ?? {}
            const label = localizeMotherSessionExerciseName(field.name, lang)
            return (
              <li
                key={field.exerciseId}
                className="rounded-2xl border border-paper-deep bg-paper-soft px-3.5 py-3"
                data-testid={`emom-recap-row-${field.exerciseId}`}
              >
                <div className="text-[14px] font-bold text-fg">{label}</div>
                {field.prescription && (
                  <div className="mt-0.5 text-[11px] text-fg-muted">{field.prescription}</div>
                )}

                <div className="mt-2.5 flex flex-wrap gap-2">
                  {(field.metricType === 'load_reps' || field.alsoAskLoadKg) && (
                    <MetricInput
                      label="kg"
                      value={value.loadKg}
                      disabled={!isPremium}
                      onChange={(n) => patchField(field.exerciseId, { loadKg: n })}
                      testId={`emom-recap-kg-${field.exerciseId}`}
                    />
                  )}
                  {field.metricType === 'load_reps' && (
                    <MetricInput
                      label="reps"
                      value={value.reps}
                      disabled={!isPremium}
                      onChange={(n) => patchField(field.exerciseId, { reps: n })}
                      testId={`emom-recap-reps-${field.exerciseId}`}
                    />
                  )}
                  {field.metricType === 'seconds' && (
                    <MetricInput
                      label="s"
                      value={value.seconds}
                      disabled={!isPremium}
                      onChange={(n) => patchField(field.exerciseId, { seconds: n })}
                      testId={`emom-recap-sec-${field.exerciseId}`}
                    />
                  )}
                  {field.metricType === 'meters' && (
                    <MetricInput
                      label="m"
                      value={value.meters}
                      disabled={!isPremium}
                      onChange={(n) => patchField(field.exerciseId, { meters: n })}
                      testId={`emom-recap-m-${field.exerciseId}`}
                    />
                  )}
                  {field.metricType === 'reps' && (
                    <MetricInput
                      label="reps"
                      value={value.reps}
                      disabled={!isPremium}
                      onChange={(n) => patchField(field.exerciseId, { reps: n })}
                      testId={`emom-recap-reps-${field.exerciseId}`}
                    />
                  )}
                </div>

                {field.previous && (
                  <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-fg/45">
                    {lang === 'fr' ? 'Dernière fois' : 'Last time'}
                    {': '}
                    {formatPreviousHint(field)}
                  </p>
                )}
              </li>
            )
          })}
        </ul>

        <div className="flex flex-col gap-2 pt-1">
          {isPremium ? (
            <button
              type="button"
              data-testid="emom-recap-confirm"
              onClick={() => onConfirm(draft)}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-brand text-[13px] font-extrabold uppercase tracking-[0.06em] text-app rf-focus-ring"
            >
              {lang === 'fr' ? 'Enregistrer' : 'Save'}
            </button>
          ) : null}
          <button
            type="button"
            data-testid="emom-recap-skip"
            onClick={onSkip}
            className="flex h-11 w-full items-center justify-center rounded-xl border border-paper-deep text-[12px] font-bold text-fg-muted rf-focus-ring"
          >
            {isPremium
              ? lang === 'fr'
                ? 'Passer'
                : 'Skip'
              : lang === 'fr'
                ? 'Continuer'
                : 'Continue'}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

function MetricInput({
  label,
  value,
  disabled,
  onChange,
  testId,
}: {
  label: string
  value: number | undefined
  disabled: boolean
  onChange: (n: number | undefined) => void
  testId: string
}) {
  return (
    <label className="flex min-w-[5.5rem] flex-1 items-center gap-1.5 rounded-xl border border-paper-deep bg-app px-2.5 py-2">
      <input
        type="number"
        inputMode="decimal"
        data-testid={testId}
        disabled={disabled}
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value.trim()
          if (!raw) {
            onChange(undefined)
            return
          }
          const n = Number(raw)
          onChange(Number.isFinite(n) ? n : undefined)
        }}
        className="w-full min-w-0 bg-transparent text-[15px] font-bold tabular-nums text-fg outline-none disabled:opacity-50"
        placeholder="—"
      />
      <span className="shrink-0 text-[11px] font-extrabold uppercase tracking-[0.08em] text-fg-muted">
        {label}
      </span>
    </label>
  )
}

function formatPreviousHint(field: EmomRecapField): string {
  const p = field.previous
  if (!p) return '—'
  const parts: string[] = []
  if (p.loadKg != null) parts.push(`${p.loadKg} kg`)
  if (p.reps != null) parts.push(`${p.reps} reps`)
  if (p.seconds != null) parts.push(`${p.seconds} s`)
  if (p.meters != null) parts.push(`${p.meters} m`)
  return parts.length ? parts.join(' · ') : '—'
}
