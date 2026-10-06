import type { HTMLAttributes, ImgHTMLAttributes } from 'react'
import type { LeagueTier } from '../../types/gamification'
import type { AthleteFormCue } from '../../services/gamification/resolveAthleteFormCue'
import { formCueEmoji } from '../../services/gamification/badgeIcon'

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

type FormCueProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  cue: AthleteFormCue
  /** Taille du glyphe emoji (px). */
  size?: number
}

/**
 * Indice de forme à côté du pseudo.
 * Émojis natifs : les SVG stroke à 14 px se lisaient comme « ( » / flamme ratée.
 */
export function FormCueIcon({ cue, size = 14, className, style, ...rest }: FormCueProps) {
  return (
    <span
      className={className ?? 'inline-flex shrink-0 items-center leading-none'}
      style={{ fontSize: size, ...style }}
      aria-hidden
      {...rest}
    >
      {formCueEmoji(cue)}
    </span>
  )
}
