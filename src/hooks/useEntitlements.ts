import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'

type EntitlementRow = {
  entitlement_key: string
  status: 'active' | 'revoked' | 'expired'
  expires_at: string | null
}

type SubscriptionRow = {
  plan_id: string
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive' | 'expired'
}

const PREMIUM_HINTS = new Set([
  'premium_program_adaptations',
  'advanced_notifications',
  'premium_analytics',
  'coach_mode',
  'priority_support',
])

export function useEntitlements() {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [keys, setKeys] = useState<string[]>([])
  const [planId, setPlanId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) {
      setKeys([])
      setPlanId(null)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const [entitlementsResult, subscriptionResult] = await Promise.all([
      supabase
        .from('user_entitlements')
        .select('entitlement_key, status, expires_at')
        .eq('user_id', userId)
        .eq('status', 'active'),
      supabase
        .from('user_subscriptions')
        .select('plan_id, status')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .limit(1)
        .maybeSingle(),
    ])

    const nextError = entitlementsResult.error?.message ?? subscriptionResult.error?.message ?? null
    if (nextError) {
      setError(nextError)
      setKeys([])
      setPlanId(null)
      setLoading(false)
      return
    }

    const nowMs = Date.now()
    const entitlements = ((entitlementsResult.data ?? []) as EntitlementRow[])
      .filter((row) => !row.expires_at || new Date(row.expires_at).getTime() > nowMs)
    const subscription = (subscriptionResult.data ?? null) as SubscriptionRow | null

    setKeys(entitlements.map((row) => row.entitlement_key))
    setPlanId(subscription?.plan_id ?? null)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    let active = true
    void (async () => {
      await refresh()
      if (!active) return
    })()
    return () => {
      active = false
    }
  }, [refresh])

  const hasEntitlement = useCallback(
    (key: string) => keys.includes(key),
    [keys],
  )

  const isPremium = useMemo(
    () => Boolean(
      planId?.startsWith('premium') ||
      keys.some((key) => PREMIUM_HINTS.has(key)),
    ),
    [keys, planId],
  )

  return {
    loading,
    error,
    keys,
    planId,
    isPremium,
    hasEntitlement,
    refresh,
  }
}
