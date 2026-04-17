import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface SessionRunProgressProps {
  /** Nombre total d'exercices cochables dans la séance. */
  totalExercises: number
  /** Nombre d'exercices déjà cochés. */
  completedExercises: number
  /** Timestamp de démarrage (ms). */
  startedAt: number
  onQuit: () => void
}

/**
 * Sticky header affiché en mode "En cours" — progression + timer + quit.
 * Remplace l'aperçu calme par une barre d'action qui donne le rythme.
 */
export function SessionRunProgress({
  totalExercises,
  completedExercises,
  startedAt,
  onQuit,
}: SessionRunProgressProps) {
  const [elapsedMin, setElapsedMin] = useState(() => Math.floor((Date.now() - startedAt) / 60000))

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsedMin(Math.floor((Date.now() - startedAt) / 60000))
    }, 15_000)
    return () => window.clearInterval(id)
  }, [startedAt])

  const pct = totalExercises === 0 ? 0 : Math.min(1, completedExercises / totalExercises)

  return (
    <div
      className="sticky top-[72px] z-30 bg-app/95 backdrop-blur border-b border-border-app"
      role="status"
      aria-label={`Séance en cours — ${completedExercises} sur ${totalExercises} exercices, ${elapsedMin} minutes`}
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
          <p className="mt-1 text-[11px] font-bold text-fg-muted">
            {completedExercises} / {totalExercises} exercices
          </p>
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
