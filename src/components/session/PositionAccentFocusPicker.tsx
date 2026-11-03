import {
  alternatePositionAccentTheme,
  positionAccentThemeHint,
  positionAccentThemeLabel,
  resolvePositionAccentTheme,
  type PositionAccentFocus,
} from '../../services/equipment/positionAccentTheme'

type Props = {
  mesoWeek: 1 | 2 | 3 | 4
  focus: PositionAccentFocus
  onChange: (focus: PositionAccentFocus) => void
  lang: 'fr' | 'en'
}

/**
 * Micro-choix Focus du jour — thème de la semaine (A) vs complémentaire (B).
 * N’apparaît que si l’accent poste est éligible (parent).
 */
export function PositionAccentFocusPicker({ mesoWeek, focus, onChange, lang }: Props) {
  const primary = resolvePositionAccentTheme(mesoWeek)
  if (!primary) return null
  const secondary = alternatePositionAccentTheme(primary)
  const options: Array<{ id: PositionAccentFocus; theme: typeof primary }> = [
    { id: 'a', theme: primary },
    { id: 'b', theme: secondary },
  ]

  const title = lang === 'en' ? 'Today’s focus' : 'Focus du jour'
  const subtitle =
    lang === 'en'
      ? 'Optional finisher bias — main lifts stay the same.'
      : 'Biais optionnel du finisher — les blocs principaux ne changent pas.'

  return (
    <div
      className="mx-3 mb-3 rounded-2xl border border-paper-deep bg-paper/60 px-3 py-3"
      data-testid="position-accent-focus-picker"
    >
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-fg-muted">{title}</p>
      <p className="mt-1 text-[11px] text-fg-soft leading-snug">{subtitle}</p>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const selected = focus === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              aria-pressed={selected}
              className={
                selected
                  ? 'rounded-xl border border-brand/40 bg-brand/10 px-3 py-2 text-left'
                  : 'rounded-xl border border-paper-deep bg-paper px-3 py-2 text-left'
              }
            >
              <span className="block text-[13px] font-extrabold text-fg">
                {positionAccentThemeLabel(opt.theme, lang)}
              </span>
              <span className="mt-0.5 block text-[10px] text-fg-muted leading-snug">
                {positionAccentThemeHint(opt.theme, lang)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
