/**
 * Transforms resolved mother session slots into a presentation layer:
 * - Calendar mode → DatedSession[] with day placement and match proximity
 * - Sequential mode → SequentialSession[] with 1-based numbering
 *
 * Pure, synchronous, no side effects.
 */
import type {
  CalendarEvent,
  ClubSchedule,
  DayOfWeek,
  SCSchedule,
} from '../../types/training'
import { parseLocalDate } from './parseLocalDate'
import type { ResolvedMotherSessionSlot } from '../motherSession/resolveMotherSessionsForWeek'
import type {
  BlockProgressionState,
  DatedSession,
  PresentedMatchEvent,
  SchedulingMode,
  SequentialSession,
  WeekCorrection,
  WeekPresentation,
} from '../../types/scheduling'

// ── Public interface ────────────────────────────────────────────────

export interface ResolveWeekPresentationParams {
  motherSessions: ResolvedMotherSessionSlot[]
  schedulingMode: SchedulingMode
  events: Array<Pick<CalendarEvent, 'date' | 'type'> & {
    user_hidden?: boolean
    opponent?: string
    is_home?: boolean
    kickoff_time?: string
  }>
  today: string
  clubSchedule?: ClubSchedule
  scSchedule?: SCSchedule
  corrections: WeekCorrection[]
  blockProgression?: BlockProgressionState
}

// ── Constants ───────────────────────────────────────────────────────

const DAY_LABELS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const

const DAY_PREF_DEFAULTS: Record<string, DayOfWeek> = {
  early_week: 1,  // Lundi
  mid_week: 3,    // Mercredi
  late_week: 5,   // Vendredi
}

const SLOT_COUNT_DEFAULTS: Record<number, DayOfWeek[]> = {
  1: [2],
  2: [2, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
}

// ── Entry point ─────────────────────────────────────────────────────

export function resolveWeekPresentation(
  params: ResolveWeekPresentationParams,
): WeekPresentation {
  const { motherSessions, schedulingMode, events, today, corrections } = params

  // Filter to visible matches within the current ISO week only
  const matchEvents = getWeekMatchEvents(events, today)

  if (schedulingMode === 'sequential') {
    return buildSequentialPresentation(motherSessions, matchEvents, corrections)
  }

  return buildCalendarPresentation(motherSessions, matchEvents, corrections, params)
}

// ── Sequential mode ─────────────────────────────────────────────────

function buildSequentialPresentation(
  slots: ResolvedMotherSessionSlot[],
  matchEvents: PresentedMatchEvent[],
  corrections: WeekCorrection[],
): WeekPresentation {
  const total = slots.length

  // Index skip corrections by sessionId
  const skippedIds = new Set(
    corrections
      .filter((c) => c.type === 'skip' && c.sessionId)
      .map((c) => c.sessionId!),
  )

  const sessions: SequentialSession[] = slots.map((slot, i) => ({
    kind: 'sequential',
    sessionSlot: slot,
    sequenceIndex: i + 1,
    totalInWeek: total,
    completionStatus: skippedIds.has(slot.sessionId) ? 'skipped' : 'pending',
  }))

  return {
    sessions,
    matchEvents,
    unavailableDays: [],
    clubDays: [],
    corrections,
    mode: 'sequential',
  }
}

// ── Calendar mode ───────────────────────────────────────────────────

function buildCalendarPresentation(
  slots: ResolvedMotherSessionSlot[],
  matchEvents: PresentedMatchEvent[],
  corrections: WeekCorrection[],
  params: ResolveWeekPresentationParams,
): WeekPresentation {
  const { clubSchedule, scSchedule } = params

  // Identify blocked days
  const matchDays = getMatchDaysOfWeek(matchEvents)
  const clubDays = new Set<DayOfWeek>(
    clubSchedule?.clubDays.map((d) => d.day) ?? [],
  )

  // Collect correction-driven unavailable days
  const correctionUnavailableDays = new Set<DayOfWeek>(
    corrections
      .filter((c) => c.type === 'unavailable_day' && c.toDay != null)
      .map((c) => c.toDay!),
  )

  // Index skip + reschedule corrections by sessionId
  const skippedIds = new Set(
    corrections.filter((c) => c.type === 'skip' && c.sessionId).map((c) => c.sessionId!),
  )
  const rescheduleMap = new Map<string, DayOfWeek>()
  for (const c of corrections) {
    if (c.type === 'reschedule' && c.sessionId && c.toDay != null) {
      rescheduleMap.set(c.sessionId, c.toDay)
    }
  }

  // Resolve placement for each slot
  const allBlockedDays = new Set([...correctionUnavailableDays])
  const usedDays = new Set<DayOfWeek>()
  const sessions: DatedSession[] = []

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    const isSkipped = skippedIds.has(slot.sessionId)

    // Determine target day: reschedule override > normal placement
    // Validate reschedule target against blocked days — reject if invalid
    let day: DayOfWeek
    const rescheduledTo = rescheduleMap.get(slot.sessionId)
    if (rescheduledTo !== undefined) {
      // Reschedule validation: honour the user's explicit choice.
      // Only truly immovable conflicts (user-unavailable, already used) reject it.
      // Match days and club days are allowed — the user deliberately chose them
      // (e.g., light primer on match-day morning).
      const rescheduleBlocked = buildBlockedSet(undefined, undefined, usedDays, undefined, allBlockedDays)
      day = rescheduleBlocked.has(rescheduledTo) ? resolveCalendarDay(
        slot, i, slots.length, scSchedule, matchDays, clubDays, usedDays, allBlockedDays,
      ) : rescheduledTo
    } else {
      day = resolveCalendarDay(
        slot, i, slots.length,
        scSchedule, matchDays, clubDays, usedDays,
        allBlockedDays,
      )
    }

    // If the day is now marked unavailable by a correction and not explicitly rescheduled,
    // try to find a fallback day
    if (correctionUnavailableDays.has(day) && rescheduledTo === undefined && !isSkipped) {
      const fallback = findFallbackDay(day, matchDays, clubDays, usedDays, allBlockedDays, slot.variant)
      if (fallback !== null) day = fallback
    }

    if (!isSkipped) usedDays.add(day)

    const proximity = computeMatchProximity(day, matchDays)

    sessions.push({
      kind: 'dated',
      sessionSlot: slot,
      dayOfWeek: day,
      dayLabel: DAY_LABELS_FR[day],
      matchProximity: proximity,
      ...(isSkipped ? { completionStatus: 'skipped' as const } : {}),
    })
  }

  // User-marked unavailable days (from corrections only — not club/match)
  const unavailableDays = Array.from(correctionUnavailableDays) as DayOfWeek[]

  return {
    sessions,
    matchEvents,
    unavailableDays,
    clubDays: Array.from(clubDays) as DayOfWeek[],
    corrections,
    mode: 'calendar',
  }
}

// ── Calendar helpers ────────────────────────────────────────────────

/**
 * Resolve which day of the week to place a session slot.
 * Priority: scSchedule > dayPreference > positional default.
 * Avoids: match days, club days, J-1 of match for non-light sessions.
 */
function resolveCalendarDay(
  slot: ResolvedMotherSessionSlot,
  index: number,
  totalSlots: number,
  scSchedule?: SCSchedule,
  matchDays?: DayOfWeek[],
  clubDays?: Set<DayOfWeek>,
  usedDays?: Set<DayOfWeek>,
  extraBlocked?: Set<DayOfWeek>,
): DayOfWeek {
  const blocked = buildBlockedSet(matchDays, clubDays, usedDays, slot.variant, extraBlocked)

  // 1. scSchedule (priority)
  if (scSchedule && scSchedule.sessions.length > 0) {
    const sorted = [...scSchedule.sessions].sort((a, b) => a.day - b.day)
    if (index < sorted.length) {
      const candidate = sorted[index].day as DayOfWeek
      if (!blocked.has(candidate)) return candidate
    }
    // Try any unblocked SC day
    for (const s of sorted) {
      if (!blocked.has(s.day as DayOfWeek)) return s.day as DayOfWeek
    }
  }

  // 2. dayPreference
  if (slot.dayPreference) {
    if (slot.dayPreference === 'pre_match') {
      return resolvePreMatch(matchDays, blocked)
    }
    const preferred = DAY_PREF_DEFAULTS[slot.dayPreference]
    if (preferred !== undefined && !blocked.has(preferred)) return preferred
  }

  // 3. Positional default
  const defaults = SLOT_COUNT_DEFAULTS[totalSlots] ?? SLOT_COUNT_DEFAULTS[2]!
  const positional = defaults[index] ?? defaults[defaults.length - 1]
  if (!blocked.has(positional)) return positional

  // 4. Fallback: first weekday not blocked (Mon–Fri)
  for (let d = 1; d <= 5; d++) {
    if (!blocked.has(d as DayOfWeek)) return d as DayOfWeek
  }

  // 5. Last resort: return positional even if blocked
  return positional
}

function findFallbackDay(
  currentDay: DayOfWeek,
  matchDays: DayOfWeek[],
  clubDays: Set<DayOfWeek>,
  usedDays: Set<DayOfWeek>,
  extraBlocked: Set<DayOfWeek>,
  variant?: 'normal' | 'light',
): DayOfWeek | null {
  const blocked = buildBlockedSet(matchDays, clubDays, usedDays, variant, extraBlocked)
  // Try nearest weekday after currentDay, then before
  for (let offset = 1; offset <= 6; offset++) {
    const after = ((currentDay + offset) % 7) as DayOfWeek
    if (after !== 0 && !blocked.has(after)) return after
  }
  return null
}

function buildBlockedSet(
  matchDays?: DayOfWeek[],
  clubDays?: Set<DayOfWeek>,
  usedDays?: Set<DayOfWeek>,
  variant?: 'normal' | 'light',
  extraBlocked?: Set<DayOfWeek>,
): Set<DayOfWeek> {
  const blocked = new Set<DayOfWeek>()

  // Match days are always blocked
  if (matchDays) {
    for (const d of matchDays) blocked.add(d)
  }

  // Club days blocked
  if (clubDays) {
    for (const d of clubDays) blocked.add(d)
  }

  // Already used days blocked
  if (usedDays) {
    for (const d of usedDays) blocked.add(d)
  }

  // J-1 of match blocked for non-light sessions
  if (variant !== 'light' && matchDays) {
    for (const md of matchDays) {
      const jMinus1 = md === 0 ? 6 : (md - 1) as DayOfWeek
      blocked.add(jMinus1)
    }
  }

  // Extra blocked days (from corrections)
  if (extraBlocked) {
    for (const d of extraBlocked) blocked.add(d)
  }

  return blocked
}

function resolvePreMatch(
  matchDays?: DayOfWeek[],
  blocked?: Set<DayOfWeek>,
): DayOfWeek {
  if (!matchDays || matchDays.length === 0) return 5 // Vendredi default

  const firstMatch = matchDays[0]
  // J-2 of match
  const jMinus2 = firstMatch <= 1
    ? ((firstMatch + 5) as DayOfWeek)
    : ((firstMatch - 2) as DayOfWeek)

  if (!blocked?.has(jMinus2)) return jMinus2

  // Try J-3
  const jMinus3 = jMinus2 === 0 ? 6 : ((jMinus2 - 1) as DayOfWeek)
  if (!blocked?.has(jMinus3)) return jMinus3

  return 5 // Fallback
}

/**
 * Compute the ISO week bounds (Monday–Sunday) for a given date.
 */
function getISOWeekBounds(today: string): { weekStart: Date; weekEnd: Date } {
  const todayDate = parseLocalDate(today)
  const todayDow = todayDate.getDay()
  const weekStart = new Date(todayDate)
  weekStart.setDate(todayDate.getDate() - ((todayDow + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  return { weekStart, weekEnd }
}

/**
 * Filter events to visible match events within the current ISO week.
 * Returns rich match events for timeline display.
 */
function getWeekMatchEvents(
  events: ResolveWeekPresentationParams['events'],
  today: string,
): PresentedMatchEvent[] {
  const { weekStart, weekEnd } = getISOWeekBounds(today)
  return events
    .filter((e) => {
      if (e.type !== 'match' || e.user_hidden === true) return false
      const evDate = parseLocalDate(e.date)
      return evDate >= weekStart && evDate <= weekEnd
    })
    .map((e) => ({
      date: e.date,
      type: 'match' as const,
      ...(e.opponent ? { opponent: e.opponent } : {}),
      ...(e.is_home != null ? { is_home: e.is_home } : {}),
      ...(e.kickoff_time ? { kickoff_time: e.kickoff_time } : {}),
    }))
}

/**
 * Extract match days of the week from already-filtered week match events.
 */
function getMatchDaysOfWeek(
  weekMatchEvents: Array<Pick<CalendarEvent, 'date' | 'type'>>,
): DayOfWeek[] {
  return weekMatchEvents.map((ev) => parseLocalDate(ev.date).getDay() as DayOfWeek)
}

/**
 * Compute match proximity label for a given day relative to match days.
 * Returns e.g. 'J-3', 'J+1', or null if no match this week.
 */
function computeMatchProximity(
  sessionDay: DayOfWeek,
  matchDays: DayOfWeek[],
): string | null {
  if (matchDays.length === 0) return null

  // Find closest match using circular (mod-7) shortest signed distance
  let closestDelta = Infinity
  for (const md of matchDays) {
    let delta = sessionDay - md
    // Wrap-around: pick shortest path on the 7-day circle
    if (delta > 3) delta -= 7
    if (delta < -3) delta += 7
    if (Math.abs(delta) < Math.abs(closestDelta)) {
      closestDelta = delta
    }
  }

  if (closestDelta === 0) return 'Jour de match'
  const sign = closestDelta < 0 ? '' : '+'
  return `J${sign}${closestDelta}`
}
