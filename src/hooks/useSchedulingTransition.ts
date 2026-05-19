/**
 * Detects scheduling mode transitions and return-after-break.
 *
 * Uses a persisted previous-mode baseline to distinguish real transitions
 * from current-state. First access with no baseline initializes silently.
 *
 * Render-pure: detection is read-only. Baseline updates happen in useEffect.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Lang } from '../i18n/appLabels'
import { schedulingTransitionLabel } from '../i18n/programSurfaces'
import type { SchedulingMode, SchedulingTransition } from '../types/scheduling'
import type { SessionLog } from '../types/training'
import { syncDismissToSupabase, useMergeRemoteDismisses } from './useDismissedUntilSync'

const HINT_PREFIX = 'scheduling_transition:'

// ── Constants ───────────────────────────────────────────────────────

const BASELINE_KEY_PREFIX = 'rugbyprep.schedulingMode.baseline'
const DISMISS_KEY_PREFIX = 'rugbyprep.schedulingTransition.dismissed'
const DEFAULT_DISMISS_DAYS = 7
const RETURN_AFTER_BREAK_DISMISS_DAYS = 1
const RETURN_AFTER_BREAK_THRESHOLD_DAYS = 14

// ── Storage interface (injectable for testing) ──────────────────────

export interface TransitionStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

// ── Public interface ────────────────────────────────────────────────

export interface UseSchedulingTransitionParams {
  schedulingMode: SchedulingMode | null
  logs: SessionLog[]
  today: string
  userId?: string | null
  lang?: Lang
  storage?: TransitionStorage
}

export interface UseSchedulingTransitionResult {
  transition: SchedulingTransition | null
  dismiss: (type: string) => void
}

// ── Hook ────────────────────────────────────────────────────────────

export function useSchedulingTransition(
  params: UseSchedulingTransitionParams,
): UseSchedulingTransitionResult {
  const { schedulingMode, logs, today, userId, lang = 'fr', storage = localStorage } = params
  const identity = userId ?? 'anon'
  const dismissKey = `${DISMISS_KEY_PREFIX}.${identity}`

  // Forces useMemo re-eval after dismiss writes to localStorage (which isn't reactive).
  const [dismissCount, setDismissCount] = useState(0)

  // Cross-device sync best-effort : merge Supabase dismisses dans le store
  // local au mount. Le store local reste la source primaire (rapide, offline).
  useMergeRemoteDismisses({
    userId: userId ?? null,
    hintPrefix: HINT_PREFIX,
    readLocal: () => readDismissed(storage, dismissKey),
    writeLocal: (data) => {
      writeDismissed(storage, dismissKey, data)
      setDismissCount((c) => c + 1)
    },
    defaultCooldownDays: DEFAULT_DISMISS_DAYS,
  })

  // Pure detection — reads only, no writes during render
  const transition = useMemo((): SchedulingTransition | null => {
    void dismissCount
    if (!schedulingMode) return null

    const dismissed = readDismissed(storage, dismissKey)
    const baselineKey = `${BASELINE_KEY_PREFIX}.${identity}`
    const previousMode = storage.getItem(baselineKey)

    // 1. Mode transitions (require baseline comparison)
    // Guard: skip transitions for anonymous users (identity 'anon') to avoid cross-account leaks
    if (previousMode === null || identity === 'anon') {
      // First access or no authenticated user — no baseline yet. Will be initialized in useEffect. No transition.
    } else if (previousMode !== schedulingMode) {
      if (previousMode === 'sequential' && schedulingMode === 'calendar') {
        if (!isDismissed(dismissed, 'calendar_mode_activated', today)) {
          return {
            type: 'calendar_mode_activated',
            message: schedulingTransitionLabel('calendar_mode', lang),
            cta: schedulingTransitionLabel('cta_ok', lang),
          }
        }
      }

      if (previousMode === 'calendar' && schedulingMode === 'sequential') {
        if (!isDismissed(dismissed, 'block_mode_activated', today)) {
          return {
            type: 'block_mode_activated',
            message: schedulingTransitionLabel('block_mode', lang),
            cta: schedulingTransitionLabel('cta_ok', lang),
          }
        }
      }
    }

    // 2. Return after break (independent from mode transitions)
    if (!isDismissed(dismissed, 'return_after_break', today)) {
      const lastLogDate = getLastLogDate(logs)
      if (lastLogDate) {
        const daysSince = daysBetween(lastLogDate, today)
        if (daysSince > RETURN_AFTER_BREAK_THRESHOLD_DAYS) {
          return {
            type: 'return_after_break',
            message: schedulingTransitionLabel('return_break', lang),
            cta: schedulingTransitionLabel('cta_go', lang),
          }
        }
      }
    }

    return null
  }, [schedulingMode, logs, today, identity, lang, storage, dismissKey, dismissCount])

  // Commit-phase: persist baseline after detection
  const baselineWrittenRef = useRef<string>('')

  useEffect(() => {
    if (!schedulingMode) return
    const baselineKey = `${BASELINE_KEY_PREFIX}.${identity}`
    const writeKey = `${identity}:${schedulingMode}`
    if (baselineWrittenRef.current === writeKey) return
    baselineWrittenRef.current = writeKey
    storage.setItem(baselineKey, schedulingMode)
  }, [schedulingMode, identity, storage])

  const dismiss = useCallback((type: string) => {
    const dismissed = readDismissed(storage, dismissKey)
    const days = type === 'return_after_break'
      ? RETURN_AFTER_BREAK_DISMISS_DAYS
      : DEFAULT_DISMISS_DAYS
    const d = new Date(`${today}T12:00:00`)
    d.setDate(d.getDate() + days)
    dismissed[type] = d.toISOString().slice(0, 10)
    writeDismissed(storage, dismissKey, dismissed)
    setDismissCount((c) => c + 1)
    // Cross-device sync best-effort.
    syncDismissToSupabase(userId ?? null, `${HINT_PREFIX}${type}`)
  }, [today, storage, dismissKey, userId])

  return { transition, dismiss }
}

// ── Helpers ─────────────────────────────────────────────────────────

function readDismissed(storage: TransitionStorage, key: string): Record<string, string> {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeDismissed(storage: TransitionStorage, key: string, data: Record<string, string>) {
  try {
    storage.setItem(key, JSON.stringify(data))
  } catch { /* ignore */ }
}

function isDismissed(dismissed: Record<string, string>, type: string, today: string): boolean {
  const until = dismissed[type]
  if (!until) return false
  return today <= until
}

function getLastLogDate(logs: SessionLog[]): string | null {
  if (logs.length === 0) return null
  let latest = logs[0].dateISO
  for (const log of logs) {
    if (log.dateISO > latest) latest = log.dateISO
  }
  return latest
}

function daysBetween(dateA: string, dateB: string): number {
  const msPerDay = 24 * 60 * 60 * 1000
  const a = new Date(dateA).getTime()
  const b = new Date(dateB).getTime()
  return Math.floor((b - a) / msPerDay)
}
