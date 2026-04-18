import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SessionRunProgressProps {
  /** Nombre total de TOURS à valider sur l'ensemble de la séance. */
  totalTours: number
  /** Nombre de tours entièrement validés. */
  completedTours: number
  /** Timestamp de démarrage (ms). */
  startedAt: number
  /** Index du bloc actif (1-based) dans la séance (ex. 1 si c'est le 1er bloc). */
  activeBlockIndex: number
  /** Nombre total de blocs affichés. */
  totalBlocks: number
  /** Nom du bloc actif. */
  activeBlockName: string
  /** Tour actif (1-based) dans le bloc actif. null si le bloc est terminé. */
  activeTourIndex: number | null
  /** Nombre total de tours dans le bloc actif. */
  activeBlockTourCount: number
  onQuit: () => void
}

/**
 * Sticky header affiché en mode "En cours" — progression globale (tours), timer,
 * localisation (bloc actif + tour actif), bouton quit.
 */
export function SessionRunProgress({
  totalTours,
  completedTours,
  startedAt,
  activeBlockIndex,
  totalBlocks,
  activeBlockName,
  activeTourIndex,
  activeBlockTourCount,
  onQuit,
}: SessionRunProgressProps) {
  const [elapsedMin, setElapsedMin] = useState(() => Math.floor((Date.now() - startedAt) / 60000))

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsedMin(Math.floor((Date.now() - startedAt) / 60000))
    }, 15_000)
    return () => window.clearInterval(id)
  }, [startedAt])

  const pct = totalTours === 0 ? 0 : Math.min(1, completedTours / totalTours)

  const subLabel = activeTourIndex != null
    ? `Bloc ${activeBlockIndex}/${totalBlocks} · ${activeBlockName} · Tour ${activeTourIndex}/${activeBlockTourCount}`
    : `Bloc ${activeBlockIndex}/${totalBlocks} · ${activeBlockName}`

  return (
    <div
      className="sticky top-[72px] z-30 bg-app/95 backdrop-blur border-b border-border-app"
      role="status"
      aria-label={`Séance en cours — ${completedTours} sur ${totalTours} tours, ${elapsedMin} minutes`}
    >
      <div className="px-5 py-3 max-w-md mx-auto flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-brand-tint">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-brand opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
            </span>
            En cours
            <span className="text-fg-muted font-bold">· {elapsedMin} min</span>
          </div>
          <div className="mt-1.5 h-1.5 bg-layer-10 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand rounded-full transition-all duration-300"
              style={{ width: `${pct * 100}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] font-bold text-fg-muted truncate">{subLabel}</p>
        </div>
        <button
          type="button"
          onClick={onQuit}
          className="w-11 h-11 rounded-2xl border border-border-app flex items-center justify-center text-fg-muted hover:text-alert hover:border-alert-bd transition-colors rf-focus-ring flex-shrink-0"
          aria-label="Quitter la séance en cours"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
