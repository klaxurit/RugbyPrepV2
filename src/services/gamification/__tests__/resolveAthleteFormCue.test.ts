import { describe, expect, it } from 'vitest'
import {
  athleteFormCueEmoji,
  resolveAthleteFormCue,
} from '../resolveAthleteFormCue'

describe('resolveAthleteFormCue', () => {
  it('marque dormant sans séance ou après 7 jours', () => {
    expect(
      resolveAthleteFormCue({ daysSinceLastSession: null, sessionsCompletedThisWeek: 0 }),
    ).toBe('dormant')
    expect(
      resolveAthleteFormCue({ daysSinceLastSession: 7, sessionsCompletedThisWeek: 1 }),
    ).toBe('dormant')
  })

  it('marque hot si séance récente ou ≥ 2 séances cette semaine', () => {
    expect(
      resolveAthleteFormCue({ daysSinceLastSession: 0, sessionsCompletedThisWeek: 1 }),
    ).toBe('hot')
    expect(
      resolveAthleteFormCue({ daysSinceLastSession: 4, sessionsCompletedThisWeek: 2 }),
    ).toBe('hot')
  })

  it('reste neutre entre les deux', () => {
    expect(
      resolveAthleteFormCue({ daysSinceLastSession: 4, sessionsCompletedThisWeek: 1 }),
    ).toBeNull()
  })
})

describe('athleteFormCueEmoji', () => {
  it('mappe les cues vers 🔥 / 💤', () => {
    expect(athleteFormCueEmoji('hot')).toBe('🔥')
    expect(athleteFormCueEmoji('dormant')).toBe('💤')
    expect(athleteFormCueEmoji(null)).toBeNull()
  })
})
