import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase/client'

/**
 * Product IDs — must match Google Play Console subscriptions
 * AND the mapping in supabase/functions/_shared/playBilling.ts
 */
const PLAY_PRODUCTS: Record<string, string> = {
  premium_monthly: 'fr.rugbyforge.premium.monthly',
  premium_yearly: 'fr.rugbyforge.premium.yearly',
}

/** True when running inside a TWA or installed PWA */
export const isStandaloneMode =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
   (navigator as unknown as { standalone?: boolean }).standalone === true)

/** True when the Digital Goods API is available (TWA with Play Billing enabled) */
export const isPlayBillingAvailable = (): boolean =>
  isStandaloneMode && 'getDigitalGoodsService' in window

type ItemDetails = {
  itemId: string
  title: string
  description: string
  price: { currency: string; value: string }
}

type DigitalGoodsService = {
  getDetails(itemIds: string[]): Promise<ItemDetails[]>
  listPurchases(): Promise<Array<{ itemId: string; purchaseToken: string }>>
  acknowledge(purchaseToken: string, type: 'onetime' | 'repeatable'): Promise<void>
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
  const purchase = useCallback(async (planId: 'premium_monthly' | 'premium_yearly' = 'premium_monthly') => {
    const productId = PLAY_PRODUCTS[planId]
    if (!productId) {
      setState((prev) => ({ ...prev, error: `Unknown plan: ${planId}` }))
      return null
    }

    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const service = await window.getDigitalGoodsService!(
        'https://play.google.com/billing',
      )

      // Get current price from Play Store
      const [details] = await service.getDetails([productId])
      if (!details) throw new Error('Product not found in Play Store')

      // Create Payment Request
      const paymentMethod: PaymentMethodData = {
        supportedMethods: 'https://play.google.com/billing',
        data: {
          sku: productId,
        },
      }

      const paymentDetails: PaymentDetailsInit = {
        total: {
          label: details.title,
          amount: {
            currency: details.price.currency,
            value: details.price.value,
          },
        },
      }

      const request = new PaymentRequest([paymentMethod], paymentDetails)
      const response = await request.show()
      const { purchaseToken } = response.details as { purchaseToken: string }

      // Verify purchase server-side
      const { data, error } = await supabase.functions.invoke('verify-play-purchase', {
        body: { productId, purchaseToken },
      })

      if (error) throw error

      const result = data as { ok: boolean; error?: string; planId?: string; status?: string }

      if (!result.ok) {
        throw new Error(result.error ?? 'Purchase verification failed')
      }

      // Acknowledge the purchase so Google doesn't refund it
      await service.acknowledge(purchaseToken, 'repeatable')

      // Complete the payment
      await response.complete('success')

      setState((prev) => ({ ...prev, loading: false, error: null }))
      return result
    } catch (err) {
      // User cancelled or error
      const message = err instanceof Error ? err.message : String(err)
      const isCancel = message.includes('AbortError') || message.includes('cancelled')
      setState((prev) => ({
        ...prev,
        loading: false,
        error: isCancel ? null : message,
      }))
      return null
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
