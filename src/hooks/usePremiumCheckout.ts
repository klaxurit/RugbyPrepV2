import { useCallback, useState } from 'react'
import { supabase } from '../services/supabase/client'
import { isPlayBillingAvailable, isStandaloneMode, usePlayBilling } from './usePlayBilling'

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
          setState({ loading: false, error: null, message: 'Premium activé !' })
          return { ok: true, ready: true } as CheckoutResponse
        }
        // purchase returned null — check if play billing captured an error
        const playError = playBilling.error
        if (playError) {
          setState({ loading: false, error: playError, message: null })
        } else {
          // User cancelled — silent reset
          setState({ loading: false, error: null, message: null })
        }
        return null
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        setState({ loading: false, error: message, message: null })
        return null
      }
    }

    // In standalone mode (TWA/PWA) but Digital Goods API unavailable
    // This happens when the app is sideloaded or not installed from Play Store
    if (isStandaloneMode) {
      setState({
        loading: false,
        error: 'Pour souscrire, installe l\'app depuis le Google Play Store.',
        message: null,
      })
      return null
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
        error: 'Le paiement n\'est pas encore disponible sur le web. Utilise l\'app Android pour passer en Premium.',
        message: null,
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

  const restorePurchases = useCallback(async () => {
    if (!isPlayBillingAvailable()) {
      setState({
        loading: false,
        error: null,
        message: 'La restauration Google Play est disponible uniquement dans l’application Android publiée sur le Play Store.',
      })
      return null
    }

    setState({ loading: true, error: null, message: null })

    try {
      const result = await playBilling.restorePurchases()
      if (result) {
        setState({
          loading: false,
          error: null,
          message: 'Achat Google Play restauré.',
        })
        return result
      }

      setState({
        loading: false,
        error: null,
        message: 'Aucun achat Google Play actif n’a été retrouvé pour ce compte.',
      })
      return null
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
    restorePurchases,
    reset,
    isPlayStore: isPlayBillingAvailable(),
    playProducts: playBilling.products,
  }
}
