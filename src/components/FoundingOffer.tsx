import { useEffect, useRef, useState } from 'react'
import { posthog } from '../services/analytics/posthog'
import { useFoundingOfferEligibility, FOUNDING_OFFER_HINT_ID } from '../hooks/useFoundingOfferEligibility'
import { useHintVisibility } from '../hooks/useHintVisibility'
import { usePremiumCheckout } from '../hooks/usePremiumCheckout'

/**
 * WS0 — Founding 49€/an offer modal.
 *
 * Mounted globally (App.tsx). Shows a one-time modal sheet when the eligibility
 * trigger fires (Day 2+ since signup, ≥1 session completed, not paying, not
 * dismissed). Routing checkout (Play vs Stripe) handled by usePremiumCheckout.
 */
export function FoundingOffer() {
  const { eligible } = useFoundingOfferEligibility()
  const { dismiss } = useHintVisibility(FOUNDING_OFFER_HINT_ID)
  const { startCheckout, loading: checkoutLoading, error: checkoutError } = usePremiumCheckout()
  const trackedRef = useRef(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (eligible && !open) {
      setOpen(true)
    }
  }, [eligible, open])

  // Fire founding_offer_shown once per session when the modal first becomes visible.
  useEffect(() => {
    if (open && !trackedRef.current) {
      trackedRef.current = true
      try {
        posthog.capture?.('founding_offer_shown')
      } catch {
        /* posthog might be disabled (no consent) */
      }
    }
  }, [open])

  if (!open) return null

  const handleAccept = async () => {
    try {
      posthog.capture?.('founding_offer_clicked')
    } catch { /* ignore */ }
    await startCheckout('founding_yearly')
    // startCheckout redirects to provider on success → modal stays mounted
    // until navigation. On Play success path, no redirect — close modal.
  }

  const handleDismiss = () => {
    try {
      posthog.capture?.('founding_offer_dismissed')
    } catch { /* ignore */ }
    dismiss()
    setOpen(false)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="founding-offer-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleDismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-app border-2 border-brand rounded-[28px] p-6 space-y-4 shadow-2xl"
      >
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand">Offre Founding</p>
          <h2 id="founding-offer-title" className="text-2xl font-black text-fg leading-tight">
            Bloque ton tarif Founding<br />à <span className="text-brand">49€/an à vie</span>
          </h2>
        </div>

        <div className="space-y-3 text-sm text-fg-secondary">
          <p>
            Tu as commencé ton préparation, tu sens que c'est sérieux. Cette offre est réservée aux
            premiers utilisateurs : <span className="font-bold text-fg">49€/an, à vie</span>, même quand
            on monte les prix.
          </p>
          <p className="text-xs text-fg-muted">
            Inclut tout l'abonnement Premium : adaptations programme, analyses avancées, mode coach,
            support prioritaire. Annulable à tout moment.
          </p>
        </div>

        {checkoutError && (
          <div className="p-3 bg-danger-bg border border-danger-bd rounded-2xl">
            <p className="text-xs text-danger font-medium">{checkoutError}</p>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={handleAccept}
            disabled={checkoutLoading}
            className="w-full h-14 rounded-full bg-brand hover:bg-brand-hover text-on-brand font-black text-sm tracking-wide transition-all active:scale-[0.98] shadow-lg shadow-brand-float disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkoutLoading ? 'Redirection…' : 'Devenir Founding — 49€/an à vie'}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full h-12 rounded-full border border-border-app text-xs font-bold text-fg-secondary hover:bg-layer-4 transition-colors"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  )
}
