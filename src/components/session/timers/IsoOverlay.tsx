import { useEffect, useRef, useState } from 'react'
import { useRestBeepPref } from '../../../hooks/useRestBeepPref'
import { playRestEndBeep } from '../../../utils/audioBeep'
import { vibrate } from '../../../utils/vibrate'
import { Icon } from '../../ui'

export interface IsoOverlayState {
  /** Nom de l'exo affiché dans l'overlay (ex: "Gainage cou isométrique"). */
  exerciseName: string
  /** Eyebrow contextuel (ex: "Finisher Premières Lignes · Tour 1"). */
  parentLabel?: string
  /** Durées proposées en sélection (ex: [15, 20]) — le user choisit avant de démarrer. */
  durationOptions: readonly number[]
}

interface IsoOverlayProps {
  state: IsoOverlayState | null
  /** Click "J'ai fait" ou auto-fin du chrono → marque l'exo validé + ferme l'overlay. */
  onComplete: () => void
  /** Click bouton fermer (annule sans valider). */
  onClose: () => void
}

/**
 * Overlay mini-chrono iso (15s / 20s typiquement) — design éditorial v4-pro.
 *
 * Phases :
 *  - idle : affiche les boutons de durée proposés
 *  - running : countdown + barre + lien "J'ai déjà fait — valider"
 *  - completed : auto-déclenche `onComplete()` + vibrate + beep, ferme l'overlay
 *
 * Mode single-phase pour l'instant (pas de perSide/perDirection — Banded Neck
 * Iso Multi reste sur l'IsoChronoButton existant si réintroduit en D7).
 */
export function IsoOverlay({ state, onComplete, onClose }: IsoOverlayProps) {
  const { enabled: beepEnabled } = useRestBeepPref()
  const beepRef = useRef(beepEnabled)
  useEffect(() => {
    beepRef.current = beepEnabled
  }, [beepEnabled])

  const [running, setRunning] = useState(false)
  const [totalSec, setTotalSec] = useState(0)
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  // Reset à chaque ouverture / fermeture.
  useEffect(() => {
    setRunning(false)
    setTotalSec(0)
    setEndsAt(null)
  }, [state])

  // Ticker 200ms quand running.
  useEffect(() => {
    if (!running || endsAt == null) return
    const id = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(id)
  }, [running, endsAt])

  // Auto-complétion à la fin du chrono.
  const completeRef = useRef(onComplete)
  useEffect(() => {
    completeRef.current = onComplete
  }, [onComplete])
  useEffect(() => {
    if (!running || endsAt == null) return
    const delay = Math.max(0, endsAt - Date.now())
    const id = window.setTimeout(() => {
      vibrate([120, 80, 120])
      if (beepRef.current) playRestEndBeep()
      completeRef.current()
    }, delay)
    return () => window.clearTimeout(id)
  }, [running, endsAt])

  if (!state) return null

  const handleStart = (sec: number) => {
    setTotalSec(sec)
    // eslint-disable-next-line react-hooks/purity -- Date.now() est appelé dans le handler du clic, pas au render
    setEndsAt(Date.now() + sec * 1000)
    setRunning(true)
  }

  const remainingMs = endsAt != null ? Math.max(0, endsAt - now) : totalSec * 1000
  const remainingSec = Math.ceil(remainingMs / 1000)
  const elapsedPct =
    totalSec > 0 ? Math.max(0, Math.min(1, (totalSec * 1000 - remainingMs) / (totalSec * 1000))) : 0

  return (
    <div
      className="mx-[14px] mb-3 rounded-[18px] border border-paper-deep bg-app animate-rf-slide-up"
      style={{
        boxShadow: '0 -2px 0 rgba(0, 0, 0, 0.04), 0 16px 40px -10px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div className="px-[18px] pt-3.5 pb-4 text-center">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 text-left">
            {state.parentLabel && (
              <div className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-brand">
                {state.parentLabel}
              </div>
            )}
            <div
              className="mt-0.5 font-serif italic font-extrabold leading-tight text-fg"
              style={{ fontSize: 18, letterSpacing: '-0.4px' }}
            >
              {state.exerciseName}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le chrono"
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-paper-deep bg-transparent rf-focus-ring"
          >
            <span aria-hidden className="text-[14px] leading-none text-fg">
              ×
            </span>
          </button>
        </div>

        <div className="mt-2.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-fg-muted">
          Chrono
        </div>

        {!running ? (
          <div className="mt-2 flex justify-center gap-2.5">
            {state.durationOptions.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => handleStart(sec)}
                className="flex h-12 items-center gap-2 rounded-full bg-brand text-app px-5 text-[14px] font-extrabold uppercase italic tracking-[0.04em] active:scale-[0.97] transition-transform rf-focus-ring"
                style={{ boxShadow: '0 8px 18px rgba(123, 13, 30, 0.4)' }}
              >
                <Icon name="play" size={11} strokeWidth={2.4} />
                {sec}S
              </button>
            ))}
          </div>
        ) : (
          <>
            <div
              className="mt-1.5 font-serif italic font-extrabold leading-none tabular-nums text-fg"
              style={{ fontSize: 56, letterSpacing: '-2px' }}
            >
              {String(remainingSec).padStart(2, '0')}s
            </div>
            <div className="mt-2.5 h-1 overflow-hidden rounded-sm bg-paper-deep">
              <div
                className="h-full bg-brand transition-[width] duration-300 ease-linear"
                style={{ width: `${elapsedPct * 100}%` }}
              />
            </div>
          </>
        )}

        <button
          type="button"
          onClick={onComplete}
          className="mt-3 inline-block bg-transparent text-[11px] font-semibold text-fg/65 underline underline-offset-2 hover:text-fg transition-colors rf-focus-ring rounded"
        >
          J&apos;ai déjà fait — valider
        </button>
      </div>
    </div>
  )
}
