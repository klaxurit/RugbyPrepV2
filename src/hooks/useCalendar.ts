import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'
import { syncCalendar } from '../services/calendar/ffrSyncService'
import { applyDeferralRules } from '../services/season/deferralRules'
import type { CalendarEvent } from '../types/training'

const STORAGE_KEY = 'rugbyprep.calendar.v1'
const AUTO_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24h
const CALENDAR_SELECT = 'id, date, type, kickoff_time, opponent, opponent_code, is_home, notes, rpe, duration_min, created_at, source, external_id, competition_id, competition_name, match_day, venue, user_hidden, user_override, synced_at'

// ─── Helpers ────────────────────────────────────────────────

const toDateStr = (d: Date): string => d.toISOString().split('T')[0]

const addDays = (d: Date, days: number): Date => {
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}

function normalizeKickoffTime(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const value = raw.trim()
  if (/^\d{2}:\d{2}$/.test(value)) return value
  if (/^\d{2}:\d{2}:\d{2}/.test(value)) return value.slice(0, 5)
  return value
}

function normalizeCalendarEvent(event: CalendarEvent): CalendarEvent {
  return {
    ...event,
    kickoff_time: normalizeKickoffTime(event.kickoff_time),
    source: event.source ?? 'manual',
  }
}

// detectSeasonPhase removed — season phase is now derived from
// detectAnnualPlanningContext (single source of truth) at the page level.

function readFromStorage(): CalendarEvent[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? (parsed as CalendarEvent[]).map(normalizeCalendarEvent)
      : []
  } catch {
    return []
  }
}

function saveToStorage(events: CalendarEvent[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch { /* ignore */ }
}

// ─── Hook ────────────────────────────────────────────────────

export function useCalendar() {
  const { authState } = useAuth()
  const { profile, updateProfile } = useProfile()
  const userId =
    authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [events, setEvents] = useState<CalendarEvent[]>(readFromStorage)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncNotification, setSyncNotification] = useState<string | null>(null)
  const autoSyncRanRef = useRef(false)
  const profileRef: MutableRefObject<typeof profile> = useRef(profile)
  profileRef.current = profile

  const dismissSyncNotification = useCallback(() => setSyncNotification(null), [])

  // Sync from Supabase when authenticated
  useEffect(() => {
    if (!userId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    supabase
      .from('match_calendar')
      .select(CALENDAR_SELECT)
      .order('date', { ascending: true })
      .then(({ data, error: err }) => {
        setLoading(false)
        if (err) {
          setError(err.message)
          return
        }
        const loaded = ((data ?? []) as CalendarEvent[]).map(normalizeCalendarEvent)
        setEvents(loaded)
        saveToStorage(loaded)
      })
  }, [userId])

  // ── Auto-sync FFR calendar if stale (>24h since last sync) ──
  useEffect(() => {
    if (!userId || autoSyncRanRef.current) return
    const competitionId = profile.ffrCompetitionId
    const clubCode = profile.clubCode
    if (!competitionId || !clubCode) return

    const lastSync = profile.ffrLastSyncAt ? new Date(profile.ffrLastSyncAt).getTime() : 0
    const isStale = Date.now() - lastSync > AUTO_SYNC_INTERVAL_MS
    if (!isStale) return

    autoSyncRanRef.current = true

    // Count current FFR events before sync
    const beforeCount = events.filter(e => e.source === 'ffr_import' && !e.user_hidden).length

    syncCalendar(competitionId, clubCode).then(async (result) => {
      if (result.error) return // silent fail

      // Reload events from Supabase
      const { data } = await supabase
        .from('match_calendar')
        .select(CALENDAR_SELECT)
        .order('date', { ascending: true })

      if (data) {
        const loaded = (data as CalendarEvent[]).map(normalizeCalendarEvent)
        setEvents(loaded)
        saveToStorage(loaded)

        // Compare to detect new matches
        const afterCount = loaded.filter(e => e.source === 'ffr_import' && !e.user_hidden).length
        const diff = afterCount - beforeCount
        if (diff > 0) {
          setSyncNotification(`${diff} nouveau${diff > 1 ? 'x' : ''} match${diff > 1 ? 's' : ''} détecté${diff > 1 ? 's' : ''}`)
        }
      }

      // Update last sync timestamp on profile
      updateProfile({ ffrLastSyncAt: new Date().toISOString() })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, profile.ffrCompetitionId, profile.clubCode])

  const addEvent = useCallback(
    async (payload: Omit<CalendarEvent, 'id' | 'created_at'>): Promise<CalendarEvent | undefined> => {
      if (userId) {
        const { data, error: err } = await supabase
          .from('match_calendar')
          .insert({ ...payload, source: payload.source ?? 'manual', user_id: userId })
          .select(CALENDAR_SELECT)
          .single()
        if (err) { setError(err.message); return undefined }
        const newEvent = normalizeCalendarEvent(data as CalendarEvent)
        setEvents((prev) => {
          const next = [...prev, newEvent].sort((a, b) => a.date.localeCompare(b.date))
          saveToStorage(next)
          return next
        })
        return newEvent
      } else {
        const newEvent: CalendarEvent = {
          ...payload,
          source: payload.source ?? 'manual',
          kickoff_time: normalizeKickoffTime(payload.kickoff_time),
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          created_at: new Date().toISOString(),
        }
        setEvents((prev) => {
          const next = [...prev, newEvent].sort((a, b) => a.date.localeCompare(b.date))
          saveToStorage(next)
          return next
        })
        return newEvent
      }
    },
    [userId]
  )

  const removeEvent = useCallback(
    async (id: string) => {
      if (userId) {
        await supabase
          .from('match_calendar')
          .delete()
          .eq('id', id)
      }
      setEvents((prev) => {
        const next = prev.filter((e) => e.id !== id)
        saveToStorage(next)
        return next
      })
    },
    [userId]
  )

  const updateMatchLoad = useCallback(
    async (eventId: string, rpe: number, durationMin: number) => {
      if (userId) {
        await supabase
          .from('match_calendar')
          .update({ rpe, duration_min: durationMin })
          .eq('id', eventId)
      }
      setEvents((prev) => {
        const next = prev.map((e) =>
          e.id === eventId ? { ...e, rpe, duration_min: durationMin } : e
        )
        saveToStorage(next)
        return next
      })
    },
    [userId]
  )

  const hideImportedEvent = useCallback(
    async (id: string) => {
      if (userId) {
        await supabase
          .from('match_calendar')
          .update({ user_hidden: true })
          .eq('id', id)
      }
      setEvents((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, user_hidden: true } : e))
        saveToStorage(next)
        return next
      })
    },
    [userId]
  )

  const unhideImportedEvent = useCallback(
    async (id: string) => {
      if (userId) {
        await supabase
          .from('match_calendar')
          .update({ user_hidden: false })
          .eq('id', id)
      }
      setEvents((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, user_hidden: false } : e))
        saveToStorage(next)
        return next
      })
    },
    [userId]
  )

  const overrideImportedEvent = useCallback(
    async (id: string, override: { date?: string; kickoff_time?: string; notes?: string }) => {
      if (userId) {
        await supabase
          .from('match_calendar')
          .update({
            user_override: override,
            ...(override.date ? { date: override.date } : {}),
            ...(override.kickoff_time ? { kickoff_time: override.kickoff_time } : {}),
            ...(override.notes !== undefined ? { notes: override.notes } : {}),
          })
          .eq('id', id)
      }
      setEvents((prev) => {
        const next = prev.map((e) =>
          e.id === id
            ? {
                ...e,
                user_override: override,
                ...(override.date ? { date: override.date } : {}),
                ...(override.kickoff_time ? { kickoff_time: override.kickoff_time } : {}),
              }
            : e
        )
        saveToStorage(next)
        return next
      })
    },
    [userId]
  )

  const refreshFromFFR = useCallback(
    async (competitionId: string, clubCode: string) => {
      setLoading(true)
      setError(null)
      const result = await syncCalendar(competitionId, clubCode)
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return result
      }
      // Reload events from Supabase
      if (userId) {
        const { data, error: err } = await supabase
          .from('match_calendar')
          .select(CALENDAR_SELECT)
          .order('date', { ascending: true })
        if (!err && data) {
          const loaded = (data as CalendarEvent[]).map(normalizeCalendarEvent)
          setEvents(loaded)
          saveToStorage(loaded)
        }
      }
      setLoading(false)
      return result
    },
    [userId]
  )

  const today = new Date()
  const todayStr = toDateStr(today)

  // Week bounds (Mon–Sun)
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1
  const weekStart = toDateStr(addDays(today, -dayOfWeek))
  const weekEnd = toDateStr(addDays(today, 6 - dayOfWeek))

  // Filter out hidden events for display
  const visibleEvents = events.filter((e) => !e.user_hidden)

  // ── Structural events: visible minus active valid deferral ──
  const { structuralEvents, shouldPurge: deferralShouldPurge } = useMemo(() => {
    return applyDeferralRules({
      activeDeferral: profile.seasonTransitionState?.activeDeferral,
      visibleEvents,
      today: toDateStr(new Date()),
      returnToTeamTrainingAt: profile.planningAnchors?.returnToTeamTrainingAt,
    })
  }, [visibleEvents, profile.seasonTransitionState?.activeDeferral, profile.planningAnchors?.returnToTeamTrainingAt])

  // ── Purge invalid deferral (side effect) ──
  useEffect(() => {
    if (!deferralShouldPurge) return
    const st = profileRef.current.seasonTransitionState
    if (!st?.activeDeferral) return
    updateProfile({
      seasonTransitionState: {
        ...st,
        activeDeferral: undefined,
      },
    })
  }, [deferralShouldPurge, updateProfile])

  const nextMatch = visibleEvents.find((e) => e.type === 'match' && e.date >= todayStr) ?? null
  const nextStructuralMatch = structuralEvents.find((e) => e.type === 'match' && e.date >= todayStr) ?? null
  const isMatchDay = visibleEvents.some((e) => e.type === 'match' && e.date === todayStr)
  const thisWeekEvents = visibleEvents.filter((e) => e.date >= weekStart && e.date <= weekEnd)
  const hiddenCount = events.filter((e) => e.user_hidden).length
  const ffrCount = visibleEvents.filter((e) => e.source === 'ffr_import').length
  const manualCount = visibleEvents.filter((e) => e.source === 'manual').length

  return {
    events,
    visibleEvents,
    structuralEvents,
    nextMatch,
    /** Next match from structural events only — use for motor/readiness decisions. */
    nextStructuralMatch,
    isMatchDay,
    thisWeekEvents,
    addEvent,
    removeEvent,
    updateMatchLoad,
    hideImportedEvent,
    unhideImportedEvent,
    overrideImportedEvent,
    refreshFromFFR,
    hiddenCount,
    ffrCount,
    manualCount,
    loading,
    error,
    /** Non-null when auto-sync detected new matches. Dismiss after showing to user. */
    syncNotification,
    dismissSyncNotification,
  }
}
