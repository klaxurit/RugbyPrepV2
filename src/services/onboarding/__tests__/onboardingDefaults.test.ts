import { describe, expect, it } from 'vitest'
import { TRAINING_DAYS_DEFAULT } from '../../program/scheduleOptimizer'
import {
  buildDefaultScSchedule,
  ONBOARDING_DEFAULT_TRAINING_BASELINE,
  resolveOnboardingSeasonPhase,
} from '../onboardingDefaults'

describe('resolveOnboardingSeasonPhase', () => {
  it('octobre → in_season', () => {
    expect(resolveOnboardingSeasonPhase(new Date(2026, 9, 27))).toBe('in_season')
  })

  it('mi-juin → off_season', () => {
    expect(resolveOnboardingSeasonPhase(new Date(2026, 5, 15))).toBe('off_season')
  })

  it('mi-juillet → pre_season', () => {
    expect(resolveOnboardingSeasonPhase(new Date(2026, 6, 15))).toBe('pre_season')
  })
})

describe('buildDefaultScSchedule', () => {
  it('aligne les jours sur TRAINING_DAYS_DEFAULT et marque source auto', () => {
    const two = buildDefaultScSchedule(2)
    expect(two.source).toBe('auto')
    expect(two.sessions.map((s) => s.day)).toEqual(TRAINING_DAYS_DEFAULT[2])
    expect(two.sessions.map((s) => s.sessionIndex)).toEqual([0, 1])

    const three = buildDefaultScSchedule(3)
    expect(three.sessions.map((s) => s.day)).toEqual(TRAINING_DAYS_DEFAULT[3])
    expect(three.sessions.map((s) => s.sessionIndex)).toEqual([0, 1, 2])
  })
})

describe('onboarding defaults', () => {
  it('baseline active pour ne pas forcer une rampe restart', () => {
    expect(ONBOARDING_DEFAULT_TRAINING_BASELINE).toBe('active')
  })
})
