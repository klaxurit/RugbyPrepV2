import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ACWRZone } from './useACWR'
import type { CalendarEvent, UserProfile } from '../types/training'
import type { VisibleProgramChangeNotice } from '../types/programChange'
import { detectProgramChange } from '../services/program/detectProgramChange'

const STORAGE_KEY = 'rf.programNotice.v1'
const POSTPONE_DAYS = 7

interface PersistedState {
  acknowledged: Record<string, string>
  postponed: Record<string, string>
}

const EMPTY: PersistedState = { acknowledged: {}, postponed: {} }

function readPersisted(): PersistedState {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    return {
      acknowledged: { ...(parsed.acknowledged ?? {}) },
      postponed: { ...(parsed.postponed ?? {}) },
    }
  } catch {
    return EMPTY
  }
}

function writePersisted(state: PersistedState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota
  }
}

function daysBetween(a: string, b: string): number {
  const parse = (iso: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
    if (!m) return null
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12).getTime()
  }
  const ta = parse(a)
  const tb = parse(b)
  if (ta == null || tb == null) return 0
  return Math.round((tb - ta) / (24 * 60 * 60 * 1000))
}

interface UseProgramChangeNoticeArgs {
  profile: UserProfile | null
  calendarEvents: CalendarEvent[]
  acwrZone: ACWRZone | null
  today: string
}

export interface UseProgramChangeNoticeResult {
  notice: VisibleProgramChangeNotice | null
  acknowledge: () => void
  postpone: () => void
}

/**
 * Surface the highest-priority pending program-change notice for the given
 * profile/calendar/ACWR state, gated by the user's prior acknowledge/postpone
 * actions stored in localStorage.
 *
 * Postpone semantics: hides the notice for 7 days. When it re-surfaces after
 * that, the postpone option is gone (user must acknowledge to dismiss).
 */
export function useProgramChangeNotice(args: UseProgramChangeNoticeArgs): UseProgramChangeNoticeResult {
  const { profile, calendarEvents, acwrZone, today } = args
  const [persisted, setPersisted] = useState<PersistedState>(() => readPersisted())

  useEffect(() => {
    if (typeof window === 'undefined') return
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setPersisted(readPersisted())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const detected = useMemo(() => {
    if (!profile) return null
    if (!profile.weeklySessions || !profile.position) return null
    try {
      return detectProgramChange({
        today,
        weeklyFrequency: (profile.weeklySessions ?? 3) as 2 | 3 | 4,
        positionGroup: 'back_three',
        planningAnchors: profile.planningAnchors,
        trainingBaseline: profile.trainingBaseline,
        acwrZone,
        calendarEvents,
      })
    } catch {
      return null
    }
  }, [profile, calendarEvents, acwrZone, today])

  const visible = useMemo<VisibleProgramChangeNotice | null>(() => {
    if (!detected) return null

    if (persisted.acknowledged[detected.id]) return null

    const postponedAt = persisted.postponed[detected.id]
    if (postponedAt) {
      const elapsed = daysBetween(postponedAt, today)
      if (elapsed < POSTPONE_DAYS) return null
      // Postpone has expired — re-surface but disable the postpone button.
      return { ...detected, canPostponeNow: false }
    }

    return { ...detected, canPostponeNow: detected.postponable }
  }, [detected, persisted, today])

  const acknowledge = useCallback(() => {
    if (!visible) return
    setPersisted((prev) => {
      const next: PersistedState = {
        acknowledged: { ...prev.acknowledged, [visible.id]: today },
        postponed: { ...prev.postponed },
      }
      delete next.postponed[visible.id]
      writePersisted(next)
      return next
    })
  }, [visible, today])

  const postpone = useCallback(() => {
    if (!visible || !visible.canPostponeNow) return
    setPersisted((prev) => {
      const next: PersistedState = {
        acknowledged: { ...prev.acknowledged },
        postponed: { ...prev.postponed, [visible.id]: today },
      }
      writePersisted(next)
      return next
    })
  }, [visible, today])

  return { notice: visible, acknowledge, postpone }
}
