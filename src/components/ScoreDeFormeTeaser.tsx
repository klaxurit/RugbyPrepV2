import { Link } from 'react-router-dom'
import { Lock, ChevronRight } from 'lucide-react'
import { ScoreDeFormeChart } from './ScoreDeFormeChart'

/**
 * Teaser du Score de forme — free uniquement. Mini line chart flouté sur 7
 * derniers jours (pattern paywall Whoop/Strava/Oura/Garmin), échelle Y nette
 * à droite, CTA Premium.
 *
 * Le chart SVG est extrait dans `ScoreDeFormeChart` et partagé avec la card
 * Premium `ScoreDeFormeCard` — même rendu visuel, seul le flou change.
 */
export function ScoreDeFormeTeaser({ ctaHref = '/profile#premium' }: { ctaHref?: string }) {
  // Valeurs d'illustration floues — la data réelle est dans ScoreDeFormeCard (premium).
  const values = [6, 7, 5, 6, 8, 7, 8]

  return (
    <section
      data-testid="home-score-teaser"
      aria-label="Score de forme — Premium requis"
      className="rounded-[24px] border border-brand-border bg-brand-soft/40 p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-black uppercase tracking-wider text-brand-tint">
          Ton score de forme
        </p>
        <Lock aria-hidden="true" className="w-4 h-4 text-brand-tint" />
      </div>

      <div className="mt-4 flex items-stretch gap-2">
        <ScoreDeFormeChart
          values={values}
          blurred
          ariaLabel="Aperçu du score de forme — valeurs masquées, débloquez avec Premium"
        />
        <div className="flex flex-col justify-between text-[10px] font-bold text-fg-faint tabular-nums py-0.5">
          <span>10</span>
          <span>5</span>
          <span>0</span>
        </div>
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[11px] text-fg-muted">
        <span>7 derniers jours</span>
        <span>Aujourd'hui</span>
      </div>

      <p className="mt-4 text-sm text-fg-soft leading-relaxed whitespace-nowrap truncate">
        Ta charge et tes RPE · 7 derniers jours
      </p>

      <Link
        to={ctaHref}
        className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-brand text-brand-tint hover:bg-brand-soft transition-colors rf-focus-ring min-h-[44px]"
      >
        <span className="text-sm font-black tracking-wide">Débloquer mon score</span>
        <ChevronRight className="w-4 h-4" />
      </Link>
    </section>
  )
}
