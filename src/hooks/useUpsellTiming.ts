import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { userScopedKey } from '../services/storage/userScopedStorage'

// ─── Constants ──────────────────────────────────────────────

const MIN_ACCOUNT_AGE_DAYS = 7
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const WEEK_VIEWED_BASE = 'rugbyforge_week_viewed'

function weekViewedKey(userId: string | null): string {
  return userScopedKey(WEEK_VIEWED_BASE, userId)
}

function getDismissKey(pageId: string) {
  return `rugbyforge_upsell_dismissed_${pageId}`
}

// ─── Types ──────────────────────────────────────────────────

interface UpsellTiming {
  canShowUpsell: boolean
  daysRemaining: number
  reason?: 'too_early' | 'no_logs' | 'no_week_view' | 'loading' | 'error'
}

// ─── Hook ───────────────────────────────────────────────────

export function useUpsellTiming(): UpsellTiming {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [accountAgeDays, setAccountAgeDays] = useState<number | null>(null)
  const [hasLogs, setHasLogs] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  // Check localStorage signal (week viewed) — scoped per user.
  const hasWeekView = useMemo(() => {
    try {
      return localStorage.getItem(weekViewedKey(userId)) === 'true'
    } catch {
      return false
    }
  }, [userId])

  // Fetch Supabase signals
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchSignals = async () => {
      setLoading(true)

      try {
        const [profileRes, logsRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('created_at')
            .eq('id', userId)
            .single(),
          supabase
            .from('session_logs')
            .select('id')
            .eq('user_id', userId)
            .limit(1),
        ])

        if (cancelled) return

        // Account age
        if (profileRes.data?.created_at) {
          const createdAt = new Date(profileRes.data.created_at)
          const now = new Date()
          const diffMs = now.getTime() - createdAt.getTime()
          setAccountAgeDays(Math.floor(diffMs / (24 * 60 * 60 * 1000)))
        } else {
          setAccountAgeDays(null)
        }

        // Has logs
        setHasLogs((logsRes.data?.length ?? 0) > 0)
      } catch {
        // Fail-safe: don't show upsell on error
        setAccountAgeDays(null)
        setHasLogs(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchSignals()

    return () => { cancelled = true }
  }, [userId])

  return useMemo(() => {
    if (loading || accountAgeDays === null || hasLogs === null) {
      return { canShowUpsell: false, daysRemaining: MIN_ACCOUNT_AGE_DAYS, reason: 'loading' }
    }

    if (accountAgeDays < MIN_ACCOUNT_AGE_DAYS) {
      return {
        canShowUpsell: false,
        daysRemaining: MIN_ACCOUNT_AGE_DAYS - accountAgeDays,
        reason: 'too_early',
      }
    }

    if (!hasLogs) {
      return { canShowUpsell: false, daysRemaining: 0, reason: 'no_logs' }
    }

    if (!hasWeekView) {
      return { canShowUpsell: false, daysRemaining: 0, reason: 'no_week_view' }
    }

    return { canShowUpsell: true, daysRemaining: 0 }
  }, [loading, accountAgeDays, hasLogs, hasWeekView])
}

// ─── Dismiss helpers ────────────────────────────────────────

export function isDismissed(pageId: string): boolean {
  try {
    const raw = localStorage.getItem(getDismissKey(pageId))
    if (!raw) return false
    const ts = parseInt(raw, 10)
    if (isNaN(ts)) return false
    return Date.now() - ts < DISMISS_COOLDOWN_MS
  } catch {
    return false
  }
}

export function dismissUpsell(pageId: string): void {
  try {
    localStorage.setItem(getDismissKey(pageId), String(Date.now()))
  } catch { /* ignore */ }
}

// ─── Mark week as viewed (call from WeekPage) ──────────────

export function markWeekViewed(userId: string | null): void {
  try {
    localStorage.setItem(weekViewedKey(userId), 'true')
  } catch { /* ignore */ }
}
