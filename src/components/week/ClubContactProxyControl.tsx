import type { Lang } from '../../i18n/appLabels'
import { tr } from '../../i18n/appLabels'
import type { ClubContactProxy } from '../../types/annualPlanning'

interface ClubContactProxyControlProps {
  value: ClubContactProxy
  lang: Lang
  onChange: (next: ClubContactProxy) => void
}

const OPTIONS = [
  { level: 'normal' as const, testId: 'club-contact-normal', labelKey: 'week_club_contact_full' },
  { level: 'hard' as const, testId: 'club-contact-hard', labelKey: 'week_club_contact_short' },
] as const

/**
 * Déclaration hebdo de contact club — 2 actions visibles.
 * Complet = normal (light historique inclus). Plus courte = hard (light + max 3 blocs).
 */
export function ClubContactProxyControl({ value, lang, onChange }: ClubContactProxyControlProps) {
  const cutsGym = value === 'hard'
  const selected = cutsGym ? 'hard' : 'normal'

  return (
    <div
      className="relative z-10 space-y-2.5 rounded-[14px] border border-edge-hairline bg-layer-2 px-3.5 py-3"
      data-testid="club-contact-proxy"
    >
      <div className="space-y-1">
        <p className="text-[13px] font-extrabold leading-snug tracking-[-0.02em] text-fg">
          {tr('week_club_contact_label', lang)}
        </p>
        <p className="text-[11px] leading-snug text-fg-muted">
          {tr('week_club_contact_hint', lang)}
        </p>
      </div>
      <div
        role="radiogroup"
        aria-label={tr('week_club_contact_label', lang)}
        className="grid grid-cols-2 gap-[3px] rounded-[10px] bg-paper-deep p-[3px]"
      >
        {OPTIONS.map((option) => {
          const isActive = selected === option.level
          return (
            <button
              key={option.level}
              type="button"
              role="radio"
              aria-checked={isActive}
              data-testid={option.testId}
              onClick={() => onChange(option.level)}
              className={`min-h-[44px] rounded-[8px] px-2 py-2 text-[12px] font-bold leading-snug tracking-[0.01em] transition-colors rf-focus-ring ${
                isActive ? 'bg-brand text-app' : 'bg-transparent text-fg'
              }`}
            >
              {tr(option.labelKey, lang)}
            </button>
          )
        })}
      </div>
      <p
        className={`text-[11px] leading-snug ${cutsGym ? 'font-semibold text-fg' : 'text-fg-muted'}`}
        data-testid="club-contact-result"
      >
        {tr(cutsGym ? 'week_club_contact_result_cut' : 'week_club_contact_result_full', lang)}
      </p>
    </div>
  )
}
