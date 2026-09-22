import type { ImgHTMLAttributes, SVGProps } from 'react'
import type { LeagueTier } from '../../types/gamification'
import type { AthleteFormCue } from '../../services/gamification/resolveAthleteFormCue'

import tierBuvette from '../../../assets/divisions/01-buvette.svg'
import tierBanc from '../../../assets/divisions/02-banc-de-touche.svg'
import tierTitulaires from '../../../assets/divisions/03-titulaires.svg'
import tierCapitaines from '../../../assets/divisions/04-capitaines.svg'
import tierBouclier from '../../../assets/divisions/05-bouclier.svg'

/**
 * Écussons de division — SVG source `assets/divisions/`.
 *
 * Import URL Vite + `<img>` : rasterisation à la taille d’affichage
 * (Retina inclus), sans pixelisation.
 */

const TIER_SRC: Record<LeagueTier, string> = {
  reserve: tierBuvette,
  espoirs: tierBanc,
  premiere: tierTitulaires,
  federale: tierCapitaines,
  elite: tierBouclier,
}

/** Ratio viewBox 64×72 des SVG source. */
const CREST_ASPECT = 72 / 64

type CrestProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  tier: LeagueTier
  /** Largeur CSS (px). La hauteur suit le ratio 64×72. */
  size?: number
}

export function LeagueCrest({ tier, size = 40, className, style, ...rest }: CrestProps) {
  const height = Math.round(size * CREST_ASPECT)
  return (
    <img
      src={TIER_SRC[tier]}
      alt=""
      width={size}
      height={height}
      draggable={false}
      className={className ?? 'shrink-0'}
      style={{ width: size, height, ...style }}
      data-testid="league-crest"
      data-tier={tier}
      aria-hidden
      {...rest}
    />
  )
}

const INK = '#7B0D1E'

type FormCueProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  cue: AthleteFormCue
  size?: number
}

/** Indice de forme (flamme / lune) — SVG inline. */
export function FormCueIcon({ cue, size = 14, className, ...rest }: FormCueProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className ?? 'shrink-0'}
      aria-hidden
      {...rest}
    >
      {cue === 'hot' ? (
        <path
          d="M20 6 C24 12 26 16 22 22 C24 20 27 20 27 24 C27 30 24 34 20 34 C16 34 13 30 13 24 C13 20 16 20 18 22 C14 16 16 12 20 6 Z"
          stroke={INK}
          strokeWidth={2.4}
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M24 8 C18 8 14 13 14 19 C14 25 18 30 24 30 C20 30 16 25 16 19 C16 13 20 8 24 8 Z"
          stroke={INK}
          strokeWidth={2.4}
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}
