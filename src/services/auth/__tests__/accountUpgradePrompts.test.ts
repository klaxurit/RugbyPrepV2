import { describe, expect, it } from 'vitest'
import type { UserProfile } from '../../../types/training'
import {
  applyNewsletterFromMetadata,
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

describe('shouldPromptNewsletterOptIn', () => {
  const afterFirstSession = { completedGymSessionCount: 1 }

  it('asks existing accounts (null) once the password is ok and ≥1 séance', () => {
    expect(shouldPromptNewsletterOptIn({
      pathname: '/home',
      passwordNeedsUpgrade: false,
      newsletterOptIn: null,
      ...afterFirstSession,
    })).toBe(true)
  })

  it('refuse avant la 1re séance (même gate que les annonces)', () => {
    expect(shouldPromptNewsletterOptIn({
      pathname: '/home',
      passwordNeedsUpgrade: false,
      newsletterOptIn: null,
      completedGymSessionCount: 0,
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

  it('does not interrupt onboarding or auth screens', () => {
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
