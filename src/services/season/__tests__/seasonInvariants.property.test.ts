import { describe, it, expect, beforeAll } from 'vitest'
import fc from 'fast-check'

// Bump per-property runs from 100 → 250 — these are pure-function tests under 1ms each,
// so the extra coverage is essentially free and gives shrinking more room to find
// minimal counter-examples.
beforeAll(() => {
  fc.configureGlobal({ numRuns: 250 })
})

import { detectAnnualPlanningContext } from '../detectAnnualPlanningContext'
import { applyDeferralRules } from '../deferralRules'
import { appendTransitionEntry, restoreLastTransition } from '../transitionJournal'

import type { AthletePlanningInputs, AnnualCycle } from '../../../types/annualPlanning'
import type {
  ActiveDeferral,
  CalendarEvent,
  SeasonTransitionState,
  TransitionEntry,
} from '../../../types/training'

// ─── Helpers ──────────────────────────────────────────────────────────

function addDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

// ─── Arbitraries ──────────────────────────────────────────────────────

const arbDateYmd = fc
  .tuple(
    fc.integer({ min: 2025, max: 2027 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }), // safe across all months (no Feb 29)
  )
  .map(([y, m, d]) => `${y}-${pad(m)}-${pad(d)}`)

const arbMatchOffsets = fc.array(fc.integer({ min: -180, max: 365 }), {
  minLength: 0,
  maxLength: 12,
})

const arbInputs: fc.Arbitrary<AthletePlanningInputs> = fc
  .record({
    today: arbDateYmd,
    matchOffsets: arbMatchOffsets,
    weeklyFrequency: fc.constantFrom(2 as const, 3 as const, 4 as const),
    positionGroup: fc.constantFrom('front_row' as const, 'back_three' as const),
  })
  .map(({ today, matchOffsets, weeklyFrequency, positionGroup }) => ({
    today,
    events: matchOffsets.map((off, i) => ({
      id: `evt-${i}-${off}`,
      date: addDays(today, off),
      type: 'match' as const,
    })),
    weeklyFrequency,
    positionGroup,
  }))

const arbCycle: fc.Arbitrary<AnnualCycle> = fc.constantFrom(
  'off_season',
  'pre_season',
  'in_season',
  'playoffs',
)

// Deferral arbitraries — generate visibleEvents with unique ids and pick one as deferred.
const arbVisibleEvent = (today: string) =>
  fc
    .tuple(fc.integer({ min: -100, max: 200 }), fc.integer({ min: 0, max: 1_000_000 }))
    .map(([off, salt]): CalendarEvent => ({
      id: `evt-${salt}-${off}`,
      date: addDays(today, off),
      type: 'match',
    }))

const arbDeferralCase = arbDateYmd.chain((today) =>
  fc
    .uniqueArray(arbVisibleEvent(today), {
      selector: (e) => e.id,
      minLength: 1,
      maxLength: 6,
    })
    .chain((events) =>
      fc
        .integer({ min: 0, max: events.length - 1 })
        .chain((targetIdx) =>
          fc
            .integer({ min: 1, max: 60 })
            .map((expiresInDays) => {
              const target = events[targetIdx]
              const deferral: ActiveDeferral = {
                eventId: target.id,
                matchDateAtDefer: target.date,
                deferredAt: today,
                expiresAt: addDays(today, expiresInDays),
              }
              return { today, events, deferral, targetIdx }
            }),
        ),
    ),
)

// Transition journal arbitraries
const arbTransitionEntry: fc.Arbitrary<TransitionEntry> = fc
  .record({
    id: fc.string({ minLength: 4, maxLength: 12 }),
    at: arbDateYmd,
    trigger: fc.constantFrom(
      'user_manual' as const,
      'banner_action' as const,
      'auto_56d' as const,
      'ffr_match' as const,
      'profile_change' as const,
    ),
    fromCycle: arbCycle,
    fromWeek: fc.integer({ min: 1, max: 12 }),
    toCycle: arbCycle,
  })
  .map(({ id, at, trigger, fromCycle, fromWeek, toCycle }) => ({
    id,
    at,
    trigger,
    from: { cycle: fromCycle, weekNumber: fromWeek, schedulingMode: 'calendar' as const },
    anchorsSnapshot: { onboardingCycleHint: fromCycle },
    to: toCycle,
  }))

// ─── Properties ───────────────────────────────────────────────────────

describe('B4 — detectAnnualPlanningContext invariants', () => {
  it('P1 — never throws on valid inputs', () => {
    fc.assert(
      fc.property(arbInputs, (inputs) => {
        expect(() => detectAnnualPlanningContext(inputs)).not.toThrow()
      }),
    )
  })

  it('P2 — output is well-formed (cycle/label/trace)', () => {
    fc.assert(
      fc.property(arbInputs, (inputs) => {
        const ctx = detectAnnualPlanningContext(inputs)
        expect(['off_season', 'pre_season', 'in_season', 'playoffs']).toContain(ctx.cycle)
        expect(ctx.weekLabel.length).toBeGreaterThan(0)
        expect([
          'manual_override',
          'explicit_anchors',
          'calendar_inferred',
          'onboarding_hint',
          'default_ffr_clock',
          'backfilled',
        ]).toContain(ctx.planningTrace.resolutionMode)
      }),
    )
  })

  it('P3 — in-season mesocycle invariant: weekNumber === 4·(block-1) + week, deload ⇔ week=4 (sauf trêve Noël)', () => {
    fc.assert(
      fc.property(arbInputs, (inputs) => {
        const ctx = detectAnnualPlanningContext(inputs)
        if (ctx.cycle !== 'in_season') return
        // mesocycle fields are required when in_season
        expect(ctx.mesocycleWeek).toBeDefined()
        expect(ctx.mesocycleBlock).toBeDefined()
        const expectedWeekNumber = (ctx.mesocycleBlock! - 1) * 4 + ctx.mesocycleWeek!
        expect(ctx.weekNumber).toBe(expectedWeekNumber)
        const christmasDeload = ctx.planningTrace.rulesApplied.includes('rule:ffr_christmas_deload')
        expect(ctx.isDeloadWeek).toBe(ctx.mesocycleWeek === 4 || christmasDeload)
      }),
    )
  })

  it('P4 — pre-season weekNumber ∈ [1, effective], deload ⇔ wn%4=0 OR wn=last', () => {
    fc.assert(
      fc.property(arbInputs, (inputs) => {
        const ctx = detectAnnualPlanningContext(inputs)
        if (ctx.cycle !== 'pre_season') return
        const last = ctx.effectivePreSeasonWeeks ?? 12
        expect(ctx.weekNumber).toBeGreaterThanOrEqual(1)
        expect(ctx.weekNumber!).toBeLessThanOrEqual(last)
        const expectedDeload = ctx.weekNumber! % 4 === 0 || ctx.weekNumber === last
        expect(ctx.isDeloadWeek).toBe(expectedDeload)
      }),
    )
  })

  it('P5 — off-season: weekNumber ≥ 1, décharge réservée au bloc hypertrophie', () => {
    fc.assert(
      fc.property(arbInputs, (inputs) => {
        const ctx = detectAnnualPlanningContext(inputs)
        if (ctx.cycle !== 'off_season') return
        expect(ctx.weekNumber).toBeGreaterThanOrEqual(1)
        // Récupération, Transition et Entretien sont déjà à volume bas, et
        // Force-Pont ne dure que 2 semaines : aucune décharge n'y a de sens.
        if (ctx.isDeloadWeek) expect(ctx.offSeasonPhase).toBe(3)
      }),
    )
  })

  it('P6 — monotonicity: today + 7d (same cycle + stable anchor) ⟹ weekNumber + 1', () => {
    fc.assert(
      fc.property(arbInputs, (inputs) => {
        const ctxA = detectAnnualPlanningContext(inputs)
        const ctxB = detectAnnualPlanningContext({ ...inputs, today: addDays(inputs.today as string, 7) })
        // Property only applies when the temporal anchor is stable across both calls.
        // The no-match fallback (line 622-633) and auto-season-end (line 808-822)
        // anchor off-season on todayWeekMonday → anchor slides with today → weekNumber stays 1.
        if (ctxA.offSeasonStartAt !== ctxB.offSeasonStartAt) return
        if (ctxA.cycle !== ctxB.cycle) return
        if (ctxA.weekNumber == null || ctxB.weekNumber == null) return
        // When today is before the computed off-season start, weekNumber is lower-clamped
        // to 1 (line 745-747). +7d brings us closer to the real anchor → ctxB stays at 1.
        if (ctxA.offSeasonStartAt != null && inputs.today < ctxA.offSeasonStartAt) return

        // Playoffs always returns weekNumber=1 — saturated by design.
        if (ctxA.cycle === 'playoffs') {
          expect(ctxB.weekNumber).toBe(ctxA.weekNumber)
          return
        }

        // Capping: pre_season clamps at effectivePreSeasonWeeks (defaults 12),
        // off_season clamps at effectiveOffSeasonWeeks. In-season is unbounded.
        const cap =
          ctxA.cycle === 'pre_season'
            ? (ctxA.effectivePreSeasonWeeks ?? 12)
            : ctxA.cycle === 'off_season'
              ? (ctxA.effectiveOffSeasonWeeks ?? Infinity)
              : Infinity

        if (ctxA.weekNumber >= cap) {
          // Saturated at cap, ctxB stays clamped at cap.
          expect(ctxB.weekNumber).toBe(cap)
        } else {
          expect(ctxB.weekNumber).toBe(ctxA.weekNumber + 1)
        }
      }),
    )
  })

  it('P7 — playoffs month guard: month > 5 + manualPlayoffs ⟹ cycle ≠ playoffs', () => {
    fc.assert(
      fc.property(arbInputs, (inputs) => {
        const month = parseInt((inputs.today as string).slice(5, 7), 10)
        if (month <= 5) return // guard not engaged

        const ctx = detectAnnualPlanningContext({
          ...inputs,
          planningAnchors: { manualPlayoffs: true },
        })
        expect(ctx.cycle).not.toBe('playoffs')
      }),
    )
  })

  it('P8 — firstMatchDateOverride takes priority over calendar', () => {
    fc.assert(
      fc.property(arbInputs, arbDateYmd, (inputs, override) => {
        const ctx = detectAnnualPlanningContext({
          ...inputs,
          planningAnchors: { firstMatchDateOverride: override },
        })
        expect(ctx.firstMatchDate).toBe(override)
      }),
    )
  })
})

describe('B4 — deferralRules invariants', () => {
  it('P9 — no activeDeferral ⟹ structuralEvents = visibleEvents, !shouldPurge', () => {
    fc.assert(
      fc.property(arbDeferralCase, ({ today, events }) => {
        const result = applyDeferralRules({
          activeDeferral: undefined,
          visibleEvents: events,
          today,
        })
        expect(result.structuralEvents).toBe(events)
        expect(result.shouldPurge).toBe(false)
      }),
    )
  })

  it('P10 — shouldPurge ⟹ structuralEvents = visibleEvents (purge does not filter)', () => {
    fc.assert(
      fc.property(arbDeferralCase, ({ today, events, deferral }) => {
        const result = applyDeferralRules({
          activeDeferral: deferral,
          visibleEvents: events,
          today,
        })
        if (!result.shouldPurge) return
        expect(result.structuralEvents).toBe(events)
      }),
    )
  })

  it('P11 — !shouldPurge & activeDeferral ⟹ |structural| = |visible| - 1, eventId filtered', () => {
    fc.assert(
      fc.property(arbDeferralCase, ({ today, events, deferral }) => {
        const result = applyDeferralRules({
          activeDeferral: deferral,
          visibleEvents: events,
          today,
        })
        if (result.shouldPurge) return
        expect(result.structuralEvents.length).toBe(events.length - 1)
        expect(result.structuralEvents.find((e) => e.id === deferral.eventId)).toBeUndefined()
      }),
    )
  })
})

describe('B4 — transitionJournal invariants', () => {
  it('P12a — appendTransitionEntry caps journal length at 3', () => {
    fc.assert(
      fc.property(fc.array(arbTransitionEntry, { minLength: 0, maxLength: 12 }), (entries) => {
        let state: SeasonTransitionState | undefined
        for (const e of entries) {
          state = appendTransitionEntry(state, e)
          expect((state.transitionJournal ?? []).length).toBeLessThanOrEqual(3)
        }
      }),
    )
  })

  it('P12b — restoreLastTransition is left-inverse of appendTransitionEntry', () => {
    fc.assert(
      fc.property(arbTransitionEntry, (entry) => {
        const after = appendTransitionEntry(undefined, entry)
        const restored = restoreLastTransition(after)
        expect(restored).not.toBeNull()
        expect(restored!.restoredAnchors).toEqual(entry.anchorsSnapshot)
        expect(restored!.restoredCycle).toBe(entry.from.cycle)
      }),
    )
  })
})
