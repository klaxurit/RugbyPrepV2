/**
 * WeekSnapshot lifecycle — resolveWeek + patchWeek + persistence.
 *
 * resolveWeek() receives a pre-computed surface and blockProgression.
 * It does NOT call resolveWeeklyProgramSurface or getBlockProgression.
 * patchWeek() rebuilds presentation from accumulated corrections.
 * Heavy corrections (fatigue, add_match) require a new surface from the caller.
 *
 * All functions are pure except the persistence helpers (save/load).
 */
import type { CalendarEvent, ClubSchedule, DayOfWeek, SCSchedule } from '../../types/training'
import type {
  BlockProgressionState,
  WeekCorrection,
  WeekSnapshot,
} from '../../types/scheduling'
import type { WeeklyProgramSurfaceResult } from '../program/resolveWeeklyProgramSurface'
import { getWeekMatchEvents, resolveWeekPresentation } from './resolveWeekPresentation'
import { buildExplanation } from './buildExplanation'
import { parseLocalDate } from './parseLocalDate'

// ── Constants ───────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX_V2 = 'rugbyprep.weekSnapshot.v2'
const STORAGE_KEY_PREFIX_V1 = 'rugbyprep.weekSnapshot.v1'

/**
 * Current snapshot schema version.
 * Increment when adding fields or changing shape.
 * v1: baseline (explanation + clubDays + unavailableDays separation)
 */
// Bumpé de 1 → 2 quand la présentation sequential a été retirée : les snapshots
// en cache contenaient des SequentialSession objets qui sont désormais filtrés
// par le WeekPage (qui ne garde que les DatedSession). Un snapshot v1 restauré
// tel quel rendait 7 jours vides. Bumper force un fresh resolve au prochain mount.
export const CURRENT_SCHEMA_VERSION = 3

// ── Public types ────────────────────────────────────────────────────

export interface ResolveWeekParams {
  surface: WeeklyProgramSurfaceResult
  events: Array<Pick<CalendarEvent, 'date' | 'type'> & { user_hidden?: boolean; id?: string }>
  today: string
  clubSchedule?: ClubSchedule
  scSchedule?: SCSchedule
  /** Previous snapshot — pendingUpdates are consumed from it. */
  previousSnapshot?: WeekSnapshot | null
  /** Pre-computed block progression (sequential mode). Caller is responsible for computing it. */
  blockProgression?: BlockProgressionState
}

export interface PatchWeekParams {
  events: Array<Pick<CalendarEvent, 'date' | 'type'> & { user_hidden?: boolean; id?: string }>
  today: string
  clubSchedule?: ClubSchedule
  scSchedule?: SCSchedule
  /**
   * For heavy corrections (fatigue, add_match): the caller must provide
   * a fresh surface recalculated with the modified params.
   */
  newSurface?: WeeklyProgramSurfaceResult
  /** Updated block progression after heavy correction (caller computes it). */
  blockProgression?: BlockProgressionState
}

export interface SnapshotStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem?(key: string): void
}

// ── resolveWeek ─────────────────────────────────────────────────────

/**
 * Full resolution — creates a fresh WeekSnapshot from a pre-computed surface.
 * Pure (no side effects). Persistence is handled separately by saveSnapshot.
 */
export function resolveWeek(params: ResolveWeekParams): WeekSnapshot {
  const {
    surface,
    events,
    today,
    clubSchedule,
    scSchedule,
    previousSnapshot,
    blockProgression,
  } = params

  const weekId = toISOWeekId(today)

  // Build presentation
  const presentation = resolveWeekPresentation({
    motherSessions: surface.motherSession?.sessions ?? [],
    schedulingMode: surface.schedulingMode,
    events,
    today,
    clubSchedule,
    scSchedule,
    corrections: [],
    blockProgression,
  })

  const explanation = buildExplanation({
    planningContext: surface.planningContext,
    schedulingMode: surface.schedulingMode,
    presentation,
    corrections: [],
  })

  return {
    weekId,
    resolvedAt: new Date().toISOString(),
    eventsFingerprint: computeEventsFingerprint(events, weekId),
    globalEventsHash: computeGlobalEventsHash(events),
    surface,
    presentation,
    corrections: [],
    pendingUpdates: previousSnapshot?.pendingUpdates
      ? [] // consumed — a fresh resolve absorbs pending data
      : [],
    confirmationRequired: [],
    blockProgression,
    explanation,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  }
}

// ── patchWeek ───────────────────────────────────────────────────────

/**
 * Incremental patch — applies a correction to an existing snapshot.
 * Returns a new snapshot (immutable). Preserves resolvedAt.
 *
 * - Light corrections (reschedule, skip, unavailable_day): presentation-only recalc.
 * - Heavy corrections (fatigue, add_match): requires newSurface from caller.
 */
export function patchWeek(
  snapshot: WeekSnapshot,
  correction: WeekCorrection,
  params: PatchWeekParams,
): WeekSnapshot {
  const corrections = [...snapshot.corrections, correction]
  const isHeavy = correction.type === 'fatigue' || correction.type === 'add_match'

  const surface = isHeavy && params.newSurface
    ? params.newSurface
    : snapshot.surface

  const blockProgression = isHeavy && params.blockProgression !== undefined
    ? params.blockProgression
    : snapshot.blockProgression

  const presentation = resolveWeekPresentation({
    motherSessions: surface.motherSession?.sessions ?? [],
    schedulingMode: surface.schedulingMode,
    events: params.events,
    today: params.today,
    clubSchedule: params.clubSchedule,
    scSchedule: params.scSchedule,
    corrections,
    blockProgression,
  })

  const explanation = buildExplanation({
    planningContext: surface.planningContext,
    schedulingMode: surface.schedulingMode,
    presentation,
    corrections,
  })

  return {
    ...snapshot,
    surface,
    presentation,
    corrections,
    blockProgression,
    explanation,
    // resolvedAt intentionally preserved — this is a patch, not a re-resolution
    // eventsFingerprint: recompute only for heavy corrections that change events
    eventsFingerprint: isHeavy
      ? computeEventsFingerprint(params.events, snapshot.weekId)
      : snapshot.eventsFingerprint,
  }
}

// ── ISO Week Helpers ────────────────────────────────────────────────

/**
 * Compute the ISO week-numbering year and week number for a date.
 * ISO 8601: weeks start on Monday, week 1 contains the year's first Thursday.
 */
function getISOWeekInfo(dateStr: string): { year: number; week: number } {
  const d = parseLocalDate(dateStr)
  d.setHours(0, 0, 0, 0)
  // Set to nearest Thursday (current date + 4 - current day number, with Monday=1 Sunday=7)
  const dayOfWeek = d.getDay() || 7 // Sunday=0 → 7
  d.setDate(d.getDate() + (4 - dayOfWeek))
  // The year of the Thursday is the ISO week-numbering year
  const year = d.getFullYear()
  const jan4 = new Date(year, 0, 4) // Jan 4 is always in week 1
  jan4.setHours(0, 0, 0, 0)
  const jan4Dow = jan4.getDay() || 7
  // Monday of week 1
  const week1Monday = new Date(jan4)
  week1Monday.setDate(jan4.getDate() - (jan4Dow - 1))
  // Diff in days from week1Monday to the Thursday we computed, divided by 7
  const diffDays = Math.round((d.getTime() - week1Monday.getTime()) / 86400000)
  const week = Math.floor(diffDays / 7) + 1
  return { year, week }
}

/**
 * Compute ISO week bounds (Monday 00:00 → Sunday 23:59:59.999) for a weekId.
 */
export function isDateInISOWeek(date: string, weekId: string): boolean {
  const bounds = getISOWeekBounds(weekId)
  if (!bounds) return false
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!m) return false
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
  return d >= bounds.weekStart && d <= bounds.weekEnd
}

function getISOWeekBounds(weekId: string): { weekStart: Date; weekEnd: Date } | null {
  const match = weekId.match(/^W(\d+)-(\d+)$/)
  if (!match) return null

  const year = parseInt(match[1], 10)
  const week = parseInt(match[2], 10)

  // Jan 4 is always in ISO week 1
  const jan4 = new Date(year, 0, 4)
  jan4.setHours(0, 0, 0, 0)
  const jan4Dow = jan4.getDay() || 7
  // Monday of week 1
  const week1Monday = new Date(jan4)
  week1Monday.setDate(jan4.getDate() - (jan4Dow - 1))
  // Monday of target week
  const weekStart = new Date(week1Monday)
  weekStart.setDate(week1Monday.getDate() + (week - 1) * 7)
  weekStart.setHours(0, 0, 0, 0)
  // Sunday of target week
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  return { weekStart, weekEnd }
}

/**
 * Compute ISO week ID from a date string.
 * Format: W{year}-{weekNumber} e.g. "W2026-15"
 */
export function toISOWeekId(today: string): string {
  const { year, week } = getISOWeekInfo(today)
  return `W${year}-${week}`
}

// ── Events Fingerprint ──────────────────────────────────────────────

/**
 * Compute a deterministic fingerprint for the events in the current week.
 * Used to detect external changes (FFR sync) between snapshots.
 */
export function computeEventsFingerprint(
  events: Array<Pick<CalendarEvent, 'date' | 'type'> & { id?: string }>,
  weekId: string,
): string {
  const bounds = getISOWeekBounds(weekId)
  if (!bounds) return '0'

  const { weekStart, weekEnd } = bounds

  // Filter events in this ISO week (Monday–Sunday), sort deterministically
  const weekEvents = events
    .filter((e) => {
      const d = parseLocalDate(e.date)
      return d >= weekStart && d <= weekEnd
    })
    .sort((a, b) => {
      const cmp = a.date.localeCompare(b.date)
      if (cmp !== 0) return cmp
      const cmp2 = (a.type ?? '').localeCompare(b.type ?? '')
      if (cmp2 !== 0) return cmp2
      return (a.id ?? '').localeCompare(b.id ?? '')
    })

  if (weekEvents.length === 0) return '0'

  // djb2 hash over the concatenated event signatures
  const input = weekEvents
    .map((e) => `${e.date}:${e.type}:${e.id ?? ''}`)
    .join('|')

  let h = 5381
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i)
  }
  return (h >>> 0).toString(36)
}

// ── External Change Classification ──────────────────────────────────

export interface ExternalChangeResult {
  changed: boolean
  category: 'none' | 'B' | 'C'
  currentFingerprint: string
}

/**
 * Classify an external events change relative to the snapshot.
 * Pure, deterministic.
 *
 * Caller is responsible for detecting that events have changed (global hash).
 * This function determines whether the change affects the current week:
 * - Category B: current week's matches are unchanged
 * - Category C: current week's match events changed (added/removed/moved)
 */
export function classifyExternalChange(
  snapshot: WeekSnapshot,
  currentEvents: Array<Pick<CalendarEvent, 'date' | 'type'> & { user_hidden?: boolean; id?: string }>,
): ExternalChangeResult {
  const currentWeekFingerprint = computeEventsFingerprint(currentEvents, snapshot.weekId)

  // Check if current week's matches changed
  const bounds = getISOWeekBounds(snapshot.weekId)
  if (!bounds) {
    return { changed: true, category: 'B', currentFingerprint: currentWeekFingerprint }
  }

  const { weekStart, weekEnd } = bounds
  const inWeek = (date: string) => {
    const d = parseLocalDate(date)
    return d >= weekStart && d <= weekEnd
  }

  const snapshotMatchDates = new Set(
    snapshot.presentation.matchEvents.map((e) => e.date),
  )

  const currentWeekMatches = currentEvents.filter(
    (e) => e.type === 'match' && e.user_hidden !== true && inWeek(e.date),
  )
  const currentMatchDates = new Set(currentWeekMatches.map((e) => e.date))

  const matchAdded = currentWeekMatches.some((e) => !snapshotMatchDates.has(e.date))
  const matchRemoved = Array.from(snapshotMatchDates).some((d) => !currentMatchDates.has(d))

  if (matchAdded || matchRemoved) {
    return { changed: true, category: 'C', currentFingerprint: currentWeekFingerprint }
  }

  return { changed: true, category: 'B', currentFingerprint: currentWeekFingerprint }
}

function matchPresentationSignature(
  events: Array<{
    date: string
    is_home?: boolean
    is_neutral?: boolean
    opponent?: string
    kickoff_time?: string
  }>,
): string {
  return [...events]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(
      (e) =>
        `${e.date}:${e.is_home ?? ''}:${e.is_neutral ?? ''}:${e.opponent ?? ''}:${e.kickoff_time ?? ''}`,
    )
    .join('|')
}

/**
 * True when calendar match display fields changed in the current week
 * (lieu, adversaire, coup d'envoi) without add/remove of a match day.
 */
export function currentWeekMatchPresentationChanged(
  snapshot: WeekSnapshot,
  currentEvents: Array<
    Pick<CalendarEvent, 'date' | 'type'> & {
      user_hidden?: boolean
      opponent?: string
      is_home?: boolean
      is_neutral?: boolean
      kickoff_time?: string
    }
  >,
  today: string,
): boolean {
  const fresh = getWeekMatchEvents(currentEvents, today)
  return matchPresentationSignature(snapshot.presentation.matchEvents) !== matchPresentationSignature(fresh)
}

/**
 * Rebuild only `presentation.matchEvents` from the live calendar (no engine re-run).
 */
export function patchSnapshotMatchPresentation(
  snapshot: WeekSnapshot,
  currentEvents: Array<
    Pick<CalendarEvent, 'date' | 'type'> & {
      user_hidden?: boolean
      opponent?: string
      opponent_code?: string
      is_home?: boolean
      is_neutral?: boolean
      kickoff_time?: string
    }
  >,
  today: string,
  globalEventsHash: string,
): WeekSnapshot {
  return {
    ...snapshot,
    globalEventsHash,
    presentation: {
      ...snapshot.presentation,
      matchEvents: getWeekMatchEvents(currentEvents, today),
    },
  }
}

/**
 * Compute a global hash of the full event list (not week-scoped).
 * Used by the hook to detect any external event change.
 *
 * Inclut les champs affichés dans l'UI (is_home, is_neutral, opponent,
 * opponent_code, kickoff_time, user_hidden) pour que toute édition
 * utilisateur invalide le cache snapshot.
 */
export function computeGlobalEventsHash(
  events: Array<
    Pick<CalendarEvent, 'date' | 'type'> & {
      id?: string
      is_home?: boolean
      is_neutral?: boolean
      opponent?: string
      opponent_code?: string
      kickoff_time?: string
      user_hidden?: boolean
    }
  >,
): string {
  const sorted = [...events].sort((a, b) => {
    const cmp = a.date.localeCompare(b.date)
    if (cmp !== 0) return cmp
    const cmp2 = (a.type ?? '').localeCompare(b.type ?? '')
    if (cmp2 !== 0) return cmp2
    return (a.id ?? '').localeCompare(b.id ?? '')
  })
  const input = sorted
    .map(
      (e) =>
        `${e.date}:${e.type}:${e.id ?? ''}:${e.is_home ?? ''}:${e.is_neutral ?? ''}:${e.opponent ?? ''}:${e.opponent_code ?? ''}:${e.kickoff_time ?? ''}:${e.user_hidden ?? ''}`,
    )
    .join('|')
  if (!input) return '0'
  let h = 5381
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i)
  }
  return (h >>> 0).toString(36)
}

// ── Rebuild with remaining corrections ─────────────────────────────

/**
 * Given a freshly resolved snapshot (corrections=[]) and a set of
 * remaining corrections, rebuild presentation to reflect them.
 * Used after add_match undo so that pre-existing light corrections
 * (reschedule, skip, unavailable_day) are not visually dropped.
 */
export function rebuildWithRemainingCorrections(
  freshSnapshot: WeekSnapshot,
  corrections: WeekCorrection[],
  params: PatchWeekParams,
): WeekSnapshot {
  if (corrections.length === 0) return freshSnapshot

  const presentation = resolveWeekPresentation({
    motherSessions: freshSnapshot.surface.motherSession?.sessions ?? [],
    schedulingMode: freshSnapshot.surface.schedulingMode,
    events: params.events,
    today: params.today,
    clubSchedule: params.clubSchedule,
    scSchedule: params.scSchedule,
    corrections,
    blockProgression: freshSnapshot.blockProgression,
  })

  const explanation = buildExplanation({
    planningContext: freshSnapshot.surface.planningContext,
    schedulingMode: freshSnapshot.surface.schedulingMode,
    presentation,
    corrections,
  })

  return {
    ...freshSnapshot,
    corrections,
    presentation,
    explanation,
  }
}

// ── 24h Correction Expiry ──────────────────────────────────────────

const CORRECTION_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Mark corrections as non-reversible if older than 24h.
 * Pure — returns a new array (or the original if nothing changed).
 */
export function expireCorrections(
  corrections: WeekCorrection[],
  now: number = Date.now(),
): WeekCorrection[] {
  let changed = false
  const result = corrections.map((c) => {
    if (!c.reversible) return c
    const appliedMs = new Date(c.appliedAt).getTime()
    if (now - appliedMs >= CORRECTION_EXPIRY_MS) {
      changed = true
      return { ...c, reversible: false }
    }
    return c
  })
  return changed ? result : corrections
}

// ── Undo Support ────────────────────────────────────────────────────

/**
 * Rebuild a snapshot with a specific correction removed.
 * Returns a new snapshot with the correction removed and presentation recalculated.
 * Pure (no side effects).
 */
export function rebuildWithoutCorrection(
  snapshot: WeekSnapshot,
  correctionId: string,
  params: PatchWeekParams,
): WeekSnapshot {
  const remainingCorrections = snapshot.corrections.filter((c) => c.id !== correctionId)

  const presentation = resolveWeekPresentation({
    motherSessions: snapshot.surface.motherSession?.sessions ?? [],
    schedulingMode: snapshot.surface.schedulingMode,
    events: params.events,
    today: params.today,
    clubSchedule: params.clubSchedule,
    scSchedule: params.scSchedule,
    corrections: remainingCorrections,
    blockProgression: snapshot.blockProgression,
  })

  const explanation = buildExplanation({
    planningContext: snapshot.surface.planningContext,
    schedulingMode: snapshot.surface.schedulingMode,
    presentation,
    corrections: remainingCorrections,
  })

  return {
    ...snapshot,
    corrections: remainingCorrections,
    presentation,
    explanation,
  }
}

// ── Persistence ─────────────────────────────────────────────────────

function storageKeyV2(userId: string, weekId: string): string {
  return `${STORAGE_KEY_PREFIX_V2}.${userId}.${weekId}`
}

function legacyStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX_V1}.${userId}`
}

/**
 * Persist a snapshot to localStorage (week-scoped key).
 */
export function saveSnapshot(
  userId: string,
  snapshot: WeekSnapshot,
  storage: SnapshotStorage = localStorage,
): void {
  try {
    storage.setItem(storageKeyV2(userId, snapshot.weekId), JSON.stringify(snapshot))
  } catch {
    // Quota exceeded or security error — degrade gracefully.
    // The snapshot remains in memory; it will be re-resolved next session.
  }
}

/**
 * Load a snapshot from localStorage.
 * Tries the week-scoped v2 key first, then falls back to the legacy v1 key
 * for compatibility with previously stored snapshots.
 * Returns null if missing, corrupt, or expired (weekId mismatch).
 * Never throws.
 */
export function loadSnapshot(
  userId: string,
  today?: string,
  storage: SnapshotStorage = localStorage,
): WeekSnapshot | null {
  try {
    const currentWeekId = today ? toISOWeekId(today) : null

    // Try v2 (week-scoped) key first
    if (currentWeekId) {
      const rawV2 = storage.getItem(storageKeyV2(userId, currentWeekId))
      if (rawV2) {
        const result = parseAndValidateSnapshot(rawV2, currentWeekId, userId, storage)
        if (result) return result
      }
    }

    // Fallback: try legacy v1 (user-only) key
    const rawV1 = storage.getItem(legacyStorageKey(userId))
    if (!rawV1) return null

    const result = parseAndValidateSnapshot(rawV1, currentWeekId, userId, storage)
    if (result) {
      // Migrate: persist under v2 key and clean up v1
      try {
        storage.setItem(storageKeyV2(userId, result.weekId), JSON.stringify(result))
        storage.removeItem?.(legacyStorageKey(userId))
      } catch { /* best-effort migration */ }
    }
    return result
  } catch {
    return null
  }
}

/**
 * Parse, validate, and apply correction expiry to a raw snapshot string.
 * Returns null if invalid or weekId mismatch.
 */
function parseAndValidateSnapshot(
  raw: string,
  currentWeekId: string | null,
  userId: string,
  storage: SnapshotStorage,
): WeekSnapshot | null {
  try {
    const parsed = JSON.parse(raw)
    if (!isValidSnapshotShape(parsed)) return null

    // Expired: weekId doesn't match current week
    if (currentWeekId && parsed.weekId !== currentWeekId) return null

    // F8: Expire reversible corrections older than 24h
    const snapshot = parsed as WeekSnapshot
    const expired = expireCorrections(snapshot.corrections)
    if (expired !== snapshot.corrections) {
      const updated = { ...snapshot, corrections: expired }
      // Persist the expiry so subsequent loads don't re-check
      try { storage.setItem(storageKeyV2(userId, updated.weekId), JSON.stringify(updated)) } catch { /* best-effort */ }
      return updated
    }

    return snapshot
  } catch {
    return null
  }
}

/**
 * Lightweight structural validation — ensures the core fields
 * needed by S2+ are present with expected basic shapes.
 */
function isValidSnapshotShape(v: unknown): boolean {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return (
    typeof o.weekId === 'string' &&
    typeof o.resolvedAt === 'string' &&
    typeof o.eventsFingerprint === 'string' &&
    typeof o.surface === 'object' && o.surface !== null &&
    typeof o.presentation === 'object' && o.presentation !== null &&
    Array.isArray(o.corrections) &&
    Array.isArray(o.pendingUpdates) &&
    Array.isArray(o.confirmationRequired)
  )
}

// ── Snapshot Migration ─────────────────────────────────────────────

export interface MigrateSnapshotParams {
  /** Club days from the current profile — needed to repair missing/leaked clubDays. */
  profileClubDays: DayOfWeek[]
}

/**
 * Migrate a persisted snapshot to the current schema.
 * Handles:
 *  - missing explanation (pre-Slice 3)
 *  - missing clubDays in presentation
 *  - club days leaked into unavailableDays
 *  - missing schemaVersion stamp
 *
 * Returns { snapshot, changed } where changed=true means the caller should re-persist.
 * Pure — no side effects.
 */
export function migrateSnapshot(
  snapshot: WeekSnapshot,
  params: MigrateSnapshotParams,
): { snapshot: WeekSnapshot; changed: boolean } {
  let s = snapshot
  let changed = false

  // Migration 1: Missing explanation (pre-Slice 3 snapshots) OR missing
  // detailItems (pre-hint-unification snapshots) → rebuild from current source.
  const needsExplanationRebuild =
    s.surface && s.presentation && (!s.explanation || !s.explanation.detailItems)
  if (needsExplanationRebuild && s.surface && s.presentation) {
    s = {
      ...s,
      explanation: buildExplanation({
        planningContext: s.surface.planningContext,
        schedulingMode: s.surface.schedulingMode,
        presentation: s.presentation,
        corrections: s.corrections,
      }),
    }
    changed = true
  }

  // Migration 2: Missing clubDays or club days leaked into unavailableDays
  if (s.presentation) {
    const clubDaySet = new Set(params.profileClubDays)
    const hasClubDaysField = Array.isArray(s.presentation.clubDays)
    const unavailableOverlapsClub =
      params.profileClubDays.length > 0 &&
      (s.presentation.unavailableDays ?? []).some((d: DayOfWeek) => clubDaySet.has(d))

    if (!hasClubDaysField || unavailableOverlapsClub) {
      s = {
        ...s,
        presentation: {
          ...s.presentation,
          clubDays: params.profileClubDays,
          unavailableDays: (s.presentation.unavailableDays ?? []).filter(
            (d: DayOfWeek) => !clubDaySet.has(d),
          ),
        },
      }
      changed = true
    }
  }

  // Stamp current schema version if missing or outdated
  if (s.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    s = { ...s, schemaVersion: CURRENT_SCHEMA_VERSION }
    changed = true
  }

  return { snapshot: s, changed }
}
