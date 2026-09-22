import type { ImgHTMLAttributes } from 'react'
import type { LeagueTier } from '../../types/gamification'
import type { AthleteFormCue } from '../../services/gamification/resolveAthleteFormCue'

import tierBuvette from '../../assets/gamification/tier-buvette.png'
import tierBanc from '../../assets/gamification/tier-banc.png'
import tierTitulaires from '../../assets/gamification/tier-titulaires.png'
import tierCapitaines from '../../assets/gamification/tier-capitaines.png'
import tierBouclier from '../../assets/gamification/tier-bouclier.png'
import formHot from '../../assets/gamification/form-hot.png'
import formDormant from '../../assets/gamification/form-dormant.png'
import emptyInvite from '../../assets/gamification/empty-invite.png'
import emptyPending from '../../assets/gamification/empty-pending.png'
import emptyPrivateA from '../../assets/gamification/empty-private-a.png'

const TIER_SRC: Record<LeagueTier, string> = {
  reserve: tierBuvette,
  espoirs: tierBanc,
  premiere: tierTitulaires,
  federale: tierCapitaines,
  elite: tierBouclier,
}

type ImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  size?: number
}

/** Écusson division — assets Design V2. */
export function LeagueCrest({ tier, size = 40, className, ...rest }: ImgProps & { tier: LeagueTier }) {
  return (
    <img
      src={TIER_SRC[tier]}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={className ?? 'shrink-0 object-contain'}
      aria-hidden
      {...rest}
    />
  )
}

export function FormCueIcon({ cue, size = 14, className, ...rest }: ImgProps & { cue: AthleteFormCue }) {
  return (
    <img
      src={cue === 'hot' ? formHot : formDormant}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={className ?? 'shrink-0 object-contain'}
      aria-hidden
      {...rest}
    />
  )
}

export function EmptyArtInvite({ size = 96, className, ...rest }: ImgProps) {
  return (
    <img
      src={emptyInvite}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={className ?? 'mx-auto object-contain'}
      aria-hidden
      {...rest}
    />
  )
}

export function EmptyArtPendingMonday({ size = 96, className, ...rest }: ImgProps) {
  return (
    <img
      src={emptyPending}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={className ?? 'mx-auto object-contain'}
      aria-hidden
      {...rest}
    />
  )
}

/** Variante A (liste + cadenas) — anneau rempli pour masquer le fond. */
export function EmptyArtPrivateLock({ size = 96, className, ...rest }: ImgProps) {
  return (
    <img
      src={emptyPrivateA}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={className ?? 'mx-auto object-contain'}
      aria-hidden
      {...rest}
    />
  )
}
