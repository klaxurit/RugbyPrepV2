import { SESSION_TYPE_ARIA_LABEL, SESSION_TYPE_SURFACE } from './sessionTypeStyles'
import type { SessionPlanKind } from './SessionTypeMarker'

const ROWS: { kind: SessionPlanKind; label: string }[] = [
  { kind: 'personal', label: 'Gym' },
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
 * Légende compacte du planning : un pill coloré par type de séance,
 * avec le libellé directement à l'intérieur (Gym / Club / Match / Récup).
 *
 * Plus dense que l'ancienne version "marqueur lettre + libellé séparé"
 * — un seul atome par entrée, et la couleur du pill matche celle de la
 * cellule correspondante dans la timeline pour que la correspondance
 * couleur-type soit immédiate.
 */
export function WeekPlanningLegend({
  className = '',
  id,
  'aria-label': ariaLabel = 'Légende des types de séance',
}: WeekPlanningLegendProps) {
  return (
    <div role="region" aria-label={ariaLabel} id={id} className={className}>
      <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
        {ROWS.map(({ kind, label }) => {
          const { fg, bg, bd } = SESSION_TYPE_SURFACE[kind]
          return (
            <li key={kind} className="flex min-w-0 items-center">
              <span
                role="img"
                aria-label={SESSION_TYPE_ARIA_LABEL[kind]}
                data-testid={`legend-marker-${kind}`}
                data-session-kind={kind}
                className="inline-flex items-center rounded-full border px-2.5 py-1 text-[0.65rem] font-extrabold leading-none tracking-tight"
                style={{ color: fg, backgroundColor: bg, borderColor: bd }}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
