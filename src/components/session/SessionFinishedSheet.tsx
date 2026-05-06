import { useState } from 'react'
import { Lock, Check } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import type { FatigueStatus } from '../../types/training'
import type { SessionPR } from '../../services/session/detectSessionPRs'
import { selectSessionInsight } from '../../services/session/selectSessionInsight'

export interface SessionFinishedSheetProps {
  open: boolean
  onClose: () => void
  /** Titre principal — ex: "Bas du corps · Hypertrophie". */
  sessionLabel: string
  /** Durée chronométrée (auto, lecture seule). null si chrono manquant. */
  durationMin: number | null
  /** Sets validés sur la séance. */
  completedSets: number
  /** Total de sets prévus dans la séance. */
  totalSets: number
  /** Tonnage Premium (Σ load×reps). null si pas de loadKg du tout. */
  tonnageKg: number | null
  /** Records détectés sur la séance. */
  prs: readonly SessionPR[]
  /** L'utilisateur Premium voit le tonnage en clair, sinon flouté. */
  isPremium: boolean
  initialFatigue?: FatigueStatus
  isSubmitting?: boolean
  onConfirm: (payload: {
    fatigue: FatigueStatus
    rpe: number
    durationMin: number
    tonnageKg?: number
  }) => void | Promise<void>
}

const RPE_LABELS: Record<number, string> = {
  1: 'Très léger',
  2: 'Léger',
  3: 'Modéré léger',
  4: 'Modéré',
  5: 'Modéré+',
  6: 'Un peu dur',
  7: 'Dur',
  8: 'Très dur',
  9: 'Extrêmement dur',
  10: 'Maximal',
}

const RPE_COLOR: Record<number, string> = {
  1: 'text-emerald-400',
  2: 'text-emerald-400',
  3: 'text-lime-500',
  4: 'text-yellow-500',
  5: 'text-yellow-500',
  6: 'text-amber-500',
  7: 'text-orange-500',
  8: 'text-orange-600',
  9: 'text-rose-500',
  10: 'text-rose-600',
}

function formatTonnage(kg: number): string {
  if (kg < 1000) return `${kg} kg`
  if (kg < 10_000) {
    const v = kg / 1000
    return `${v.toFixed(1).replace(/\.0$/, '')}K kg`
  }
  return `${Math.round(kg / 1000)}K kg`
}

export function SessionFinishedSheet({
  open,
  onClose,
  sessionLabel,
  durationMin,
  completedSets,
  totalSets,
  tonnageKg,
  prs,
  isPremium,
  initialFatigue = 'OK',
  isSubmitting = false,
  onConfirm,
}: SessionFinishedSheetProps) {
  // RPE pré-rempli à 5 (= "Modéré+") : valeur médiane intuitive — l'utilisateur
  // ajuste s'il veut, sinon il valide tel quel. Évite un CTA disabled silencieux
  // qui laisse l'utilisateur perplexe quand il a juste fini sa séance.
  const [rpe, setRpe] = useState<number>(5)
  const [fatigue, setFatigue] = useState<FatigueStatus>(initialFatigue)

  const effectiveDuration = durationMin ?? 0
  const sRPE = rpe * effectiveDuration
  const completedRatio = totalSets > 0 ? completedSets / totalSets : 1
  const insight = selectSessionInsight({ rpe, completedRatio, prs })

  const canConfirm = !isSubmitting

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm({
      fatigue,
      rpe,
      durationMin: effectiveDuration,
      tonnageKg: tonnageKg ?? undefined,
    })
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabel="Finaliser la séance"
      hideDefaultHeader
      disableSwipeDismiss={isSubmitting}
      disableBackdropDismiss={isSubmitting}
      showClose={!isSubmitting}
    >
      <div className="px-5 pb-4 pt-1">
        {/* ── En-tête éditorial ─────────────────────────────────────────── */}
        <div
          data-testid="finish-eyebrow"
          className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-tint"
        >
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand text-on-brand">
            <Check className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
          Séance bouclée
        </div>
        <h2
          data-testid="finish-quote"
          className="mt-3 font-serif italic font-extrabold leading-[1.05] text-fg [text-wrap:balance]"
          style={{ fontSize: 30, letterSpacing: '-0.6px' }}
        >
          Bien joué.
          <br />
          <span className="text-fg/70">Récup propre maintenant.</span>
        </h2>
        <p className="mt-2 text-[12px] font-bold text-fg-muted">{sessionLabel}</p>

        {/* ── Stats inline avec séparateurs verticaux ───────────────────── */}
        <div className="mt-5 flex items-stretch overflow-hidden rounded-2xl border border-border-app bg-layer-5">
          <StatCell
            value={durationMin != null ? `${durationMin}'` : '—'}
            label="Durée"
            testId="finish-recap-duration"
          />
          <Divider />
          <StatCell
            value={`${completedSets}/${totalSets}`}
            label="Sets"
            testId="finish-recap-sets"
          />
          <Divider />
          <StatCell
            value={tonnageKg != null && tonnageKg > 0 ? formatTonnage(tonnageKg) : '—'}
            label="Tonnage"
            blurred={!isPremium && tonnageKg != null && tonnageKg > 0}
            testId="finish-recap-tonnage"
          />
          <Divider />
          <StatCell
            value={sRPE > 0 ? `${sRPE}` : '—'}
            label="Charge"
            testId="finish-recap-srpe"
          />
        </div>

        {/* ── Forme du jour ─────────────────────────────────────────────── */}
        <div className="mt-6">
          <label className="text-[10px] font-bold uppercase tracking-wider text-fg-muted">
            Ta forme du jour
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(
              [
                { value: 'OK', label: 'En forme' },
                { value: 'FATIGUE', label: 'Fatigué' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFatigue(opt.value)}
                data-testid={`finish-fatigue-${opt.value.toLowerCase()}`}
                className={`rounded-xl border px-3 py-3 text-sm font-black transition-colors ${
                  fatigue === opt.value
                    ? 'border-brand bg-brand text-on-brand'
                    : 'border-border-app bg-app text-fg-secondary hover:bg-layer-7'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Effort ressenti — slider ──────────────────────────────────── */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="finish-rpe-slider"
              className="text-[10px] font-bold uppercase tracking-wider text-fg-muted"
            >
              Effort ressenti
            </label>
            <span
              className={`text-xs font-black tabular-nums ${RPE_COLOR[rpe]}`}
              data-testid="finish-rpe-label"
            >
              {`${rpe} — ${RPE_LABELS[rpe]}`}
            </span>
          </div>
          <input
            id="finish-rpe-slider"
            type="range"
            min={1}
            max={10}
            step={1}
            value={rpe}
            onChange={(e) => setRpe(Number(e.target.value))}
            data-testid="finish-rpe-slider"
            className="mt-3 w-full accent-brand"
          />
          <div className="mt-1 flex justify-between text-[10px] text-fg-muted">
            <span>Léger</span>
            <span>Max</span>
          </div>
        </div>

        {/* ── Insight contextuel (conditionnel) ─────────────────────────── */}
        {insight && (
          <div
            data-testid="finish-insight"
            className={`mt-5 flex gap-2 rounded-xl border px-3 py-2.5 text-xs leading-snug ${
              insight.tone === 'success'
                ? 'border-success/30 bg-success/10 text-success'
                : insight.tone === 'warn'
                  ? 'border-warn/30 bg-warn-bg text-warn'
                  : 'border-border-app bg-layer-5 text-fg-secondary'
            }`}
          >
            <span className="shrink-0">{insight.badge}</span>
            <span>{insight.message}</span>
          </div>
        )}

        {/* ── CTA principal ─────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm}
          data-testid="finish-confirm-btn"
          className="mt-6 w-full rounded-2xl bg-brand py-4 text-sm font-black uppercase italic tracking-wide text-on-brand transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40 shadow-lg shadow-brand-glow"
        >
          {isSubmitting ? 'Enregistrement…' : 'Enregistrer la séance'}
        </button>
      </div>
    </BottomSheet>
  )
}

function StatCell({
  value,
  label,
  blurred = false,
  testId,
}: {
  value: string
  label: string
  blurred?: boolean
  testId?: string
}) {
  return (
    <div data-testid={testId} className="flex min-w-0 flex-1 flex-col items-center justify-center px-2 py-3">
      <div className="flex items-baseline gap-1">
        <span
          className={`text-[16px] font-extrabold tabular-nums text-fg ${blurred ? 'blur-sm select-none' : ''}`}
          style={{ letterSpacing: '-0.4px' }}
        >
          {value}
        </span>
        {blurred && (
          <span
            data-testid={`${testId}-lock`}
            aria-label="Premium"
            className="rounded-full bg-brand/15 p-0.5 text-brand-tint"
          >
            <Lock className="h-2.5 w-2.5" />
          </span>
        )}
      </div>
      <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-fg-muted">
        {label}
      </div>
    </div>
  )
}

function Divider() {
  return <div aria-hidden className="w-px self-stretch bg-border-app/70" />
}
