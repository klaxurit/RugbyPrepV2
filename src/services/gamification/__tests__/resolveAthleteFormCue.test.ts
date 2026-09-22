import { describe, expect, it } from 'vitest'
import { resolveAthleteFormCue } from '../resolveAthleteFormCue'
import {
  badgeIconFamily,
  badgeIconName,
  formCueAriaLabel,
  formCueIconName,
} from '../badgeIcon'

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

describe('formCueIconName', () => {
  it('mappe les cues vers des glyphes brand (plus d’émoji)', () => {
    expect(formCueIconName('hot')).toBe('form-hot')
    expect(formCueIconName('dormant')).toBe('form-dormant')
    expect(formCueAriaLabel('hot', 'fr')).toMatch(/Enchaîne/i)
  })
})

describe('badgeIconName', () => {
  it('classe les badges en 4 familles distinctes', () => {
    expect(badgeIconFamily('plan_week_4')).toBe('plan')
    expect(badgeIconFamily('streak_8')).toBe('streak')
    expect(badgeIconFamily('deload_1')).toBe('deload')
    expect(badgeIconFamily('level_capitaine')).toBe('level')
    expect(badgeIconName('plan_week_1')).toBe('badge-plan')
    expect(badgeIconName('streak_16')).toBe('badge-streak')
    expect(badgeIconName('deload_3')).toBe('badge-deload')
    expect(badgeIconName('level_legende')).toBe('badge-level')
  })
})
