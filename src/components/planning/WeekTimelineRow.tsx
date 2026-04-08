import type { ReactNode } from 'react'
import { SessionTypeMarker, type SessionPlanKind } from './SessionTypeMarker'

export interface WeekTimelineRowProps {
  planKind: SessionPlanKind
  children: ReactNode
  statusSlot?: ReactNode
  /**
   * `standalone` — léger cadre + fond selon le type (ligne seule).
   * `embedded` — marqueur + flux uniquement (carte parente déjà stylée).
   */
  layout?: 'standalone' | 'embedded'
  className?: string
  'data-testid'?: string
}

/** Fonds / bordures pour une ligne autonome — pas de sous-composant par type. */
const STANDALONE_SURFACE: Record<SessionPlanKind, string> = {
  personal: 'border border-border-app bg-layer-7',
  club: 'border border-bd-soft bg-layer-5',
  match: 'border border-[var(--color-warn-border)] bg-[var(--color-warn-surface-muted)]',
  recovery: 'border border-[var(--color-info-border)] bg-[var(--color-info-surface)]',
}

/**
 * Ligne timeline semaine : `SessionTypeMarker` + contenu + slot (ex. `SessionStatusIndicator`).
 */
export function WeekTimelineRow({
  planKind,
  children,
  statusSlot,
  layout = 'standalone',
  className = '',
  'data-testid': dataTestId = 'week-timeline-row',
}: WeekTimelineRowProps) {
  const frame =
    layout === 'embedded'
      ? ''
      : `rounded-xl px-2.5 py-2 ${STANDALONE_SURFACE[planKind]}`

  return (
    <div
      data-testid={dataTestId}
      data-week-row-kind={planKind}
      data-week-row-layout={layout}
      className={`flex min-w-0 items-center gap-2 ${frame} ${className}`.trim()}
    >
      <SessionTypeMarker kind={planKind} data-testid={`${dataTestId}-marker`} />
      <div className="flex min-w-0 flex-1 items-center">{children}</div>
      {statusSlot != null ? (
        <div className="flex shrink-0 flex-col items-end gap-1">{statusSlot}</div>
      ) : null}
    </div>
  )
}
