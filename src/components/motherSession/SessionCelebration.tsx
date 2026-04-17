import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, Dumbbell, Clock, Hash } from 'lucide-react'
import confetti from 'canvas-confetti'
import type { FatigueStatus } from '../../types/training'

interface SessionCelebrationStats {
  /** Durée totale en minutes. */
  durationMin: number
  /** Nombre total de séries validées. */
  totalSets: number
  /** Tonnage cumulé (somme kg × reps) ou null si aucune donnée. */
  tonnageKg: number | null
}

interface SessionCelebrationProps {
  isOpen: boolean
  sessionLabel: string
  stats: SessionCelebrationStats
  onClose: () => void
  onConfirm: (payload: { fatigue: FatigueStatus; rpe: number; durationMin: number; notes: string }) => void | Promise<void>
  isSubmitting?: boolean
}

const RPE_LABEL: Record<number, string> = {
  1: 'Très léger',
  2: 'Léger',
  3: 'Modéré léger',
  4: 'Modéré',
  5: 'Modéré+',
  6: 'Un peu dur',
  7: 'Dur',
  8: 'Très dur',
  9: 'Extrême',
  10: 'Maximal',
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator === 'undefined') return
  const nav = navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean }
  try {
    nav.vibrate?.(pattern)
  } catch {
    // ignore
  }
}

/**
 * Celebration screen plein écran — récompense la fin d'une séance en cours.
 * Confetti non bloquant + RPE + notes optionnelles + valide.
 */
export function SessionCelebration({
  isOpen,
  sessionLabel,
  stats,
  onClose,
  onConfirm,
  isSubmitting = false,
}: SessionCelebrationProps) {
  const [rpe, setRpe] = useState(7)
  const [notes, setNotes] = useState('')
  const [notesOpen, setNotesOpen] = useState(false)
  const confettiTriggeredRef = useRef(false)

  useEffect(() => {
    if (!isOpen) {
      confettiTriggeredRef.current = false
      return
    }
    if (confettiTriggeredRef.current) return
    confettiTriggeredRef.current = true

    // Confetti salvo — deux bursts depuis les deux côtés pour remplir l'écran sans bloquer.
    vibrate([80, 50, 80, 50, 120])
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }
    confetti({
      ...defaults,
      particleCount: 80,
      origin: { x: 0.1, y: 0.5 },
      colors: ['#7B0D1E', '#F5F2EE', '#B45309', '#047857'],
    })
    confetti({
      ...defaults,
      particleCount: 80,
      origin: { x: 0.9, y: 0.5 },
      colors: ['#7B0D1E', '#F5F2EE', '#B45309', '#047857'],
    })
  }, [isOpen])

  const fatigue: FatigueStatus = useMemo(() => (rpe >= 8 ? 'FATIGUE' : 'OK'), [rpe])

  const handleConfirm = async () => {
    await onConfirm({
      fatigue,
      rpe,
      durationMin: stats.durationMin,
      notes: notes.trim(),
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Séance bouclée"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-app z-50 overflow-y-auto"
        >
          <div className="max-w-md mx-auto min-h-full flex flex-col">
            <div className="flex items-center justify-end p-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 rounded-xl text-fg-muted hover:bg-layer-10 rf-focus-ring disabled:opacity-40"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 flex-1 space-y-6 pb-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 14, stiffness: 180, delay: 0.1 }}
                className="text-center space-y-1"
              >
                <p className="text-[11px] font-black uppercase tracking-widest text-brand-tint">Séance bouclée</p>
                <h2 className="text-3xl font-black text-fg leading-tight">{sessionLabel}</h2>
                <p className="text-sm text-fg-muted">Bien joué.</p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-3 gap-3"
              >
                <StatCard icon={<Clock className="w-4 h-4" />} label="Durée" value={`${stats.durationMin} min`} />
                <StatCard icon={<Hash className="w-4 h-4" />} label="Séries" value={String(stats.totalSets)} />
                <StatCard
                  icon={<Dumbbell className="w-4 h-4" />}
                  label="Tonnage"
                  value={stats.tonnageKg != null ? `${stats.tonnageKg} kg` : '—'}
                />
              </motion.div>

              <motion.section
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <div className="flex items-baseline justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-fg-muted">
                    Intensité ressentie (RPE)
                  </label>
                  <span className="text-xs font-bold text-fg">
                    {rpe} / 10 — <span className="text-fg-muted">{RPE_LABEL[rpe]}</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={rpe}
                  onChange={(e) => setRpe(Number(e.target.value))}
                  className="w-full h-2 rounded-full accent-[var(--color-brand)] bg-layer-10 cursor-pointer rf-focus-ring"
                  aria-label="Échelle RPE de 1 à 10"
                />
                <div className="flex justify-between text-[10px] text-fg-faint">
                  <span>Facile</span>
                  <span>Maximal</span>
                </div>
              </motion.section>

              <motion.section
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <button
                  type="button"
                  onClick={() => setNotesOpen((v) => !v)}
                  aria-expanded={notesOpen}
                  className="flex items-center gap-2 text-xs font-bold text-fg-muted hover:text-fg rf-focus-ring rounded-lg"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${notesOpen ? 'rotate-180' : ''}`} />
                  Notes (optionnel)
                </button>
                {notesOpen && (
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Comment t'es-tu senti ? PR, douleur, énergie…"
                    className="mt-2 w-full px-4 py-3 rounded-2xl border border-border-app bg-layer-5 text-sm text-fg-secondary placeholder:text-fg-ghost resize-none rf-focus-ring"
                  />
                )}
              </motion.section>
            </div>

            <div className="sticky bottom-0 px-6 pb-6 pt-3 bg-gradient-to-t from-app via-app/95 to-transparent">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-brand hover:bg-brand-hover text-on-brand font-black uppercase italic tracking-wide transition-all shadow-lg shadow-brand-float disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Enregistrement…' : 'Valider ma séance'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-layer-5 border border-border-app rounded-2xl p-3 flex flex-col items-center gap-1 text-center">
      <div className="text-fg-muted">{icon}</div>
      <p className="text-lg font-black text-fg tabular-nums leading-none">{value}</p>
      <p className="text-[10px] font-bold text-fg-muted uppercase tracking-tight">{label}</p>
    </div>
  )
}
