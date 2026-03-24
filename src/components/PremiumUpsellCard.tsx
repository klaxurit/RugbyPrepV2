import { Lock, X } from 'lucide-react'
import { usePremiumCheckout } from '../hooks/usePremiumCheckout'

interface PremiumUpsellCardProps {
  title: string
  body: string
  ctaLabel?: string
  planId?: 'premium_monthly' | 'premium_yearly'
  dismissable?: boolean
  onDismiss?: () => void
}

export function PremiumUpsellCard({
  title,
  body,
  ctaLabel = 'Passer en Premium',
  planId = 'premium_monthly',
  dismissable = true,
  onDismiss,
}: PremiumUpsellCardProps) {
  const {
    loading,
    error,
    message,
    startCheckout,
  } = usePremiumCheckout()

  return (
    <div className="rounded-[24px] border border-[#ff6b35]/20 bg-[#ff6b35]/[0.06] p-5 relative">
      {dismissable && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-white/40 hover:text-white/70 hover:bg-white/15 transition-colors"
          aria-label="Fermer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#ff6b35]/15 text-[#ff6b35]">
          <Lock className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/60">{body}</p>
          <button
            type="button"
            onClick={() => {
              void startCheckout(planId)
            }}
            disabled={loading}
            className="mt-3 inline-flex items-center justify-center rounded-2xl bg-[#ff6b35] px-4 py-2 text-xs font-black text-white transition-colors hover:bg-[#e55a2b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Chargement...' : ctaLabel}
          </button>
          {message && (
            <p className="mt-2 text-[11px] leading-relaxed text-[#ffb08f]">{message}</p>
          )}
          {error && (
            <p className="mt-2 text-[11px] leading-relaxed text-amber-300">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
