import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, Clock, Zap } from 'lucide-react'
import type { FatigueStatus } from '../../types/training'

// ─── Types ────────────────────────────────────────────────────

interface RPEModalProps {
  isOpen: boolean
  sessionLabel: string   // ex: "Haut du corps"
  onClose: () => void
  onConfirm: (payload: { fatigue: FatigueStatus; rpe: number; durationMin: number }) => void | Promise<void>
  initialFatigue?: FatigueStatus
  isSubmitting?: boolean
}

// ─── Constants ───────────────────────────────────────────────

const DURATION_PRESETS = [30, 45, 60, 75, 90]

const RPE_COLORS: Record<number, string> = {
  1: 'bg-emerald-400',
  2: 'bg-emerald-500',
  3: 'bg-lime-500',
  4: 'bg-yellow-400',
  5: 'bg-yellow-500',
  6: 'bg-amber-500',
  7: 'bg-orange-500',
  8: 'bg-orange-600',
  9: 'bg-rose-500',
  10: 'bg-rose-600',
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

// ─── Component ───────────────────────────────────────────────

function RPEModalContent({
  sessionLabel,
  onClose,
  onConfirm,
  initialFatigue,
  isSubmitting,
}: Omit<RPEModalProps, 'isOpen'> & { initialFatigue: FatigueStatus }) {
  const [rpe, setRpe] = useState<number | null>(null)
  const [duration, setDuration] = useState<number>(60)
  const [customDuration, setCustomDuration] = useState('')
  const [sessionFatigue, setSessionFatigue] = useState<FatigueStatus>(initialFatigue)

  const effectiveDuration = customDuration ? Number(customDuration) : duration
  const canConfirm = rpe !== null && effectiveDuration > 0

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm({ fatigue: sessionFatigue, rpe: rpe!, durationMin: effectiveDuration })
  }

  const load = rpe != null ? rpe * effectiveDuration : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-app border border-border-app rounded-[2rem] p-6 space-y-6 shadow-[0_8px_40px_rgb(44_24_16/0.15)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-fg">Séance terminée 💪</h3>
            <p className="text-xs text-fg-muted mt-0.5">{sessionLabel} — note ton effort</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl border border-border-app flex items-center justify-center text-fg-muted hover:text-fg hover:bg-layer-10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* RPE */}
        <div>
          <label className="text-xs font-black text-fg-muted uppercase tracking-wide block mb-1">
            Ta forme du jour
          </label>
          <p className="text-[10px] text-fg-faint mb-3">Ajuste le volume de ta semaine si tu n'es pas à 100%</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'OK', label: 'En forme' },
              { value: 'FATIGUE', label: 'Fatigué' },
            ] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSessionFatigue(option.value)}
                data-testid={`completion-fatigue-${option.value.toLowerCase()}`}
                className={`px-3 py-3 rounded-2xl text-sm font-black border transition-all ${
                  sessionFatigue === option.value
                    ? 'bg-brand text-on-brand border-brand'
                    : 'bg-panel text-fg-secondary border border-border-app hover:bg-layer-10 hover:border-brand-border'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* RPE */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-brand-tint" />
            <label className="text-xs font-black text-fg-muted uppercase tracking-wide">
              Effort ressenti
            </label>
            {rpe && (
              <span className="ml-auto text-xs font-bold text-fg-secondary">{RPE_LABELS[rpe]}</span>
            )}
          </div>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRpe(n)}
                data-testid={`completion-rpe-${n}`}
                className={`aspect-square rounded-xl text-sm font-black transition-all ${
                  rpe === n
                    ? `${RPE_COLORS[n]} text-white scale-110 shadow-md`
                    : 'bg-panel text-fg-muted hover:bg-layer-10 border border-border-app'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-1 px-0.5">
            <span className="text-[9px] text-fg-muted">Léger</span>
            <span className="text-[9px] text-fg-muted">Max</span>
          </div>
        </div>

        {/* Duration */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-brand-tint" />
            <label className="text-xs font-black text-fg-muted uppercase tracking-wide">
              Durée
            </label>
          </div>
          <div className="flex gap-2 flex-wrap">
            {DURATION_PRESETS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setDuration(d); setCustomDuration('') }}
                data-testid={`completion-duration-${d}`}
                className={`px-3 py-2 rounded-2xl text-xs font-black transition-all ${
                  duration === d && !customDuration
                    ? 'bg-brand text-on-brand border border-brand'
                    : 'bg-layer-10 text-fg-secondary border border-border-app hover:border-border-app'
                }`}
              >
                {d} min
              </button>
            ))}
            <input
              type="number"
              min="1"
              max="300"
              placeholder="Autre"
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
              className="w-20 px-3 py-2 rounded-2xl text-xs font-bold border border-border-app bg-panel text-fg placeholder:text-fg-faint focus:outline-none focus:border-brand transition-all"
            />
          </div>
        </div>

        {/* Charge preview */}
        {load != null && (
          <div className="flex items-center gap-3 px-4 py-3 bg-panel border border-border-app rounded-2xl">
            <div className="text-xl font-black text-fg">{load} pts</div>
            <div className="text-xs text-fg-muted">
              Charge séance<br />
              <span className="text-[10px]">RPE {rpe} × {effectiveDuration} min</span>
            </div>
          </div>
        )}

        {/* Confirm */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canConfirm || isSubmitting}
          data-testid="completion-confirm-btn"
          className="w-full py-4 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed text-on-brand font-black uppercase italic tracking-wide flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-glow"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer la séance'}
        </button>
      </motion.div>
    </div>
  )
}

export function RPEModal({
  isOpen,
  sessionLabel,
  onClose,
  onConfirm,
  initialFatigue = 'OK',
  isSubmitting = false,
}: RPEModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <RPEModalContent
          key={`${sessionLabel}-${initialFatigue}`}
          sessionLabel={sessionLabel}
          onClose={onClose}
          onConfirm={onConfirm}
          initialFatigue={initialFatigue}
          isSubmitting={isSubmitting}
        />
      )}
    </AnimatePresence>
  )
}
