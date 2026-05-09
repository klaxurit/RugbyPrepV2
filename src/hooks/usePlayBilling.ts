import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase/client'

/**
 * Product IDs — must match Google Play Console subscriptions
 * AND the mapping in supabase/functions/_shared/playBilling.ts
 */
const PLAY_PRODUCTS: Record<string, string> = {
  premium_monthly: 'premium.monthly',
  premium_yearly: 'premium.yearly',
  // WS0 Décision #52 — Founding 49€/an à vie. Le SKU correspondant doit être
  // créé côté Play Console (Subscription, base plan annual, prix 49€ EUR).
  founding_yearly: 'founding.yearly',
}

/** True when running inside a TWA or installed PWA (evaluated lazily) */
export const isStandaloneMode =
  typeof window !== 'undefined' &&
  (
    // Standard PWA standalone check
    (typeof window.matchMedia === 'function' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
       window.matchMedia('(display-mode: minimal-ui)').matches)) ||
    // iOS Safari standalone
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    // TWA: referrer from android-app
    document.referrer.includes('android-app://') ||
    // TWA: Digital Goods API present (strongest signal)
    'getDigitalGoodsService' in window
  )

/** True when the Digital Goods API is available (TWA with Play Billing enabled) */
export const isPlayBillingAvailable = (): boolean =>
  typeof window !== 'undefined' && 'getDigitalGoodsService' in window

type ItemDetails = {
  itemId: string
  title: string
  description: string
  price: { currency: string; value: string }
}

type PurchaseDetails = {
  itemId: string
  purchaseToken: string
  acknowledged?: boolean
}

type DigitalGoodsService = {
  getDetails(itemIds: string[]): Promise<ItemDetails[]>
  listPurchases(): Promise<PurchaseDetails[]>
}

declare global {
  interface Window {
    getDigitalGoodsService?(serviceProvider: string): Promise<DigitalGoodsService>
  }
}

type PlayBillingState = {
  available: boolean
  loading: boolean
  error: string | null
  products: ItemDetails[]
}

export function usePlayBilling() {
  const [state, setState] = useState<PlayBillingState>({
    available: false,
    loading: false,
    error: null,
    products: [],
  })

  // Load product details on mount if Play Billing is available
  useEffect(() => {
    if (!isPlayBillingAvailable()) return

    let active = true

    const loadProducts = async () => {
      setState((prev) => ({ ...prev, loading: true }))
      try {
        const service = await window.getDigitalGoodsService!(
          'https://play.google.com/billing',
        )
        const productIds = Object.values(PLAY_PRODUCTS)
        const details = await service.getDetails(productIds)

        if (active) {
          setState({
            available: true,
            loading: false,
            error: null,
            products: details,
          })
        }
      } catch (err) {
        if (active) {
          setState({
            available: false,
            loading: false,
            error: err instanceof Error ? err.message : String(err),
            products: [],
          })
        }
      }
    }

    void loadProducts()
    return () => { active = false }
  }, [])

  /**
   * Initiate a purchase via the Payment Request API + Digital Goods API.
   * On success, verifies the purchase server-side and grants entitlements.
   */
  const purchase = useCallback(async (planId: 'premium_monthly' | 'premium_yearly' | 'founding_yearly' = 'premium_monthly') => {
    const productId = PLAY_PRODUCTS[planId]
    if (!productId) {
      setState((prev) => ({ ...prev, error: `Unknown plan: ${planId}` }))
      return null
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      console.log('[PlayBilling] Starting purchase for', planId, '→ productId:', productId)

      const service = await window.getDigitalGoodsService!(
        'https://play.google.com/billing',
      )
      console.log('[PlayBilling] Digital Goods Service acquired')

      // Try to get price from Play Store, fall back to hardcoded values
      let label = planId === 'premium_monthly'
        ? 'RugbyForge Premium Mensuel'
        : planId === 'founding_yearly'
          ? 'RugbyForge Founding (49€/an à vie)'
          : 'RugbyForge Premium Annuel'
      let currency = 'EUR'
      let value = planId === 'premium_monthly'
        ? '5.99'
        : planId === 'founding_yearly'
          ? '49.00'
          : '47.99'

      try {
        const [details] = await service.getDetails([productId])
        if (details) {
          label = details.title
          currency = details.price.currency
          value = details.price.value
          console.log('[PlayBilling] Product details from Play Store:', label, currency, value)
        }
      } catch (detailsErr) {
        console.warn('[PlayBilling] getDetails failed, using fallback pricing:', detailsErr)
      }

      // Create Payment Request
      const paymentMethod: PaymentMethodData = {
        supportedMethods: 'https://play.google.com/billing',
        data: {
          sku: productId,
        },
      }

      const paymentDetails: PaymentDetailsInit = {
        total: {
          label,
          amount: { currency, value },
        },
      }

      const request = new PaymentRequest([paymentMethod], paymentDetails)
      const response = await request.show()
      console.log('[PlayBilling] Payment response received')

      // From here, we MUST call response.complete() to dismiss the overlay
      let purchaseResult: { ok: boolean; error?: string; planId?: string; status?: string } | null = null
      try {
        const paymentResponseDetails = response.details as { purchaseToken?: string; token?: string }
        const purchaseToken = paymentResponseDetails.purchaseToken ?? paymentResponseDetails.token
        if (!purchaseToken) throw new Error('Play purchase token missing')
        console.log('[PlayBilling] Got purchase token, verifying server-side...')

        // Verify purchase server-side
        const { data, error } = await supabase.functions.invoke('verify-play-purchase', {
          body: { productId, purchaseToken },
        })

        if (error) {
          // Extract the real error message from the edge function response
          let errorMessage = error.message
          const ctx = (error as { context?: Response }).context
          if (ctx && typeof ctx.json === 'function') {
            try {
              const body = await ctx.json()
              if (body?.error) errorMessage = body.error
            } catch { /* body already consumed */ }
          }
          console.error('[PlayBilling] Verification error:', errorMessage)
          throw new Error(errorMessage)
        }

        const result = data as { ok: boolean; error?: string; planId?: string; status?: string }
        console.log('[PlayBilling] Verification result:', result)
        if (!result.ok) throw new Error(result.error ?? 'Purchase verification failed')

        purchaseResult = result
        // response.complete('success') acknowledges the purchase in DGAPI v2
        await response.complete('success')
        console.log('[PlayBilling] Purchase complete')
      } catch (verifyErr) {
        console.error('[PlayBilling] Error in verification/acknowledge:', verifyErr)
        // Always dismiss the payment overlay even on error
        try { await response.complete('fail') } catch { /* ignore */ }
        throw verifyErr
      }

      setState((prev) => ({ ...prev, loading: false, error: null }))
      return purchaseResult
    } catch (err) {
      // User cancelled or error
      const message = err instanceof Error ? err.message : String(err)
      console.error('[PlayBilling] Purchase failed:', message)
      const isCancel = message.includes('AbortError') || message.includes('cancelled') || message.includes('NotAllowedError')
      const errorMsg = isCancel ? null : message
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMsg,
      }))
      // Return error info so callers can react immediately (React state is async)
      return isCancel ? null : { ok: false, error: errorMsg } as { ok: false; error: string | null }
    }
  }, [])

  /**
   * Check and restore existing purchases (e.g. after reinstall).
   */
  const restorePurchases = useCallback(async () => {
    if (!isPlayBillingAvailable()) return null

    setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const service = await window.getDigitalGoodsService!(
          'https://play.google.com/billing',
        )

        const purchases = await service.listPurchases()

        for (const { itemId, purchaseToken } of purchases) {
          const { data, error } = await supabase.functions.invoke('verify-play-purchase', {
            body: { productId: itemId, purchaseToken },
          })
          if (!error && (data as { ok: boolean }).ok) {
            setState((prev) => ({ ...prev, loading: false }))
            return data
          }
        }

        setState((prev) => ({ ...prev, loading: false }))
        return null
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      }))
      return null
    }
  }, [])

  return {
    ...state,
    purchase,
    restorePurchases,
  }
}

/** Debug helper — call from console or render in a debug panel */
export function getPlayBillingDebugInfo() {
  return {
    isStandaloneMode,
    isPlayBillingAvailable: isPlayBillingAvailable(),
    hasGetDigitalGoodsService: typeof window !== 'undefined' && 'getDigitalGoodsService' in window,
    displayModeStandalone: typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)')?.matches,
    displayModeMinimalUi: typeof window !== 'undefined' && window.matchMedia?.('(display-mode: minimal-ui)')?.matches,
    referrer: typeof document !== 'undefined' ? document.referrer : '',
    navigatorStandalone: (navigator as unknown as { standalone?: boolean }).standalone,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  }
}
