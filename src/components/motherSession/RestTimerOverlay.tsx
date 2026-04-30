import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, SkipForward } from 'lucide-react'
import { useSessionRun } from '../../contexts/SessionRunContext'
import { useRestBeepPref } from '../../hooks/useRestBeepPref'
import { playRestEndBeep } from '../../utils/audioBeep'

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
 * Chrono de repos — sticky bottom overlay, global à la session en cours.
 * Auto-dismiss à l'expiration avec vibration courte (Android).
 */
export function RestTimerOverlay() {
  const { restTimer, adjustRestTimer, skipRestTimer } = useSessionRun()
  const { enabled: beepEnabled } = useRestBeepPref()
  const [now, setNow] = useState(() => Date.now())
  const expiredRef = useRef(false)

  useEffect(() => {
    if (!restTimer) {
      expiredRef.current = false
      return
    }
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [restTimer])

  const remainingMs = restTimer ? Math.max(0, restTimer.endsAt - now) : 0
  const remainingSec = Math.ceil(remainingMs / 1000)

  useEffect(() => {
    if (!restTimer) return
    if (remainingMs === 0 && !expiredRef.current) {
      expiredRef.current = true
      vibrate([120, 80, 120])
      if (beepEnabled) playRestEndBeep()
      // Dismiss after a short delay to let the user see "0" briefly.
      const id = window.setTimeout(() => skipRestTimer(), 800)
      return () => window.clearTimeout(id)
    }
  }, [remainingMs, restTimer, skipRestTimer, beepEnabled])

  const pct =
    restTimer && restTimer.totalSeconds > 0
      ? Math.max(0, Math.min(1, remainingMs / (restTimer.totalSeconds * 1000)))
      : 0

  const mm = String(Math.floor(remainingSec / 60)).padStart(1, '0')
  const ss = String(remainingSec % 60).padStart(2, '0')
  const isExpiring = remainingSec <= 3 && remainingSec > 0

  return (
    <AnimatePresence>
      {restTimer && (
        <motion.div
          key="rest-timer"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto"
          role="status"
          aria-live="polite"
          aria-label={`Repos ${remainingSec} secondes restantes`}
        >
          <div className={`rounded-[24px] shadow-brand-float border backdrop-blur p-4 ${isExpiring ? 'bg-brand text-on-brand border-brand' : 'bg-panel border-border-app'}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className={`text-[10px] font-black uppercase tracking-widest ${isExpiring ? 'text-on-brand' : 'text-fg-muted'}`}>
                  Repos {restTimer.label ? `· ${restTimer.label}` : ''}
                </p>
                <p className={`font-black leading-none tabular-nums ${isExpiring ? 'text-on-brand text-4xl' : 'text-fg text-3xl'}`}>
                  {mm}:{ss}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustRestTimer(-10)}
                  aria-label="Réduire de 10 secondes"
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors rf-focus-ring ${
                    isExpiring
                      ? 'bg-white/20 border-white/30 text-on-brand'
                      : 'bg-layer-5 border-border-app text-fg-muted hover:border-brand-border-strong hover:text-brand-tint'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => adjustRestTimer(10)}
                  aria-label="Ajouter 10 secondes"
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors rf-focus-ring ${
                    isExpiring
                      ? 'bg-white/20 border-white/30 text-on-brand'
                      : 'bg-layer-5 border-border-app text-fg-muted hover:border-brand-border-strong hover:text-brand-tint'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={skipRestTimer}
                  aria-label="Passer le repos"
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors rf-focus-ring ${
                    isExpiring
                      ? 'bg-white/20 border-white/30 text-on-brand'
                      : 'bg-layer-5 border-border-app text-fg-muted hover:border-alert-bd hover:text-alert'
                  }`}
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-layer-10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-200 ease-linear ${isExpiring ? 'bg-white/70' : 'bg-brand'}`}
                style={{ width: `${pct * 100}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
