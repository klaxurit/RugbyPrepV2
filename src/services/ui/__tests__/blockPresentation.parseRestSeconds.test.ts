import { describe, it, expect } from 'vitest'
import { parseBlockRestSeconds, formatInterTourRest } from '../blockPresentation'
import type { Block } from '../../../types/motherSession'

function block(format: string, exercises: Array<{ name: string; prescription: string }> = []): Block {
  return {
    number: 1,
    type: 'main',
    name: 'test',
    format,
    exercises,
  } as unknown as Block
}

describe('parseBlockRestSeconds — mother-session formats', () => {
  it('parses "X-Ys rest after the pair" using upper bound', () => {
    expect(parseBlockRestSeconds(block('`3 rounds`, `90-120s` rest after the pair'))).toBe(120)
    expect(parseBlockRestSeconds(block('`3 rounds`, `75-90s` rest after pair'))).toBe(90)
    expect(parseBlockRestSeconds(block('`3 rounds`, `60-90s` rest after the pair'))).toBe(90)
    expect(parseBlockRestSeconds(block('`3 rounds`, `90-120s` rest after the triplet'))).toBe(120)
  })

  it('parses "X-Ys rest" without trailing qualifier', () => {
    expect(parseBlockRestSeconds(block('`3 rounds`, `90-120s` rest'))).toBe(120)
    expect(parseBlockRestSeconds(block('`2 rounds`, `45-60s` rest'))).toBe(60)
    expect(parseBlockRestSeconds(block('`2 rounds`, `60-75s` rest'))).toBe(75)
    expect(parseBlockRestSeconds(block('`1-2 rounds`, `30-45s` rest'))).toBe(45)
  })

  it('parses "X[-Y] min rest [between sets/rounds]"', () => {
    expect(parseBlockRestSeconds(block('`4 work sets`, `2 min` rest between sets'))).toBe(120)
    expect(parseBlockRestSeconds(block('`4 work sets`, `2 min` rest'))).toBe(120)
    expect(parseBlockRestSeconds(block('`4 work sets`, `2-3 min` rest between sets'))).toBe(180)
    expect(parseBlockRestSeconds(block('`3 work sets`, `2-3 min` rest between sets'))).toBe(180)
    expect(parseBlockRestSeconds(block('`4 rounds`, `3-4 min` rest between rounds'))).toBe(240)
    expect(parseBlockRestSeconds(block('`4 rounds`, `3-4 min` rest'))).toBe(240)
  })

  it('parses "full rest X-Y s/min [after each round]"', () => {
    expect(parseBlockRestSeconds(block('`3 rounds`, full rest `3 min`'))).toBe(180)
    expect(parseBlockRestSeconds(block('`3 rounds`, full rest `3 min` after each round'))).toBe(180)
    expect(parseBlockRestSeconds(block('`4 rounds`, full rest `3 min` after each round'))).toBe(180)
    expect(parseBlockRestSeconds(block('`3 rounds`, full rest `2-3 min`'))).toBe(180)
    expect(parseBlockRestSeconds(block('`3 rounds`, full rest `90-120s`'))).toBe(120)
  })

  it('takes the longest rest when multiple are mentioned (intra-tour vs inter-tour)', () => {
    // "10-15s between exercises" (intra) + "full rest 3-4 min after each round" (inter) → inter wins
    expect(
      parseBlockRestSeconds(
        block('`4 rounds`, `10-15s` between exercises, full rest `3-4 min` after each round'),
      ),
    ).toBe(240)
    // Weekly variation: "full rest 90-120s between reps and 2-3 min between rounds" → 180s
    expect(
      parseBlockRestSeconds(
        block(
          '`W5-W6 = 4 rounds`, `W7 = 5 rounds`, `W8 = 4 rounds`, full rest `90-120s` between reps and `2-3 min` between rounds',
        ),
      ),
    ).toBe(180)
  })

  it('parses "X-Ys rest between drills"', () => {
    expect(parseBlockRestSeconds(block('`1 round`, `20-30s` rest between drills'))).toBe(30)
    expect(parseBlockRestSeconds(block('`1-2 rounds`, `20-30s` rest between drills'))).toBe(30)
  })

  it('parses contrast/PAP "full rest X-Ys between reps"', () => {
    expect(
      parseBlockRestSeconds(block('`2 drills`, `3-4 reps` each, full rest `60-90s` between reps')),
    ).toBe(90)
    expect(parseBlockRestSeconds(block('`2 drills`, `3-4 reps` each, full rest `60-90s`'))).toBe(90)
  })

  it('falls back to 90s default for unstructured/EMOM/empty formats', () => {
    expect(parseBlockRestSeconds(block(''))).toBe(90)
    expect(parseBlockRestSeconds(block('`EMOM 6\''))).toBe(90)
    expect(parseBlockRestSeconds(block('`EMOM 8\''))).toBe(90)
    expect(parseBlockRestSeconds(block('`2 rounds`, minimal rest'))).toBe(90)
    expect(parseBlockRestSeconds(block('`2 rounds`, move continuously with minimal rest'))).toBe(90)
    expect(
      parseBlockRestSeconds(block('`6-8 reps`, walk-back recovery and full rest between reps')),
    ).toBe(90)
  })

  it('preserves legacy "@ Xs" / "(Xs)" / "repos X min" prescription parsing', () => {
    expect(parseBlockRestSeconds(block('', [{ name: 'squat', prescription: '4×5 @ 90s' }]))).toBe(90)
    expect(parseBlockRestSeconds(block('', [{ name: 'squat', prescription: '3×8 (60s)' }]))).toBe(60)
    expect(parseBlockRestSeconds(block('', [{ name: 'squat', prescription: '4×5 repos 3 min' }]))).toBe(180)
  })

  it('parse formats hybrides FR/EN (repos après, 2 min 30)', () => {
    expect(parseBlockRestSeconds(block('`3 Rounds`, `90s` repos après la paire.'))).toBe(90)
    expect(parseBlockRestSeconds(block('`3 Rounds`, `2 min 30` repos between tours.'))).toBe(150)
    expect(parseBlockRestSeconds(block('3 tours, `75-90s` de repos'))).toBe(90)
    expect(parseBlockRestSeconds(block('`3 Rounds`, `120s` repos after the trio.'))).toBe(120)
  })

  it('parse les formats FR mother-session (de repos, après la paire)', () => {
    expect(
      parseBlockRestSeconds(
        block('`4 séries de travail`, `2 min` de repos entre les séries'),
      ),
    ).toBe(120)
    expect(
      parseBlockRestSeconds(block('`4 tours`, `90-120s` de repos après la paire')),
    ).toBe(120)
    expect(
      parseBlockRestSeconds(block('`3 tours`, `75-90s` de repos après la paire')),
    ).toBe(90)
    expect(
      parseBlockRestSeconds(block('`2 tours`, `45-60s` de repos après le tour')),
    ).toBe(60)
    expect(parseBlockRestSeconds(block('`3 tours`, repos complet `3 min`'))).toBe(180)
  })
})

describe('formatInterTourRest', () => {
  it('formats sub-minute and fractional minutes without rounding up', () => {
    expect(formatInterTourRest(90, 'fr')).toBe('1 min 30')
    expect(formatInterTourRest(120, 'fr')).toBe('2 min')
    expect(formatInterTourRest(45, 'fr')).toBe('45s')
  })
})
