import { useCallback, useEffect, useState } from 'react'
import type { SessionLog } from '../types/training'

const STORAGE_KEY = 'rugbyprep.history.v1'

const sortNewestFirst = (logs: SessionLog[]): SessionLog[] =>
  [...logs].sort(
    (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
  )

const isSessionLog = (value: unknown): value is SessionLog => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<SessionLog>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.dateISO === 'string' &&
    (candidate.week === 'W1' ||
      candidate.week === 'W2' ||
      candidate.week === 'W3' ||
      candidate.week === 'W4' ||
      candidate.week === 'W5' ||
      candidate.week === 'W6' ||
      candidate.week === 'W7' ||
      candidate.week === 'W8' ||
      candidate.week === 'DELOAD') &&
    (candidate.sessionType === 'UPPER' ||
      candidate.sessionType === 'LOWER' ||
      candidate.sessionType === 'FULL') &&
    (candidate.fatigue === 'OK' || candidate.fatigue === 'FATIGUE')
  )
}

const readLogs = (): SessionLog[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return sortNewestFirst(parsed.filter(isSessionLog))
  } catch {
    return []
  }
}

export const useHistory = () => {
  const [logs, setLogs] = useState<SessionLog[]>(readLogs)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
  }, [logs])

const addLog = useCallback((log: Omit<SessionLog, 'id'>) => {
    const completeLog: SessionLog = {
      ...log,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    }
    setLogs((current) => sortNewestFirst([completeLog, ...current]))
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  return { logs, addLog, clearLogs }
}
