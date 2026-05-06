import { Icon } from '../../ui'

interface CompletedStat {
  value: string
  label: string
}

interface HeroCompletedProps {
  /** Texte italic Playfair (ex: "Bien joué.\nRécup propre maintenant."). */
  quote: string
  /** Numéro affiché en ghost arrière-plan italic 200px (ex: nombre de blocs). */
  ghostNumber?: string
  /** 3 stats max alignées en grid (Blocs / Durée / Sets validés). */
  stats?: readonly CompletedStat[]
}

/**
 * Hero "séance bouclée" — full-bleed bordeaux avec ghost number, eyebrow check
 * + citation Playfair italic + 3 stats inline. Remplace l'ancienne modale
 * `SessionCelebration` côté visuel (la modale RPE reste pour l'input métier).
 */
export function HeroCompleted({ quote, ghostNumber, stats }: HeroCompletedProps) {
  const lines = quote.split('\n')

  return (
    <div className="mx-[14px] mt-3.5">
      <div
        className="relative overflow-hidden rounded-[22px] bg-brand text-app px-[18px] py-5"
        style={{ boxShadow: '0 16px 36px rgba(123, 13, 30, 0.3)' }}
      >
        {ghostNumber && (
          <div
            aria-hidden
            className="pointer-events-none absolute -right-5 -top-9 select-none font-serif italic font-extrabold leading-none tabular-nums"
            style={{ fontSize: 200, letterSpacing: -10, color: 'rgb(245 242 238 / 0.15)' }}
          >
            {ghostNumber}
          </div>
        )}

        <div className="relative">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] opacity-85">
            <Icon name="check" size={10} strokeWidth={2.6} />
            Séance bouclée
          </div>
          <h2
            className="mt-2 font-serif italic font-extrabold leading-[1.05] [text-wrap:balance]"
            style={{ fontSize: 28, letterSpacing: '-0.8px' }}
          >
            {lines.map((line, i) => (
              <span key={i}>
                {line}
                {i < lines.length - 1 && <br />}
              </span>
            ))}
          </h2>
          {stats && stats.length > 0 && (
            <div className="mt-4 flex gap-0 border-t border-app/25 pt-3.5">
              {stats.map((s, i) => (
                <div key={i} className="min-w-0 flex-1">
                  <div
                    className="text-[18px] font-extrabold tabular-nums"
                    style={{ letterSpacing: '-0.5px' }}
                  >
                    {s.value}
                  </div>
                  <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] opacity-60">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
