import type { ReactNode } from 'react'

export type ChipTone =
  | 'brand'
  | 'neutral'
  | 'warn'
  | 'alert'
  | 'success'
  | 'info'

export type ChipVariant = 'soft' | 'outline' | 'solid'
export type ChipSize = 'sm' | 'md'

export interface ChipProps {
  children: ReactNode
  tone?: ChipTone
  variant?: ChipVariant
  size?: ChipSize
  /** Affiche un point coloré devant le texte. Réservé aux statuts dynamiques (live, en cours). */
  dot?: boolean
  /** Classe supplémentaire. */
  className?: string
  'aria-label'?: string
}

const softByTone: Record<ChipTone, string> = {
  brand: 'bg-brand-soft text-brand-tint border-brand-border',
  neutral: 'bg-badge-muted-bg text-badge-muted-fg border-bd-soft',
  warn: 'bg-warn-bg-muted text-warn border-warn-bd',
  alert: 'bg-alert-bg-muted text-alert border-alert-bd',
  success: 'bg-ok-bg-muted text-ok-strong border-ok-bd',
  info: 'bg-info-bg text-info border-info-bd',
}

const outlineByTone: Record<ChipTone, string> = {
  brand: 'border-brand-border-strong text-brand-tint bg-transparent',
  neutral: 'border-bd-soft text-fg-secondary bg-transparent',
  warn: 'border-warn-bd-strong text-warn-strong bg-transparent',
  alert: 'border-alert-bd text-alert-strong bg-transparent',
  success: 'border-ok-bd text-ok-strong bg-transparent',
  info: 'border-info-bd text-info bg-transparent',
}

const solidByTone: Record<ChipTone, string> = {
  brand: 'bg-brand text-on-brand border-transparent',
  neutral: 'bg-fg text-app border-transparent',
  warn: 'bg-warn-button text-white border-transparent',
  alert: 'bg-alert text-white border-transparent',
  success: 'bg-ok-strong text-white border-transparent',
  info: 'bg-info text-white border-transparent',
}

const dotByTone: Record<ChipTone, string> = {
  brand: 'bg-brand',
  neutral: 'bg-fg-muted',
  warn: 'bg-warn-strong',
  alert: 'bg-alert',
  success: 'bg-ok-strong',
  info: 'bg-info',
}

const sizeClass: Record<ChipSize, string> = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-[11px] gap-1.5',
}

/**
 * Chip de statut — un composant unique pour tous les badges (saison, semaine, niveau, etc.).
 * Par défaut `variant="outline"` (sobre, cohérent) et `size="sm"`.
 * `dot` est réservé aux statuts dynamiques (live / en cours).
 */
export function Chip({
  children,
  tone = 'neutral',
  variant = 'outline',
  size = 'sm',
  dot = false,
  className,
  'aria-label': ariaLabel,
}: ChipProps) {
  const variantClass =
    variant === 'solid' ? solidByTone[tone] : variant === 'soft' ? softByTone[tone] : outlineByTone[tone]
  return (
    <span
      className={`inline-flex items-center rounded-full border font-black uppercase tracking-wide ${sizeClass[size]} ${variantClass}${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={`inline-block h-1.5 w-1.5 rounded-full ${dotByTone[tone]}`}
        />
      ) : null}
      {children}
    </span>
  )
}
