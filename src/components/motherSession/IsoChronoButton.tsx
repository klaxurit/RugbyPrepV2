import { useEffect, useRef, useState } from 'react'
import { Play, X } from 'lucide-react'
import { playSetEndBeep, playSideSwitchBeep } from '../../utils/audioBeep'
import { useRestBeepPref } from '../../hooks/useRestBeepPref'

export interface IsoChronoButtonProps {
  /** Lower bound of the prescribed range (e.g. 20 for "20-30s"). */
  durationLow: number
  /** Upper bound (equal to durationLow when prescription is fixed). */
  durationHigh: number
  /** When true, runs left side then right side back-to-back per set. */
  perSide: boolean
  /** Visual label of the exercise — shown in the active state. */
  label: string
  /** Called once the full set (incl. both sides if applicable) is done. */
  onCompleted: () => void
  /** Called when the user explicitly cancels mid-set. */
  onCancel?: () => void
}

type Phase = 'idle' | 'left' | 'right' | 'single'

/**
 * Inline countdown chrono for time-based exercises (Pallof, planks, etc.).
 *
 * - Idle state shows duration pills (e.g. `20s` / `30s`) when the prescription
 *   is a range, or a single Start button when fixed.
 * - Running state shows a big tabular countdown + Skip.
 * - perSide handles `Left → beep → Right → beep → Done` automatically so the
 *   user doesn't have to fiddle with the timer mid-set.
 *
 * Audio + haptic cues are intentionally distinct from the rest-timer beeps so
 * the user knows whether the chrono signals "switch sides" or "set done".
 *
 * Implementation: phase transitions are driven by setTimeout (one timeout per
 * phase) rather than a tick-based effect. The on-screen countdown is purely
 * cosmetic and updates from a separate effect — keeping side-effects out of
 * the render-driven path avoids the `set-state-in-effect` lint warning.
 */
export function IsoChronoButton({
  durationLow,
  durationHigh,
  perSide,
  label,
  onCompleted,
  onCancel,
}: IsoChronoButtonProps) {
  const [pickedDuration, setPickedDuration] = useState<number>(durationLow)
  const [phase, setPhase] = useState<Phase>('idle')
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const { enabled: beepEnabled } = useRestBeepPref()
  const onCompletedRef = useRef(onCompleted)

  useEffect(() => {
    onCompletedRef.current = onCompleted
  }, [onCompleted])

  const isRange = durationHigh > durationLow

  // Display-only ticker: refresh `now` every 200ms while running.
  useEffect(() => {
    if (phase === 'idle' || endsAt === null) return
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [phase, endsAt])

  // Phase-transition timeout: scheduled fresh whenever phase / duration change.
  // The cleanup cancels the timeout if the user cancels or re-renders cause a
  // dependency change before the timeout fires.
  useEffect(() => {
    if (phase === 'idle') return
    const id = window.setTimeout(() => {
      if (phase === 'left') {
        vibrate([60, 40, 60])
        if (beepEnabled) playSideSwitchBeep()
        setPhase('right')
        setEndsAt(Date.now() + pickedDuration * 1000)
        return
      }
      // single or right → set is done.
      vibrate([120, 80, 120])
      if (beepEnabled) playSetEndBeep()
      setPhase('idle')
      setEndsAt(null)
      onCompletedRef.current()
    }, pickedDuration * 1000)
    return () => window.clearTimeout(id)
    // We intentionally re-arm the timeout when `phase` flips left→right; both
    // phase transitions use the same `pickedDuration`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const start = (duration: number) => {
    setPickedDuration(duration)
    setEndsAt(Date.now() + duration * 1000)
    setPhase(perSide ? 'left' : 'single')
  }

  const cancel = () => {
    setPhase('idle')
    setEndsAt(null)
    onCancel?.()
  }

  if (phase === 'idle') {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-fg-muted">
          {perSide ? 'Chrono · gauche puis droite' : 'Chrono'}
        </p>
        {isRange ? (
          <div className="flex items-center gap-2">
            <DurationPill seconds={durationLow} onStart={start} />
            <DurationPill seconds={durationHigh} onStart={start} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => start(durationLow)}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand text-on-brand px-5 py-3 font-black uppercase italic tracking-wide shadow-brand-float rf-focus-ring"
          >
            <Play className="w-4 h-4" strokeWidth={3} />
            <span>Démarrer · {durationLow}s</span>
          </button>
        )}
      </div>
    )
  }

  // Running state.
  const remainingMs = endsAt !== null ? Math.max(0, endsAt - now) : 0
  const remainingSec = Math.ceil(remainingMs / 1000)
  const totalMs = pickedDuration * 1000
  const pct = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0
  const phaseLabel =
    phase === 'left' ? 'Côté gauche' : phase === 'right' ? 'Côté droit' : label

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <p className="text-[10px] font-black uppercase tracking-widest text-brand-tint">
        {phaseLabel}
      </p>
      <p
        className="text-5xl font-black tabular-nums text-fg leading-none"
        aria-live="polite"
        aria-label={`${remainingSec} secondes restantes`}
      >
        {String(remainingSec).padStart(2, '0')}
      </p>
      <div className="w-full max-w-xs h-1.5 bg-layer-10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-200 ease-linear"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <button
        type="button"
        onClick={cancel}
        aria-label="Annuler le chrono"
        className="inline-flex items-center gap-1.5 rounded-xl border border-border-app bg-layer-5 text-fg-muted px-3 py-1.5 text-xs font-bold hover:border-alert-bd hover:text-alert rf-focus-ring"
      >
        <X className="w-3.5 h-3.5" strokeWidth={2.5} />
        Annuler
      </button>
    </div>
  )
}

function DurationPill({ seconds, onStart }: { seconds: number; onStart: (s: number) => void }) {
  return (
    <button
      type="button"
      onClick={() => onStart(seconds)}
      className="inline-flex items-center gap-1.5 rounded-2xl bg-brand text-on-brand px-4 py-2.5 font-black uppercase italic tracking-wide shadow-brand-float rf-focus-ring"
    >
      <Play className="w-3.5 h-3.5" strokeWidth={3} />
      <span>{seconds}s</span>
    </button>
  )
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
