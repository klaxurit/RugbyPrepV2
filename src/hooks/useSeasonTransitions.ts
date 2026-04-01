import { useCallback, useMemo } from 'react'
import type { AnnualPlanningContext } from '../types/annualPlanning'
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
}) {
  const { planningContext, today } = params

  const transition = useMemo((): SeasonTransition | null => {
    if (!planningContext) return null
    return detectSeasonTransitions({
      planningContext,
      today,
      dismissedUntil: readDismissed(),
    })
  }, [planningContext, today])

  const dismiss = useCallback((type: string) => {
    const d = new Date(`${today}T12:00:00`)
    d.setDate(d.getDate() + DISMISS_DAYS)
    const current = readDismissed()
    current[type] = d.toISOString().slice(0, 10)
    writeDismissed(current)
  }, [today])

  return { transition, dismiss }
}
