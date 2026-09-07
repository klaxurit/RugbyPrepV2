import type { UserProfile } from '../../types/training'

export type NewsletterOptInSource = 'signup' | 'in_app' | 'profile'

const AUTH_LEGAL_PATHS = new Set([
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/login',
  '/signup',
  '/landing',
  '/legal',
  '/privacy',
  '/delete-account',
])

export function isAccountUpgradeSuppressedPath(pathname: string): boolean {
  return AUTH_LEGAL_PATHS.has(pathname)
}

export function shouldPromptPasswordUpgrade(input: {
  pathname: string
  passwordNeedsUpgrade: boolean | null | undefined
}): boolean {
  if (isAccountUpgradeSuppressedPath(input.pathname)) return false
  return input.passwordNeedsUpgrade === true
}

export function shouldPromptNewsletterOptIn(input: {
  pathname: string
  passwordNeedsUpgrade: boolean | null | undefined
  newsletterOptIn: boolean | null | undefined
}): boolean {
  if (isAccountUpgradeSuppressedPath(input.pathname)) return false
  if (input.pathname === '/onboarding') return false
  if (input.passwordNeedsUpgrade === true) return false
  // null = existing account, never asked. undefined = not hydrated yet — don't flash.
  return input.newsletterOptIn === null
}

export function newsletterPreferencePatch(
  optedIn: boolean,
  source: NewsletterOptInSource,
  at = new Date().toISOString(),
): Pick<UserProfile, 'newsletterOptIn' | 'newsletterOptedAt' | 'newsletterOptInSource'> {
  return {
    newsletterOptIn: optedIn,
    newsletterOptedAt: at,
    newsletterOptInSource: source,
  }
}

export function applyNewsletterFromMetadata(
  profile: UserProfile,
  metadata: Record<string, unknown> | undefined,
): UserProfile {
  if (profile.newsletterOptIn != null) return profile
  if (typeof metadata?.newsletter_opt_in !== 'boolean') return profile

  return {
    ...profile,
    ...newsletterPreferencePatch(
      metadata.newsletter_opt_in,
      'signup',
      typeof metadata.newsletter_opted_at === 'string'
        ? metadata.newsletter_opted_at
        : undefined,
    ),
  }
}
