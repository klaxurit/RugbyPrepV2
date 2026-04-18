import { Link } from 'react-router-dom'
import { Lock, ChevronRight } from 'lucide-react'

/**
 * Teaser du Score de forme, visible pour les utilisateurs free.
 * Composant stateless : l'hôte décide de l'afficher ou non selon le statut premium.
 *
 * - Chiffre remplacé par ● ● (masqué) pour suggérer qu'une valeur existe.
 * - Jauge partiellement révélée (~40 %) pour visualiser l'idée d'une métrique
 *   sans dévoiler la réelle.
 * - CTA outlined bordeaux, pleine largeur, ≥44 px.
 *
 * Accessibilité :
 *   - La card porte un `aria-label` explicite "Score de forme — Premium requis".
 *   - Le cadenas est `aria-hidden` (texte Premium présent ailleurs).
 *   - La jauge a `role="progressbar"` + `aria-valuetext` explicite.
 */
export function ScoreDeFormeTeaser({ ctaHref = '/profile#premium' }: { ctaHref?: string }) {
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

      {/* Ligne chiffre masqué — deux puces typographiques à la place du score. */}
      <div className="mt-3 flex items-baseline gap-2">
        <span
          aria-hidden="true"
          className="text-3xl font-black text-brand-tint tracking-tight leading-none select-none"
        >
          ●&nbsp;●
        </span>
        <span className="text-xl font-black text-fg-muted leading-none">/ 10</span>
        <span className="text-xs text-fg-muted ml-2">aujourd'hui</span>
      </div>

      {/* Jauge révélée à ~40 % : suggère une valeur sans la dévoiler. */}
      <div
        role="progressbar"
        aria-valuetext="Valeur masquée, réservée aux abonnés Premium"
        aria-valuemin={0}
        aria-valuemax={10}
        className="mt-4 h-2 rounded-full bg-layer-10 overflow-hidden"
      >
        <div className="h-full w-[40%] bg-brand rounded-full" />
      </div>

      <p className="mt-3 text-sm text-fg-soft leading-relaxed">
        Basé sur ta charge, ton sommeil et tes RPE des 7 derniers jours.
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
