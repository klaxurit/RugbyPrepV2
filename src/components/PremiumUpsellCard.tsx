import { Lock, X } from 'lucide-react'
import { Link } from 'react-router-dom'

interface PremiumUpsellCardProps {
  title: string
  body: string
  ctaLabel?: string
  dismissable?: boolean
  onDismiss?: () => void
}

export function PremiumUpsellCard({
  title,
  body,
  ctaLabel = 'Passer en Premium',
  dismissable = true,
  onDismiss,
}: PremiumUpsellCardProps) {
  return (
    <div className="rounded-[24px] border border-brand-border bg-brand-soft p-5 relative">
      {dismissable && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-layer-10 text-fg-muted hover:text-fg-secondary hover:bg-layer-15 transition-colors"
          aria-label="Fermer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-medium text-brand-tint">
          <Lock className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-fg">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">{body}</p>
          <Link
            to="/profile#premium"
            className="mt-3 inline-flex items-center justify-center rounded-2xl bg-brand px-4 py-2 text-xs font-black text-on-brand transition-colors hover:bg-brand-hover"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
