import { Link } from 'react-router-dom'
import { Lock, ChevronRight } from 'lucide-react'
import { ScoreDeFormeGauge } from './ScoreDeFormeGauge'

/**
 * Teaser du Score de forme (free) — card compacte, tout flouté sauf le CTA.
 * Même composant visuel que la `ScoreDeFormeCard` premium, seule la clarté diffère.
 */
export function ScoreDeFormeTeaser({ ctaHref = '/profile#premium' }: { ctaHref?: string }) {
  return (
    <section
      data-testid="home-score-teaser"
      aria-label="Score de forme — Premium requis"
      className="rounded-[24px] border border-brand-border bg-brand-soft/40 p-4 space-y-3"
    >
      {/* Tout le contenu est flouté — seul le CTA reste net. */}
      <div style={{ filter: 'blur(5px)' }} aria-hidden="true" className="pointer-events-none">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-brand-tint">
            Ton score de forme
          </p>
          <Lock className="w-4 h-4 text-brand-tint" />
        </div>

        <div className="mt-2">
          <ScoreDeFormeGauge score={72} color="green" size="sm" />
        </div>

        <p className="mt-1 text-center text-[11px] font-bold text-fg-muted">Bonne forme</p>
      </div>

      <Link
        to={ctaHref}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-brand text-brand-tint hover:bg-brand-soft transition-colors rf-focus-ring min-h-[44px]"
      >
        <span className="text-sm font-black tracking-wide">Débloquer mon score</span>
        <ChevronRight className="w-4 h-4" />
      </Link>
    </section>
  )
}
