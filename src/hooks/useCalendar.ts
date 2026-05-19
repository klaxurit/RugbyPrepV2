import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'
import { syncCalendar } from '../services/calendar/ffrSyncService'
import { applyDeferralRules } from '../services/season/deferralRules'
import { readUserScoped, writeUserScoped } from '../services/storage/userScopedStorage'
import type { CalendarEvent, MatchKind } from '../types/training'
import { useProgramEvolutionSheet } from './useProgramEvolutionSheet'
import { getToday } from '../services/ui/debugDateOverride'

const STORAGE_BASE = 'rugbyprep.calendar'
const AUTO_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000 // 24h
const CALENDAR_SELECT =
  'id, date, type, kickoff_time, opponent, opponent_code, is_home, is_neutral, notes, rpe, duration_min, created_at, source, external_id, competition_id, competition_name, match_day, venue, user_hidden, user_override, synced_at, match_kind'

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

function readFromStorage(userId: string | null): CalendarEvent[] {
  const parsed = readUserScoped<CalendarEvent[]>(STORAGE_BASE, userId)
  if (!Array.isArray(parsed)) return []
  return parsed.map(normalizeCalendarEvent)
}

function saveToStorage(events: CalendarEvent[], userId: string | null) {
  writeUserScoped(STORAGE_BASE, userId, events)
}

// ─── Hook ────────────────────────────────────────────────────

/**
 * Implémentation interne — appelée UNE SEULE FOIS par CalendarProvider.
 * Les composants consomment via `useCalendar()` (ré-exporté plus bas)
 * qui lit le context partagé. Sans ça, chaque caller avait sa propre
 * copie de state et les mutations (ex. removeEvent depuis MatchEditDrawer)
 * ne propageaient pas vers les pages parentes.
 */
export function useCalendarSource() {
  const { authState } = useAuth()
  const { profile, updateProfile } = useProfile()
  const { openProgramEvolution } = useProgramEvolutionSheet()
  const userId =
    authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [events, setEvents] = useState<CalendarEvent[]>(() => readFromStorage(userId))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const autoSyncRanRef = useRef(false)
  const profileRef: MutableRefObject<typeof profile> = useRef(profile)
  profileRef.current = profile

  // Sync from Supabase when authenticated — and re-seed state from the new
  // user's cache first so the current render doesn't keep the previous user's
  // events visible between userId change and Supabase response.
  useEffect(() => {
    setEvents(readFromStorage(userId))
    if (!userId) return
    setLoading(true)
    supabase
      .from('match_calendar')
      .select(CALENDAR_SELECT)
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .then(({ data, error: err }) => {
        setLoading(false)
        if (err) {
          setError(err.message)
          return
        }
        const loaded = ((data ?? []) as CalendarEvent[]).map(normalizeCalendarEvent)
        setEvents(loaded)
        saveToStorage(loaded, userId)
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
        .eq('user_id', userId)
        .order('date', { ascending: true })

      if (data) {
        const loaded = (data as CalendarEvent[]).map(normalizeCalendarEvent)
        setEvents(loaded)
        saveToStorage(loaded, userId)

        // Compare to detect new matches
        const afterCount = loaded.filter(e => e.source === 'ffr_import' && !e.user_hidden).length
        const diff = afterCount - beforeCount
        if (diff > 0) {
          const todayStr = getToday()
          const nextMatch = loaded.find(
            (e) => e.type === 'match' && !e.user_hidden && e.date >= todayStr,
          )
          openProgramEvolution({
            matchDateISO: nextMatch?.date,
            programNoticeId: nextMatch ? undefined : null,
          })
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
          saveToStorage(next, userId)
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
          saveToStorage(next, userId)
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
        saveToStorage(next, userId)
        return next
      })
      // Nettoyage des références au match supprimé dans le profil :
      //   - `activeDeferral` : sera de toute façon purgé par applyDeferralRules
      //     (rule 'match_removed_or_hidden') au prochain render, mais on
      //     évite un round-trip en le faisant ici.
      //   - `offseasonMatchResumeAckEventId` : reste sinon stale à pointer
      //     un eventId qui n'existe plus → l'utilisateur reverrait le
      //     banner `match_detected_in_offseason` s'il rajoutait un match
      //     plus tard, mais le moteur garderait la résolution in_season
      //     pour rien. Bonus : si c'était le seul match du calendrier, le
      //     cycle re-bascule naturellement en off-season au prochain
      //     resolve (le moteur ne voit plus de match), ce qui répond
      //     directement au "propose à l'utilisateur de revenir à son
      //     ancien programme" — pas besoin d'une popup supplémentaire.
      const st = profileRef.current.seasonTransitionState
      if (
        st?.offseasonMatchResumeAckEventId === id ||
        st?.activeDeferral?.eventId === id
      ) {
        updateProfile({
          seasonTransitionState: {
            ...st,
            ...(st.offseasonMatchResumeAckEventId === id
              ? { offseasonMatchResumeAckEventId: undefined }
              : {}),
            ...(st.activeDeferral?.eventId === id ? { activeDeferral: undefined } : {}),
          },
        })
      }
    },
    [userId, updateProfile]
  )

  const updateMatchKind = useCallback(
    async (eventId: string, match_kind: MatchKind) => {
      if (userId) {
        await supabase.from('match_calendar').update({ match_kind }).eq('id', eventId)
      }
      setEvents((prev) => {
        const next = prev.map((e) => (e.id === eventId ? { ...e, match_kind } : e))
        saveToStorage(next, userId)
        return next
      })
    },
    [userId],
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
        saveToStorage(next, userId)
        return next
      })
    },
    [userId]
  )

  const setMatchNeutral = useCallback(
    async (eventId: string, isNeutral: boolean) => {
      if (userId) {
        await supabase
          .from('match_calendar')
          .update({ is_neutral: isNeutral })
          .eq('id', eventId)
      }
      setEvents((prev) => {
        const next = prev.map((e) =>
          e.id === eventId ? { ...e, is_neutral: isNeutral } : e
        )
        saveToStorage(next, userId)
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
        saveToStorage(next, userId)
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
        saveToStorage(next, userId)
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
        saveToStorage(next, userId)
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
          .eq('user_id', userId)
          .order('date', { ascending: true })
        if (!err && data) {
          const loaded = (data as CalendarEvent[]).map(normalizeCalendarEvent)
          setEvents(loaded)
          saveToStorage(loaded, userId)
          if (result.imported > 0) {
            const todayStr = getToday()
            const nextMatch = loaded.find(
              (e) => e.type === 'match' && !e.user_hidden && e.date >= todayStr,
            )
            openProgramEvolution({
              matchDateISO: nextMatch?.date,
              programNoticeId: nextMatch ? undefined : null,
            })
          }
        }
      }
      setLoading(false)
      return result
    },
    [userId, openProgramEvolution],
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
    updateMatchKind,
    updateMatchLoad,
    setMatchNeutral,
    hideImportedEvent,
    unhideImportedEvent,
    overrideImportedEvent,
    refreshFromFFR,
    hiddenCount,
    ffrCount,
    manualCount,
    loading,
    error,
  }
}

// Re-export du hook public consommé par les composants — il lit le
// context CalendarContext alimenté par CalendarProvider (App.tsx).
// Source unique de vérité pour les events calendrier dans toute l'app :
// une mutation depuis n'importe quel sous-composant (MatchEditDrawer,
// ProfilePage, etc.) propage vers tous les consommateurs sans
// re-fetch ni cache désynchronisé.
export { useCalendar } from '../contexts/calendarContextValue'
