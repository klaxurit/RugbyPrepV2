import { Pill } from '../../ui'

interface HeroIdleProps {
  /** Eyebrow bordeaux UPPERCASE (ex: "SÉANCE DU JOUR · VEN. 8 MAI"). */
  eyebrow: string
  title: string
  /** Tags meta (ex: ["En saison", "42-52 min", "Avancé"]) — outline bordeaux. */
  tags?: readonly string[]
}

/**
 * Hero éditorial visible en phase `idle` (preview avant démarrage).
 * Un filet bordeaux + eyebrow + titre Playfair italic 38px + tags pill outline.
 */
export function HeroIdle({ eyebrow, title, tags }: HeroIdleProps) {
  return (
    <div className="px-[18px]">
      <div className="flex items-center gap-2">
        <span aria-hidden className="block h-[1.5px] w-6 bg-brand" />
        <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-brand">
          {eyebrow}
        </span>
      </div>
      <h1
        className="mt-2.5 font-serif italic font-extrabold leading-[0.95] text-fg [text-wrap:balance]"
        style={{ fontSize: 38, letterSpacing: '-1.4px' }}
      >
        {title}.
      </h1>
      {tags && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t, i) => (
            <Pill key={i} tone="wine" size="sm">
              {t}
            </Pill>
          ))}
        </div>
      )}
    </div>
  )
}
