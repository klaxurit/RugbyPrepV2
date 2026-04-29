import { Info } from 'lucide-react'
import type { WeekExplanation } from '../../types/scheduling'
import { useOpenCompanion } from '../../contexts/CoachContext'

interface PlanningContextCardProps {
  explanation: WeekExplanation
  /** Optional cycle/week label for the card header. */
  weekLabel?: string
  /** Reserved for back-compat (no longer rendered here — détails sont dans la mascotte). */
  companionRecommendations?: string[]
  warnings?: string[]
  hideCorrections?: boolean
}

/**
 * Indicateur structurel de contexte hebdo — 1 ligne, non-dismissable.
 * Tous les détails (`detailLines`, `warnings`, `companionRecommendations`,
 * `corrections`) sont désormais affichés dans le `CoachCompanion` (mascotte
 * en bas à droite). Le bouton « Pourquoi ? » ouvre la mascotte directement.
 */
export function PlanningContextCard({
  explanation,
  weekLabel,
  hideCorrections = false,
}: PlanningContextCardProps) {
  const openCompanion = useOpenCompanion()
  const visibleCorrections = hideCorrections ? [] : explanation.corrections
  const hasDetails = explanation.detailLines.length > 0 || visibleCorrections.length > 0

  return (
    <div
      className="rounded-2xl border border-border-app bg-layer-5 px-4 py-3 flex items-center gap-3"
      data-testid="planning-context-card"
    >
      <div className="p-1.5 rounded-xl bg-layer-10 text-fg-muted flex-shrink-0">
        <Info className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        {weekLabel && (
          <p className="text-[10px] font-bold text-fg-faint uppercase tracking-wider mb-0.5">
            {weekLabel}
          </p>
        )}
        <p className="text-xs font-bold text-fg-emphasis leading-relaxed">
          {explanation.summaryLine}
        </p>
      </div>
      {hasDetails && (
        <button
          type="button"
          onClick={openCompanion}
          className="text-[10px] font-bold text-brand-tint hover:text-brand transition-colors rf-focus-ring rounded-lg px-2 py-1 flex-shrink-0"
          data-testid="planning-context-toggle"
          aria-label="Voir les détails du programme avec le coach"
        >
          Pourquoi ?
        </button>
      )}
    </div>
  )
}
