import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Info } from 'lucide-react'
import type { WeekExplanation } from '../../types/scheduling'

interface PlanningContextCardProps {
  explanation: WeekExplanation
  /** Optional cycle/week label for the card header. */
  weekLabel?: string
  /** Companion conditioning recommendations (from mother session resolution). */
  companionRecommendations?: string[]
  /** Merged planning/resolution warnings (filtered for user display). */
  warnings?: string[]
  /** When true, correction lines are hidden (e.g. on WeekPage where they are action logs, not explanations). */
  hideCorrections?: boolean
}

export function PlanningContextCard({
  explanation,
  weekLabel,
  companionRecommendations,
  warnings,
  hideCorrections = false,
}: PlanningContextCardProps) {
  const [open, setOpen] = useState(false)
  const visibleCorrections = hideCorrections ? [] : explanation.corrections
  const hasDetails = explanation.detailLines.length > 0 || visibleCorrections.length > 0

  return (
    <div
      className="rounded-2xl border border-border-app bg-layer-5 p-4 space-y-3"
      data-testid="planning-context-card"
    >
      {/* Summary — always visible */}
      <div className="flex items-center gap-3">
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
            onClick={() => setOpen(!open)}
            className="flex-shrink-0 text-[10px] font-bold text-fg-faint hover:text-fg-soft flex items-center gap-0.5 transition-colors rf-focus-ring rounded-lg px-1"
            data-testid="planning-context-toggle"
          >
            {open ? 'Fermer' : 'Pourquoi ?'}
            {open
              ? <ChevronUp className="w-3 h-3" />
              : <ChevronDown className="w-3 h-3" />
            }
          </button>
        )}
      </div>

      {/* Detail — revealed on toggle */}
      {open && hasDetails && (
        <div className="pl-8 space-y-1.5 pt-1" data-testid="planning-context-details">
          {explanation.detailLines.map((line, i) => (
            <p key={i} className="text-[11px] text-fg-soft leading-relaxed">
              {line}
            </p>
          ))}
          {visibleCorrections.length > 0 && (
            <div className="pt-1 space-y-1">
              {visibleCorrections.map((c, i) => (
                <p key={i} className="text-[11px] text-brand-muted leading-relaxed">
                  {c}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Companion recommendations */}
      {companionRecommendations && companionRecommendations.length > 0 && (
        <div className="rounded-2xl border border-brand-border-strong bg-brand-soft px-3 py-2.5">
          <p className="text-[10px] font-black uppercase tracking-wide text-brand mb-1.5">
            Conditionnement compagnon
          </p>
          <ul className="space-y-1 text-xs text-fg-emphasis">
            {companionRecommendations.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="rounded-2xl border border-warn-bd bg-warn-bg-muted px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-warn mb-1.5">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            Avertissements
          </p>
          <ul className="space-y-1.5 text-xs text-warn-body">
            {warnings.map((w) => (
              <li key={w} className="leading-snug">{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
