import { useEffect, useRef } from 'react'
import { posthog } from '../services/analytics/posthog'
import { useFoundingOfferEligibility, consumeFoundingForceShow } from '../hooks/useFoundingOfferEligibility'
import { usePremiumCheckout } from '../hooks/usePremiumCheckout'
import { useProfile } from '../hooks/useProfile'
import { tr, type Lang } from '../i18n/appLabels'

/**
 * WS0 — Founding 49€/an offer modal.
 *
 * Mounted globally (App.tsx). Shows a one-time modal sheet when the eligibility
 * trigger fires (Day 2+ since signup, ≥1 session completed, not paying, not
 * dismissed). Routing checkout (Play vs Stripe) handled by usePremiumCheckout.
 *
 * Visibility is fully derived from the `eligible` flag — when the user clicks
 * "Plus tard" the dismiss persists, the hook re-evaluates eligible to false
 * on next render, and the modal unmounts.
 *
 * Le `dismiss` vient obligatoirement de `useFoundingOfferEligibility` (une seule
 * instance de `useHintVisibility` pour ce hint) — sinon la modale reste affichée.
 */
export function FoundingOffer() {
  const { eligible, dismiss, cohortFull } = useFoundingOfferEligibility()
  const { startCheckout, loading: checkoutLoading, error: checkoutError } = usePremiumCheckout()
  const { profile } = useProfile()
  const lang: Lang = ((profile?.preferredLanguage as Lang | undefined) ?? 'fr')
  const trackedRef = useRef(false)

  // Fire founding_offer_shown once per session when the modal first becomes
  // visible. Also consume the /founding force-show flag (one-shot) so the
  // subsequent renders fall back to the normal eligibility gates.
  useEffect(() => {
    if (eligible && !trackedRef.current) {
      trackedRef.current = true
      consumeFoundingForceShow()
      try {
        posthog.capture?.('founding_offer_shown')
      } catch {
        /* posthog might be disabled (no consent) */
      }
    }
  }, [eligible])

  if (!eligible) return null

  const handleAccept = async () => {
    if (cohortFull) return
    try {
      posthog.capture?.('founding_offer_clicked')
    } catch { /* ignore */ }
    await startCheckout('founding_yearly')
    // startCheckout redirects to provider on success → modal stays mounted
    // until navigation.
  }

  const handleDismiss = () => {
    try {
      posthog.capture?.('founding_offer_dismissed')
    } catch { /* ignore */ }
    dismiss()
    // dismiss persists → next render eligible becomes false → unmount.
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="founding-offer-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss()
      }}
    >
      <div
        className="w-full max-w-md bg-app border-2 border-brand rounded-[28px] p-6 space-y-4 shadow-2xl pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand">{tr('founding_eyebrow', lang)}</p>
          <h2 id="founding-offer-title" className="text-2xl font-black text-fg leading-tight">
            {tr('founding_title_pre', lang)}<br />{lang === 'fr' ? 'à' : 'at'} <span className="text-brand">49€/an {tr('founding_title_suffix', lang)}</span>
          </h2>
        </div>

        <div className="space-y-3 text-sm text-fg-secondary">
          {cohortFull ? (
            <>
              <p className="font-bold text-fg">{tr('founding_cohort_sold_out_title', lang)}</p>
              <p>{tr('founding_cohort_sold_out_body', lang)}</p>
              <p className="text-xs text-fg-muted">{tr('founding_cohort_sold_out_note', lang)}</p>
            </>
          ) : (
            <>
              <p>{tr('founding_body_1', lang)}</p>
              <p className="text-xs text-fg-muted">{tr('founding_body_2', lang)}</p>
            </>
          )}
        </div>

        {checkoutError && (
          <div className="p-3 bg-danger-bg border border-danger-bd rounded-2xl">
            <p className="text-xs text-danger font-medium">{checkoutError}</p>
          </div>
        )}

        <div className="space-y-2 pt-2">
          {cohortFull ? (
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full h-14 rounded-full bg-brand hover:bg-brand-hover text-on-brand font-black text-sm tracking-wide transition-all active:scale-[0.98] shadow-lg shadow-brand-float [touch-action:manipulation]"
            >
              {tr('founding_later', lang)}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleAccept}
                disabled={checkoutLoading}
                className="w-full h-14 rounded-full bg-brand hover:bg-brand-hover text-on-brand font-black text-sm tracking-wide transition-all active:scale-[0.98] shadow-lg shadow-brand-float disabled:opacity-50 disabled:cursor-not-allowed [touch-action:manipulation]"
              >
                {checkoutLoading ? tr('founding_redirecting', lang) : tr('founding_become', lang)}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full h-12 rounded-full border border-border-app text-xs font-bold text-fg-secondary hover:bg-layer-4 transition-colors [touch-action:manipulation]"
              >
                {tr('founding_later', lang)}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
