import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  subtitle?: string
  /** Icône affichée dans la pastille à gauche du titre. */
  icon?: ReactNode
  /** Classes de la pastille (background / border / text). */
  iconClassName?: string
  /** Badge affiché à droite du titre, avant le chevron (ex : pill PREMIUM/FREE). */
  trailing?: ReactNode
  /** Ouvert par défaut (défaut : fermé). */
  defaultOpen?: boolean
  /** data-testid appliqué sur la section. */
  testId?: string
  /** Classes supplémentaires de la section wrapper. */
  className?: string
  children: ReactNode
}

/**
 * Section pliable harmonisée avec le style des cards /profile.
 * Header : icône + titre + sous-titre + trailing + chevron.
 * Body : rendu uniquement quand ouvert.
 */
export function CollapsibleSection({
  title,
  subtitle,
  icon,
  iconClassName = 'bg-layer-10 text-fg-soft border border-border-app',
  trailing,
  defaultOpen = false,
  testId,
  className = 'bg-layer-5 border border-border-app rounded-[24px] overflow-hidden',
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className={className} data-testid={testId}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full p-6 flex items-center gap-3 text-left rf-focus-ring"
        aria-expanded={open}
      >
        {icon && (
          <div className={`p-2 rounded-2xl flex-shrink-0 ${iconClassName}`}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-black text-fg">{title}</h2>
          {subtitle && <p className="text-xs text-fg-muted mt-0.5">{subtitle}</p>}
        </div>
        {trailing}
        <ChevronDown
          className={`w-4 h-4 text-fg-muted transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open && <div className="px-6 pb-6 space-y-5">{children}</div>}
    </section>
  )
}
