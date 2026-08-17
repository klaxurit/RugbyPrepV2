import { describe, expect, it } from 'vitest'
import {
  selectPrimaryMatchDates,
  selectPrimaryMatchEvents,
} from '../selectPrimaryMatchDates'

describe('selectPrimaryMatchDates', () => {
  it('garde une date par semaine ISO', () => {
    expect(
      selectPrimaryMatchDates([
        { date: '2025-03-15', type: 'match' },
        { date: '2025-03-16', type: 'match' },
      ]),
    ).toEqual(['2025-03-15'])
  })

  it('préfère championnat / coupe à l’amical, même plus tard dans la semaine', () => {
    expect(
      selectPrimaryMatchDates([
        { date: '2025-03-15', type: 'match', match_kind: 'friendly' },
        { date: '2025-03-16', type: 'match', match_kind: 'league' },
      ]),
    ).toEqual(['2025-03-16'])
    expect(
      selectPrimaryMatchDates([
        { date: '2025-03-15', type: 'match', match_kind: 'friendly' },
        { date: '2025-03-16', type: 'match', match_kind: 'cup_final' },
      ]),
    ).toEqual(['2025-03-16'])
  })

  it('ignore rest / dates invalides, conserve deux semaines distinctes', () => {
    expect(
      selectPrimaryMatchDates([
        { date: '2025-03-15', type: 'match', match_kind: 'league' },
        { date: '2025-03-16', type: 'rest' },
        { date: 'not-a-date', type: 'match' },
        { date: '2025-03-22', type: 'match', match_kind: 'league' },
      ]),
    ).toEqual(['2025-03-15', '2025-03-22'])
  })

  it('selectPrimaryMatchEvents retourne l’event gagnant', () => {
    const kept = selectPrimaryMatchEvents([
      { date: '2025-03-15', type: 'match', match_kind: 'friendly' },
      { date: '2025-03-16', type: 'match', match_kind: 'league' },
    ])
    expect(kept).toHaveLength(1)
    expect(kept[0]?.date).toBe('2025-03-16')
    expect(kept[0]?.match_kind).toBe('league')
  })
})
