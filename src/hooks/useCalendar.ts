import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import type { CalendarEvent, SeasonPhase } from '../types/training'

const STORAGE_KEY = 'rugbyprep.calendar.v1'

// ─── Helpers ────────────────────────────────────────────────

const toDateStr = (d: Date): string => d.toISOString().split('T')[0]

const addDays = (d: Date, days: number): Date => {
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}

function detectSeasonPhase(events: CalendarEvent[], today: Date): SeasonPhase {
  const month = today.getMonth() + 1 // 1-12
  const todayStr = toDateStr(today)
  const fourWeeksLaterStr = toDateStr(addDays(today, 28))
  const twoWeeksAgoStr = toDateStr(addDays(today, -14))

  const hasUpcomingMatch = events.some(
    (e) => e.type === 'match' && e.date >= todayStr && e.date <= fourWeeksLaterStr
  )
  const hasRecentMatch = events.some(
    (e) => e.type === 'match' && e.date >= twoWeeksAgoStr && e.date < todayStr
  )

  // If user has entered match data in the activity window, trust it
  if (hasUpcomingMatch || hasRecentMatch) {
    if (month >= 4 && month <= 5) return 'playoffs'
    return 'in-season'
  }

  // Fallback: month-based (French FFR season)
  if (month >= 6 && month <= 7) return 'off-season'
  if (month === 8) return 'pre-season'
  if (month >= 4 && month <= 5) return 'playoffs'
  return 'in-season' // Sept–March
}

function readFromStorage(): CalendarEvent[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as CalendarEvent[]) : []
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
  const userId =
    authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [events, setEvents] = useState<CalendarEvent[]>(readFromStorage)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync from Supabase when authenticated
  useEffect(() => {
    if (!userId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    supabase
      .from('match_calendar')
      .select('id, date, type, kickoff_time, opponent, opponent_code, is_home, notes, rpe, duration_min, created_at')
      .order('date', { ascending: true })
      .then(({ data, error: err }) => {
        setLoading(false)
        if (err) {
          setError(err.message)
          return
        }
        const loaded = (data ?? []) as CalendarEvent[]
        setEvents(loaded)
        saveToStorage(loaded)
      })
  }, [userId])

  const addEvent = useCallback(
    async (payload: Omit<CalendarEvent, 'id' | 'created_at'>) => {
      if (userId) {
        const { data, error: err } = await supabase
          .from('match_calendar')
          .insert({ ...payload, user_id: userId })
          .select('id, date, type, kickoff_time, opponent, opponent_code, is_home, notes, rpe, duration_min, created_at')
          .single()
        if (err) { setError(err.message); return }
        const newEvent = data as CalendarEvent
        setEvents((prev) => {
          const next = [...prev, newEvent].sort((a, b) => a.date.localeCompare(b.date))
          saveToStorage(next)
          return next
        })
      } else {
        const newEvent: CalendarEvent = {
          ...payload,
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          created_at: new Date().toISOString(),
        }
        setEvents((prev) => {
          const next = [...prev, newEvent].sort((a, b) => a.date.localeCompare(b.date))
          saveToStorage(next)
          return next
        })
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

  const today = new Date()
  const todayStr = toDateStr(today)

  // Week bounds (Mon–Sun)
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1
  const weekStart = toDateStr(addDays(today, -dayOfWeek))
  const weekEnd = toDateStr(addDays(today, 6 - dayOfWeek))

  const nextMatch = events.find((e) => e.type === 'match' && e.date >= todayStr) ?? null
  const isMatchDay = events.some((e) => e.type === 'match' && e.date === todayStr)
  const thisWeekEvents = events.filter((e) => e.date >= weekStart && e.date <= weekEnd)
  const seasonPhase = detectSeasonPhase(events, today)

  return {
    events,
    nextMatch,
    isMatchDay,
    thisWeekEvents,
    seasonPhase,
    addEvent,
    removeEvent,
    updateMatchLoad,
    loading,
    error,
  }
}
