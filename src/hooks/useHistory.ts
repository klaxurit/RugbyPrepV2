import { useCallback, useEffect, useState } from 'react'
import type { SessionLog, SessionLogProgramContext } from '../types/training'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { DEMO_MODE_KEY } from '../data/fakeDataForProgress'

const STORAGE_KEY = 'rugbyprep.history.v1'

const sortNewestFirst = (logs: SessionLog[]): SessionLog[] =>
  [...logs].sort(
    (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
  )

export const mergeLogsById = (...logGroups: SessionLog[][]): SessionLog[] => {
  const merged = new Map<string, SessionLog>()

  for (const group of logGroups) {
    for (const log of group) {
      merged.set(log.id, log)
    }
  }

  return sortNewestFirst([...merged.values()])
}

const readFromStorage = (): SessionLog[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as SessionLog[]) : []
  } catch {
    return []
  }
}

const saveToStorage = (logs: SessionLog[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
  } catch { /* ignore */ }
}

// ─── Row ↔ SessionLog mapping ──────────────────────────────────

type SessionLogRow = {
  id: string
  date_iso: string
  week: string
  session_type: string
  fatigue: string
  notes: string | null
  rpe: number | null
  duration_min: number | null
  program_source: string | null
  legacy_recipe_id: string | null
  mother_session_id: string | null
  session_label: string | null
  program_context: Record<string, unknown> | null
}

const rowToLog = (row: SessionLogRow): SessionLog => ({
  id: row.id,
  dateISO: row.date_iso,
  week: row.week as SessionLog['week'],
  sessionType: row.session_type as SessionLog['sessionType'],
  fatigue: row.fatigue as SessionLog['fatigue'],
  notes: row.notes ?? undefined,
  rpe: row.rpe ?? undefined,
  durationMin: row.duration_min ?? undefined,
  programSource: (row.program_source as SessionLog['programSource']) ?? undefined,
  legacyRecipeId: row.legacy_recipe_id ?? undefined,
  motherSessionId: row.mother_session_id ?? undefined,
  sessionLabel: row.session_label ?? undefined,
  programContext: row.program_context
    ? (row.program_context as SessionLogProgramContext)
    : undefined,
})

const logToRow = (log: SessionLog, userId: string) => ({
  id: log.id,
  user_id: userId,
  date_iso: log.dateISO,
  week: log.week,
  session_type: log.sessionType,
  fatigue: log.fatigue,
  notes: log.notes ?? null,
  rpe: log.rpe ?? null,
  duration_min: log.durationMin ?? null,
  program_source: log.programSource ?? null,
  legacy_recipe_id: log.legacyRecipeId ?? null,
  mother_session_id: log.motherSessionId ?? null,
  session_label: log.sessionLabel ?? null,
  program_context: log.programContext ?? {},
})

// ─── Hook ────────────────────────────────────────────────────

export const useHistory = () => {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [logs, setLogs] = useState<SessionLog[]>(readFromStorage)

  // Sync from Supabase on auth (skip if demo mode — keep localStorage data)
  useEffect(() => {
    if (!userId) return
    if (typeof window !== 'undefined' && window.localStorage.getItem(DEMO_MODE_KEY) === '1') return
    supabase
      .from('session_logs')
      .select('id, date_iso, week, session_type, fatigue, notes, rpe, duration_min, program_source, legacy_recipe_id, mother_session_id, session_label, program_context')
      .order('date_iso', { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) return
        const loaded = (data as SessionLogRow[]).map(rowToLog)
        const merged = mergeLogsById(readFromStorage(), loaded)
        setLogs(merged)
        saveToStorage(merged)
      })
  }, [userId])

  const addLog = useCallback(
    async (log: Omit<SessionLog, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const completeLog: SessionLog = { ...log, id }
      const demoMode = typeof window !== 'undefined' && window.localStorage.getItem(DEMO_MODE_KEY) === '1'

      if (userId && !demoMode) {
        const { data, error } = await supabase
          .from('session_logs')
          .insert(logToRow(completeLog, userId))
          .select('id, date_iso, week, session_type, fatigue, notes, rpe, duration_min, program_source, legacy_recipe_id, mother_session_id, session_label, program_context')
          .single()
        if (!error && data) {
          // Use the server-returned row (same data, server-assigned id if needed)
          const saved = rowToLog(data as SessionLogRow)
          setLogs((current) => {
            const next = mergeLogsById([saved], current)
            saveToStorage(next)
            return next
          })
          return
        }
      }

      // Offline fallback
      setLogs((current) => {
        const next = mergeLogsById([completeLog], current)
        saveToStorage(next)
        return next
      })
    },
    [userId]
  )

  const clearLogs = useCallback(async () => {
    const demoMode = typeof window !== 'undefined' && window.localStorage.getItem(DEMO_MODE_KEY) === '1'
    if (userId && !demoMode) {
      await supabase.from('session_logs').delete().eq('user_id', userId)
    }
    setLogs([])
    saveToStorage([])
  }, [userId])

  return { logs, addLog, clearLogs }
}
