import { describe, expect, it } from 'vitest'
import { computeReadinessScore, type ReadinessInput } from './computeReadinessScore'

const BASE: ReadinessInput = {
  acwrZone: 'optimal',
  fatigue: 'OK',
  lastSessionDateISO: '2026-03-29',
  nextMatchDateISO: '2026-04-05',
  todayISO: '2026-03-31',
}

describe('computeReadinessScore', () => {
  it('optimal scenario → score near 100', () => {
    const r = computeReadinessScore(BASE)
    expect(r.score).toBeGreaterThanOrEqual(90)
    expect(r.label).toBe('Excellente forme')
    expect(r.color).toBe('emerald')
    expect(r.hasSufficientData).toBe(true)
  })

  it('danger + fatigue + match today → low score', () => {
    const r = computeReadinessScore({
      ...BASE,
      acwrZone: 'danger',
      fatigue: 'FATIGUE',
      lastSessionDateISO: '2026-03-31',
      nextMatchDateISO: '2026-03-31',
    })
    expect(r.score).toBeLessThanOrEqual(50)
    expect(r.color).toBe('amber')
  })

  it('critical ACWR → repos conseillé', () => {
    const r = computeReadinessScore({
      ...BASE,
      acwrZone: 'critical',
      fatigue: 'FATIGUE',
      lastSessionDateISO: '2026-03-31',
      nextMatchDateISO: '2026-03-31',
    })
    expect(r.score).toBeLessThan(40)
    expect(r.label).toBe('Repos conseillé')
    expect(r.color).toBe('red')
  })

  it('no ACWR data → weights redistributed, still computes', () => {
    const r = computeReadinessScore({ ...BASE, acwrZone: null })
    expect(r.score).toBeGreaterThan(0)
    expect(r.components.acwr).toBeNull()
    expect(r.components.fatigue).not.toBeNull()
    expect(r.hasSufficientData).toBe(true) // has session history
  })

  it('no session history → recovery skipped', () => {
    const r = computeReadinessScore({ ...BASE, lastSessionDateISO: null })
    expect(r.components.recovery).toBeNull()
    expect(r.score).toBeGreaterThan(0)
  })

  it('no match → proximity skipped', () => {
    const r = computeReadinessScore({ ...BASE, nextMatchDateISO: null })
    expect(r.components.matchProximity).toBeNull()
    expect(r.score).toBeGreaterThan(0)
  })

  it('first-time user (fatigue only) → score based on OK default', () => {
    const r = computeReadinessScore({
      acwrZone: null,
      fatigue: 'OK',
      lastSessionDateISO: null,
      nextMatchDateISO: null,
      todayISO: '2026-03-31',
    })
    expect(r.score).toBe(100) // only fatigue=OK at weight 1.0
    expect(r.hasSufficientData).toBe(false)
    expect(r.components.acwr).toBeNull()
    expect(r.components.recovery).toBeNull()
    expect(r.components.matchProximity).toBeNull()
  })

  it('deterministic — same input always produces same output', () => {
    const a = computeReadinessScore(BASE)
    const b = computeReadinessScore(BASE)
    expect(a).toEqual(b)
  })

  it('component weights sum to ~100', () => {
    const r = computeReadinessScore(BASE)
    const total =
      (r.components.acwr?.weight ?? 0) +
      r.components.fatigue.weight +
      (r.components.recovery?.weight ?? 0) +
      (r.components.matchProximity?.weight ?? 0)
    expect(total).toBeGreaterThanOrEqual(99)
    expect(total).toBeLessThanOrEqual(101)
  })

  it('7 jours sans séance + ACWR sous-charge → Attention (~56)', () => {
    const r = computeReadinessScore({
      acwrZone: 'underload',
      fatigue: 'OK',
      lastSessionDateISO: '2026-05-20',
      nextMatchDateISO: null,
      todayISO: '2026-05-27',
    })
    expect(r.score).toBeGreaterThanOrEqual(54)
    expect(r.score).toBeLessThanOrEqual(58)
    expect(r.label).toBe('Attention')
    expect(r.components.recovery?.score).toBe(45)
  })
})
