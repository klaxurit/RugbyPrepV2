import type { ReactNode } from 'react'

export interface SectionLabelProps {
  /** Texte de l'eyebrow (transformé en UPPERCASE via CSS) */
  label: string
  /** Si true, n'affiche pas la ligne séparatrice (utile en row avec un lien "Tout voir") */
  bare?: boolean
  /** Slot optionnel à droite (ex: lien "Tout voir") — incompatible avec bare=false */
  trailing?: ReactNode
  className?: string
}

/**
 * Eyebrow + ligne séparatrice — pattern récurrent du design éditorial.
 * Ex: "TA CADENCE  ────────────────"
 */
export function SectionLabel({ label, bare = false, trailing, className = '' }: SectionLabelProps) {
  return (
    <div className={`flex items-center gap-[10px] ${className}`}>
      <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-fg/45">
        {label}
      </div>
      {!bare && <div className="h-px flex-1 bg-paper-deep" />}
      {trailing}
    </div>
  )
}
