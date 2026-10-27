// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'

const trackSignupCompletedWithAttribution = vi.fn()

vi.mock('../../analytics/activationEvents', () => ({
  trackSignupCompletedWithAttribution: (...args: unknown[]) =>
    trackSignupCompletedWithAttribution(...args),
}))

import { maybeTrackGoogleSignup } from '../maybeTrackGoogleSignup'

describe('maybeTrackGoogleSignup', () => {
  afterEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('tracks a brand-new Google-only account once', () => {
    maybeTrackGoogleSignup({
      id: 'u1',
      created_at: new Date().toISOString(),
      identities: [{ provider: 'google' }],
    })
    maybeTrackGoogleSignup({
      id: 'u1',
      created_at: new Date().toISOString(),
      identities: [{ provider: 'google' }],
    })
    expect(trackSignupCompletedWithAttribution).toHaveBeenCalledTimes(1)
  })

  it('ignores returning Google users and email accounts', () => {
    maybeTrackGoogleSignup({
      id: 'u2',
      created_at: '2024-01-01T00:00:00.000Z',
      identities: [{ provider: 'google' }],
    })
    maybeTrackGoogleSignup({
      id: 'u3',
      created_at: new Date().toISOString(),
      identities: [{ provider: 'email' }],
    })
    expect(trackSignupCompletedWithAttribution).not.toHaveBeenCalled()
  })
})
