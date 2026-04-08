import { SessionTypeMarker, type SessionPlanKind } from './SessionTypeMarker'

const ROWS: { kind: SessionPlanKind; label: string }[] = [
  { kind: 'personal', label: 'Perso' },
  { kind: 'club', label: 'Club' },
  { kind: 'match', label: 'Match' },
  { kind: 'recovery', label: 'Récup' },
]

export interface WeekPlanningLegendProps {
  className?: string
  id?: string
  'aria-label'?: string
}

/**
 * Légende compacte P/C/J/R : lettre + libellé court (pas seulement la couleur).
 */
export function WeekPlanningLegend({
  className = '',
  id,
  'aria-label': ariaLabel = 'Légende des types de séance',
}: WeekPlanningLegendProps) {
  return (
    <div role="region" aria-label={ariaLabel} id={id} className={className}>
      <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1.5 p-0">
        {ROWS.map(({ kind, label }) => (
          <li key={kind} className="flex min-w-0 max-w-full items-center gap-1.5">
            <SessionTypeMarker kind={kind} size="compact" data-testid={`legend-marker-${kind}`} />
            <span className="max-w-[7rem] truncate text-[0.65rem] font-semibold leading-none text-fg-secondary sm:max-w-none">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
