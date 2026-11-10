import { describe, expect, it } from 'vitest'
import type { UserProfile } from '../../../types/training'
import {
  applyNewsletterFromMetadata,
  isProductPromptSuppressedPath,
  newsletterPreferencePatch,
  shouldPromptNewsletterOptIn,
  shouldPromptPasswordUpgrade,
} from '../accountUpgradePrompts'

describe('shouldPromptPasswordUpgrade', () => {
  it('shows only when the persisted flag is true, off auth/legal routes', () => {
    expect(shouldPromptPasswordUpgrade({ pathname: '/home', passwordNeedsUpgrade: true })).toBe(true)
    expect(shouldPromptPasswordUpgrade({ pathname: '/home', passwordNeedsUpgrade: false })).toBe(false)
    expect(shouldPromptPasswordUpgrade({ pathname: '/home', passwordNeedsUpgrade: undefined })).toBe(false)
    expect(shouldPromptPasswordUpgrade({ pathname: '/auth/login', passwordNeedsUpgrade: true })).toBe(false)
    expect(shouldPromptPasswordUpgrade({ pathname: '/auth/reset-password', passwordNeedsUpgrade: true })).toBe(false)
  })
})

describe('isProductPromptSuppressedPath', () => {
  it('supprime auth, onboarding et séance live — pas /profile ni revue de log', () => {
    expect(isProductPromptSuppressedPath('/onboarding')).toBe(true)
    expect(isProductPromptSuppressedPath('/auth/login')).toBe(true)
    expect(isProductPromptSuppressedPath('/session/0')).toBe(true)
    expect(isProductPromptSuppressedPath('/session/12')).toBe(true)
    expect(isProductPromptSuppressedPath('/session/log/abc')).toBe(false)
    expect(isProductPromptSuppressedPath('/profile')).toBe(false)
    expect(isProductPromptSuppressedPath('/home')).toBe(false)
  })
})

describe('shouldPromptNewsletterOptIn', () => {
  const afterFirstSession = {
    sessionGate: { status: 'ready' as const, completedGymSessionCount: 1 },
  }

  it('asks existing accounts (null) once the password is ok and ≥1 séance serveur', () => {
    expect(shouldPromptNewsletterOptIn({
      pathname: '/home',
      passwordNeedsUpgrade: false,
      newsletterOptIn: null,
      ...afterFirstSession,
    })).toBe(true)
    expect(shouldPromptNewsletterOptIn({
      pathname: '/profile',
      passwordNeedsUpgrade: false,
      newsletterOptIn: null,
      ...afterFirstSession,
    })).toBe(true)
  })

  it('refuse avant la 1re séance — y compris /profile (SoT serveur)', () => {
    expect(shouldPromptNewsletterOptIn({
      pathname: '/profile',
      passwordNeedsUpgrade: false,
      newsletterOptIn: null,
      sessionGate: { status: 'ready', completedGymSessionCount: 0 },
    })).toBe(false)
  })

  it('refuse tant que le comptage serveur n’est pas ready (pas de flash local)', () => {
    expect(shouldPromptNewsletterOptIn({
      pathname: '/profile',
      passwordNeedsUpgrade: false,
      newsletterOptIn: null,
      sessionGate: { status: 'loading' },
    })).toBe(false)
    expect(shouldPromptNewsletterOptIn({
      pathname: '/home',
      passwordNeedsUpgrade: false,
      newsletterOptIn: null,
      sessionGate: { status: 'idle' },
    })).toBe(false)
  })

  it('does not ask new accounts that already chose at signup', () => {
    expect(shouldPromptNewsletterOptIn({
      pathname: '/home',
      passwordNeedsUpgrade: false,
      newsletterOptIn: false,
      ...afterFirstSession,
    })).toBe(false)
    expect(shouldPromptNewsletterOptIn({
      pathname: '/home',
      passwordNeedsUpgrade: false,
      newsletterOptIn: true,
      ...afterFirstSession,
    })).toBe(false)
  })

  it('waits until profile hydration (undefined) and until password upgrade is done', () => {
    expect(shouldPromptNewsletterOptIn({
      pathname: '/home',
      passwordNeedsUpgrade: undefined,
      newsletterOptIn: null,
      ...afterFirstSession,
    })).toBe(true)
    expect(shouldPromptNewsletterOptIn({
      pathname: '/home',
      passwordNeedsUpgrade: true,
      newsletterOptIn: null,
      ...afterFirstSession,
    })).toBe(false)
    expect(shouldPromptNewsletterOptIn({
      pathname: '/home',
      passwordNeedsUpgrade: false,
      newsletterOptIn: undefined,
      ...afterFirstSession,
    })).toBe(false)
  })

  it('does not interrupt onboarding, auth, or live session', () => {
    expect(shouldPromptNewsletterOptIn({
      pathname: '/onboarding',
      passwordNeedsUpgrade: false,
      newsletterOptIn: null,
      ...afterFirstSession,
    })).toBe(false)
    expect(shouldPromptNewsletterOptIn({
      pathname: '/privacy',
      passwordNeedsUpgrade: false,
      newsletterOptIn: null,
      ...afterFirstSession,
    })).toBe(false)
    expect(shouldPromptNewsletterOptIn({
      pathname: '/session/0',
      passwordNeedsUpgrade: false,
      newsletterOptIn: null,
      ...afterFirstSession,
    })).toBe(false)
  })
})

describe('newsletterPreferencePatch', () => {
  it('stamps the choice and source', () => {
    expect(newsletterPreferencePatch(true, 'signup', '2026-09-07T12:00:00.000Z')).toEqual({
      newsletterOptIn: true,
      newsletterOptedAt: '2026-09-07T12:00:00.000Z',
      newsletterOptInSource: 'signup',
    })
  })
})

describe('applyNewsletterFromMetadata', () => {
  const base = { newsletterOptIn: null } as UserProfile

  it('copies signup choice when the profile was never asked', () => {
    const next = applyNewsletterFromMetadata(base, {
      newsletter_opt_in: true,
      newsletter_opted_at: '2026-09-07T12:00:00.000Z',
    })
    expect(next.newsletterOptIn).toBe(true)
    expect(next.newsletterOptInSource).toBe('signup')
    expect(next.newsletterOptedAt).toBe('2026-09-07T12:00:00.000Z')
  })

  it('does not overwrite an explicit choice', () => {
    const next = applyNewsletterFromMetadata(
      { newsletterOptIn: false } as UserProfile,
      { newsletter_opt_in: true },
    )
    expect(next.newsletterOptIn).toBe(false)
  })
})
