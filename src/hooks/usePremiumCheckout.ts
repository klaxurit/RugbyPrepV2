import { useCallback, useState } from 'react'
import { supabase } from '../services/supabase/client'
import { isPlayBillingAvailable, usePlayBilling } from './usePlayBilling'

type CheckoutResponse = {
  ok: boolean
  ready: boolean
  plan?: {
    id: string
    name: string
    billing_interval: string
    price_cents: number
    currency: string
    is_active: boolean
  }
  entitlements?: string[]
  checkoutUrl?: string
  message?: string
  reason?: 'provider_not_configured' | 'provider_not_wired'
  nextStep?: string
}

interface CheckoutState {
  loading: boolean
  error: string | null
  message: string | null
}

export function usePremiumCheckout() {
  const [state, setState] = useState<CheckoutState>({
    loading: false,
    error: null,
    message: null,
  })

  const playBilling = usePlayBilling()

  const startCheckout = useCallback(async (planId: 'premium_monthly' | 'premium_yearly' = 'premium_monthly') => {
    setState({ loading: true, error: null, message: null })

    // Route to Google Play Billing when inside the TWA
    if (isPlayBillingAvailable()) {
      try {
        const result = await playBilling.purchase(planId)
        if (result) {
          setState({ loading: false, error: null, message: null })
          return { ok: true, ready: true } as CheckoutResponse
        }
        // User cancelled
        setState({ loading: false, error: null, message: null })
        return null
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setState({ loading: false, error: message, message: null })
        return null
      }
    }

    // Fallback to Stripe checkout for web
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          planId,
          successUrl: `${window.location.origin}/chat?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/chat?checkout=cancel`,
        },
      })

      if (error) throw error

      const payload = (data ?? null) as CheckoutResponse | null
      if (payload?.ready && payload.checkoutUrl) {
        window.location.assign(payload.checkoutUrl)
        return payload
      }

      setState({
        loading: false,
        error: null,
        message: payload?.message ?? 'Le checkout premium est prêt côté app mais pas encore activé côté paiement.',
      })
      return payload
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setState({
        loading: false,
        error: message,
        message: null,
      })
      return null
    }
  }, [playBilling])

  const reset = useCallback(() => {
    setState({ loading: false, error: null, message: null })
  }, [])

  return {
    ...state,
    startCheckout,
    reset,
    isPlayStore: isPlayBillingAvailable(),
    playProducts: playBilling.products,
  }
}
