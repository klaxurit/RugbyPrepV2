import { describe, expect, it } from 'vitest'
import {
  chatPhaseFromPlanning,
  chatWeekLabelFromPlanning,
} from '../resolveChatProgramContext'

describe('chatPhaseFromPlanning', () => {
  it('ne mappe plus W1 fantôme → FORCE : la phase suit le cycle annuel', () => {
    expect(chatPhaseFromPlanning({ cycle: 'in_season', isDeloadWeek: false })).toBe('FORCE')
    expect(chatPhaseFromPlanning({ cycle: 'off_season', isDeloadWeek: false })).toBe('HYPERTROPHY')
    expect(chatPhaseFromPlanning({ cycle: 'pre_season', isDeloadWeek: false })).toBe('POWER')
    expect(chatPhaseFromPlanning({ cycle: 'in_season', isDeloadWeek: true })).toBeNull()
  })
})

describe('chatWeekLabelFromPlanning', () => {
  it('affiche le libellé annuel, pas CycleWeek W1', () => {
    expect(
      chatWeekLabelFromPlanning(
        {
          weekLabel: 'En saison - S29 (1/4)',
          cycle: 'in_season',
          weekNumber: 29,
          isDeloadWeek: false,
        },
        'fr',
      ),
    ).toBe('En saison - S29 (1/4)')
  })
})
