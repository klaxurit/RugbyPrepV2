import { describe, it, expect } from 'vitest'
import { parseBlockFormat, isTimedFormat } from '../parseBlockFormat'

describe('parseBlockFormat', () => {
  it('detects EMOM with minute markers', () => {
    const r = parseBlockFormat("`EMOM 8'`")
    expect(r.type).toBe('emom')
    if (r.type === 'emom') {
      expect(r.totalSeconds).toBe(480)
      expect(r.intervalSeconds).toBe(60)
      expect(r.rounds).toBe(8)
    }
  })

  it('detects EMOM with "min" suffix', () => {
    const r = parseBlockFormat('EMOM 6 min')
    expect(r.type).toBe('emom')
    if (r.type === 'emom') {
      expect(r.rounds).toBe(6)
      expect(r.totalSeconds).toBe(360)
    }
  })

  it('detects Tabata with work/rest intervals', () => {
    const r = parseBlockFormat('Tabata 8x 20/10s')
    expect(r.type).toBe('tabata')
    if (r.type === 'tabata') {
      expect(r.rounds).toBe(8)
      expect(r.workSeconds).toBe(20)
      expect(r.restSeconds).toBe(10)
      expect(r.totalSeconds).toBe(8 * 30)
    }
  })

  it('detects AMRAP with minute duration', () => {
    const r = parseBlockFormat("AMRAP 10'")
    expect(r.type).toBe('amrap')
    if (r.type === 'amrap') {
      expect(r.totalSeconds).toBe(600)
    }
  })

  it('detects For Time', () => {
    const r = parseBlockFormat('For Time')
    expect(r.type).toBe('for_time')
  })

  it('falls back to rounds when format is not timed', () => {
    expect(parseBlockFormat('3 tours, `90-120s` de repos').type).toBe('rounds')
    expect(parseBlockFormat('').type).toBe('rounds')
    expect(parseBlockFormat(undefined).type).toBe('rounds')
  })

  it('handles typographic apostrophe and backticks', () => {
    const r = parseBlockFormat("`EMOM 8\u2019`")
    expect(r.type).toBe('emom')
  })

  it('isTimedFormat reports timed types only', () => {
    expect(isTimedFormat(parseBlockFormat("EMOM 8'"))).toBe(true)
    expect(isTimedFormat(parseBlockFormat('Tabata 8x 20/10s'))).toBe(true)
    expect(isTimedFormat(parseBlockFormat('AMRAP 10'))).toBe(true)
    expect(isTimedFormat(parseBlockFormat('For Time'))).toBe(true)
    expect(isTimedFormat(parseBlockFormat('3 tours'))).toBe(false)
  })
})
