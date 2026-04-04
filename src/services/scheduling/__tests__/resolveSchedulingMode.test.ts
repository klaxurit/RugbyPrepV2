import { describe, expect, it } from 'vitest'
import { resolveSchedulingMode } from '../resolveSchedulingMode'
import type { ResolveSchedulingModeParams } from '../../../types/scheduling'

type EventInput = ResolveSchedulingModeParams['events'][number]

function match(date: string, hidden?: boolean): EventInput {
  return { date, type: 'match', user_hidden: hidden }
}

function rest(date: string): EventInput {
  return { date, type: 'rest' }
}

const TODAY = '2026-04-02'

describe('resolveSchedulingMode', () => {
  // ── Level 1: future match within 42 days ──

  it('L1 — future match at J+1 → calendar, high', () => {
    const r = resolveSchedulingMode({
      events: [match('2026-04-03')],
      today: TODAY,
    })
    expect(r.mode).toBe('calendar')
    expect(r.confidence).toBe('high')
    expect(r.reason).toBe('future_matches_detected')
    expect(r.calendarSignalStrength).toBe(1)
  })

  it('L1 — future match at J+42 (boundary) → calendar, high', () => {
    const r = resolveSchedulingMode({
      events: [match('2026-05-14')],
      today: TODAY,
    })
    expect(r.mode).toBe('calendar')
    expect(r.confidence).toBe('high')
    expect(r.calendarSignalStrength).toBe(1)
  })

  it('L1 — future match at J+43 (outside boundary) → not L1', () => {
    const r = resolveSchedulingMode({
      events: [match('2026-05-15')],
      today: TODAY,
    })
    // Should fall through to level 6
    expect(r.mode).toBe('sequential')
  })

  it('L1 — multiple future matches → calendarSignalStrength counts them, capped at 100', () => {
    const events = Array.from({ length: 5 }, (_, i) =>
      match(`2026-04-${String(5 + i).padStart(2, '0')}`),
    )
    const r = resolveSchedulingMode({ events, today: TODAY })
    expect(r.calendarSignalStrength).toBe(5)
  })

  it('L1 — hidden match is ignored', () => {
    const r = resolveSchedulingMode({
      events: [match('2026-04-05', true)],
      today: TODAY,
    })
    expect(r.mode).toBe('sequential')
    expect(r.reason).toBe('no_data')
  })

  it('L1 — rest events are ignored', () => {
    const r = resolveSchedulingMode({
      events: [rest('2026-04-05')],
      today: TODAY,
    })
    expect(r.mode).toBe('sequential')
  })

  // ── Level 2: recent past match within 28 days ──

  it('L2 — recent match at J-1 → calendar, medium', () => {
    const r = resolveSchedulingMode({
      events: [match('2026-04-01')],
      today: TODAY,
    })
    expect(r.mode).toBe('calendar')
    expect(r.confidence).toBe('medium')
    expect(r.reason).toBe('recent_match_detected')
    expect(r.calendarSignalStrength).toBe(0)
  })

  it('L2 — recent match at J-28 (boundary) → calendar, medium', () => {
    const r = resolveSchedulingMode({
      events: [match('2026-03-05')],
      today: TODAY,
    })
    expect(r.mode).toBe('calendar')
    expect(r.confidence).toBe('medium')
  })

  it('L2 — old match at J-29 (outside boundary) → not L2', () => {
    const r = resolveSchedulingMode({
      events: [match('2026-03-04')],
      today: TODAY,
    })
    expect(r.mode).toBe('sequential')
  })

  it('L2 — hidden past match is ignored', () => {
    const r = resolveSchedulingMode({
      events: [match('2026-04-01', true)],
      today: TODAY,
    })
    expect(r.mode).toBe('sequential')
  })

  // ── Level 3: seasonEndedAt set ──

  it('L3 — seasonEndedAt set → sequential, high', () => {
    const r = resolveSchedulingMode({
      events: [],
      today: TODAY,
      planningAnchors: { seasonEndedAt: '2026-03-15' },
    })
    expect(r.mode).toBe('sequential')
    expect(r.confidence).toBe('high')
    expect(r.reason).toBe('season_ended')
  })

  // ── Level 4: onboardingCycleHint = off_season ──

  it('L4 — onboardingCycleHint off_season → sequential, high', () => {
    const r = resolveSchedulingMode({
      events: [],
      today: TODAY,
      onboardingCycleHint: 'off_season',
    })
    expect(r.mode).toBe('sequential')
    expect(r.confidence).toBe('high')
    expect(r.reason).toBe('onboarding_off_season')
  })

  it('L4 — onboardingCycleHint from planningAnchors → sequential, high', () => {
    const r = resolveSchedulingMode({
      events: [],
      today: TODAY,
      planningAnchors: { onboardingCycleHint: 'off_season' },
    })
    expect(r.mode).toBe('sequential')
    expect(r.confidence).toBe('high')
    expect(r.reason).toBe('onboarding_off_season')
  })

  // ── Level 5: onboardingCycleHint = in_season / pre_season ──

  it('L5 — onboardingCycleHint in_season → sequential, medium', () => {
    const r = resolveSchedulingMode({
      events: [],
      today: TODAY,
      onboardingCycleHint: 'in_season',
    })
    expect(r.mode).toBe('sequential')
    expect(r.confidence).toBe('medium')
    expect(r.reason).toBe('onboarding_season_hint')
  })

  it('L5 — onboardingCycleHint pre_season → sequential, medium', () => {
    const r = resolveSchedulingMode({
      events: [],
      today: TODAY,
      onboardingCycleHint: 'pre_season',
    })
    expect(r.mode).toBe('sequential')
    expect(r.confidence).toBe('medium')
  })

  // ── Level 6: no data ──

  it('L6 — no events, no anchors, no hint → sequential, low', () => {
    const r = resolveSchedulingMode({
      events: [],
      today: TODAY,
    })
    expect(r.mode).toBe('sequential')
    expect(r.confidence).toBe('low')
    expect(r.reason).toBe('no_data')
    expect(r.calendarSignalStrength).toBe(0)
  })

  // ── Priority tests ──

  it('L1 takes priority over L3 (future match + seasonEndedAt)', () => {
    const r = resolveSchedulingMode({
      events: [match('2026-04-10')],
      today: TODAY,
      planningAnchors: { seasonEndedAt: '2026-03-01' },
    })
    expect(r.mode).toBe('calendar')
    expect(r.confidence).toBe('high')
  })

  it('L2 takes priority over L4 (recent match + off_season hint)', () => {
    const r = resolveSchedulingMode({
      events: [match('2026-03-30')],
      today: TODAY,
      onboardingCycleHint: 'off_season',
    })
    expect(r.mode).toBe('calendar')
    expect(r.confidence).toBe('medium')
  })

  it('L3 takes priority over L4 (seasonEndedAt + off_season hint)', () => {
    const r = resolveSchedulingMode({
      events: [],
      today: TODAY,
      planningAnchors: { seasonEndedAt: '2026-03-15' },
      onboardingCycleHint: 'off_season',
    })
    expect(r.reason).toBe('season_ended')
  })

  // ── Edge: match on today ──

  it('match on today (delta=0) → calendar, high (F5 fix)', () => {
    const r = resolveSchedulingMode({
      events: [match('2026-04-02')],
      today: TODAY,
    })
    // F5: match on today is treated as a future match (delta >= 0)
    expect(r.mode).toBe('calendar')
    expect(r.confidence).toBe('high')
    expect(r.reason).toBe('future_matches_detected')
  })
})
