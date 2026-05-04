import type { ReactNode } from 'react'
import type { SessionPlanKind } from './SessionTypeMarker'

export interface WeekTimelineRowProps {
  planKind: SessionPlanKind
  children: ReactNode
  statusSlot?: ReactNode
  /**
   * `standalone` — cadre + fond colorés selon le type (la ligne porte
   *   elle-même le code couleur du planning).
   * `embedded` — pas de cadre — la carte parente est déjà colorée
   *   (cas des SessionRow dans CalendarWeekTimeline).
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
 * Ligne timeline semaine — fond/bordure coloré (standalone) + contenu +
 * slot statut optionnel (`SessionStatusIndicator`).
 *
 * L'ancien `SessionTypeMarker` (pastille colorée) a été retiré : la
 * couleur du fond/bordure de la row porte déjà le code couleur du type
 * de séance, le marker dupliquait juste l'info en prenant 16px de
 * largeur — du bruit visuel sur les écrans denses.
 *
 * `data-week-row-kind` reste exposé sur la racine pour les tests + la
 * sémantique structurée.
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
      <div className="flex min-w-0 flex-1 items-center">{children}</div>
      {statusSlot != null ? (
        <div className="flex shrink-0 flex-col items-end gap-1">{statusSlot}</div>
      ) : null}
    </div>
  )
}
