import { useCallback, useEffect, useState } from 'react'
import type { SessionLog, SessionLogProgramContext } from '../types/training'
import { supabase } from '../services/supabase/client'
import { useAuth } from './useAuth'
import { readUserScoped, writeUserScoped } from '../services/storage/userScopedStorage'

const STORAGE_BASE = 'rugbyprep.history'
const DELETED_IDS_BASE = 'rugbyprep.history.deleted'
const HISTORY_CHANGED_EVENT = 'rf.history.changed'

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

const readDeletedIds = (userId: string | null): Set<string> => {
  if (typeof window === 'undefined') return new Set()
  const parsed = readUserScoped<string[]>(DELETED_IDS_BASE, userId)
  return new Set(Array.isArray(parsed) ? parsed : [])
}

const saveDeletedIds = (ids: Set<string>, userId: string | null) => {
  writeUserScoped(DELETED_IDS_BASE, userId, [...ids])
}

const rememberDeletedIds = (userId: string | null, ids: string[]) => {
  if (ids.length === 0) return
  const next = readDeletedIds(userId)
  for (const id of ids) next.add(id)
  saveDeletedIds(next, userId)
}

/** Exclut les logs tombstonés (évite la résurrection via merge offline). */
export const excludeDeletedLogs = (
  logs: SessionLog[],
  deletedIds: Set<string>,
): SessionLog[] => {
  if (deletedIds.size === 0) return logs
  return logs.filter((log) => !deletedIds.has(log.id))
}

/**
 * Merge local + remote en ignorant les ids annulés.
 * Un tombstone ne se retire que lorsque le remote ne renvoie plus l'id
 * (confirmation que la suppression a tenu — pas un fetch périmé).
 */
export const mergeHistoryAfterRemoteFetch = (
  local: SessionLog[],
  remote: SessionLog[],
  deletedIds: Set<string>,
): { logs: SessionLog[]; deletedIds: Set<string> } => {
  const remoteIds = new Set(remote.map((l) => l.id))
  const nextDeleted = new Set<string>()
  for (const id of deletedIds) {
    if (remoteIds.has(id)) nextDeleted.add(id)
  }
  return {
    logs: excludeDeletedLogs(mergeLogsById(local, remote), deletedIds),
    deletedIds: nextDeleted,
  }
}

const notifyHistoryChanged = () => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(HISTORY_CHANGED_EVENT))
}

const applyLocalLogs = (
  userId: string | null,
  setLogs: (logs: SessionLog[] | ((current: SessionLog[]) => SessionLog[])) => void,
  next: SessionLog[],
) => {
  saveToStorage(next, userId)
  setLogs(next)
  notifyHistoryChanged()
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
  slot_signature: string | null
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
    slotSignature: row.slot_signature ?? undefined,
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
    slot_signature: log.slotSignature ?? null,
  }
}

const SESSION_LOG_SELECT =
  'id, date_iso, week, session_type, fatigue, notes, rpe, duration_min, program_source, legacy_recipe_id, mother_session_id, session_label, program_context, slot_signature'

// ─── Hook ────────────────────────────────────────────────────

export const useHistory = () => {
  const { authState } = useAuth()
  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [logs, setLogs] = useState<SessionLog[]>(() =>
    excludeDeletedLogs(readFromStorage(userId), readDeletedIds(userId)),
  )

  // Sync from Supabase on auth. Also re-seed local state from the active user's
  // cache when userId changes, so a new session doesn't keep the previous user's logs.
  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- required: userId change must reset cache
    setLogs(excludeDeletedLogs(readFromStorage(userId), readDeletedIds(userId)))
    if (!userId) return

    supabase
      .from('session_logs')
      .select(SESSION_LOG_SELECT)
      .eq('user_id', userId)
      .order('date_iso', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled || error || !data) return
        const loaded = (data as SessionLogRow[]).map(rowToLog)
        const deletedIds = readDeletedIds(userId)
        const { logs: merged, deletedIds: nextDeleted } = mergeHistoryAfterRemoteFetch(
          readFromStorage(userId),
          loaded,
          deletedIds,
        )
        saveDeletedIds(nextDeleted, userId)
        saveToStorage(merged, userId)
        setLogs(merged)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  // Chaque instance useHistory a son propre state : resync après delete/add ailleurs.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => {
      setLogs(excludeDeletedLogs(readFromStorage(userId), readDeletedIds(userId)))
    }
    window.addEventListener(HISTORY_CHANGED_EVENT, sync)
    return () => window.removeEventListener(HISTORY_CHANGED_EVENT, sync)
  }, [userId])

  const addLog = useCallback(
    async (log: Omit<SessionLog, 'id'>): Promise<SessionLog | null> => {
      // Idempotency: si un log existe déjà avec le même slotSignature, on UPDATE
      // au lieu d'INSERT pour éviter le double-comptage (cas free→premium qui
      // ré-ouvre une séance pour ajouter ses charges).
      if (log.slotSignature && userId) {
        const existing = await supabase
          .from('session_logs')
          .select('id')
          .eq('user_id', userId)
          .eq('slot_signature', log.slotSignature)
          .maybeSingle()
        if (existing.data?.id) {
          const updated: SessionLog = { ...log, id: existing.data.id }
          const { data, error } = await supabase
            .from('session_logs')
            .update(logToRow(updated, userId))
            .eq('id', existing.data.id)
            .select(SESSION_LOG_SELECT)
            .single()
          if (!error && data) {
            const saved = rowToLog(data as SessionLogRow)
            const deleted = readDeletedIds(userId)
            if (deleted.delete(saved.id)) saveDeletedIds(deleted, userId)
            setLogs((current) => {
              const next = mergeLogsById([saved], current)
              saveToStorage(next, userId)
              notifyHistoryChanged()
              return next
            })
            return saved
          }
        }
      }

      const id = crypto.randomUUID()
      const completeLog: SessionLog = { ...log, id }
      if (userId) {
        const { data, error } = await supabase
          .from('session_logs')
          .insert(logToRow(completeLog, userId))
          .select(SESSION_LOG_SELECT)
          .single()
        if (!error && data) {
          const saved = rowToLog(data as SessionLogRow)
          const deleted = readDeletedIds(userId)
          if (deleted.delete(saved.id)) saveDeletedIds(deleted, userId)
          setLogs((current) => {
            const next = mergeLogsById([saved], current)
            saveToStorage(next, userId)
            notifyHistoryChanged()
            return next
          })
          return saved
        }
      }

      // Offline fallback
      setLogs((current) => {
        const next = mergeLogsById([completeLog], current)
        saveToStorage(next, userId)
        notifyHistoryChanged()
        return next
      })
      return completeLog
    },
    [userId]
  )

  const clearLogs = useCallback(async () => {
    if (userId) {
      await supabase.from('session_logs').delete().eq('user_id', userId)
    }
    saveDeletedIds(new Set(), userId)
    applyLocalLogs(userId, setLogs, [])
  }, [userId])

  /**
   * Supprime une séance enregistrée pour pouvoir la refaire.
   * Vérifie que la ligne a bien disparu côté Supabase (sinon RLS no-op silencieux),
   * et pose un tombstone pour empêcher un fetch périmé / merge offline de la ressusciter.
   */
  const deleteLog = useCallback(
    async (logId: string, slotSignature?: string | null): Promise<boolean> => {
      const removedIds = new Set<string>([logId])

      if (userId) {
        const { data, error } = await supabase
          .from('session_logs')
          .delete()
          .eq('id', logId)
          .eq('user_id', userId)
          .select('id')

        if (error) {
          console.error('[useHistory] deleteLog failed:', error.message)
          return false
        }

        let deletedRows = data ?? []
        if (deletedRows.length === 0 && slotSignature) {
          const fallback = await supabase
            .from('session_logs')
            .delete()
            .eq('user_id', userId)
            .eq('slot_signature', slotSignature)
            .select('id')
          if (fallback.error) {
            console.error('[useHistory] deleteLog slot fallback failed:', fallback.error.message)
            return false
          }
          deletedRows = fallback.data ?? []
        }

        if (deletedRows.length === 0) {
          console.error('[useHistory] deleteLog: aucune ligne supprimée', { logId, slotSignature })
          return false
        }

        for (const row of deletedRows) removedIds.add(row.id)
      }

      rememberDeletedIds(userId, [...removedIds])
      const next = excludeDeletedLogs(readFromStorage(userId), readDeletedIds(userId)).filter(
        (log) => !removedIds.has(log.id) && !(slotSignature && log.slotSignature === slotSignature),
      )
      applyLocalLogs(userId, setLogs, next)
      return true
    },
    [userId],
  )

  return { logs, addLog, clearLogs, deleteLog }
}
