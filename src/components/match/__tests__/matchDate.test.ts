import { describe, expect, it } from 'vitest'
import { suggestedNextMatchISO } from '../matchDate'

describe('suggestedNextMatchISO — amateur FFR = dimanche par défaut', () => {
  it('lundi → dimanche de la même semaine ISO', () => {
    expect(suggestedNextMatchISO('2026-04-06')).toBe('2026-04-12')
  })

  it('dimanche → dimanche suivant (pas aujourd’hui)', () => {
    expect(suggestedNextMatchISO('2026-04-12')).toBe('2026-04-19')
  })

  it('jour habituel samedi → prochaine occurrence samedi, pas dimanche', () => {
    expect(suggestedNextMatchISO('2026-04-06', 6)).toBe('2026-04-11')
  })
})
