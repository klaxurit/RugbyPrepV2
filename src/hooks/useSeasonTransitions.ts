import { useCallback, useMemo, useState } from 'react'
import type { AnnualPlanningContext } from '../types/annualPlanning'
import type { CalendarEvent, UserProfile } from '../types/training'
import { detectSeasonTransitions, type SeasonTransition } from '../services/season/detectSeasonTransitions'

const STORAGE_KEY = 'rugbyforge.season_transition_dismissed'
const DISMISS_DAYS = 7

function readDismissed(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeDismissed(data: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

export function useSeasonTransitions(params: {
  planningContext: AnnualPlanningContext | null
  today: string
  visibleEvents?: CalendarEvent[]
  profile?: UserProfile
}) {
  const { planningContext, today, visibleEvents, profile } = params
  const [dismissCount, setDismissCount] = useState(0)

  const transition = useMemo((): SeasonTransition | null => {
    // dismissCount dependency forces re-evaluation after dismiss
    void dismissCount
    if (!planningContext) return null
    return detectSeasonTransitions({
      planningContext,
      today,
      dismissedUntil: readDismissed(),
      visibleEvents: visibleEvents?.map((e) => ({
        id: e.id,
        date: e.date,
        type: e.type,
        opponent: e.opponent,
      })),
      hasActiveDeferral: Boolean(profile?.seasonTransitionState?.activeDeferral),
      hasReturnDate: Boolean(profile?.planningAnchors?.returnToTeamTrainingAt),
      offseasonMatchResumeAckEventId: profile?.seasonTransitionState?.offseasonMatchResumeAckEventId,
    })
  }, [
    planningContext,
    today,
    visibleEvents,
    profile?.seasonTransitionState?.activeDeferral,
    profile?.seasonTransitionState?.offseasonMatchResumeAckEventId,
    profile?.planningAnchors?.returnToTeamTrainingAt,
    dismissCount,
  ])

  const dismiss = useCallback((type: string) => {
    // match_detected_in_offseason is NOT dismissed via localStorage — it's controlled by activeDeferral
    if (type === 'match_detected_in_offseason') return
    const d = new Date(`${today}T12:00:00`)
    d.setDate(d.getDate() + DISMISS_DAYS)
    const current = readDismissed()
    current[type] = d.toISOString().slice(0, 10)
    writeDismissed(current)
    setDismissCount((c) => c + 1)
  }, [today])

  return { transition, dismiss }
}
