/**
 * P = perso, C = club, J = match, R = récup — sémantique figée spec UX.
 */
export type SessionPlanKind = 'personal' | 'club' | 'match' | 'recovery'

const LETTER: Record<SessionPlanKind, 'P' | 'C' | 'J' | 'R'> = {
  personal: 'P',
  club: 'C',
  match: 'J',
  recovery: 'R',
}

const ARIA_LABEL: Record<SessionPlanKind, string> = {
  personal: 'Séance personnelle',
  club: 'Entraînement club',
  match: 'Jour de match',
  recovery: 'Récupération',
}

/** Couleurs via les tokens d'événement — source unique de vérité dans theme-tokens.css. */
const SURFACE: Record<SessionPlanKind, { fg: string; bg: string; bd: string }> = {
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

export interface SessionTypeMarkerProps {
  kind: SessionPlanKind
  /** `compact` pour légende ou lignes denses. */
  size?: 'default' | 'compact'
  className?: string
  'data-testid'?: string
}

export function SessionTypeMarker({
  kind,
  size = 'default',
  className = '',
  'data-testid': dataTestId = 'session-type-marker',
}: SessionTypeMarkerProps) {
  const { fg, bg, bd } = SURFACE[kind]
  const dim = size === 'compact' ? 'h-4 w-4 text-[0.5rem]' : 'h-5 w-5 text-[0.55rem]'
  const letter = LETTER[kind]

  return (
    <span
      role="img"
      aria-label={ARIA_LABEL[kind]}
      data-testid={dataTestId}
      data-session-kind={kind}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border font-extrabold leading-none tracking-tight ${dim} ${className}`}
      style={{ color: fg, backgroundColor: bg, borderColor: bd }}
    >
      <span aria-hidden className="leading-none">
        {letter}
      </span>
    </span>
  )
}
