import { useEffect, useRef, useState } from 'react'
import { Check, FastForward, Play } from 'lucide-react'
import { playSetEndBeep, playSideSwitchBeep } from '../../utils/audioBeep'
import { useRestBeepPref } from '../../hooks/useRestBeepPref'

export interface IsoChronoButtonProps {
  /** Lower bound of the prescribed range (e.g. 20 for "20-30s"). */
  durationLow: number
  /** Upper bound (equal to durationLow when prescription is fixed). */
  durationHigh: number
  /** "/côté" — chrono runs left then right back-to-back. */
  perSide: boolean
  /** "/direction" — chrono runs the 4 neck directions back-to-back. */
  perDirection: boolean
  /** Visual label of the exercise — shown in the active state. */
  label: string
  /** Called once the full set (incl. all phases) is done. */
  onCompleted: () => void
}

type Phase = 'idle' | 'work' | 'between'

/** Prep window between phases (left → between → right, etc.). */
const BETWEEN_SIDES_SECONDS = 5

const SIDE_LABELS = ['Côté gauche', 'Côté droit'] as const
const DIRECTION_LABELS = ['Avant', 'Arrière', 'Côté gauche', 'Côté droit'] as const

/**
 * Inline countdown chrono for time-based exercises (Pallof, planks, neck iso, etc.).
 *
 * - Idle state shows duration pills (e.g. `20s` / `30s`) when the prescription
 *   is a range, or a single Start button when fixed.
 * - Running state shows a big tabular countdown + Skip.
 * - Multi-phase patterns (perSide → 2 phases, perDirection → 4 phases) loop
 *   through their phases with a 5s prep window between each (Down Dog /
 *   Caliber pattern). Each phase shows its own label so the user knows
 *   which side / direction to engage.
 *
 * Audio + haptic cues are intentionally distinct from the rest-timer beeps so
 * the user knows whether the chrono signals "switch phase" or "set done".
 *
 * Implementation: phase transitions are driven by a single setTimeout
 * scheduled per phase change. The on-screen countdown updates on a separate
 * 200ms ticker — keeping side-effects out of the render-driven path avoids
 * the `set-state-in-effect` lint warning.
 */
export function IsoChronoButton({
  durationLow,
  durationHigh,
  perSide,
  perDirection,
  label,
  onCompleted,
}: IsoChronoButtonProps) {
  const phaseLabels: readonly string[] = perDirection
    ? DIRECTION_LABELS
    : perSide
      ? SIDE_LABELS
      : []
  const workTotal = phaseLabels.length || 1

  const [pickedDuration, setPickedDuration] = useState<number>(durationLow)
  const [phase, setPhase] = useState<Phase>('idle')
  const [workIndex, setWorkIndex] = useState(0)
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const { enabled: beepEnabled } = useRestBeepPref()
  const onCompletedRef = useRef(onCompleted)

  useEffect(() => {
    onCompletedRef.current = onCompleted
  }, [onCompleted])

  const isRange = durationHigh > durationLow

  // Display ticker — refresh `now` every 200ms while running.
  useEffect(() => {
    if (phase === 'idle' || endsAt === null) return
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [phase, endsAt])

  // Phase-transition timeout. Re-armed every time `phase` or `workIndex`
  // changes. Closure captures `pickedDuration` from the render where the
  // user picked it (set together with phase=work via `start()`).
  useEffect(() => {
    if (phase === 'idle') return
    const phaseDuration = phase === 'between' ? BETWEEN_SIDES_SECONDS : pickedDuration
    const id = window.setTimeout(() => {
      if (phase === 'work') {
        const isLastPhase = workIndex >= workTotal - 1
        if (isLastPhase) {
          // End of set — long haptic + ascending triple beep, validate.
          vibrate([120, 80, 120])
          if (beepEnabled) playSetEndBeep()
          setPhase('idle')
          setEndsAt(null)
          setWorkIndex(0)
          onCompletedRef.current()
          return
        }
        // Phase done, but more to come → switch beep + 5s prep window.
        vibrate([60, 40, 60])
        if (beepEnabled) playSideSwitchBeep()
        setPhase('between')
        setEndsAt(Date.now() + BETWEEN_SIDES_SECONDS * 1000)
        return
      }
      // between → start next work phase.
      if (beepEnabled) playSideSwitchBeep()
      setWorkIndex((i) => i + 1)
      setPhase('work')
      setEndsAt(Date.now() + pickedDuration * 1000)
    }, phaseDuration * 1000)
    return () => window.clearTimeout(id)
    // The closure on `pickedDuration` / `workTotal` / `beepEnabled` is fresh
    // at each phase transition because we rerun the effect on every phase
    // change — no need for explicit deps on those.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, workIndex])

  const start = (duration: number) => {
    setPickedDuration(duration)
    setWorkIndex(0)
    setEndsAt(Date.now() + duration * 1000)
    setPhase('work')
  }

  /** Skip the chrono and validate the set as done. Available everywhere
   *  so the player isn't trapped (forgot to start, did it manually, etc.). */
  const skipToCompleted = () => {
    if (phase !== 'idle') {
      vibrate([120, 80, 120])
      if (beepEnabled) playSetEndBeep()
    }
    setPhase('idle')
    setEndsAt(null)
    setWorkIndex(0)
    onCompletedRef.current()
  }

  /** During the prep window, jump straight to the next work phase. */
  const nextPhaseEarly = () => {
    if (phase !== 'between') return
    if (beepEnabled) playSideSwitchBeep()
    setWorkIndex((i) => i + 1)
    setPhase('work')
    setEndsAt(Date.now() + pickedDuration * 1000)
  }

  if (phase === 'idle') {
    const modeHint = perDirection
      ? `Chrono · 4 directions (${DIRECTION_LABELS.join(' · ')})`
      : perSide
        ? 'Chrono · gauche puis droite'
        : 'Chrono'
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-fg-muted text-center">
          {modeHint}
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
        {/* Filet de sécurité : si l'utilisateur a oublié de lancer le chrono
            et a fait sa série à la main, il peut valider directement sans
            passer par un compte à rebours. */}
        <button
          type="button"
          onClick={skipToCompleted}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-fg-muted hover:text-brand-tint underline underline-offset-2 rf-focus-ring"
        >
          J'ai déjà fait — valider
        </button>
      </div>
    )
  }

  // Running / between state.
  const remainingMs = endsAt !== null ? Math.max(0, endsAt - now) : 0
  const remainingSec = Math.ceil(remainingMs / 1000)
  const phaseDurationSec = phase === 'between' ? BETWEEN_SIDES_SECONDS : pickedDuration
  const totalMs = phaseDurationSec * 1000
  const pct = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0

  if (phase === 'between') {
    const nextLabel = phaseLabels[workIndex + 1] ?? 'Phase suivante'
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-tint text-center">
          Prépare · {nextLabel}
        </p>
        <p
          className="text-5xl font-black tabular-nums text-fg leading-none"
          aria-live="polite"
        >
          {String(remainingSec).padStart(2, '0')}
        </p>
        <p className="text-[11px] text-fg-muted">
          Démarre auto dans {remainingSec}s
        </p>
        <div className="w-full max-w-xs h-1.5 bg-layer-10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-tint transition-[width] duration-200 ease-linear"
            style={{ width: `${pct * 100}%` }}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={nextPhaseEarly}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-brand text-on-brand px-4 py-2.5 font-black uppercase italic tracking-wide text-sm shadow-brand-float rf-focus-ring"
          >
            <Play className="w-3.5 h-3.5" strokeWidth={3} />
            Démarrer maintenant
          </button>
          <button
            type="button"
            onClick={skipToCompleted}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-app bg-layer-5 text-fg-muted px-3 py-1.5 text-xs font-bold hover:border-ok-bd hover:text-ok-strong rf-focus-ring"
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            Marquer fait
          </button>
        </div>
      </div>
    )
  }

  // Running (work phase).
  const phaseLabel = phaseLabels[workIndex] ?? label
  const phaseProgressLabel =
    workTotal > 1 ? `${phaseLabel} · ${workIndex + 1}/${workTotal}` : label

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <p className="text-[10px] font-black uppercase tracking-widest text-brand-tint text-center">
        {phaseProgressLabel}
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
      {/* Skip mid-chrono : valide la série en cours et avance. Couvre les
          cas "j'ai oublié de lancer / je l'ai fait, passe à la suite". */}
      <button
        type="button"
        onClick={skipToCompleted}
        className="inline-flex items-center gap-1.5 rounded-xl border border-border-app bg-layer-5 text-fg-muted px-3 py-1.5 text-xs font-bold hover:border-ok-bd hover:text-ok-strong rf-focus-ring"
      >
        <FastForward className="w-3.5 h-3.5" strokeWidth={2.5} />
        Marquer fait
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
