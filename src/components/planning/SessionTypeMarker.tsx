/**
 * G = gym (perso), C = club, M = match, R = récup — sémantique figée spec UX.
 */
export type SessionPlanKind = 'personal' | 'club' | 'match' | 'recovery'

const LETTER: Record<SessionPlanKind, 'G' | 'C' | 'M' | 'R'> = {
  personal: 'G',
  club: 'C',
  match: 'M',
  recovery: 'R',
}

import { SESSION_TYPE_ARIA_LABEL, SESSION_TYPE_SURFACE } from './sessionTypeStyles'

export interface SessionTypeMarkerProps {
  kind: SessionPlanKind
  /** `compact` pour légende ou lignes denses. */
  size?: 'default' | 'compact'
  /**
   * Affiche la lettre G/C/M/R au centre du pastille. Défaut `true`.
   * Mis à `false` dans la timeline semaine où la couleur seule suffit
   * (et la lettre ajoutait du bruit visuel sur des cellules denses).
   */
  showLetter?: boolean
  className?: string
  'data-testid'?: string
}

export function SessionTypeMarker({
  kind,
  size = 'default',
  showLetter = true,
  className = '',
  'data-testid': dataTestId = 'session-type-marker',
}: SessionTypeMarkerProps) {
  const { fg, bg, bd } = SESSION_TYPE_SURFACE[kind]
  const dim = size === 'compact' ? 'h-4 w-4 text-[0.5rem]' : 'h-5 w-5 text-[0.55rem]'
  const letter = LETTER[kind]

  return (
    <span
      role="img"
      aria-label={SESSION_TYPE_ARIA_LABEL[kind]}
      data-testid={dataTestId}
      data-session-kind={kind}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border font-extrabold leading-none tracking-tight ${dim} ${className}`}
      style={{ color: fg, backgroundColor: bg, borderColor: bd }}
    >
      {showLetter && (
        <span aria-hidden className="leading-none">
          {letter}
        </span>
      )}
    </span>
  )
}
