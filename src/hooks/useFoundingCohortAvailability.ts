import { useEffect, useState } from 'react'
import { fetchFoundingCohortStats, type FoundingCohortStats } from '../services/billing/foundingCohortStats'
import { useAuth } from './useAuth'

/**
 * Server-backed founding cohort (cap 100). Shared by Founding modal and Profile upsell.
 * On RPC failure, stats stays null → fail-open (do not hide the offer on transient errors).
 */
export function useFoundingCohortAvailability(): {
  loading: boolean
  stats: FoundingCohortStats | null
  /** True only when stats loaded successfully and cohort is full. */
  cohortFull: boolean
} {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<FoundingCohortStats | null>(null)

  useEffect(() => {
    if (!userId) {
      /* eslint-disable react-hooks/set-state-in-effect -- logout: clear server-backed cohort snapshot */
      setLoading(false)
      setStats(null)
      /* eslint-enable react-hooks/set-state-in-effect */
      return
    }

    let cancelled = false
    setLoading(true)
    void (async () => {
      const s = await fetchFoundingCohortStats()
      if (cancelled) return
      setStats(s)
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [userId])

  const cohortFull = stats !== null && !stats.accepting_new
  return { loading, stats, cohortFull }
}
