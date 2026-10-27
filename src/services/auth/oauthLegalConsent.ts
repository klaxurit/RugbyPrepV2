import { isAccountUpgradeSuppressedPath } from './accountUpgradePrompts'

export const PENDING_OAUTH_CONSENT_KEY = 'rugbyprep.oauth.pendingConsent'

export type PendingOauthConsent = {
  medicalConsentAcceptedAt: string
  newsletterOptIn: boolean
}

export type OauthLegalConsentStatus = 'loading' | 'present' | 'missing'

export function notePendingOauthConsent(consent: PendingOauthConsent): void {
  try {
    sessionStorage.setItem(PENDING_OAUTH_CONSENT_KEY, JSON.stringify(consent))
  } catch {
    /* private mode */
  }
}

export function readPendingOauthConsent(): PendingOauthConsent | null {
  try {
    const raw = sessionStorage.getItem(PENDING_OAUTH_CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PendingOauthConsent>
    if (typeof parsed.medicalConsentAcceptedAt !== 'string') return null
    if (typeof parsed.newsletterOptIn !== 'boolean') return null
    return {
      medicalConsentAcceptedAt: parsed.medicalConsentAcceptedAt,
      newsletterOptIn: parsed.newsletterOptIn,
    }
  } catch {
    return null
  }
}

export function clearPendingOauthConsent(): void {
  try {
    sessionStorage.removeItem(PENDING_OAUTH_CONSENT_KEY)
  } catch {
    /* private mode */
  }
}

export function isGoogleAuthUser(user: {
  identities?: Array<{ provider: string }> | null
  app_metadata?: { provider?: string; providers?: string[] } | null
}): boolean {
  if (user.identities?.some((identity) => identity.provider === 'google')) return true
  if (user.app_metadata?.provider === 'google') return true
  return user.app_metadata?.providers?.includes('google') === true
}

export function shouldPromptOauthLegalConsent(input: {
  pathname: string
  consentStatus: OauthLegalConsentStatus
}): boolean {
  if (isAccountUpgradeSuppressedPath(input.pathname)) return false
  return input.consentStatus === 'missing'
}
