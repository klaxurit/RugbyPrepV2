import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { markFoundingForceShow } from '../hooks/useFoundingOfferEligibility'

/**
 * WS0 — Lightweight landing page for the Founding offer link distributed
 * via DM / email. On mount, sets a session-storage flag so the global
 * `<FoundingOffer>` modal opens immediately on the next route, bypassing
 * the dismissed + D2 + session gates (but never the isPremium gate).
 *
 * Behaviour :
 * - Anonymous user → redirect to /auth/login?redirectTo=/founding
 * - Authenticated user → set force-show flag + redirect to /home (modal
 *   surfaces there).
 */
export function FoundingTriggerPage() {
  const { authState, isInitializing } = useAuth()

  useEffect(() => {
    if (authState.status === 'authenticated') {
      markFoundingForceShow()
    }
  }, [authState.status])

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (authState.status !== 'authenticated') {
    return <Navigate to="/auth/login?redirectTo=/founding" replace />
  }

  return <Navigate to="/home" replace />
}
