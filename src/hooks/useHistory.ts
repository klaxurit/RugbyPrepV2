import { useCallback, useEffect, useState } from 'react'
import type { SessionLog, SessionLogProgramContext } from '../types/training'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { readUserScoped, writeUserScoped } from '../services/storage/userScopedStorage'

const STORAGE_BASE = 'rugbyprep.history'

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

const readFromStorage = (userId: string | null): SessionLog[] => {
  if (typeof window === 'undefined') return []
  const parsed = readUserScoped<SessionLog[]>(STORAGE_BASE, userId)
  return Array.isArray(parsed) ? parsed : []
}

const saveToStorage = (logs: SessionLog[], userId: string | null) => {
  writeUserScoped(STORAGE_BASE, userId, logs)
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

const rowToLog = (row: SessionLogRow): SessionLog => {
  // tonnageKg is transported inside program_context JSONB (no dedicated column yet).
  const ctx = (row.program_context ?? null) as Record<string, unknown> | null
  const tonnageRaw = ctx?.tonnageKg
  const tonnageKg = typeof tonnageRaw === 'number' ? tonnageRaw : undefined
  let programContext: SessionLogProgramContext | undefined
  if (ctx) {
    const { tonnageKg: _drop, ...rest } = ctx as Record<string, unknown>
    void _drop
    programContext = rest as SessionLogProgramContext
  }
  return {
    id: row.id,
    dateISO: row.date_iso,
    week: row.week as SessionLog['week'],
    sessionType: row.session_type as SessionLog['sessionType'],
    fatigue: row.fatigue as SessionLog['fatigue'],
    notes: row.notes ?? undefined,
    rpe: row.rpe ?? undefined,
    durationMin: row.duration_min ?? undefined,
    tonnageKg,
    programSource: (row.program_source as SessionLog['programSource']) ?? undefined,
    legacyRecipeId: row.legacy_recipe_id ?? undefined,
    motherSessionId: row.mother_session_id ?? undefined,
    sessionLabel: row.session_label ?? undefined,
    programContext,
  }
}

const logToRow = (log: SessionLog, userId: string) => {
  const contextOut: Record<string, unknown> = { ...(log.programContext ?? {}) }
  if (log.tonnageKg != null) contextOut.tonnageKg = log.tonnageKg
  return {
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
    program_context: contextOut,
  }
}

// ─── Hook ────────────────────────────────────────────────────

export const useHistory = () => {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [logs, setLogs] = useState<SessionLog[]>(() => readFromStorage(userId))

  // Sync from Supabase on auth. Also re-seed local state from the active user's
  // cache when userId changes, so a new session doesn't keep the previous user's logs.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- required: userId change must reset cache
    setLogs(readFromStorage(userId))
    if (!userId) return
    supabase
      .from('session_logs')
      .select('id, date_iso, week, session_type, fatigue, notes, rpe, duration_min, program_source, legacy_recipe_id, mother_session_id, session_label, program_context')
      .eq('user_id', userId)
      .order('date_iso', { ascending: false })
      .then(({ data, error }) => {
        if (error || !data) return
        const loaded = (data as SessionLogRow[]).map(rowToLog)
        const merged = mergeLogsById(readFromStorage(userId), loaded)
        setLogs(merged)
        saveToStorage(merged, userId)
      })
  }, [userId])

  const addLog = useCallback(
    async (log: Omit<SessionLog, 'id'>) => {
      const id = crypto.randomUUID()
      const completeLog: SessionLog = { ...log, id }
      if (userId) {
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
            saveToStorage(next, userId)
            return next
          })
          return
        }
      }

      // Offline fallback
      setLogs((current) => {
        const next = mergeLogsById([completeLog], current)
        saveToStorage(next, userId)
        return next
      })
    },
    [userId]
  )

  const clearLogs = useCallback(async () => {
    if (userId) {
      await supabase.from('session_logs').delete().eq('user_id', userId)
    }
    setLogs([])
    saveToStorage([], userId)
  }, [userId])

  return { logs, addLog, clearLogs }
}
