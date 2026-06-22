import { describe, expect, it } from 'vitest'
import { DEFAULT_PROFILE } from '../../../hooks/useProfile'
import type { CalendarEvent, SessionLog, UserProfile } from '../../../types/training'
import { detectAnnualPlanningContext } from '../../season/detectAnnualPlanningContext'
import { buildAthletePlanningInputs } from '../buildAthletePlanningInputs'

const TODAY = '2025-03-10'

function baseProfile(over: Partial<UserProfile>): UserProfile {
  return { ...DEFAULT_PROFILE, ...over }
}

const emptyEvents: CalendarEvent[] = []

describe('buildAthletePlanningInputs', () => {
  it('FRONT_ROW -> front_row', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ rugbyPosition: 'FRONT_ROW' }),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.derived.resolvedPositionGroup).toBe('front_row')
    expect(r.inputs.positionGroup).toBe('front_row')
  })

  it('BACK_THREE -> back_three', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ rugbyPosition: 'BACK_THREE' }),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.derived.resolvedPositionGroup).toBe('back_three')
  })

  it('SECOND_ROW (avant non première ligne) -> front_row', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ rugbyPosition: 'SECOND_ROW' }),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.derived.resolvedPositionGroup).toBe('front_row')
  })

  it('poste absent -> back_three + warning', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ rugbyPosition: undefined, position: undefined }),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.derived.resolvedPositionGroup).toBe('back_three')
    expect(r.warnings.some((w) => /non renseigné|back_three/i.test(w))).toBe(true)
  })

  it('fatigue OK + ACWR optimal -> normal', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({}),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
      acwrZone: 'optimal',
    })
    expect(r.derived.fatigueLevel).toBe('normal')
  })

  it('FATIGUE ou caution -> high', () => {
    const hi = buildAthletePlanningInputs({
      profile: baseProfile({}),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'FATIGUE',
      acwrZone: 'optimal',
    })
    expect(hi.derived.fatigueLevel).toBe('high')

    const hi2 = buildAthletePlanningInputs({
      profile: baseProfile({}),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
      acwrZone: 'caution',
    })
    expect(hi2.derived.fatigueLevel).toBe('high')
  })

  it('danger / critical -> very_high', () => {
    const d = buildAthletePlanningInputs({
      profile: baseProfile({}),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
      acwrZone: 'danger',
    })
    expect(d.derived.fatigueLevel).toBe('very_high')
    const c = buildAthletePlanningInputs({
      profile: baseProfile({}),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
      acwrZone: 'critical',
    })
    expect(c.derived.fatigueLevel).toBe('very_high')
  })

  it('monitoring snapshot : compteurs 7j/28j, blessures, dernière charge RPE×durée', () => {
    const logs: SessionLog[] = [
      {
        id: '1',
        dateISO: '2025-03-09T10:00:00.000Z',
        week: 'W1',
        sessionType: 'LOWER',
        fatigue: 'OK',
        rpe: 8,
        durationMin: 60,
      },
      {
        id: '2',
        dateISO: '2025-03-01T10:00:00.000Z',
        week: 'W1',
        sessionType: 'UPPER',
        fatigue: 'OK',
      },
    ]
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ injuries: ['knee_pain', 'ankle_pain'] }),
      events: emptyEvents,
      logs,
      today: '2025-03-10',
      fatigue: 'OK',
    })
    expect(r.inputs.monitoringSnapshot?.completedSessionsLast7d).toBeGreaterThanOrEqual(1)
    expect(r.inputs.monitoringSnapshot?.completedSessionsLast28d).toBeGreaterThanOrEqual(2)
    expect(r.inputs.monitoringSnapshot?.painFlags).toEqual(['knee_pain', 'ankle_pain'])
    expect(r.inputs.monitoringSnapshot?.latestRpeLoad).toBe(8 * 60)
  })

  it('weeklySessions absente -> fallback 2 + warning', () => {
    const r = buildAthletePlanningInputs({
      profile: { ...baseProfile({}), weeklySessions: undefined as unknown as 2 | 3 },
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.inputs.weeklyFrequency).toBe(2)
    expect(r.warnings.some((w) => /fréquence|2 séances/i.test(w))).toBe(true)
  })

  it('identity : clubCode + athleteId passés via athleteIdentity', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ clubCode: 'ABC' }),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
      athleteIdentity: { athleteId: 'user-1', source: 'self' },
    })
    expect(r.inputs.identity?.athleteId).toBe('user-1')
    expect(r.inputs.identity?.clubId).toBe('ABC')
    expect(r.inputs.identity?.source).toBe('self')
  })

  it('first-run (events=0, logs=0) : injecte onboardingCycleHint depuis seasonMode', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ seasonMode: 'off_season' }),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    // Without seasonEndedAt anchor, off_season goes through hint path, not manual override
    expect(r.inputs.planningAnchors?.onboardingCycleHint).toBe('off_season')
    expect(r.inputs.planningAnchors?.manualCycleOverride).toBeUndefined()
  })

  it('logs présents + pas de match + seasonMode → hint injecté (seasonMode durable)', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ seasonMode: 'in_season' }),
      events: emptyEvents,
      logs: [{ dateISO: '2025-03-09', sessionType: 'UPPER' as const }] as SessionLog[],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.inputs.planningAnchors).toEqual({ onboardingCycleHint: 'in_season' })
  })

  it('événement rest seul + pas de logs → hint injecté', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ seasonMode: 'in_season' }),
      events: [{ date: '2025-03-08', type: 'rest' }] as CalendarEvent[],
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.inputs.planningAnchors).toEqual({ onboardingCycleHint: 'in_season' })
  })

  it('événement unavailable seul + pas de logs → hint injecté', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ seasonMode: 'pre_season' }),
      events: [{ date: '2025-03-08', type: 'unavailable' }] as CalendarEvent[],
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.inputs.planningAnchors).toEqual({ onboardingCycleHint: 'pre_season' })
  })

  it('V2: match présent + in_season → pas de manualCycleOverride (auto-detection)', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ seasonMode: 'in_season' }),
      events: [{ date: '2025-04-05', type: 'match' }] as CalendarEvent[],
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    // V2: in_season with matches lets V2 auto-detect (no manual override)
    expect(r.inputs.planningAnchors?.manualCycleOverride).toBeUndefined()
  })

  it('V2: match présent + pre_season → pas de manualCycleOverride (auto-detection)', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ seasonMode: 'pre_season' }),
      events: [{ date: '2025-04-05', type: 'match' }] as CalendarEvent[],
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    // V2: pre_season with matches lets V2 auto-detect (no manual override)
    expect(r.inputs.planningAnchors?.manualCycleOverride).toBeUndefined()
  })

  it('off_season onboarding hint preserved when calendar has past matches but no seasonEndedAt', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({
        seasonMode: 'off_season',
        planningAnchors: {
          onboardingCycleHint: 'off_season',
          offSeasonStartAt: '2025-03-10',
        },
      }),
      events: [{ id: 'm1', date: '2025-02-22', type: 'match' }] as CalendarEvent[],
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.inputs.planningAnchors?.onboardingCycleHint).toBe('off_season')
    expect(r.inputs.planningAnchors?.offSeasonStartAt).toBe('2025-03-10')
  })

  // ── S3 Slice 4: onboardingCycleHint source of truth ──

  it('prefers planningAnchors.onboardingCycleHint over seasonMode for bootstrap', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({
        seasonMode: 'in_season',
        planningAnchors: { onboardingCycleHint: 'off_season' },
      }),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    // onboardingCycleHint wins over seasonMode
    expect(r.inputs.planningAnchors?.onboardingCycleHint).toBe('off_season')
    // No manual override (no seasonEndedAt anchor)
    expect(r.inputs.planningAnchors?.manualCycleOverride).toBeUndefined()
  })

  it('falls back to seasonMode when onboardingCycleHint is absent', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({
        seasonMode: 'pre_season',
        planningAnchors: {},
      }),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.inputs.planningAnchors?.onboardingCycleHint).toBe('pre_season')
  })

  it('off_season hint without seasonEndedAt does NOT force manualCycleOverride', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({
        seasonMode: 'in_season',
        planningAnchors: { onboardingCycleHint: 'off_season' },
      }),
      events: emptyEvents,
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.inputs.planningAnchors?.manualCycleOverride).toBeUndefined()
    expect(r.inputs.planningAnchors?.onboardingCycleHint).toBe('off_season')
  })

  it('propage les overrides admin (manualCycleOverride + semaine inter-saison)', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({
        seasonMode: 'off_season',
        planningAnchors: {
          manualCycleOverride: 'off_season',
          manualOffSeasonWeekOverride: 5,
        },
      }),
      events: [{ id: 'm1', date: TODAY, type: 'match' }] as CalendarEvent[],
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.inputs.planningAnchors?.manualCycleOverride).toBe('off_season')
    expect(r.inputs.planningAnchors?.manualOffSeasonWeekOverride).toBe(5)
  })

  it('semaine manuelle + skip récup sans manualCycleOverride → force off_season', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({
        seasonMode: 'off_season',
        planningAnchors: {
          manualOffSeasonWeekOverride: 5,
          skipOffSeasonRecoveryIntro: true,
        },
      }),
      events: [{ id: 'm1', date: TODAY, type: 'match' }] as CalendarEvent[],
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.inputs.planningAnchors?.manualCycleOverride).toBe('off_season')
    expect(r.inputs.planningAnchors?.manualOffSeasonWeekOverride).toBe(5)
  })

  // ── Match-in-current-week vs seasonEndedAt ──

  it('preserves seasonEndedAt when a match exists in the same ISO week (FFR stale)', () => {
    const today = '2025-03-14'
    const r = buildAthletePlanningInputs({
      profile: baseProfile({
        seasonMode: 'off_season',
        planningAnchors: { seasonEndedAt: '2025-02-28' },
      }),
      events: [{ id: 'm1', date: '2025-03-12', type: 'match' }] as CalendarEvent[],
      logs: [],
      today,
      fatigue: 'OK',
    })
    expect(r.inputs.planningAnchors?.seasonEndedAt).toBe('2025-02-28')
    expect(r.inputs.planningAnchors?.manualCycleOverride).toBe('off_season')
  })

  it('keeps off_season manualCycleOverride with match in same week when season ended', () => {
    const today = '2025-03-13'
    const r = buildAthletePlanningInputs({
      profile: baseProfile({
        seasonMode: 'off_season',
        planningAnchors: {
          seasonEndedAt: '2025-02-20',
          onboardingCycleHint: 'off_season',
        },
      }),
      events: [{ id: 'm1', date: '2025-03-10', type: 'match' }] as CalendarEvent[],
      logs: [],
      today,
      fatigue: 'OK',
    })
    expect(r.inputs.planningAnchors?.manualCycleOverride).toBe('off_season')
    expect(r.inputs.planningAnchors?.seasonEndedAt).toBe('2025-02-20')
  })

  it('seasonEndedAt is preserved when no match exists this week or in the future', () => {
    // Today is 2025-03-14 — last match was 2025-02-28 (different week, in the past)
    const today = '2025-03-14'
    const r = buildAthletePlanningInputs({
      profile: baseProfile({
        seasonMode: 'off_season',
        planningAnchors: { seasonEndedAt: '2025-02-28' },
      }),
      events: [{ id: 'm1', date: '2025-02-22', type: 'match' }] as CalendarEvent[],
      logs: [],
      today,
      fatigue: 'OK',
    })
    // No match this week and no future match → seasonEndedAt is valid
    expect(r.inputs.planningAnchors?.seasonEndedAt).toBe('2025-02-28')
    expect(r.inputs.planningAnchors?.manualCycleOverride).toBe('off_season')
  })

  it('preserves seasonEndedAt when a future match exists (user declared end of season)', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({
        seasonMode: 'off_season',
        planningAnchors: { seasonEndedAt: '2025-02-28' },
      }),
      events: [{ id: 'm1', date: TODAY, type: 'match' }] as CalendarEvent[],
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })
    expect(r.inputs.planningAnchors?.seasonEndedAt).toBe('2025-02-28')
    expect(r.inputs.planningAnchors?.manualCycleOverride).toBe('off_season')
  })

  it('hidden match does not invalidate seasonEndedAt anchor', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({
        seasonMode: 'off_season',
        planningAnchors: { seasonEndedAt: '2025-02-28' },
      }),
      events: [{
        id: 'm-hidden',
        date: TODAY,
        type: 'match',
        source: 'ffr_import',
        user_hidden: true,
      }] as CalendarEvent[],
      logs: [],
      today: TODAY,
      fatigue: 'OK',
    })

    expect(r.inputs.events).toEqual([])
    expect(r.inputs.planningAnchors?.seasonEndedAt).toBe('2025-02-28')
    expect(r.inputs.planningAnchors?.manualCycleOverride).toBe('off_season')
  })

  it('ACWR critical is ignored when seasonEndedAt is set (off-season transition)', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({
        seasonMode: 'off_season',
        planningAnchors: { seasonEndedAt: '2025-02-28' },
      }),
      events: [],
      logs: [],
      today: TODAY,
      fatigue: 'OK',
      acwrZone: 'critical',
    })
    // ACWR critical should NOT produce very_high fatigue in off-season
    // (match loads from the ended season are transient)
    expect(r.derived.fatigueLevel).toBe('normal')
  })

  it('ACWR critical still applies when season is active (no seasonEndedAt)', () => {
    const r = buildAthletePlanningInputs({
      profile: baseProfile({ seasonMode: 'in_season' }),
      events: [{ id: 'm1', date: TODAY, type: 'match' }] as CalendarEvent[],
      logs: [],
      today: TODAY,
      fatigue: 'OK',
      acwrZone: 'critical',
    })
    expect(r.derived.fatigueLevel).toBe('very_high')
  })

  it('auto manualPlayoffs when a future FFR journee signals playoffs', () => {
    const built = buildAthletePlanningInputs({
      profile: baseProfile({ planningAnchors: {} }),
      events: [
        {
          id: 'm-finals',
          date: '2026-05-20',
          type: 'match',
          journee_name: 'Demi-finale',
        } as CalendarEvent,
      ],
      logs: [],
      today: '2026-05-01',
      fatigue: 'OK',
    })
    expect(built.inputs.planningAnchors?.manualPlayoffs).toBe(true)

    const ctx = detectAnnualPlanningContext({
      weeklyFrequency: 3,
      positionGroup: 'front_row',
      events: built.inputs.events,
      today: '2026-05-01',
      planningAnchors: built.inputs.planningAnchors,
    })
    expect(ctx.cycle).toBe('playoffs')
  })

  it('does not auto manualPlayoffs after manual off-season confirmation', () => {
    const built = buildAthletePlanningInputs({
      profile: baseProfile({
        planningAnchors: {
          seasonEndedAt: '2026-03-01',
          seasonEndedSource: 'manual',
        },
      }),
      events: [
        {
          id: 'm-finals',
          date: '2026-05-20',
          type: 'match',
          journee_name: 'Finale',
        } as CalendarEvent,
      ],
      logs: [],
      today: '2026-05-01',
      fatigue: 'OK',
    })
    expect(built.inputs.planningAnchors?.manualPlayoffs).toBeUndefined()
  })

  it('regression: off-season hypertrophy not reset by FFR match this week', () => {
    const seasonEndedAt = '2026-02-12'
    const today = '2026-03-20'
    const built = buildAthletePlanningInputs({
      profile: baseProfile({
        weeklySessions: 3,
        seasonMode: 'off_season',
        planningAnchors: {
          seasonEndedAt,
          seasonEndedSource: 'manual',
          skipOffSeasonRecoveryIntro: true,
          onboardingCycleHint: 'off_season',
        },
      }),
      events: [
        { id: 'm-ffr', date: '2026-03-18', type: 'match', source: 'ffr_import' } as CalendarEvent,
      ],
      logs: [],
      today,
      fatigue: 'OK',
    })
    const ctx = detectAnnualPlanningContext({
      weeklyFrequency: built.inputs.weeklyFrequency,
      positionGroup: built.inputs.positionGroup,
      events: built.inputs.events,
      today,
      planningAnchors: built.inputs.planningAnchors,
    })
    expect(ctx.cycle).toBe('off_season')
    expect(ctx.offSeasonPhase).toBe(3)
    expect(built.inputs.weeklyFrequency).toBe(3)
  })
})
