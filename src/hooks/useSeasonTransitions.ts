/**
 * Season transition ownership:
 * - Home is the primary surface (`SeasonTransitionBanner` + dismiss).
 * - Profile (`MaSituationSection`) is for explicit manual overrides only; see
 *   `shouldShowProfileSeasonActions` when a Home banner already covers the same case.
 */
import { useCallback, useMemo, useState } from 'react'
import type { AnnualPlanningContext } from '../types/annualPlanning'
import type { CalendarEvent, UserProfile } from '../types/training'
import { detectSeasonTransitions, type SeasonTransition } from '../services/season/detectSeasonTransitions'
import { userScopedKey } from '../services/storage/userScopedStorage'
import { useAuth } from './useAuth'
import { syncDismissToSupabase, useMergeRemoteDismisses } from './useDismissedUntilSync'

const DISMISS_STORAGE_BASE = 'rugbyforge.season_transition_dismissed'
const ONBOARDING_COMPLETED_STORAGE_BASE = 'rugbyprep.onboarding.completedAt'
const DISMISS_DAYS = 7
const HINT_PREFIX = 'season_transition:'

function readOnboardingCompletedAt(userId: string | null): string | undefined {
  try {
    return localStorage.getItem(userScopedKey(ONBOARDING_COMPLETED_STORAGE_BASE, userId)) ?? undefined
  } catch {
    return undefined
  }
}

function readDismissed(userId: string | null): Record<string, string> {
  try {
    const raw = localStorage.getItem(userScopedKey(DISMISS_STORAGE_BASE, userId))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeDismissed(data: Record<string, string>, userId: string | null) {
  try {
    localStorage.setItem(userScopedKey(DISMISS_STORAGE_BASE, userId), JSON.stringify(data))
  } catch { /* ignore */ }
}

export function useSeasonTransitions(params: {
  planningContext: AnnualPlanningContext | null
  today: string
  visibleEvents?: CalendarEvent[]
  profile?: UserProfile
}) {
  const { planningContext, today, visibleEvents, profile } = params
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null
  const [dismissCount, setDismissCount] = useState(0)

  // Cross-device sync best-effort : merge dismisses Supabase dans le store local.
  useMergeRemoteDismisses({
    userId,
    hintPrefix: HINT_PREFIX,
    readLocal: () => readDismissed(userId),
    writeLocal: (data) => {
      writeDismissed(data, userId)
      setDismissCount((c) => c + 1)
    },
    defaultCooldownDays: DISMISS_DAYS,
  })

  const transition = useMemo((): SeasonTransition | null => {
    // dismissCount dependency forces re-evaluation after dismiss
    void dismissCount
    if (!planningContext) return null
    return detectSeasonTransitions({
      planningContext,
      today,
      dismissedUntil: readDismissed(userId),
      visibleEvents: visibleEvents?.map((e) => ({
        id: e.id,
        date: e.date,
        type: e.type,
        opponent: e.opponent,
        match_kind: e.match_kind,
      })),
      hasActiveDeferral: Boolean(profile?.seasonTransitionState?.activeDeferral),
      hasReturnDate: Boolean(profile?.planningAnchors?.returnToTeamTrainingAt),
      offseasonMatchResumeAckEventId: profile?.seasonTransitionState?.offseasonMatchResumeAckEventId,
      onboardingCompletedAt: readOnboardingCompletedAt(userId),
    })
  }, [
    planningContext,
    today,
    visibleEvents,
    profile?.seasonTransitionState?.activeDeferral,
    profile?.seasonTransitionState?.offseasonMatchResumeAckEventId,
    profile?.planningAnchors?.returnToTeamTrainingAt,
    dismissCount,
    userId,
  ])

  const dismiss = useCallback((type: string) => {
    // match_detected_in_offseason is NOT dismissed via localStorage — it's controlled by activeDeferral
    if (type === 'match_detected_in_offseason') return
    const d = new Date(`${today}T12:00:00`)
    d.setDate(d.getDate() + DISMISS_DAYS)
    const current = readDismissed(userId)
    current[type] = d.toISOString().slice(0, 10)
    writeDismissed(current, userId)
    setDismissCount((c) => c + 1)
    // Cross-device sync best-effort.
    syncDismissToSupabase(userId, `${HINT_PREFIX}${type}`)
  }, [today, userId])

  return { transition, dismiss }
}
