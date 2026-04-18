import { Link } from 'react-router-dom'
import { Lock, ChevronRight } from 'lucide-react'

/**
 * Teaser du Score de forme, visible pour les utilisateurs free.
 * Composant stateless — l'hôte décide de l'afficher ou non selon le statut Premium.
 *
 * Visualisation : mini line chart SVG flouté (pattern paywall canonique :
 * Whoop / Strava / Oura / Garmin). 7 points représentant les 7 derniers jours
 * avec aire sous la courbe + dot "aujourd'hui", le tout flouté. L'échelle Y
 * (`10 / 5 / 0`) et le label `Aujourd'hui` restent nets pour préserver le
 * contexte.
 *
 * Accessibilité :
 *   - `aria-label` explicite sur la card.
 *   - Cadenas `aria-hidden` (le mot "Premium" est dans le texte CTA).
 *   - SVG `role="img"` + `aria-label` descriptif.
 */
export function ScoreDeFormeTeaser({ ctaHref = '/profile#premium' }: { ctaHref?: string }) {
  // Valeurs d'illustration — 7 points avec légère tendance haussière pour donner
  // une forme crédible. La data réelle ne sera affichée qu'en mode Premium
  // (itération future).
  const values = [6, 7, 5, 6, 8, 7, 8]
  const W = 200
  const H = 80
  const yFor = (v: number) => H - (v / 10) * H

  // Liste de points (x, y) régulièrement espacés sur la largeur.
  const points = values.map((v, i) => {
    const x = (i * W) / (values.length - 1)
    return { x, y: yFor(v) }
  })

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')
  // Aire sous la courbe : on ferme le path en descendant au coin inférieur droit
  // puis gauche avant de remonter au point de départ.
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`
  const lastPoint = points[points.length - 1]

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

      {/* Chart flouté + échelle Y nette à droite. */}
      <div className="mt-4 flex items-stretch gap-2">
        {/* Zone chart : overflow-hidden pour contenir le flou, rounded-xl pour le cadre.
            Le SVG occupe toute la hauteur (~80 px) et s'étire en largeur. */}
        <div className="relative flex-1 h-20 rounded-xl bg-layer-5 overflow-hidden">
          <svg
            role="img"
            aria-label="Aperçu du score de forme — valeurs masquées, débloquez avec Premium"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            {/* Groupe flouté : contient l'aire + la ligne + le dot final.
                Le filter blur s'applique uniquement ici, pas sur le reste. */}
            <g style={{ filter: 'blur(6px)' }}>
              <path d={areaPath} fill="rgba(139, 28, 43, 0.12)" />
              <path
                d={linePath}
                fill="none"
                stroke="#8B1C2B"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={lastPoint.x} cy={lastPoint.y} r="4" fill="#8B1C2B" />
            </g>
          </svg>
        </div>
        {/* Échelle Y — 3 graduations, non floutées, lisibles. */}
        <div className="flex flex-col justify-between text-[10px] font-bold text-fg-faint tabular-nums py-0.5">
          <span>10</span>
          <span>5</span>
          <span>0</span>
        </div>
      </div>

      {/* Ligne meta sous le chart : contexte temporel à gauche, ancre "Aujourd'hui" à droite. */}
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-fg-muted">
        <span>7 derniers jours</span>
        <span>Aujourd'hui</span>
      </div>

      <p className="mt-4 text-sm text-fg-soft leading-relaxed">
        Basé sur ta charge et tes RPE post-séance des 7 derniers jours.
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
