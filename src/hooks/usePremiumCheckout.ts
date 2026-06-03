import { useCallback, useState } from 'react'
import { supabase } from '../services/supabase/client'
import { isPlayBillingAvailable, isStandaloneMode, usePlayBilling } from './usePlayBilling'
import { isUserCancelledError, mapCheckoutError } from './checkoutErrorMessages'

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
  reason?: 'provider_not_configured' | 'provider_not_wired' | 'founding_cohort_full'
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

  const startCheckout = useCallback(async (planId: 'premium_monthly' | 'premium_yearly' | 'founding_yearly' = 'premium_monthly') => {
    setState({ loading: true, error: null, message: null })

    // Route to Google Play Billing when inside the TWA
    if (isPlayBillingAvailable()) {
      try {
        const result = await playBilling.purchase(planId)
        if (result && 'ok' in result && result.ok === false) {
          const rawErr = (result as { error: string | null }).error
          if (isUserCancelledError(rawErr)) {
            setState({ loading: false, error: null, message: null })
            return null
          }
          if (rawErr) console.error('[usePremiumCheckout] Play purchase error:', rawErr)
          setState({ loading: false, error: mapCheckoutError(rawErr), message: null })
          return null
        }
        if (result && result.ok !== false) {
          setState({ loading: false, error: null, message: 'Pro activé ! Tes nouveaux accès sont déjà déverrouillés.' })
          return { ok: true, ready: true } as CheckoutResponse
        }
        // User cancelled — silent reset
        setState({ loading: false, error: null, message: null })
        return null
      } catch (err) {
        if (isUserCancelledError(err)) {
          setState({ loading: false, error: null, message: null })
          return null
        }
        console.error('[usePremiumCheckout] Play purchase threw:', err)
        setState({ loading: false, error: mapCheckoutError(err), message: null })
        return null
      }
    }

    // In standalone mode (TWA/PWA) but Digital Goods API unavailable :
    // app sideloaded ou pas installée depuis le Play Store.
    if (isStandaloneMode) {
      setState({
        loading: false,
        error: 'Pour souscrire depuis cette installation, ouvre l\'application via le Play Store ou utilise rugbyforge.fr dans ton navigateur.',
        message: null,
      })
      return null
    }

    // Fallback to Stripe checkout for web (iOS PWA + desktop)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          planId,
          successUrl: `${window.location.origin}/profile?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/profile?checkout=cancel`,
        },
      })

      if (error) throw error

      const payload = (data ?? null) as CheckoutResponse | null
      if (payload?.reason === 'founding_cohort_full') {
        setState({
          loading: false,
          error: mapCheckoutError('founding_cohort_full'),
          message: null,
        })
        return payload
      }
      if (payload?.ready && payload.checkoutUrl) {
        window.location.assign(payload.checkoutUrl)
        return payload
      }

      // Edge Function returned ready=false → provider not yet configured.
      const reason = payload?.reason
      const userMessage = reason
        ? mapCheckoutError(reason)
        : 'Le paiement web n\'est pas encore configuré. Sur Android, utilise l\'app installée via le Play Store. Sur iOS / desktop, écris-nous à bonjour@rugbyforge.fr.'
      setState({ loading: false, error: userMessage, message: null })
      return payload
    } catch (err) {
      console.error('[usePremiumCheckout] Stripe checkout threw:', err)
      setState({
        loading: false,
        error: mapCheckoutError(err),
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
          message: 'Achat Google Play restauré — tes accès Pro sont actifs.',
        })
        return result
      }

      setState({
        loading: false,
        error: null,
        message: 'Aucun abonnement actif n\'a été retrouvé sur ce compte Google. Vérifie que tu utilises le même compte que lors de l\'achat.',
      })
      return null
    } catch (err) {
      console.error('[usePremiumCheckout] restorePurchases threw:', err)
      setState({
        loading: false,
        error: mapCheckoutError(err),
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
