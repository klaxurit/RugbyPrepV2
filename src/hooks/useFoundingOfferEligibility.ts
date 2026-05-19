import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { useEntitlements } from './useEntitlements'
import { useHintVisibility } from './useHintVisibility'
import { useFoundingCohortAvailability } from './useFoundingCohortAvailability'

export const D2_DELAY_MS = 24 * 60 * 60 * 1000 // 24h
export const FOUNDING_OFFER_HINT_ID = 'founding_offer_2026'
const FORCE_SHOW_KEY = 'founding_offer_force_show'

/**
 * Used by /founding route to force-display the modal even if the user has
 * dismissed it before (e.g. user clicked an email/DM link). Cleared by the
 * modal itself once it surfaces.
 */
export function markFoundingForceShow(): void {
  try {
    sessionStorage.setItem(FORCE_SHOW_KEY, '1')
  } catch {
    /* ignore (storage disabled) */
  }
}

export function consumeFoundingForceShow(): boolean {
  try {
    const flag = sessionStorage.getItem(FORCE_SHOW_KEY) === '1'
    if (flag) sessionStorage.removeItem(FORCE_SHOW_KEY)
    return flag
  } catch {
    return false
  }
}

function readFoundingForceShow(): boolean {
  try {
    return sessionStorage.getItem(FORCE_SHOW_KEY) === '1'
  } catch {
    return false
  }
}

interface FoundingOfferEligibility {
  /** True iff the user matches the trigger : Day 2+ AND ≥1 session AND not paying AND not dismissed AND cohort not full (unless forceShow). */
  eligible: boolean
  /** Loading any of the upstream signals. */
  loading: boolean
  /** Whether the user has dismissed the offer at least once. Used to gate re-prompts. */
  dismissed: boolean
  /** Server says founding cohort reached cap (successful RPC only). */
  cohortFull: boolean
  /**
   * Persiste le refus de l’offre (local + Supabase). Doit être la même fonction que celle
   * utilisée pour calculer `eligible` — ne pas appeler `useHintVisibility` en parallèle ailleurs
   * pour le même `FOUNDING_OFFER_HINT_ID`, sinon le dismiss ne met pas à jour `eligible`.
   */
  dismiss: () => void
}

interface EligibilityInputs {
  userId: string | null
  userCreatedAt: number | null
  isPremium: boolean
  hasSession: boolean
  dismissed: boolean
  loading: boolean
  /** When true (server-loaded), hide offer unless forceShow explains sold-out messaging. */
  cohortFull?: boolean
  now?: number
}

/**
 * Pure decision function used by the hook AND covered by unit tests.
 * Keep this side-effect-free so it stays testable in isolation.
 *
 * `forceShow` (set via /founding route) bypasses the dismissed + D2 + session
 * checks. It still respects the no-userId, loading, and isPremium gates.
 * When `cohortFull` is true it still blocks unless `forceShow` — so /
 * founding can explain that the cohort is complete.
 */
export function evaluateFoundingEligibility(inputs: EligibilityInputs & { forceShow?: boolean }): boolean {
  if (!inputs.userId) return false
  if (inputs.loading) return false
  if (inputs.isPremium) return false
  if (inputs.cohortFull && !inputs.forceShow) return false
  if (inputs.forceShow) return true
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
  const { visible: hintVisible, loading: hintLoading, dismiss } = useHintVisibility(FOUNDING_OFFER_HINT_ID)
  const dismissed = !hintVisible && !hintLoading
  const { loading: cohortLoading, cohortFull } = useFoundingCohortAvailability()

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

  const loading = entitlementsLoading || hintLoading || hasSession === null || cohortLoading
  const forceShow = readFoundingForceShow()

  const eligible = evaluateFoundingEligibility({
    userId,
    userCreatedAt,
    isPremium,
    hasSession: hasSession === true,
    dismissed,
    loading,
    forceShow,
    cohortFull,
  })

  return { eligible, loading, dismissed, dismiss, cohortFull }
}
