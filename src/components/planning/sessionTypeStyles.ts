import type { SessionPlanKind } from './SessionTypeMarker'

/** Couleurs partagées entre la timeline (cellules) et la légende (pills). */
export const SESSION_TYPE_SURFACE: Record<SessionPlanKind, { fg: string; bg: string; bd: string }> = {
  personal: {
    fg: 'var(--color-event-personal-fg)',
    bg: 'var(--color-event-personal-bg)',
    bd: 'var(--color-event-personal-border)',
  },
  club: {
    fg: 'var(--color-event-club-fg)',
    bg: 'var(--color-event-club-bg)',
    bd: 'var(--color-event-club-border)',
  },
  match: {
    fg: 'var(--color-event-match-fg)',
    bg: 'var(--color-event-match-bg)',
    bd: 'var(--color-event-match-border)',
  },
  recovery: {
    fg: 'var(--color-event-recovery-fg)',
    bg: 'var(--color-event-recovery-bg)',
    bd: 'var(--color-event-recovery-border)',
  },
}

export const SESSION_TYPE_ARIA_LABEL: Record<SessionPlanKind, string> = {
  personal: 'Séance en salle',
  club: 'Entraînement club',
  match: 'Jour de match',
  recovery: 'Récupération',
}
