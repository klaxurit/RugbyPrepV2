import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle2, Clock, Zap } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────

interface RPEModalProps {
  isOpen: boolean
  sessionLabel: string   // ex: "Haut du corps"
  onClose: () => void
  onConfirm: (rpe: number, durationMin: number) => void
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

export function RPEModal({ isOpen, sessionLabel, onClose, onConfirm }: RPEModalProps) {
  const [rpe, setRpe] = useState<number | null>(null)
  const [duration, setDuration] = useState<number>(60)
  const [customDuration, setCustomDuration] = useState('')

  const effectiveDuration = customDuration ? Number(customDuration) : duration
  const canConfirm = rpe !== null && effectiveDuration > 0

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm(rpe!, effectiveDuration)
    // reset
    setRpe(null)
    setDuration(60)
    setCustomDuration('')
  }

  const load = rpe != null ? rpe * effectiveDuration : null

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#23140f] border border-white/10 rounded-[2rem] p-6 space-y-6 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Séance terminée 💪</h3>
                <p className="text-xs text-white/50 mt-0.5">{sessionLabel} — note ton effort</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-2xl border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* RPE */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-[#ff6b35]" />
                <label className="text-xs font-black text-white/50 uppercase tracking-wide">
                  Effort perçu (RPE)
                </label>
                {rpe && (
                  <span className="ml-auto text-xs font-bold text-white/70">{RPE_LABELS[rpe]}</span>
                )}
              </div>
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRpe(n)}
                    className={`aspect-square rounded-xl text-sm font-black transition-all ${
                      rpe === n
                        ? `${RPE_COLORS[n]} text-white scale-110 shadow-md`
                        : 'bg-white/10 text-white/50 hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-1 px-0.5">
                <span className="text-[9px] text-white/40">Léger</span>
                <span className="text-[9px] text-white/40">Max</span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-[#ff6b35]" />
                <label className="text-xs font-black text-white/50 uppercase tracking-wide">
                  Durée
                </label>
              </div>
              <div className="flex gap-2 flex-wrap">
                {DURATION_PRESETS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setDuration(d); setCustomDuration('') }}
                    className={`px-3 py-2 rounded-2xl text-xs font-black transition-all ${
                      duration === d && !customDuration
                        ? 'bg-[#1a5f3f] text-white border border-[#1a5f3f]'
                        : 'bg-white/10 text-white/70 border border-white/10 hover:border-white/20'
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
                  className="w-20 px-3 py-2 rounded-2xl text-xs font-bold border border-white/20 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff6b35] transition-all [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Charge preview */}
            {load != null && (
              <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl">
                <div className="text-xl font-black text-white">{load} UA</div>
                <div className="text-xs text-white/50">
                  Charge séance<br />
                  <span className="text-[10px]">RPE {rpe} × {effectiveDuration} min</span>
                </div>
              </div>
            )}

            {/* Confirm */}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="w-full py-4 rounded-2xl bg-[#ff6b35] hover:bg-[#e55a2b] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase italic tracking-wide flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#ff6b35]/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Enregistrer la séance
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
