import { describe, expect, it } from 'vitest'
import { parseLocalDateOnly } from '../../dates/localIsoDate'
import { resolveDefaultFfrSeasonClock } from '../defaultFfrSeasonClock'

function clock(iso: string) {
  const d = parseLocalDateOnly(iso)
  if (!d) throw new Error(iso)
  return resolveDefaultFfrSeasonClock(d)
}

describe('resolveDefaultFfrSeasonClock', () => {
  it('début juillet encore en transition (semaine du 1er juillet)', () => {
    const ctx = clock('2026-07-02')
    expect(ctx.cycle).toBe('off_season')
    expect(ctx.weekNumber).toBeLessThanOrEqual(4)
  })

  it('mi-juillet → pré-saison 1 (force + hypertrophie), pas inter-saison', () => {
    const ctx = clock('2026-07-10')
    expect(ctx.cycle).toBe('pre_season')
    expect(ctx.preSeasonPhase).toBe(1)
    expect(ctx.preSeasonStartMondayIso).toBe('2026-07-06')
    expect(ctx.inSeasonStartMondayIso).toBe('2026-09-07')
  })

  it('juin → transition plafonnée (pas d’hypertrophie S5)', () => {
    const ctx = clock('2026-06-22')
    expect(ctx.cycle).toBe('off_season')
    expect(ctx.weekNumber).toBeLessThanOrEqual(4)
    expect(ctx.effectiveOffSeasonWeeks).toBeLessThanOrEqual(4)
  })

  it('1er juin → inter-saison S1', () => {
    const ctx = clock('2026-06-01')
    expect(ctx.cycle).toBe('off_season')
    expect(ctx.weekNumber).toBe(1)
  })

  it('début août → pré-saison 2', () => {
    const ctx = clock('2026-08-04')
    expect(ctx.cycle).toBe('pre_season')
    expect(ctx.preSeasonPhase).toBe(2)
  })

  it('mi-août → pré-saison 3 (puissance + conditioning)', () => {
    const ctx = clock('2026-08-20')
    expect(ctx.cycle).toBe('pre_season')
    expect(ctx.preSeasonPhase).toBe(3)
    expect(ctx.weekNumber).toBeGreaterThanOrEqual(2)
    expect(ctx.preSeasonStartMondayIso).toBe('2026-07-06')
  })

  it('mi-septembre → en saison, semaine 2+', () => {
    const ctx = clock('2026-09-15')
    expect(ctx.cycle).toBe('in_season')
    expect(ctx.weekNumber).toBeGreaterThanOrEqual(2)
    expect(ctx.forceDeload).toBe(false)
  })

  it('novembre → en saison avancée (pas S1)', () => {
    const ctx = clock('2025-11-10')
    expect(ctx.cycle).toBe('in_season')
    expect(ctx.weekNumber).toBeGreaterThanOrEqual(8)
  })

  it('22 décembre → en saison + deload de trêve', () => {
    const ctx = clock('2025-12-22')
    expect(ctx.cycle).toBe('in_season')
    expect(ctx.forceDeload).toBe(true)
  })

  it('10 janvier → en saison, plus de deload de trêve', () => {
    const ctx = clock('2026-01-10')
    expect(ctx.cycle).toBe('in_season')
    expect(ctx.forceDeload).toBe(false)
  })

  it('mars → encore en saison (ancre septembre N-1)', () => {
    const ctx = clock('2026-03-22')
    expect(ctx.cycle).toBe('in_season')
    expect(ctx.inSeasonStartMondayIso).toBe('2025-09-01')
    expect(ctx.weekNumber).toBe(29)
  })

  it('mai → encore en saison (fin de cycle, pas d’inter-saison anticipée)', () => {
    const ctx = clock('2026-05-15')
    expect(ctx.cycle).toBe('in_season')
  })
})
