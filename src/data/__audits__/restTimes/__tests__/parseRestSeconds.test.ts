import { describe, expect, it } from 'vitest'
import { parseRestSeconds } from '../parseRestSeconds'

describe('parseRestSeconds — primitive time specs', () => {
  it('parses single seconds value', () => {
    const r = parseRestSeconds('`2 rounds`, `60s` rest')
    expect(r.kind).toBe('rounds')
    expect(r.minSeconds).toBe(60)
    expect(r.maxSeconds).toBe(60)
  })

  it('parses second range', () => {
    const r = parseRestSeconds('`3 rounds`, `90-120s` rest after the pair')
    expect(r.kind).toBe('rounds')
    expect(r.minSeconds).toBe(90)
    expect(r.maxSeconds).toBe(120)
    expect(r.source).toMatch(/after the pair/i)
  })

  it('parses single min value', () => {
    const r = parseRestSeconds('`4 work sets`, `2 min` rest between sets')
    expect(r.kind).toBe('rounds')
    expect(r.minSeconds).toBe(120)
    expect(r.maxSeconds).toBe(120)
  })

  it('parses min range', () => {
    const r = parseRestSeconds('`4 work sets`, `2-3 min` rest between sets')
    expect(r.kind).toBe('rounds')
    expect(r.minSeconds).toBe(120)
    expect(r.maxSeconds).toBe(180)
  })

  it('parses compound "X min YY to Z min"', () => {
    const r = parseRestSeconds('`4 rounds`, full rest `2 min 30 to 3 min` after each round')
    expect(r.kind).toBe('rounds')
    expect(r.minSeconds).toBe(150)
    expect(r.maxSeconds).toBe(180)
  })
})

describe('parseRestSeconds — full rest pattern', () => {
  it('parses "full rest 3 min"', () => {
    const r = parseRestSeconds('`3 rounds`, full rest `3 min`')
    expect(r.kind).toBe('rounds')
    expect(r.minSeconds).toBe(180)
    expect(r.maxSeconds).toBe(180)
  })

  it('parses "full rest 2-3 min"', () => {
    const r = parseRestSeconds('`3 rounds`, full rest `2-3 min`')
    expect(r.minSeconds).toBe(120)
    expect(r.maxSeconds).toBe(180)
  })

  it('parses "full rest 90-120s"', () => {
    const r = parseRestSeconds('`3 rounds`, full rest `90-120s`')
    expect(r.minSeconds).toBe(90)
    expect(r.maxSeconds).toBe(120)
  })
})

describe('parseRestSeconds — qualifier priority', () => {
  it('prefers "between rounds" over "between exercises"', () => {
    const r = parseRestSeconds(
      '`4 rounds`, `10-15s` between exercises, full rest `3-4 min` after each round',
    )
    expect(r.kind).toBe('rounds')
    expect(r.minSeconds).toBe(180)
    expect(r.maxSeconds).toBe(240)
    expect(r.source).toMatch(/after each round/i)
  })

  it('prefers "between rounds" over "between reps" in block periodization spec', () => {
    const r = parseRestSeconds(
      '`W5-W6 = 4 rounds`, `W7 = 5 rounds`, `W8 = 4 rounds`, full rest `90-120s` between reps and `2-3 min` between rounds',
    )
    expect(r.kind).toBe('rounds')
    expect(r.minSeconds).toBe(120)
    expect(r.maxSeconds).toBe(180)
    expect(r.source).toMatch(/between rounds/i)
  })

  it('uses "after the triplet" as inter-round rest', () => {
    const r = parseRestSeconds('`3 rounds`, `90-120s` rest after the triplet')
    expect(r.minSeconds).toBe(90)
    expect(r.maxSeconds).toBe(120)
    expect(r.source).toMatch(/after the triplet/i)
  })

  it('falls back on "between drills" when single round (no inter-round)', () => {
    const r = parseRestSeconds('`1 round`, `20-30s` rest between drills')
    expect(r.kind).toBe('rounds')
    expect(r.minSeconds).toBe(20)
    expect(r.maxSeconds).toBe(30)
    expect(r.source).toMatch(/between drills/i)
  })
})

describe('parseRestSeconds — special kinds', () => {
  it('flags EMOM as emom kind (no numeric rest)', () => {
    const r = parseRestSeconds('`EMOM 8\'`')
    expect(r.kind).toBe('emom')
    expect(r.minSeconds).toBeNull()
    expect(r.maxSeconds).toBeNull()
  })

  it('flags "minimal rest" as minimal kind', () => {
    const r = parseRestSeconds('`2 rounds`, minimal rest')
    expect(r.kind).toBe('minimal')
    expect(r.minSeconds).toBeNull()
  })

  it('flags "move continuously with minimal rest" as minimal kind', () => {
    const r = parseRestSeconds('`2 rounds`, move continuously with minimal rest')
    expect(r.kind).toBe('minimal')
  })

  it('flags walk-back recovery as walkback kind', () => {
    const r = parseRestSeconds('`6-8 reps`, walk-back recovery and full rest between reps')
    expect(r.kind).toBe('walkback')
  })

  it('flags empty format as empty kind', () => {
    const r = parseRestSeconds('')
    expect(r.kind).toBe('empty')
  })

  it('flags null format as empty kind', () => {
    const r = parseRestSeconds(null)
    expect(r.kind).toBe('empty')
  })
})

describe('parseRestSeconds — coverage of corpus formats (smoke)', () => {
  // Sample of all distinct format strings observed in motherSessions.generated.ts
  // (Phase A discovery, 2026-05-08).
  const samples = [
    { fmt: '`3 rounds`, `75-90s` rest after the pair', expectMin: 75, expectMax: 90 },
    { fmt: '`2 rounds`, `45-60s` rest', expectMin: 45, expectMax: 60 },
    { fmt: '`3 rounds`, `90-120s` rest after the pair', expectMin: 90, expectMax: 120 },
    { fmt: '`4 rounds`, `90-120s` rest after the pair', expectMin: 90, expectMax: 120 },
    { fmt: '`3 rounds`, `60-75s` rest after the pair', expectMin: 60, expectMax: 75 },
    { fmt: '`2-3 rounds`, `45-60s` rest', expectMin: 45, expectMax: 60 },
    { fmt: '`3 rounds`, full rest `90-120s`', expectMin: 90, expectMax: 120 },
    { fmt: '`3 rounds`, full rest `2-3 min`', expectMin: 120, expectMax: 180 },
    { fmt: '`4 work sets`, `2-3 min` rest between sets', expectMin: 120, expectMax: 180 },
    { fmt: '`4 work sets`, `2 min` rest between sets', expectMin: 120, expectMax: 120 },
    { fmt: '`4 rounds`, full rest `3 min` after each round', expectMin: 180, expectMax: 180 },
    { fmt: '`4 rounds`, `3-4 min` rest between rounds', expectMin: 180, expectMax: 240 },
    { fmt: '`3 rounds`, full rest `3 min`', expectMin: 180, expectMax: 180 },
    { fmt: '`3 rounds`, `60-75s` rest after the pair', expectMin: 60, expectMax: 75 },
    { fmt: '`1-2 rounds`, `20-30s` rest between drills', expectMin: 20, expectMax: 30 },
    { fmt: '`2 rounds`, `45-60s` rest after the round', expectMin: 45, expectMax: 60 },
    { fmt: '`3 rounds`, `60-90s` rest after the pair', expectMin: 60, expectMax: 90 },
    { fmt: '`4 rounds`, full rest `2 min 30 to 3 min` after each round', expectMin: 150, expectMax: 180 },
    { fmt: '`2 rounds`, `60-75s` rest', expectMin: 60, expectMax: 75 },
    { fmt: '`1-2 rounds`, `30-45s` rest', expectMin: 30, expectMax: 45 },
    { fmt: '`2-3 rounds`, `60-90s` rest', expectMin: 60, expectMax: 90 },
    { fmt: '`2-3 rounds`, `60-75s` rest after the pair', expectMin: 60, expectMax: 75 },
    { fmt: '`2 drills`, `3-4 reps` each, full rest `60-90s` between reps', expectMin: 60, expectMax: 90 },
    { fmt: '`2 drills`, `3-4 reps` each, full rest `60-90s`', expectMin: 60, expectMax: 90 },
  ]

  it.each(samples)('parses "$fmt" → $expectMin–$expectMax s', ({ fmt, expectMin, expectMax }) => {
    const r = parseRestSeconds(fmt)
    expect(r.kind).toBe('rounds')
    expect(r.minSeconds).toBe(expectMin)
    expect(r.maxSeconds).toBe(expectMax)
  })
})
