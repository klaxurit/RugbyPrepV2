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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-white rounded-[2rem] p-6 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Séance terminée 💪</h3>
                <p className="text-xs text-slate-400 mt-0.5">{sessionLabel} — note ton effort</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-2xl border border-gray-200 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* RPE */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-rose-500" />
                <label className="text-xs font-black text-slate-400 uppercase tracking-wide">
                  Effort perçu (RPE)
                </label>
                {rpe && (
                  <span className="ml-auto text-xs font-bold text-slate-500">{RPE_LABELS[rpe]}</span>
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
                        : 'bg-gray-100 text-slate-500 hover:bg-gray-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-1 px-0.5">
                <span className="text-[9px] text-slate-400">Léger</span>
                <span className="text-[9px] text-slate-400">Max</span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-blue-500" />
                <label className="text-xs font-black text-slate-400 uppercase tracking-wide">
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
                        ? 'bg-slate-900 text-white'
                        : 'bg-gray-100 text-slate-600 hover:bg-gray-200'
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
                  className={`w-20 px-3 py-2 rounded-2xl text-xs font-bold border transition-all focus:outline-none ${
                    customDuration
                      ? 'border-slate-900 bg-slate-50 text-slate-900'
                      : 'border-gray-200 text-slate-400'
                  } focus:ring-2 focus:ring-rose-500`}
                />
              </div>
            </div>

            {/* Charge preview */}
            {load != null && (
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl">
                <div className="text-xl font-black text-slate-900">{load} UA</div>
                <div className="text-xs text-slate-400">
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
              className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-colors"
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
