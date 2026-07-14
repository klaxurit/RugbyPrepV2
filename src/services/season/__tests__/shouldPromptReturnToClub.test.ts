import { describe, expect, it } from 'vitest'
import { shouldPromptReturnToClub } from '../shouldPromptReturnToClub'

const base = {
  cycle: 'off_season' as const,
  hasReturnDate: false,
  onboardingComplete: true,
  inOnboardingGracePeriod: false,
  hasPendingOffseasonMatch: false,
  pathname: '/home',
}

describe('shouldPromptReturnToClub', () => {
  it('affiche en inter-saison sans date de reprise', () => {
    expect(shouldPromptReturnToClub(base)).toBe(true)
  })

  it('masque si date de reprise déjà posée', () => {
    expect(shouldPromptReturnToClub({ ...base, hasReturnDate: true })).toBe(false)
  })

  it('masque hors inter-saison', () => {
    expect(shouldPromptReturnToClub({ ...base, cycle: 'in_season' })).toBe(false)
    expect(shouldPromptReturnToClub({ ...base, cycle: 'pre_season' })).toBe(false)
  })

  it('masque pendant onboarding ou grace period', () => {
    expect(shouldPromptReturnToClub({ ...base, onboardingComplete: false })).toBe(false)
    expect(shouldPromptReturnToClub({ ...base, inOnboardingGracePeriod: true })).toBe(false)
  })

  it('masque si match off-season en attente de décision', () => {
    expect(shouldPromptReturnToClub({ ...base, hasPendingOffseasonMatch: true })).toBe(false)
  })

  it('masque sur routes auth / onboarding', () => {
    expect(shouldPromptReturnToClub({ ...base, pathname: '/onboarding' })).toBe(false)
    expect(shouldPromptReturnToClub({ ...base, pathname: '/auth/login' })).toBe(false)
  })
})
