import type { ReactNode } from 'react'
import { Icon } from '../ui'

export type SessionHeaderPhase = 'idle' | 'running' | 'completed'

interface SessionHeaderProps {
  phase: SessionHeaderPhase
  onBack?: () => void
  /** Slot droit (avatar / initiales / etc.). Optionnel. */
  rightSlot?: ReactNode
  /** Contenu sous la barre top : titre éditorial (idle/completed) ou progress bar (running). */
  children?: ReactNode
}

/**
 * Header conditionnel de la page Séance.
 * - `idle` / `completed` : fond cream + chevron-back outlined cream
 * - `running` : fond bordeaux + chevron-back outlined sur fond bordeaux
 *
 * Le contenu sous la top row (titre, progress bar) est passé en `children` pour
 * laisser la page composer librement selon l'état.
 */
export function SessionHeader({ phase, onBack, rightSlot, children }: SessionHeaderProps) {
  const isWine = phase === 'running'
  const containerClass = isWine ? 'bg-brand text-app' : 'bg-app text-fg'
  const buttonBorder = isWine ? 'border-app/30' : 'border-paper-deep'
  const iconColor = isWine ? 'var(--color-bg-app)' : 'var(--color-text-primary)'

  return (
    <header
      className={`${containerClass} pt-[max(2.5rem,env(safe-area-inset-top))] px-[18px] pb-3.5 relative`}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          className={`flex h-9 w-9 items-center justify-center rounded-full border bg-transparent rf-focus-ring transition-colors hover:bg-current/10 ${buttonBorder}`}
        >
          <Icon name="chevron-left" size={16} color={iconColor} />
        </button>
        <div className="text-[11px] font-extrabold uppercase tracking-[0.14em]">
          Rugby<span className="opacity-70">Forge</span>
        </div>
        <div className="flex h-9 w-9 items-center justify-center">
          {rightSlot ?? <span className="block h-9 w-9" aria-hidden />}
        </div>
      </div>

      {children && <div className="mt-5">{children}</div>}
    </header>
  )
}

interface ProgressBarProps {
  /** Index du bloc courant (0-based). */
  currentBlockIdx: number
  totalBlocks: number
  /** Libellé italique sous la barre (ex: "Triplet Force Lower · Tour 2/3"). */
  label?: string
  /** Temps écoulé formaté (ex: "12 MIN"). */
  elapsedLabel?: string
}

/**
 * Barre de progression "En cours · X MIN" + bar 3px + libellé italic dessous.
 * À placer dans `children` du SessionHeader en phase running.
 */
export function SessionRunProgressBar({
  currentBlockIdx,
  totalBlocks,
  label,
  elapsedLabel,
}: ProgressBarProps) {
  const safeTotal = Math.max(1, totalBlocks)
  const widthPct = Math.min(100, Math.round(((currentBlockIdx + 0.5) / safeTotal) * 100))

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[9px] font-extrabold uppercase tracking-[0.14em]">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-app animate-rf-pulse" aria-hidden />
          <span>En cours</span>
          {elapsedLabel && (
            <>
              <span className="h-[3px] w-[3px] rounded-full bg-app/50" aria-hidden />
              <span className="opacity-85 tabular-nums">{elapsedLabel}</span>
            </>
          )}
        </div>
        <div className="opacity-70">
          Bloc {String(currentBlockIdx + 1).padStart(2, '0')}/{String(totalBlocks).padStart(2, '0')}
        </div>
      </div>
      <div className="h-[3px] overflow-hidden rounded bg-app/25">
        <div
          className="h-full bg-app transition-[width] duration-500"
          style={{ width: `${widthPct}%` }}
        />
      </div>
      {label && (
        <p className="mt-2 text-[10px] font-semibold italic tracking-wide opacity-85">{label}</p>
      )}
    </div>
  )
}
