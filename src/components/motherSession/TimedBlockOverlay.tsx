import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pause, Play, SkipForward, X, Flag, Plus } from 'lucide-react'
import type { Block, Exercise } from '../../types/motherSession'
import type { TimedBlockFormat } from '../../services/ui/parseBlockFormat'
import { useBlockTimer, type TimerSnapshot } from '../../hooks/useBlockTimer'
import { isDirectiveText } from '../../services/motherSession/motherSessionExerciseMap'
import { useWakeLock } from '../../hooks/useWakeLock'

interface TimedBlockOverlayProps {
  block: Block
  format: TimedBlockFormat
  /** Noms FR des exercices (fallback = block.exercises[i].name). */
  frExerciseNames?: (string | undefined)[]
  isOpen: boolean
  /** Déclenché au tap "Stop" ou à la fin du timer : marque le bloc terminé. */
  onFinish: (result: TimedBlockResult) => void
  /** Déclenché au tap "Quitter" pour fermer l'overlay sans valider le bloc. */
  onCancel: () => void
}

export interface TimedBlockResult {
  /** Temps écoulé réel (secondes). */
  elapsedSec: number
  /** Pour For Time : temps final. Pour AMRAP : tours comptés. Pour EMOM/Tabata : undefined. */
  amrapRounds?: number
  /** True si l'utilisateur a terminé normalement, false s'il a stoppé avant la fin. */
  completed: boolean
}

function fmt(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

function pickLoggableExercises(block: Block): Exercise[] {
  return block.exercises.filter((ex) => !isDirectiveText(ex.name))
}

function getFormatTitle(format: TimedBlockFormat): string {
  switch (format.type) {
    case 'emom':
      return `EMOM · ${format.rounds} min`
    case 'tabata':
      return `Tabata · ${format.rounds} rounds ${format.workSeconds}s/${format.restSeconds}s`
    case 'amrap':
      return `AMRAP · ${Math.round(format.totalSeconds / 60)} min`
    case 'for_time':
      return 'For Time'
    default:
      return 'Bloc'
  }
}

export function TimedBlockOverlay({
  block,
  format,
  frExerciseNames,
  isOpen,
  onFinish,
  onCancel,
}: TimedBlockOverlayProps) {
  const loggable = useMemo(() => pickLoggableExercises(block), [block])
  const resolveName = (i: number): string => frExerciseNames?.[i] ?? loggable[i]?.name ?? '—'

  // Wake lock tant que l'overlay est ouvert (comme le mode En cours).
  useWakeLock(isOpen)

  const { snapshot, start, pause, stop, skipInterval, incrementAmrapRound } = useBlockTimer({
    format,
    onComplete: () => {
      onFinish({
        elapsedSec: snapshot.elapsedSec,
        amrapRounds: format.type === 'amrap' ? snapshot.amrapRounds : undefined,
        completed: true,
      })
    },
  })

  useEffect(() => {
    if (isOpen && snapshot.status === 'idle') {
      start()
    }
    if (!isOpen && snapshot.status !== 'idle') {
      stop()
    }
  }, [isOpen, snapshot.status, start, stop])

  const handleStop = () => {
    const result: TimedBlockResult = {
      elapsedSec: snapshot.elapsedSec,
      amrapRounds: format.type === 'amrap' ? snapshot.amrapRounds : undefined,
      completed: false,
    }
    stop()
    onFinish(result)
  }

  const handleFinishForTime = () => {
    const result: TimedBlockResult = {
      elapsedSec: snapshot.elapsedSec,
      completed: true,
    }
    stop()
    onFinish(result)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="timed-block-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Bloc ${getFormatTitle(format)} en cours`}
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          className="fixed left-0 right-0 bottom-28 z-40 px-4 pointer-events-none"
        >
          <div className="max-w-md mx-auto pointer-events-auto">
            <OverlayBody
              format={format}
              snapshot={snapshot}
              resolveName={resolveName}
              loggableCount={loggable.length}
              onPauseResume={() => (snapshot.status === 'running' ? pause() : start())}
              onSkip={skipInterval}
              onStop={handleStop}
              onIncrementRound={incrementAmrapRound}
              onFinishForTime={handleFinishForTime}
              onCancel={onCancel}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function OverlayBody({
  format,
  snapshot,
  resolveName,
  loggableCount,
  onPauseResume,
  onSkip,
  onStop,
  onIncrementRound,
  onFinishForTime,
  onCancel,
}: {
  format: TimedBlockFormat
  snapshot: TimerSnapshot
  resolveName: (i: number) => string
  loggableCount: number
  onPauseResume: () => void
  onSkip: () => void
  onStop: () => void
  onIncrementRound: () => void
  onFinishForTime: () => void
  onCancel: () => void
}) {
  const isPaused = snapshot.status === 'paused'
  const isTabata = format.type === 'tabata'
  const isEmom = format.type === 'emom'
  const isAmrap = format.type === 'amrap'
  const isForTime = format.type === 'for_time'

  // Indicateur principal : temps restant dans l'intervalle courant (EMOM/Tabata),
  // ou temps restant total (AMRAP), ou temps écoulé (For Time).
  const primarySec =
    isEmom || isTabata
      ? snapshot.remainingInIntervalSec ?? 0
      : isAmrap && snapshot.totalSec != null
        ? Math.max(0, snapshot.totalSec - snapshot.elapsedSec)
        : snapshot.elapsedSec

  // Barre de progression : remplissage sur la durée attendue.
  const progressPct = (() => {
    if (isEmom && snapshot.remainingInIntervalSec != null) {
      return 1 - snapshot.remainingInIntervalSec / format.intervalSeconds
    }
    if (isTabata && snapshot.remainingInIntervalSec != null) {
      const intervalLen = snapshot.tabataPhase === 'work' ? format.workSeconds : format.restSeconds
      return intervalLen > 0 ? 1 - snapshot.remainingInIntervalSec / intervalLen : 0
    }
    if (isAmrap && snapshot.totalSec != null) {
      return Math.min(1, snapshot.elapsedSec / snapshot.totalSec)
    }
    return 0
  })()

  // Exo courant / suivant pour EMOM (cycle sur la liste).
  const emomExerciseLabels = (() => {
    if (!isEmom || loggableCount === 0) return null
    const idx = (snapshot.currentMinute ?? 0) % loggableCount
    const next = (idx + 1) % loggableCount
    return { current: resolveName(idx), next: resolveName(next) }
  })()

  const headerLabel = (() => {
    if (isEmom) {
      return `${getFormatTitle(format)} · Minute ${(snapshot.currentMinute ?? 0) + 1}/${snapshot.totalMinutes ?? 0}`
    }
    if (isTabata) {
      const phase = snapshot.tabataPhase === 'work' ? 'EFFORT' : 'REPOS'
      return `Tabata · Round ${(snapshot.currentRound ?? 0) + 1}/${format.rounds} · ${phase}`
    }
    if (isAmrap) {
      return `AMRAP · ${Math.round(format.totalSeconds / 60)} min`
    }
    if (isForTime) {
      return 'For Time · en cours'
    }
    return 'Bloc chronométré'
  })()

  const tabataPhaseColor = (() => {
    if (!isTabata) return null
    return snapshot.tabataPhase === 'work'
      ? 'bg-ok-strong text-white'
      : 'bg-warn-button text-white'
  })()

  const bodyBaseClass = isTabata && tabataPhaseColor
    ? `rounded-[24px] shadow-brand-float border backdrop-blur p-4 ${tabataPhaseColor} border-transparent`
    : 'rounded-[24px] shadow-brand-float border border-border-app bg-panel p-4'

  return (
    <div className={bodyBaseClass}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <p
          className={`text-[10px] font-black uppercase tracking-widest ${
            isTabata ? 'text-white/90' : 'text-brand-tint'
          }`}
        >
          {headerLabel}
        </p>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Quitter sans valider"
          className={`w-8 h-8 rounded-xl flex items-center justify-center rf-focus-ring transition-colors ${
            isTabata
              ? 'bg-white/20 text-white hover:bg-white/30'
              : 'text-fg-muted hover:bg-layer-10'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Chrono + état */}
      <div className="mt-2 flex items-baseline gap-3">
        <p className={`font-black tabular-nums leading-none text-5xl ${isTabata ? 'text-white' : 'text-fg'}`}>
          {fmt(primarySec)}
        </p>
        {isAmrap && (
          <p className="text-xs font-bold text-fg-muted">
            {snapshot.amrapRounds ?? 0} tour{(snapshot.amrapRounds ?? 0) > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Barre de progression (hors For Time) */}
      {!isForTime && (
        <div className={`mt-3 h-1.5 rounded-full overflow-hidden ${isTabata ? 'bg-white/30' : 'bg-layer-10'}`}>
          <div
            className={`h-full rounded-full transition-[width] duration-200 ease-linear ${
              isTabata ? 'bg-white' : 'bg-brand'
            }`}
            style={{ width: `${progressPct * 100}%` }}
          />
        </div>
      )}

      {/* Exo courant / suivant (EMOM) */}
      {isEmom && emomExerciseLabels && (
        <div className="mt-3 space-y-1">
          <p className="text-[11px] font-bold text-fg-muted uppercase tracking-wider">En cours</p>
          <p className="text-sm font-black text-fg leading-tight">{emomExerciseLabels.current}</p>
          <p className="text-[11px] text-fg-muted">
            Ensuite : <span className="font-bold">{emomExerciseLabels.next}</span>
          </p>
        </div>
      )}

      {/* Contrôles */}
      <div className="mt-4 flex items-center gap-2">
        {isAmrap && (
          <button
            type="button"
            onClick={onIncrementRound}
            className="flex items-center gap-1.5 px-3 h-10 rounded-xl bg-brand text-on-brand text-xs font-black uppercase tracking-wide rf-focus-ring"
          >
            <Plus className="w-3.5 h-3.5" />
            Tour
          </button>
        )}
        {isForTime && (
          <button
            type="button"
            onClick={onFinishForTime}
            className="flex items-center gap-1.5 px-3 h-10 rounded-xl bg-ok-strong text-white text-xs font-black uppercase tracking-wide rf-focus-ring"
          >
            <Flag className="w-3.5 h-3.5" />
            Terminé
          </button>
        )}
        <button
          type="button"
          onClick={onPauseResume}
          aria-label={isPaused ? 'Reprendre' : 'Pause'}
          className={`w-10 h-10 rounded-xl border flex items-center justify-center rf-focus-ring transition-colors ${
            isTabata
              ? 'border-white/40 bg-white/20 text-white'
              : 'border-border-app bg-layer-5 text-fg-muted hover:text-brand-tint'
          }`}
        >
          {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
        </button>
        {(isEmom || isTabata) && (
          <button
            type="button"
            onClick={onSkip}
            aria-label="Passer l'intervalle"
            className={`w-10 h-10 rounded-xl border flex items-center justify-center rf-focus-ring transition-colors ${
              isTabata
                ? 'border-white/40 bg-white/20 text-white'
                : 'border-border-app bg-layer-5 text-fg-muted hover:text-brand-tint'
            }`}
          >
            <SkipForward className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onStop}
          aria-label="Stopper le bloc"
          className={`ml-auto w-10 h-10 rounded-xl border flex items-center justify-center rf-focus-ring transition-colors ${
            isTabata
              ? 'border-white/40 bg-white/20 text-white'
              : 'border-alert-bd bg-layer-5 text-alert hover:bg-alert-bg-muted'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
