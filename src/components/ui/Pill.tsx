import type { ReactNode } from 'react'

export type PillTone = 'ink' | 'cream' | 'wine' | 'gold' | 'green'
export type PillSize = 'xs' | 'sm'

export interface PillProps {
  children: ReactNode
  /** Tonalité du contour + texte. Par défaut 'ink' (sur fond clair). */
  tone?: PillTone
  /** xs = très compact (badge meta), sm = un peu plus large (chip Domicile/Extérieur) */
  size?: PillSize
  /** Variante remplie (background plein) au lieu d'outline */
  filled?: boolean
  className?: string
}

const TONE_OUTLINE: Record<PillTone, string> = {
  ink: 'border-fg/20 text-fg',
  cream: 'border-app/33 text-app',
  wine: 'border-brand text-brand',
  gold: 'border-pro text-pro',
  green: 'border-win text-win',
}

const TONE_FILLED: Record<PillTone, string> = {
  ink: 'bg-fg text-app',
  cream: 'bg-app text-brand',
  wine: 'bg-brand text-app',
  gold: 'bg-pro text-fg',
  green: 'bg-win text-app',
}

const SIZE: Record<PillSize, string> = {
  xs: 'text-[9px] tracking-[0.12em] px-[7px] py-[3px]',
  sm: 'text-[10px] tracking-[0.14em] px-[10px] py-1',
}

/**
 * Pill outline UPPERCASE — pattern récurrent (DOMICILE, MATCH-DAY, INT 03/05, etc.).
 * Tabular-nums pour les pills qui contiennent des chiffres.
 */
export function Pill({
  children,
  tone = 'ink',
  size = 'xs',
  filled = false,
  className = '',
}: PillProps) {
  const tones = filled ? TONE_FILLED[tone] : `border ${TONE_OUTLINE[tone]}`
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-extrabold uppercase whitespace-nowrap tabular-nums ${SIZE[size]} ${tones} ${className}`}
    >
      {children}
    </span>
  )
}
