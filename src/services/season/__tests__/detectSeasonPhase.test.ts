import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from '../../../types/training'
import { detectSeasonPhaseInfo } from '../detectSeasonPhase'

type Input = Pick<CalendarEvent, 'date' | 'type'>

/** Premier match le 2025-03-15 (samedi) → lundi de semaine du match 2025-03-10 ; pré-saison démarre 2024-12-16 */
const FIRST_MATCH = '2025-03-15'

function match(date: string): Input {
  return { date, type: 'match' }
}

describe('detectSeasonPhaseInfo', () => {
  it('aucun match → off-season, nulls, pas de match week', () => {
    const r = detectSeasonPhaseInfo([], '2025-01-01')
    expect(r).toMatchObject({
      cycle: 'off_season',
      weekLabel: 'Inter-saison',
      isDeloadWeek: false,
      firstMatchDate: null,
      daysUntilNextMatch: null,
      isMatchWeek: false,
    })
    expect(r.phase).toBeUndefined()
    expect(r.weekNumber).toBeUndefined()
  })

  it('ignore les événements non-match', () => {
    const r = detectSeasonPhaseInfo(
      [
        { date: '2025-06-01', type: 'rest' },
        { date: '2025-06-02', type: 'unavailable' },
      ],
      '2025-01-01'
    )
    expect(r.cycle).toBe('off_season')
    expect(r.firstMatchDate).toBeNull()
  })

  it('off-season : aujourd’hui avant le début de la pré-saison (premier match à > 12 semaines)', () => {
    const events = [match(FIRST_MATCH)]
    // Lundi 2024-12-09 : avant preStart 2024-12-16
    const r = detectSeasonPhaseInfo(events, '2024-12-09')
    expect(r.cycle).toBe('off_season')
    expect(r.weekLabel).toBe('Inter-saison')
    expect(r.firstMatchDate).toBe(FIRST_MATCH)
    expect(r.daysUntilNextMatch).toBeGreaterThan(0)
    expect(r.isMatchWeek).toBe(false)
  })

  it('pré-saison S1 (lundi de la semaine 1)', () => {
    const events = [match(FIRST_MATCH)]
    const r = detectSeasonPhaseInfo(events, '2024-12-16')
    expect(r.cycle).toBe('pre_season')
    expect(r.phase).toBe(1)
    expect(r.weekNumber).toBe(1)
    expect(r.weekLabel).toBe('Pré-saison Phase 1 - S1')
    expect(r.isDeloadWeek).toBe(false)
  })

  it('pré-saison S6 → phase 2', () => {
    const events = [match(FIRST_MATCH)]
    const r = detectSeasonPhaseInfo(events, '2025-01-20')
    expect(r.cycle).toBe('pre_season')
    expect(r.phase).toBe(2)
    expect(r.weekNumber).toBe(6)
    expect(r.weekLabel).toBe('Pré-saison Phase 2 - S6')
    expect(r.isDeloadWeek).toBe(false)
  })

  it('pré-saison S12 → phase 3 et deload', () => {
    const events = [match(FIRST_MATCH)]
    const r = detectSeasonPhaseInfo(events, '2025-03-03')
    expect(r.cycle).toBe('pre_season')
    expect(r.phase).toBe(3)
    expect(r.weekNumber).toBe(12)
    expect(r.weekLabel).toBe('Pré-saison Phase 3 - S12')
    expect(r.isDeloadWeek).toBe(true)
  })

  it('in-season : semaine avec match (match week)', () => {
    const events = [match(FIRST_MATCH), match('2025-03-22')]
    // Lundi 2025-03-17 … dimanche 2025-03-23 contient le 22
    const r = detectSeasonPhaseInfo(events, '2025-03-18')
    expect(r.cycle).toBe('in_season')
    expect(r.isMatchWeek).toBe(true)
    expect(r.weekLabel).toMatch(/^En saison - S\d+$/)
    expect(r.weekNumber).toBeGreaterThanOrEqual(2)
  })

  it('in-season : semaine sans match', () => {
    const events = [match(FIRST_MATCH), match('2025-04-05')]
    // Semaine du 2025-03-17 : premier match était le 15 (semaine précédente), pas de match entre 17 et 23
    const r = detectSeasonPhaseInfo(events, '2025-03-18')
    expect(r.cycle).toBe('in_season')
    expect(r.isMatchWeek).toBe(false)
  })

  it('daysUntilNextMatch : prochain match futur (date-only)', () => {
    const events = [match(FIRST_MATCH)]
    const r = detectSeasonPhaseInfo(events, '2025-03-01')
    expect(r.daysUntilNextMatch).toBe(14)
  })

  it('accepte today comme Date', () => {
    const events = [match(FIRST_MATCH)]
    const r = detectSeasonPhaseInfo(events, new Date(2024, 11, 16, 12, 0, 0))
    expect(r.weekNumber).toBe(1)
  })

  it('rejette une string today invalide sans repli sur la date système', () => {
    expect(() => detectSeasonPhaseInfo([], 'pas-une-date')).toThrow(/today invalide/i)
    expect(() => detectSeasonPhaseInfo([], 'pas-une-date')).toThrow(/YYYY-MM-DD/)
    expect(() => detectSeasonPhaseInfo([], '2025-13-40')).toThrow(/today invalide/i)
    expect(() => detectSeasonPhaseInfo([], '2025-1-05')).toThrow(/today invalide/i)
    expect(() => detectSeasonPhaseInfo([], '')).toThrow(/today invalide/i)
  })

  it('rejette une Date today invalide (NaN)', () => {
    expect(() => detectSeasonPhaseInfo([], new Date(Number.NaN))).toThrow(/Date invalide/i)
  })
})
