import { describe, expect, it } from 'vitest'
import {
  dayBeforeMatch,
  formatDisplacedSessionLabel,
} from '../displacedSessionLabel'

describe('formatDisplacedSessionLabel', () => {
  it('samedi avant match dimanche → Déplacée : match dimanche', () => {
    expect(
      formatDisplacedSessionLabel({
        sessionDayOfWeek: 6,
        matchDayOfWeek: 0,
        preferredTrainingDays: [1, 3, 5],
        lang: 'fr',
      }),
    ).toBe('Déplacée : match dimanche')
  })

  it('ne libelle pas un vendredi habituel sans déplacement', () => {
    expect(
      formatDisplacedSessionLabel({
        sessionDayOfWeek: 5,
        matchDayOfWeek: 0,
        preferredTrainingDays: [1, 3, 5],
        lang: 'fr',
      }),
    ).toBeNull()
  })

  it('dayBeforeMatch dimanche → samedi', () => {
    expect(dayBeforeMatch(0)).toBe(6)
  })
})
