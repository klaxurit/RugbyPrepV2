import { describe, expect, it } from 'vitest'
import { DEFAULT_PROFILE } from '../../../hooks/useProfile'
import { mergeProfileFromCache } from '../mergeProfileFromCache'

describe('mergeProfileFromCache', () => {
  it('returns remote unchanged when cache is absent', () => {
    const remote = { ...DEFAULT_PROFILE, weeklySessions: 2 as const }
    const { profile, shouldHealRemote } = mergeProfileFromCache(remote, null)
    expect(profile.weeklySessions).toBe(2)
    expect(shouldHealRemote).toBe(false)
  })

  it('restores planning anchors when remote lost seasonEndedAt', () => {
    const remote = {
      ...DEFAULT_PROFILE,
      weeklySessions: 2 as const,
      seasonMode: 'in_season' as const,
    }
    const cached = {
      ...DEFAULT_PROFILE,
      weeklySessions: 3 as const,
      seasonMode: 'off_season' as const,
      planningAnchors: {
        seasonEndedAt: '2026-01-15',
        seasonEndedSource: 'manual' as const,
        skipOffSeasonRecoveryIntro: true,
        onboardingCycleHint: 'off_season' as const,
      },
    }
    const { profile, shouldHealRemote } = mergeProfileFromCache(remote, cached)
    expect(shouldHealRemote).toBe(true)
    expect(profile.weeklySessions).toBe(3)
    expect(profile.seasonMode).toBe('off_season')
    expect(profile.planningAnchors?.seasonEndedAt).toBe('2026-01-15')
    expect(profile.planningAnchors?.skipOffSeasonRecoveryIntro).toBe(true)
  })

  it('does not override remote when remote already has anchors', () => {
    const anchors = {
      seasonEndedAt: '2026-02-01',
      seasonEndedSource: 'manual' as const,
    }
    const remote = {
      ...DEFAULT_PROFILE,
      weeklySessions: 3 as const,
      seasonMode: 'off_season' as const,
      planningAnchors: anchors,
    }
    const cached = {
      ...remote,
      planningAnchors: { seasonEndedAt: '2025-01-01', seasonEndedSource: 'manual' as const },
    }
    const { shouldHealRemote } = mergeProfileFromCache(remote, cached)
    expect(shouldHealRemote).toBe(false)
  })
})
