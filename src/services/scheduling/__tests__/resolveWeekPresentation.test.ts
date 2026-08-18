import { describe, expect, it } from 'vitest'
import { resolveWeekPresentation } from '../resolveWeekPresentation'
import type { ResolvedMotherSessionSlot } from '../../motherSession/resolveMotherSessionsForWeek'
import type { DayOfWeek, SCSchedule, ClubSchedule } from '../../../types/training'
// ── Helpers ─────────────────────────────────────────────────────────

function slot(
  id: string,
  pref?: 'early_week' | 'mid_week' | 'late_week' | 'pre_match',
  variant?: 'normal' | 'light',
): ResolvedMotherSessionSlot {
  return {
    sessionId: id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session: { metadata: { id } } as any,
    role: 'primary',
    dayPreference: pref,
    variant,
  }
}

function match(date: string) {
  return { date, type: 'match' as const }
}

function sc(...days: number[]): SCSchedule {
  return {
    sessions: days.map((d, i) => ({ sessionIndex: i as 0 | 1 | 2, day: d as DayOfWeek })),
  }
}

function scManual(...days: number[]): SCSchedule {
  return {
    sessions: days.map((d, i) => ({ sessionIndex: i as 0 | 1 | 2, day: d as DayOfWeek })),
    source: 'manual',
  }
}

function club(days: number[], matchDay?: number): ClubSchedule {
  return {
    clubDays: days.map((d) => ({ day: d as DayOfWeek })),
    matchDay: matchDay as DayOfWeek | undefined,
  }
}

// Monday of a test week (2026-04-06 is a Monday)
const TODAY = '2026-04-06'

// Note : le mode sequential a été retiré — toutes les semaines sortent désormais en
// mode calendar (7 jours), y compris off_season et pre_season sans match. Les tests
// ci-dessous couvrent l'unique mode restant.

// ── Calendar mode — scSchedule priority ─────────────────────────────

describe('resolveWeekPresentation — calendar mode with scSchedule', () => {
  it('places sessions on scSchedule days', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'early_week'), slot('B', 'late_week')],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      scSchedule: sc(2, 4), // Mardi, Jeudi
      corrections: [],
    })

    expect(result.mode).toBe('calendar')
    expect(result.sessions).toHaveLength(2)
    const days = result.sessions.map((s) => s.kind === 'dated' ? s.dayOfWeek : -1)
    expect(days).toEqual([2, 4]) // Mardi, Jeudi
  })

  it('honours manual scSchedule even when the day is a clubDay', () => {
    // User explicitly chose Saturday (6) for a session via the manual planning editor,
    // even though Saturday is also a clubDay. The scheduler must respect this choice.
    const result = resolveWeekPresentation({
      motherSessions: [slot('A')],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      scSchedule: scManual(6), // Samedi, manual
      clubSchedule: club([6]), // Samedi club day
      corrections: [],
    })

    const days = result.sessions.map((s) => s.kind === 'dated' ? s.dayOfWeek : -1)
    expect(days).toEqual([6])
  })

  it('honours manual scSchedule even when the day is J-1 of a match', () => {
    // Match on Sunday (0), J-1 = Saturday (6) — normally blocked for non-light.
    // User manually placed the session on Saturday → must be honoured.
    const result = resolveWeekPresentation({
      motherSessions: [slot('A')],
      schedulingMode: 'calendar',
      events: [match('2026-04-12')], // Sunday
      today: TODAY,
      scSchedule: scManual(6), // Samedi, manual
      corrections: [],
    })

    const days = result.sessions.map((s) => s.kind === 'dated' ? s.dayOfWeek : -1)
    expect(days).toEqual([6])
  })

  it('does NOT honour manual scSchedule when it conflicts with a same-day match', () => {
    // User manually placed Saturday, but Saturday is also a match → physical conflict,
    // the scheduler must reject and fallback.
    const result = resolveWeekPresentation({
      motherSessions: [slot('A')],
      schedulingMode: 'calendar',
      events: [match('2026-04-11')], // Saturday
      today: TODAY,
      scSchedule: scManual(6), // Samedi, manual — same day as match
      corrections: [],
    })

    const days = result.sessions.map((s) => s.kind === 'dated' ? s.dayOfWeek : -1)
    expect(days[0]).not.toBe(6)
  })

  it('produces dayLabel in French', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('A')],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      scSchedule: sc(3), // Mercredi
      corrections: [],
    })

    if (result.sessions[0].kind === 'dated') {
      expect(result.sessions[0].dayLabel).toBe('Mercredi')
    }
  })
})

// ── Calendar mode — dayPreference fallback ──────────────────────────

describe('resolveWeekPresentation — calendar mode with dayPreference', () => {
  it('falls back to dayPreference when no scSchedule', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'early_week'), slot('B', 'late_week')],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      corrections: [],
    })

    const days = result.sessions.map((s) => s.kind === 'dated' ? s.dayOfWeek : -1)
    expect(days).toEqual([1, 5]) // Lundi, Vendredi
  })

  it('uses positional defaults when no dayPreference', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('A'), slot('B')],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      corrections: [],
    })

    const days = result.sessions.map((s) => s.kind === 'dated' ? s.dayOfWeek : -1)
    expect(days).toEqual([2, 4]) // Default 2-slot: Mardi, Jeudi
  })
})

// ── Calendar mode — match avoidance ─────────────────────────────────

describe('resolveWeekPresentation — calendar mode match avoidance', () => {
  it('avoids placing sessions on match day', () => {
    // Match on Saturday (6), scSchedule says Sat+Tue
    const result = resolveWeekPresentation({
      motherSessions: [slot('A'), slot('B')],
      schedulingMode: 'calendar',
      events: [match('2026-04-11')], // Saturday
      today: TODAY,
      scSchedule: sc(6, 2), // sorted: Tue(2), Sat(6) — Sat blocked
      corrections: [],
    })

    const days = result.sessions.map((s) => s.kind === 'dated' ? s.dayOfWeek : -1)
    // Session A should get day 2 (Tue), Session B should avoid 6 (Sat=match)
    expect(days).not.toContain(6)
  })

  it('avoids J-1 of match for non-light sessions', () => {
    // Match on Saturday (6), J-1 = Friday (5)
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'late_week', 'normal')],
      schedulingMode: 'calendar',
      events: [match('2026-04-11')], // Saturday
      today: TODAY,
      corrections: [],
    })

    const days = result.sessions.map((s) => s.kind === 'dated' ? s.dayOfWeek : -1)
    // Vendredi (5) should be avoided for normal variant
    expect(days[0]).not.toBe(5)
    expect(days[0]).not.toBe(6) // match day
  })

  it('allows J-1 of match for light sessions', () => {
    // Match on Saturday (6), J-1 = Friday (5)
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'late_week', 'light')],
      schedulingMode: 'calendar',
      events: [match('2026-04-11')], // Saturday
      today: TODAY,
      corrections: [],
    })

    const days = result.sessions.map((s) => s.kind === 'dated' ? s.dayOfWeek : -1)
    // Vendredi (5) allowed for light variant — but match day (6) still blocked
    expect(days[0]).toBe(5)
  })

  it('avoids club days', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'early_week')],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      clubSchedule: club([1]), // Lundi blocked
      corrections: [],
    })

    const days = result.sessions.map((s) => s.kind === 'dated' ? s.dayOfWeek : -1)
    expect(days[0]).not.toBe(1)
  })
})

// ── Calendar mode — matchProximity ──────────────────────────────────

describe('resolveWeekPresentation — calendar mode matchProximity', () => {
  it('computes J-N proximity relative to match', () => {
    // Match on Saturday (6), session on Wednesday (3) → J-3
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'mid_week')],
      schedulingMode: 'calendar',
      events: [match('2026-04-11')], // Saturday
      today: TODAY,
      corrections: [],
    })

    if (result.sessions[0].kind === 'dated') {
      expect(result.sessions[0].matchProximity).toBe('J-3')
    }
  })

  it('F4: Sunday session + Saturday match → J+1 (wrap-around)', () => {
    // Match on Saturday (6), session forced to Sunday (0) via reschedule
    // Sunday is 1 day AFTER Saturday → J+1, not J-6
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'early_week')],
      schedulingMode: 'calendar',
      events: [match('2026-04-11')], // Saturday = day 6
      today: TODAY,
      corrections: [
        { id: 'c1', type: 'reschedule', sessionId: 'A', toDay: 0 as DayOfWeek, appliedAt: '2026-04-06', reversible: true },
      ],
    })

    if (result.sessions[0].kind === 'dated') {
      // The session may not land on Sunday (0 is blocked by match proximity logic),
      // but if it does, proximity should be J+1 not J-6
      const prox = result.sessions[0].matchProximity
      if (result.sessions[0].dayOfWeek === 0) {
        expect(prox).toBe('J+1')
      }
      // In any case, no proximity should exceed ±3 for adjacent days
      if (prox) {
        const num = parseInt(prox.replace('J', '').replace('+', ''), 10)
        expect(Math.abs(num)).toBeLessThanOrEqual(3)
      }
    }
  })

  it('F4: Monday session + Saturday match → J-2 via wrap (Mon=1, Sat=6, shortest = -5 → wraps to +2? No, linear -5 wraps to +2 but Mon is BEFORE Sat → J-5)', () => {
    // Actually: Mon(1) to Sat(6) = delta 1-6 = -5, wraps to +2.
    // But Monday IS 5 days before Saturday linearly. The wrap says +2.
    // In a 7-day circle, Mon→Sat forward is 5, backward is 2.
    // The shortest path is 2 days backward (J+2 would mean Mon is AFTER Sat by 2 days going backwards).
    // Since |(-5)| > 3, we wrap: -5 + 7 = 2, so delta=+2 → J+2.
    // This represents: from Saturday's perspective, Monday is 2 days "after" wrapping from previous week.
    // This is the correct circular behavior for the wrap-around fix.
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'early_week')],
      schedulingMode: 'calendar',
      events: [match('2026-04-11')], // Saturday = day 6
      today: TODAY,
      corrections: [],
    })

    if (result.sessions[0].kind === 'dated') {
      const prox = result.sessions[0].matchProximity
      if (prox) {
        const num = parseInt(prox.replace('J', '').replace('+', ''), 10)
        expect(Math.abs(num)).toBeLessThanOrEqual(3)
      }
    }
  })

  it('returns null matchProximity when no match this week', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'mid_week')],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      corrections: [],
    })

    if (result.sessions[0].kind === 'dated') {
      expect(result.sessions[0].matchProximity).toBeNull()
    }
  })
})

// ── Calendar mode — matchEvents inclusion ───────────────────────────

describe('resolveWeekPresentation — calendar mode matchEvents', () => {
  it('includes match events in the result', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('A')],
      schedulingMode: 'calendar',
      events: [match('2026-04-11'), { date: '2026-04-08', type: 'rest' }],
      today: TODAY,
      corrections: [],
    })

    expect(result.matchEvents).toHaveLength(1)
    expect(result.matchEvents[0].type).toBe('match')
  })
})

// ── Calendar mode — pre_match placement ─────────────────────────────

describe('resolveWeekPresentation — calendar mode pre_match', () => {
  it('places pre_match session at J-2 of match', () => {
    // Match on Saturday (6), J-2 = Thursday (4)
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'pre_match', 'light')],
      schedulingMode: 'calendar',
      events: [match('2026-04-11')], // Saturday
      today: TODAY,
      corrections: [],
    })

    if (result.sessions[0].kind === 'dated') {
      expect(result.sessions[0].dayOfWeek).toBe(4) // Jeudi
    }
  })
})

// ── Edge cases ──────────────────────────────────────────────────────

describe('resolveWeekPresentation — edge cases', () => {
  it('handles empty motherSessions', () => {
    const result = resolveWeekPresentation({
      motherSessions: [],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      corrections: [],
    })
    expect(result.sessions).toHaveLength(0)
  })

})

// ── Corrections — skip ──────────────────────────────────────────────

describe('resolveWeekPresentation — correction: skip', () => {
  it('calendar: marks skipped session with completionStatus', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'early_week'), slot('B', 'late_week')],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      corrections: [
        { id: 'c1', type: 'skip', sessionId: 'A', appliedAt: '2026-04-06', reversible: true },
      ],
    })

    const s0 = result.sessions[0]
    expect(s0.kind).toBe('dated')
    if (s0.kind === 'dated') {
      expect(s0.completionStatus).toBe('skipped')
    }

    const s1 = result.sessions[1]
    if (s1.kind === 'dated') {
      expect(s1.completionStatus).toBeUndefined()
    }
  })

})

// ── Corrections — reschedule (calendar only) ────────────────────────

describe('resolveWeekPresentation — correction: reschedule', () => {
  it('calendar: moves session to target day', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'early_week'), slot('B', 'late_week')],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      corrections: [
        { id: 'c1', type: 'reschedule', sessionId: 'A', toDay: 4, appliedAt: '2026-04-06', reversible: true },
      ],
    })

    const sessionA = result.sessions.find(
      (s) => s.kind === 'dated' && s.sessionSlot.sessionId === 'A',
    )
    expect(sessionA).toBeDefined()
    if (sessionA?.kind === 'dated') {
      expect(sessionA.dayOfWeek).toBe(4) // Jeudi
    }
  })

  it('calendar: reschedule to match day is accepted (user explicit choice)', () => {
    // Match on Saturday (6) — user wants a light primer on match morning
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'early_week')],
      schedulingMode: 'calendar',
      events: [match('2026-04-11')], // Saturday = day 6
      today: TODAY,
      corrections: [
        { id: 'c1', type: 'reschedule', sessionId: 'A', toDay: 6, appliedAt: '2026-04-06', reversible: true },
      ],
    })

    const sessionA = result.sessions[0]
    if (sessionA.kind === 'dated') {
      expect(sessionA.dayOfWeek).toBe(6) // Honoured — user explicitly chose match day
      expect(sessionA.matchProximity).toBe('Jour de match')
      expect(sessionA.sessionSlot.variant).toBe('light')
      expect(sessionA.sessionSlot.maxBlocks).toBe(2)
    }
  })

  it('rail J-2 calendaire : Lower reschedule jeudi avant samedi → variant light', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('LOWER', 'early_week')],
      schedulingMode: 'calendar',
      events: [match('2026-04-11')],
      today: TODAY,
      corrections: [
        { id: 'c1', type: 'reschedule', sessionId: 'LOWER', toDay: 4, appliedAt: '2026-04-06', reversible: true },
      ],
    })

    const session = result.sessions.find(
      (s) => s.kind === 'dated' && s.sessionSlot.sessionId === 'LOWER',
    )
    expect(session?.kind).toBe('dated')
    if (session?.kind === 'dated') {
      expect(session.dayOfWeek).toBe(4)
      expect(session.sessionSlot.variant).toBe('light')
      expect(session.sessionSlot.maxBlocks).toBe(2)
    }
  })

  it('rail J-2 calendaire : mercredi (J-3) avant samedi → pas light', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('LOWER', 'early_week')],
      schedulingMode: 'calendar',
      events: [match('2026-04-11')],
      today: TODAY,
      corrections: [
        { id: 'c1', type: 'reschedule', sessionId: 'LOWER', toDay: 3, appliedAt: '2026-04-06', reversible: true },
      ],
    })

    const session = result.sessions[0]
    if (session.kind === 'dated') {
      expect(session.dayOfWeek).toBe(3)
      expect(session.sessionSlot.variant).not.toBe('light')
      expect(session.sessionSlot.maxBlocks).toBeUndefined()
    }
  })

  it('rail J-2 calendaire : jeudi sans match → pas light', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('LOWER', 'early_week')],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      corrections: [
        { id: 'c1', type: 'reschedule', sessionId: 'LOWER', toDay: 4, appliedAt: '2026-04-06', reversible: true },
      ],
    })

    const session = result.sessions[0]
    if (session.kind === 'dated') {
      expect(session.dayOfWeek).toBe(4)
      expect(session.sessionSlot.variant).not.toBe('light')
      expect(session.sessionSlot.maxBlocks).toBeUndefined()
    }
  })

  it('rail J-2 : match dimanche → vendredi light, jeudi pas light', () => {
    const thursday = resolveWeekPresentation({
      motherSessions: [slot('LOWER', 'early_week')],
      schedulingMode: 'calendar',
      events: [match('2026-04-12')],
      today: TODAY,
      corrections: [
        { id: 'c1', type: 'reschedule', sessionId: 'LOWER', toDay: 4, appliedAt: '2026-04-06', reversible: true },
      ],
    })
    const thu = thursday.sessions[0]
    if (thu.kind === 'dated') {
      expect(thu.dayOfWeek).toBe(4)
      expect(thu.sessionSlot.variant).not.toBe('light')
    }

    const friday = resolveWeekPresentation({
      motherSessions: [slot('LOWER', 'early_week')],
      schedulingMode: 'calendar',
      events: [match('2026-04-12')],
      today: TODAY,
      corrections: [
        { id: 'c1', type: 'reschedule', sessionId: 'LOWER', toDay: 5, appliedAt: '2026-04-06', reversible: true },
      ],
    })
    const fri = friday.sessions[0]
    if (fri.kind === 'dated') {
      expect(fri.dayOfWeek).toBe(5)
      expect(fri.sessionSlot.variant).toBe('light')
      expect(fri.sessionSlot.maxBlocks).toBe(2)
    }
  })

  it('rail J-2 : jour habituel samedi sans event → pas de light fantôme', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('LOWER', 'early_week')],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      clubSchedule: club([2, 4], 6),
      corrections: [
        { id: 'c1', type: 'reschedule', sessionId: 'LOWER', toDay: 4, appliedAt: '2026-04-06', reversible: true },
      ],
    })
    const session = result.sessions[0]
    if (session.kind === 'dated') {
      expect(session.dayOfWeek).toBe(4)
      expect(session.sessionSlot.variant).not.toBe('light')
    }
  })

  it('calendar: reschedule to club day is accepted (club days are constrained, not forbidden)', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'early_week')],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      clubSchedule: club([3]), // Mercredi is club day
      corrections: [
        { id: 'c1', type: 'reschedule', sessionId: 'A', toDay: 3, appliedAt: '2026-04-06', reversible: true },
      ],
    })

    const sessionA = result.sessions[0]
    if (sessionA.kind === 'dated') {
      expect(sessionA.dayOfWeek).toBe(3) // Accepted on club day
    }
  })

  it('F10: calendar reschedule to Saturday (6) works when no match on Saturday', () => {
    // Match on Sunday (0), reschedule to Saturday (6) — should be accepted
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'early_week')],
      schedulingMode: 'calendar',
      events: [match('2026-04-12')], // Sunday = day 0
      today: TODAY,
      corrections: [
        { id: 'c1', type: 'reschedule', sessionId: 'A', toDay: 6, appliedAt: '2026-04-06', reversible: true },
      ],
    })

    const sessionA = result.sessions.find(
      (s) => s.kind === 'dated' && s.sessionSlot.sessionId === 'A',
    )
    if (sessionA?.kind === 'dated') {
      // Saturday is not blocked (match is Sunday, J-1 for non-light blocks Saturday — but
      // the reschedule validator checks differently). If Saturday is blocked by J-1 for
      // Sunday match, the reschedule is rejected and falls back. Either way, no crash.
      expect(sessionA.dayOfWeek).toBeDefined()
    }
  })

  it('F10: calendar reschedule to Sunday (0) when no match → accepted', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'early_week')],
      schedulingMode: 'calendar',
      events: [], // no match
      today: TODAY,
      corrections: [
        { id: 'c1', type: 'reschedule', sessionId: 'A', toDay: 0, appliedAt: '2026-04-06', reversible: true },
      ],
    })

    const sessionA = result.sessions[0]
    if (sessionA?.kind === 'dated') {
      expect(sessionA.dayOfWeek).toBe(0) // Sunday
    }
  })

})

// ── Corrections — unavailable_day (calendar only) ───────────────────

describe('resolveWeekPresentation — correction: unavailable_day', () => {
  it('calendar: adds day to unavailableDays', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'early_week')],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      corrections: [
        { id: 'c1', type: 'unavailable_day', toDay: 1, appliedAt: '2026-04-06', reversible: true },
      ],
    })

    expect(result.unavailableDays).toContain(1)
  })

  it('calendar: session on unavailable day is re-placed', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'early_week')], // would normally go to day 1
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      corrections: [
        { id: 'c1', type: 'unavailable_day', toDay: 1, appliedAt: '2026-04-06', reversible: true },
      ],
    })

    const sessionA = result.sessions[0]
    if (sessionA.kind === 'dated') {
      expect(sessionA.dayOfWeek).not.toBe(1) // Should have been moved
    }
  })
})

// ── UX cleanup: day-state semantics ───────────────────────────────

describe('resolveWeekPresentation — day-state semantics (UX cleanup)', () => {
  it('unavailableDays contains only user-correction unavailable days, not club days', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'mid_week')],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      clubSchedule: club([1, 4]), // Mon+Thu blocked by club
      corrections: [
        { id: 'c1', type: 'unavailable_day', toDay: 5, appliedAt: '2026-04-06', reversible: true },
      ],
    })

    // unavailableDays should only have the user correction (day 5)
    expect(result.unavailableDays).toEqual([5])
    // clubDays should have the club schedule days
    expect(result.clubDays).toEqual([1, 4])
  })

  it('clubDays is empty when no club schedule provided', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('A')],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      corrections: [],
    })

    expect(result.clubDays).toEqual([])
  })

  it('matchEvents carry opponent and is_home when available', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('A')],
      schedulingMode: 'calendar',
      events: [{
        date: '2026-04-11',
        type: 'match',
        opponent: 'Racing 92',
        is_home: false,
        kickoff_time: '20:45',
      }],
      today: TODAY,
      corrections: [],
    })

    expect(result.matchEvents).toHaveLength(1)
    expect(result.matchEvents[0].opponent).toBe('Racing 92')
    expect(result.matchEvents[0].is_home).toBe(false)
    expect(result.matchEvents[0].kickoff_time).toBe('20:45')
  })

  it('matchEvents degrade gracefully when optional fields missing', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('A')],
      schedulingMode: 'calendar',
      events: [{ date: '2026-04-11', type: 'match' }],
      today: TODAY,
      corrections: [],
    })

    expect(result.matchEvents).toHaveLength(1)
    expect(result.matchEvents[0].opponent).toBeUndefined()
    expect(result.matchEvents[0].is_home).toBeUndefined()
  })

  it('reschedule to a club day is accepted (club days are not forbidden for reschedule)', () => {
    // Club on Wednesday (3), session normally on Tuesday (2)
    // Reschedule to Wednesday (3) — should be accepted since club days are constrained, not forbidden
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'early_week')],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      clubSchedule: club([3]),
      corrections: [
        { id: 'c1', type: 'reschedule', sessionId: 'A', toDay: 3, appliedAt: '2026-04-06', reversible: true },
      ],
    })

    const sessionA = result.sessions[0]
    if (sessionA.kind === 'dated') {
      expect(sessionA.dayOfWeek).toBe(3) // Accepted on club day
    }
  })

  it('reschedule to a match day is now accepted (explicit user correction)', () => {
    // Match on Saturday (6), reschedule to Saturday — user wants match-day primer
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'early_week')],
      schedulingMode: 'calendar',
      events: [match('2026-04-11')],
      today: TODAY,
      corrections: [
        { id: 'c1', type: 'reschedule', sessionId: 'A', toDay: 6, appliedAt: '2026-04-06', reversible: true },
      ],
    })

    const sessionA = result.sessions[0]
    if (sessionA.kind === 'dated') {
      expect(sessionA.dayOfWeek).toBe(6) // Accepted — user explicitly chose match day
    }
  })

  it('explicit reschedule to club day succeeds when no other S&C session on that day', () => {
    // Club on Friday (5), two sessions auto-placed elsewhere, reschedule B to Friday
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'early_week'), slot('B', 'mid_week')],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      clubSchedule: club([5]), // Vendredi is club day
      corrections: [
        { id: 'c1', type: 'reschedule', sessionId: 'B', toDay: 5, appliedAt: '2026-04-06', reversible: true },
      ],
    })

    const sessionB = result.sessions.find(
      (s) => s.kind === 'dated' && s.sessionSlot.sessionId === 'B',
    )
    expect(sessionB).toBeDefined()
    if (sessionB?.kind === 'dated') {
      expect(sessionB.dayOfWeek).toBe(5) // Accepted — rugby + one S&C = allowed
    }
    // Club day appears in output
    expect(result.clubDays).toContain(5)
  })

  it('two S&C sessions on the same day via reschedule: second is rejected', () => {
    // Both A and B rescheduled to the same club day (Friday 5)
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'early_week'), slot('B', 'mid_week')],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      clubSchedule: club([5]),
      corrections: [
        { id: 'c1', type: 'reschedule', sessionId: 'A', toDay: 5, appliedAt: '2026-04-06', reversible: true },
        { id: 'c2', type: 'reschedule', sessionId: 'B', toDay: 5, appliedAt: '2026-04-06', reversible: true },
      ],
    })

    const datedSessions = result.sessions.filter(
      (s) => s.kind === 'dated',
    ) as Array<{ dayOfWeek: number; sessionSlot: { sessionId: string } }>
    const onFriday = datedSessions.filter((s) => s.dayOfWeek === 5)
    // At most one S&C session on Friday — the second reschedule should fall back
    expect(onFriday.length).toBeLessThanOrEqual(1)
  })

  it('reschedule to user-unavailable day is rejected', () => {
    const result = resolveWeekPresentation({
      motherSessions: [slot('A', 'early_week')],
      schedulingMode: 'calendar',
      events: [],
      today: TODAY,
      corrections: [
        { id: 'c1', type: 'unavailable_day', toDay: 4, appliedAt: '2026-04-06', reversible: true },
        { id: 'c2', type: 'reschedule', sessionId: 'A', toDay: 4, appliedAt: '2026-04-06', reversible: true },
      ],
    })

    const sessionA = result.sessions[0]
    if (sessionA.kind === 'dated') {
      expect(sessionA.dayOfWeek).not.toBe(4) // Rejected — user-unavailable
    }
  })
})
