import { useEffect, useMemo } from 'react'
import type { Block, Exercise } from '../../../types/motherSession'
import {
  localizeMotherSessionExerciseName,
  type Lang,
} from '../../../services/motherSession/localizeMotherSessionExerciseName'
import { parseBlockFormat } from '../../../services/ui/parseBlockFormat'
import { useBlockTimer } from '../../../hooks/useBlockTimer'
import { useRestBeepPref } from '../../../hooks/useRestBeepPref'
import { playRestEndBeep } from '../../../utils/audioBeep'
import { vibrate } from '../../../utils/vibrate'
import { Icon } from '../../ui'

interface EmomOverlayProps {
  /** Le bloc EMOM/Tabata à exécuter. Null = overlay fermé. */
  block: Block | null
  /** Appelée à la fin du timer total (le bloc devient terminé côté page). */
  onComplete: () => void
  /** Appelée quand l'utilisateur ferme l'overlay (croix ou Stop). */
  onClose: () => void
  /** Aligné sur `UserProfile.preferredLanguage` — lexique mother session. */
  lang?: Lang
}

/**
 * Overlay full-screen sticky bas pour les blocs chronométrés (EMOM/Tabata/AMRAP).
 *
 * Utilise `useBlockTimer` pour tout le tick + détection de boundary minute /
 * round. Vibrate + beep à chaque transition + à la complétion.
 *
 * Design éditorial v4-pro : countdown 64px italic + dots minutes + exo en cours +
 * contrôles play/skip/stop.
 */
export function EmomOverlay({ block, onComplete, onClose, lang = 'fr' }: EmomOverlayProps) {
  const format = useMemo(() => (block ? parseBlockFormat(block.format) : null), [block])
  const { enabled: beepEnabled } = useRestBeepPref()

  const { snapshot, start, pause, stop, skipInterval } = useBlockTimer({
    format: format ?? { type: 'rounds' },
    onIntervalBoundary: () => {
      if (beepEnabled) playRestEndBeep()
    },
    onComplete: () => {
      vibrate([180, 80, 180])
      if (beepEnabled) playRestEndBeep()
      onComplete()
    },
  })

  // Auto-start au mount.
  useEffect(() => {
    if (!block) return
    start()
    return () => {
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start/stop dépendent du status mais on veut juste auto-start au mount
  }, [block])

  if (!block || !format) return null

  // Format-specific data.
  const isEmom = format.type === 'emom'
  const isTabata = format.type === 'tabata'

  const totalUnits = isEmom ? format.rounds : isTabata ? format.rounds : 0
  const currentUnit = isEmom ? snapshot.currentMinute ?? 0 : isTabata ? snapshot.currentRound ?? 0 : 0
  const remainingInUnit = snapshot.remainingInIntervalSec ?? 0
  const totalRemainingSec =
    snapshot.totalSec != null ? Math.max(0, snapshot.totalSec - snapshot.elapsedSec) : 0

  const mm = Math.floor(remainingInUnit / 60)
  const ss = String(Math.floor(remainingInUnit % 60)).padStart(2, '0')
  const progressPct =
    isEmom && format.type === 'emom'
      ? ((format.intervalSeconds - remainingInUnit) / format.intervalSeconds) * 100
      : isTabata && format.type === 'tabata'
        ? ((format.workSeconds - remainingInUnit) / format.workSeconds) * 100
        : 0

  const { currentExo, nextExo } = pickEmomCurrentExos(block.exercises, currentUnit)

  const isPaused = snapshot.status === 'paused'
  const handleTogglePause = () => {
    if (isPaused) start()
    else pause()
  }

  return (
    <div
      className="mx-[14px] mb-3 overflow-hidden rounded-[22px] border border-paper-deep bg-app animate-rf-slide-up"
      style={{
        boxShadow: '0 -2px 0 rgba(0, 0, 0, 0.04), 0 24px 50px -10px rgba(0, 0, 0, 0.18)',
      }}
    >
      <div className="px-[18px] pt-3.5 pb-4">
        {/* Header : eyebrow + croix */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand">
              {isEmom ? `EMOM · Minute ${currentUnit + 1}/${totalUnits}` : 'Chrono'}
            </div>
            <div className="mt-0.5 text-[11px] tabular-nums text-fg-muted">
              Temps total restant : {formatTotalRemaining(totalRemainingSec)}
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

        {/* Big timer */}
        <div
          className="mt-2.5 font-serif italic font-extrabold leading-none tabular-nums text-fg"
          style={{ fontSize: 64, letterSpacing: '-3px' }}
        >
          {mm}:{ss}
        </div>

        {/* Progress bar de la minute courante */}
        <div className="mt-3 h-1 overflow-hidden rounded-sm bg-paper-deep">
          <div
            className="h-full bg-brand transition-[width] duration-500 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Dots minutes (EMOM) */}
        {isEmom && totalUnits > 0 && (
          <div className="mt-2.5 flex gap-1.5">
            {Array.from({ length: totalUnits }).map((_, i) => {
              const done = i < currentUnit
              const cur = i === currentUnit
              return (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-sm ${done ? 'bg-brand opacity-40' : cur ? 'bg-brand' : 'bg-paper-deep'}`}
                />
              )
            })}
          </div>
        )}

        {/* Exo en cours / suivant */}
        {currentExo && (
          <div className="mt-3.5 rounded-xl border border-paper-deep bg-app px-3.5 py-3">
            <div className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-brand">
              En cours
            </div>
            <div
              className="mt-0.5 font-serif italic font-extrabold text-fg"
              style={{ fontSize: 17, letterSpacing: '-0.4px' }}
            >
              {localizeMotherSessionExerciseName(currentExo.name, lang)}
            </div>
            {nextExo && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-fg-muted">
                <span className="font-bold opacity-60 text-fg">Ensuite :</span>
                <span>{localizeMotherSessionExerciseName(nextExo.name, lang)}</span>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="mt-3.5 flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleTogglePause}
            aria-label={isPaused ? 'Reprendre' : 'Pause'}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-paper-deep bg-app rf-focus-ring"
          >
            {isPaused ? (
              <Icon name="play" size={14} color="var(--color-text-primary)" strokeWidth={2} />
            ) : (
              <PauseIcon />
            )}
          </button>
          <button
            type="button"
            onClick={skipInterval}
            aria-label="Passer à la minute suivante"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-paper-deep bg-app rf-focus-ring"
          >
            <SkipIcon />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto flex h-11 items-center rounded-full border-[1.5px] border-brand bg-transparent text-brand px-5 text-[12px] font-extrabold uppercase tracking-[0.06em] hover:bg-brand-soft transition-colors rf-focus-ring"
          >
            Stop
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTotalRemaining(sec: number): string {
  const mm = Math.floor(sec / 60)
  const ss = String(sec % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

/**
 * Pour un EMOM avec pattern alterné (Min 1,3,5,7 = exo A · Min 2,4,6,8 = exo B),
 * retourne l'exo courant (selon parity / round) + l'exo suivant.
 */
function pickEmomCurrentExos(
  exercises: readonly Exercise[],
  currentUnit: number,
): { currentExo: Exercise | null; nextExo: Exercise | null } {
  if (exercises.length === 0) return { currentExo: null, nextExo: null }
  const idx = currentUnit % exercises.length
  const nextIdx = (currentUnit + 1) % exercises.length
  return {
    currentExo: exercises[idx] ?? null,
    nextExo: exercises[nextIdx] ?? null,
  }
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-text-primary)" aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  )
}

function SkipIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-text-primary)" aria-hidden>
      <path d="M5 5l9 7-9 7V5z" />
      <rect x="16" y="5" width="2.5" height="14" rx="1" />
    </svg>
  )
}
