import { Link } from 'react-router-dom'
import { Icon } from './ui'
import { useProfile } from '../hooks/useProfile'
import { tr, type Lang } from '../i18n/appLabels'

interface ScoreDeFormeTeaserProps {
  ctaHref?: string
  /**
   * Score "tease" affiché flouté pour donner envie. Pas la vraie data.
   * Default 74 pour rester en zone "bonne forme" perçue.
   */
  teaseScore?: number
}

/**
 * Teaser du Score de forme — carte sombre éditoriale (FIX 6b, brief mai 2026).
 *
 * Design source (`handoff/accueil.jsx` ~ligne 361-466) :
 * - Carte fond ink (#1A1015 → #2A1820) avec glow doré radial en haut-droite
 * - Cercle de progression SVG 90×90 stroke gold (#E8C547 → #B8893A) avec drop-shadow gold
 * - Score géant centré dans le cercle, flouté blur(1.8px) opacity 0.7 (FIX 6) — on doit
 *   *deviner* le 74 sans le lire, ça crée la friction Pro
 * - Lock pastille cream 32×32 par-dessus le score (reste net)
 * - À droite : badge Pro gold + citation Playfair italic + sub-text "Charge · sommeil · …"
 * - Footer border-top + "Débloquer Pro" en gold + arrow-right
 */
export function ScoreDeFormeTeaser({
  ctaHref = '/profile#premium',
  teaseScore = 74,
}: ScoreDeFormeTeaserProps) {
  const { profile } = useProfile()
  const lang: Lang = ((profile?.preferredLanguage as Lang | undefined) ?? 'fr')
  // Cercle de progression : circumference = 2π × 38 ≈ 238.76. On affiche ~75% rempli
  // (offset 60) pour suggérer une "bonne forme" sans révéler la vraie valeur.
  const dashOffset = Math.round(238 - (teaseScore / 100) * 238)

  return (
    <Link
      to={ctaHref}
      data-testid="home-score-teaser"
      aria-label={tr('score_teaser_aria', lang)}
      className="block relative overflow-hidden rounded-[20px] text-app rf-focus-ring"
      style={{
        background: 'linear-gradient(135deg, var(--color-text-primary) 0%, #2A1820 100%)',
        cursor: 'pointer',
      }}
    >
      {/* Glow doré radial top-right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-10 h-[180px] w-[180px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgb(184 137 58 / 0.3), transparent 70%)',
        }}
      />

      <div className="relative px-[22px] pt-5 pb-5">
        <div className="flex items-start gap-4">
          {/* ── Cercle de progression + score flouté + lock pastille ── */}
          <div className="relative h-[90px] w-[90px] flex-shrink-0">
            <svg
              width="90"
              height="90"
              viewBox="0 0 90 90"
              style={{ transform: 'rotate(-90deg)' }}
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="rfGradGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-gold-light)" />
                  <stop offset="100%" stopColor="var(--color-gold)" />
                </linearGradient>
              </defs>
              <circle
                cx="45"
                cy="45"
                r="38"
                fill="none"
                stroke="rgb(245 242 238 / 0.15)"
                strokeWidth="6"
              />
              <circle
                cx="45"
                cy="45"
                r="38"
                fill="none"
                stroke="url(#rfGradGold)"
                strokeWidth="6"
                strokeDasharray="238"
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0 0 6px rgb(184 137 58 / 0.5))' }}
              />
            </svg>

            {/* Score géant flouté (1.8px / 0.7 — FIX 6) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-pro tabular-nums"
              style={{ filter: 'blur(1.8px)', opacity: 0.7 }}
            >
              <div
                className="font-extrabold leading-none"
                style={{ fontSize: 26, letterSpacing: '-1px' }}
              >
                {teaseScore}
              </div>
              <div className="text-[8px] font-bold tracking-wider opacity-80 mt-0.5">
                /100
              </div>
            </div>

            {/* Lock pastille cream (reste net) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-app text-fg"
                style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)' }}
              >
                <Icon name="lock" size={14} color="var(--color-text-primary)" strokeWidth={2.4} />
              </div>
            </div>
          </div>

          {/* ── Texte droite ── */}
          <div className="min-w-0 flex-1">
            <span
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-fg"
              style={{ background: 'var(--color-gold)' }}
            >
              <Icon name="sparkle" size={9} color="var(--color-text-primary)" strokeWidth={2.4} />
              {tr('score_teaser_pro', lang)}
            </span>
            <div
              className="mt-2.5 font-serif italic font-medium leading-[1.2] [text-wrap:balance]"
              style={{ fontSize: 18, letterSpacing: '-0.3px' }}
            >
              {tr('score_teaser_title_1', lang)}
              <br />
              <span className="opacity-70">{tr('score_teaser_title_2', lang)}</span>
            </div>
            <div className="mt-1.5 text-[11px] font-semibold leading-[1.4] opacity-55">
              {tr('score_teaser_subtext', lang)}
            </div>
          </div>
        </div>

        {/* ── Footer "Débloquer Pro" + arrow gold ── */}
        <div
          className="mt-[18px] flex items-center justify-between pt-3.5"
          style={{ borderTop: '1px solid rgb(245 242 238 / 0.15)' }}
        >
          <span className="text-[12px] font-bold tracking-[0.02em] text-pro">
            {tr('score_teaser_cta', lang)}
          </span>
          <Icon name="arrow-right" size={14} color="var(--color-gold)" strokeWidth={2.4} />
        </div>
      </div>
    </Link>
  )
}
