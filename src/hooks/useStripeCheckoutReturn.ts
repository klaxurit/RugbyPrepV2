import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabase/client'

/**
 * Retour Stripe Checkout (?checkout=success&session_id=…).
 * Réessaie la synchro entitlements tant que le webhook n’a pas été traité.
 */
export function useStripeCheckoutReturn(isPremium: boolean, refreshEntitlements: () => Promise<void>) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activationSyncing, setActivationSyncing] = useState(false)
  const [activationSyncTimeout, setActivationSyncTimeout] = useState(false)

  const checkoutSessionId = searchParams.get('session_id')
  const isCheckoutSuccess = searchParams.get('checkout') === 'success'

  useEffect(() => {
    if (!isCheckoutSuccess || isPremium) return

    let cancelled = false
    setActivationSyncing(true)
    setActivationSyncTimeout(false)

    let attempts = 0
    const maxAttempts = 12
    let timer: number | null = null

    const tick = async () => {
      if (checkoutSessionId) {
        await supabase.functions.invoke('sync-checkout-session', {
          body: { sessionId: checkoutSessionId },
        })
      }
      await refreshEntitlements()
      attempts += 1
      if (cancelled) return
      if (attempts >= maxAttempts) {
        setActivationSyncing(false)
        setActivationSyncTimeout(true)
        return
      }
      timer = window.setTimeout(() => {
        void tick()
      }, 2500)
    }

    void tick()

    return () => {
      cancelled = true
      if (timer !== null) window.clearTimeout(timer)
    }
  }, [checkoutSessionId, isCheckoutSuccess, isPremium, refreshEntitlements])

  useEffect(() => {
    if (!isCheckoutSuccess || !isPremium) return

    setActivationSyncing(false)
    setActivationSyncTimeout(false)

    const next = new URLSearchParams(searchParams)
    next.delete('checkout')
    next.delete('session_id')
    setSearchParams(next, { replace: true })
  }, [isCheckoutSuccess, isPremium, searchParams, setSearchParams])

  return {
    isCheckoutSuccess,
    activationSyncing,
    activationSyncTimeout,
  }
}
