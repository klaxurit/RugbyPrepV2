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

/** Fonds / bordures colorés par type — vert perso, violet club, jaune match, bleu récup. */
const STANDALONE_SURFACE: Record<SessionPlanKind, string> = {
  personal: 'border border-ok-bd bg-ok-bg',
  club: 'border border-violet-200 bg-violet-50',
  match: 'border border-warn-bd bg-warn-bg',
  recovery: 'border border-info-bd bg-info-bg',
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
      <SessionTypeMarker
        kind={planKind}
        showLetter={false}
        data-testid={`${dataTestId}-marker`}
      />
      <div className="flex min-w-0 flex-1 items-center">{children}</div>
      {statusSlot != null ? (
        <div className="flex shrink-0 flex-col items-end gap-1">{statusSlot}</div>
      ) : null}
    </div>
  )
}
