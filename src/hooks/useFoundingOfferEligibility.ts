import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { useEntitlements } from './useEntitlements'
import { useHintVisibility } from './useHintVisibility'

export const D2_DELAY_MS = 24 * 60 * 60 * 1000 // 24h
export const FOUNDING_OFFER_HINT_ID = 'founding_offer_2026'

interface FoundingOfferEligibility {
  /** True iff the user matches the trigger : Day 2+ AND ≥1 session AND not paying AND not dismissed. */
  eligible: boolean
  /** Loading any of the upstream signals. */
  loading: boolean
  /** Whether the user has dismissed the offer at least once. Used to gate re-prompts. */
  dismissed: boolean
}

interface EligibilityInputs {
  userId: string | null
  userCreatedAt: number | null
  isPremium: boolean
  hasSession: boolean
  dismissed: boolean
  loading: boolean
  now?: number
}

/**
 * Pure decision function used by the hook AND covered by unit tests.
 * Keep this side-effect-free so it stays testable in isolation.
 */
export function evaluateFoundingEligibility(inputs: EligibilityInputs): boolean {
  if (!inputs.userId) return false
  if (inputs.loading) return false
  if (inputs.isPremium) return false
  if (inputs.dismissed) return false
  if (inputs.userCreatedAt == null) return false
  const now = inputs.now ?? Date.now()
  if (now - inputs.userCreatedAt < D2_DELAY_MS) return false
  if (!inputs.hasSession) return false
  return true
}

/**
 * WS0 Décision #52 — Eligibility for the Founding 49€/an pre-sale offer.
 *
 * Trigger composé (cf. Décision #15) :
 * - `auth.user.created_at + 24h <= now()` (Day 2 since signup)
 * - ET au moins 1 ligne `session_logs` pour ce user (first_session_completed)
 * - ET pas déjà premium ou founding (sinon offre redondante)
 * - ET pas déjà dismissed pour ce hint
 */
export function useFoundingOfferEligibility(): FoundingOfferEligibility {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null
  const userCreatedAt = authState.status === 'authenticated' ? authState.user?.createdAt ?? null : null

  const { isPremium, loading: entitlementsLoading } = useEntitlements()
  const { visible: hintVisible, loading: hintLoading } = useHintVisibility(FOUNDING_OFFER_HINT_ID)
  const dismissed = !hintVisible && !hintLoading

  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    async function check() {
      if (!userId) {
        setHasSession(null)
        return
      }
      const { count, error } = await supabase
        .from('session_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .limit(1)
      if (cancelled) return
      if (error) {
        // On read failure, default to false to avoid surfacing the offer to ineligible users.
        setHasSession(false)
        return
      }
      setHasSession((count ?? 0) > 0)
    }

    void check()
    return () => {
      cancelled = true
    }
  }, [userId])

  const loading = entitlementsLoading || hintLoading || hasSession === null

  const eligible = evaluateFoundingEligibility({
    userId,
    userCreatedAt,
    isPremium,
    hasSession: hasSession === true,
    dismissed,
    loading,
  })

  return { eligible, loading, dismissed }
}
