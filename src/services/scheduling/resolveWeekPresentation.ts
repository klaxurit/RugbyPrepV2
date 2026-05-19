/**
 * Transforms resolved mother session slots into a presentation layer :
 * un calendrier 7 jours (DatedSession[]) avec placement par jour de la semaine
 * et proximité du match. Les séances sont placées Lun/Mer/Ven par défaut
 * (quand il n'y a ni scSchedule, ni clubDays, ni matchs à contourner).
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
  WeekCorrection,
  WeekPresentation,
} from '../../types/scheduling'
import type { MotherSessionType } from '../../types/motherSession'
import { isPostMatchWindow, pickPrimerDay } from './matchWindowPolicy'

// ── Public interface ────────────────────────────────────────────────

export interface ResolveWeekPresentationParams {
  motherSessions: ResolvedMotherSessionSlot[]
  schedulingMode: SchedulingMode
  events: Array<Pick<CalendarEvent, 'date' | 'type'> & {
    user_hidden?: boolean
    opponent?: string
    opponent_code?: string
    is_home?: boolean
    is_neutral?: boolean
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

/**
 * Ordre de tri pour placer les séances de la semaine : Lower d'abord, puis Upper,
 * puis Full/Full Light, puis speed/power. Cet ordre est canonique quel que soit
 * le mode de saison (in/off/pre) — les séances sont ensuite placées sur les
 * jours de la semaine par `buildCalendarPresentation`.
 */
const SESSION_TYPE_SORT_ORDER: Record<MotherSessionType, number> = {
  lower: 0,
  upper: 1,
  full: 2,
  full_light_primer: 3,
  speed_power: 4,
}

function sortedByCanonicalOrder(slots: ResolvedMotherSessionSlot[]): ResolvedMotherSessionSlot[] {
  return [...slots].sort((a, b) => {
    const ra = SESSION_TYPE_SORT_ORDER[a.session.metadata.sessionType] ?? 99
    const rb = SESSION_TYPE_SORT_ORDER[b.session.metadata.sessionType] ?? 99
    return ra - rb
  })
}

export function resolveWeekPresentation(
  params: ResolveWeekPresentationParams,
): WeekPresentation {
  const { motherSessions, events, today, corrections } = params

  // Filter to visible matches within the current ISO week only
  const matchEvents = getWeekMatchEvents(events, today)

  // Une seule branche : le calendrier 7 jours est la vue unique, y compris en
  // off_season / pre_season sans match (pattern par défaut Lun/Mer/Ven via
  // SLOT_COUNT_DEFAULTS dans resolveCalendarDay).
  const sortedSlots = sortedByCanonicalOrder(motherSessions)
  return buildCalendarPresentation(sortedSlots, matchEvents, corrections, params)
}

// ── Calendar mode ───────────────────────────────────────────────────

function buildCalendarPresentation(
  slots: ResolvedMotherSessionSlot[],
  matchEvents: PresentedMatchEvent[],
  corrections: WeekCorrection[],
  params: ResolveWeekPresentationParams,
): WeekPresentation {
  const { clubSchedule, scSchedule } = params
  const reference = parseLocalDate(params.today)

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

  // Post-match blocking : ne jamais placer une séance S&C dans les 24h
  // suivant un match (fenêtre récupération obligatoire — KB recovery.md §3).
  const postMatchBlockedDays = new Set<DayOfWeek>()
  for (const match of matchEvents) {
    for (let d = 0 as DayOfWeek; d <= 6; d = (d + 1) as DayOfWeek) {
      if (isPostMatchWindow(d, match, reference)) postMatchBlockedDays.add(d)
    }
  }

  // Resolve placement for each slot
  const allBlockedDays = new Set<DayOfWeek>([
    ...correctionUnavailableDays,
    ...postMatchBlockedDays,
  ])
  const usedDays = new Set<DayOfWeek>()
  const sessions: DatedSession[] = []

  // Pré-placement PRIMER : si un slot est `full_light_primer` et qu'un match
  // est présent cette semaine, on réserve MD-1 (fallback MD-2) avant que les
  // autres slots ne prennent la place — fenêtre 18h-36h avant kickoff.
  const primerDayByIndex = new Map<number, DayOfWeek>()
  const reservedPrimerDays = new Set<DayOfWeek>()
  if (matchEvents.length > 0) {
    for (let i = 0; i < slots.length; i++) {
      if (slots[i].session.metadata.sessionType !== 'full_light_primer') continue
      // On prend le premier match de la semaine comme référence primer.
      const day = pickPrimerDay(matchEvents[0], reference, (d) =>
        allBlockedDays.has(d)
        || clubDays.has(d)
        || matchDays.includes(d),
      )
      if (day !== null) {
        primerDayByIndex.set(i, day)
        reservedPrimerDays.add(day)
      }
      // Un seul primer par semaine dans la pratique actuelle.
      break
    }
  }

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]
    const isSkipped = skippedIds.has(slot.sessionId)

    // Determine target day: reschedule override > primer reservation > normal placement
    let day: DayOfWeek
    const rescheduledTo = rescheduleMap.get(slot.sessionId)
    const primerReservedDay = primerDayByIndex.get(i)

    if (rescheduledTo !== undefined) {
      // Reschedule validation: honour the user's explicit choice.
      // Only truly immovable conflicts (user-unavailable, already used) reject it.
      // Match days and club days are allowed — the user deliberately chose them
      // (e.g., light primer on match-day morning).
      const rescheduleBlocked = buildBlockedSet(undefined, undefined, usedDays, undefined, allBlockedDays)
      day = rescheduleBlocked.has(rescheduledTo) ? resolveCalendarDay(
        slot, i, slots.length, scSchedule, matchDays, clubDays, usedDays, allBlockedDays,
      ) : rescheduledTo
    } else if (primerReservedDay !== undefined) {
      // Primer slot : jour déjà réservé MD-1/MD-2 via pickPrimerDay.
      day = primerReservedDay
    } else {
      // Les jours réservés pour le primer sont bloqués pour les autres slots.
      const extraWithPrimer = new Set<DayOfWeek>([...allBlockedDays, ...reservedPrimerDays])
      day = resolveCalendarDay(
        slot, i, slots.length,
        scSchedule, matchDays, clubDays, usedDays,
        extraWithPrimer,
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
    // Manual scSchedule = user explicitly chose these days → honour them even if
    // they coincide with clubDays or J-1 match. Still reject hard conflicts:
    // same-day match (physical impossibility) and usedDays (no duplicate day).
    const isManual = scSchedule.source === 'manual'
    const hardBlocked = isManual
      ? buildHardBlockedSet(matchDays, usedDays, extraBlocked)
      : blocked

    if (index < sorted.length) {
      const candidate = sorted[index].day as DayOfWeek
      if (!hardBlocked.has(candidate)) return candidate
    }
    // Try any unblocked SC day
    for (const s of sorted) {
      if (!hardBlocked.has(s.day as DayOfWeek)) return s.day as DayOfWeek
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

/**
 * Hard blocks only: match days (same-day conflict), used days (doublon),
 * user-unavailable days. Used when honouring a manual scSchedule choice.
 * Does NOT block clubDays or J-1 match.
 */
function buildHardBlockedSet(
  matchDays?: DayOfWeek[],
  usedDays?: Set<DayOfWeek>,
  extraBlocked?: Set<DayOfWeek>,
): Set<DayOfWeek> {
  const blocked = new Set<DayOfWeek>()
  if (matchDays) for (const d of matchDays) blocked.add(d)
  if (usedDays) for (const d of usedDays) blocked.add(d)
  if (extraBlocked) for (const d of extraBlocked) blocked.add(d)
  return blocked
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
export function getWeekMatchEvents(
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
      ...(e.opponent_code ? { opponent_code: e.opponent_code } : {}),
      ...(e.is_home != null ? { is_home: e.is_home } : {}),
      ...(e.is_neutral ? { is_neutral: e.is_neutral } : {}),
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
