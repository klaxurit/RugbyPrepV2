import type { Lang } from '../../i18n/appLabels'
import { tr } from '../../i18n/appLabels'
import type { ClubContactProxy } from '../../types/annualPlanning'
import { CLUB_CONTACT_PROXIES } from '../../services/scheduling/clubContactProxy'

interface ClubContactProxyControlProps {
  value: ClubContactProxy
  lang: Lang
  onChange: (next: ClubContactProxy) => void
}

const OPTION_KEYS = {
  light: 'week_club_contact_light',
  normal: 'week_club_contact_normal',
  hard: 'week_club_contact_hard',
} as const

/**
 * Déclaration hebdo de charge club — léger / normal / dur.
 * Pas de minutes, pas de GPS.
 */
export function ClubContactProxyControl({ value, lang, onChange }: ClubContactProxyControlProps) {
  return (
    <div className="space-y-2" data-testid="club-contact-proxy">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-fg-muted">
          {tr('week_club_contact_label', lang)}
        </p>
        <p className="text-[10px] text-fg-muted text-right leading-snug">
          {tr('week_club_contact_hint', lang)}
        </p>
      </div>
      <div
        role="radiogroup"
        aria-label={tr('week_club_contact_label', lang)}
        className="grid grid-cols-3 gap-[3px] rounded-[10px] bg-paper-deep p-[3px]"
      >
        {CLUB_CONTACT_PROXIES.map((level) => {
          const isActive = value === level
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={isActive}
              data-testid={`club-contact-${level}`}
              onClick={() => onChange(level)}
              className={`rounded-[8px] py-1.5 text-[12px] font-bold tracking-[0.02em] transition-colors rf-focus-ring ${
                isActive ? 'bg-brand text-app' : 'bg-transparent text-fg'
              }`}
            >
              {tr(OPTION_KEYS[level], lang)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
