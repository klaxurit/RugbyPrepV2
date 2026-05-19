import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../services/supabase/client'

/**
 * Retour Stripe Checkout (?checkout=success&session_id=…).
 * Réessaie la synchro entitlements tant que le webhook n’a pas été traité.
 */
export function useStripeCheckoutReturn(isPremium: boolean, refreshEntitlements: () => Promise<void>) {
  const [searchParams, setSearchParams] = useSearchParams()
  /** Session pour laquelle la synchro a échoué (timeout) — évite setState synchrone au montage de l’effet. */
  const [timedOutSessionId, setTimedOutSessionId] = useState<string | null>(null)

  const checkoutSessionId = searchParams.get('session_id')
  const isCheckoutSuccess = searchParams.get('checkout') === 'success'
  const needsActivationSync = isCheckoutSuccess && !isPremium
  const activationSyncTimeout =
    needsActivationSync &&
    timedOutSessionId != null &&
    timedOutSessionId === (checkoutSessionId ?? '')
  const activationSyncing = needsActivationSync && !activationSyncTimeout

  useEffect(() => {
    if (!needsActivationSync) return

    let cancelled = false
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
        setTimedOutSessionId(checkoutSessionId ?? '')
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
  }, [checkoutSessionId, needsActivationSync, refreshEntitlements])

  useEffect(() => {
    if (!isCheckoutSuccess || !isPremium) return

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
