import { trackSignupCompletedWithAttribution } from '../analytics/activationEvents'

const GOOGLE_SIGNUP_TRACKED_KEY = 'rugbyprep.analytics.googleSignupTracked'
const NEW_ACCOUNT_WINDOW_MS = 120_000

export function maybeTrackGoogleSignup(user: {
  id: string
  created_at: string
  identities?: Array<{ provider: string }> | null
}): void {
  const identities = user.identities ?? []
  if (identities.length !== 1 || identities[0]?.provider !== 'google') return

  const createdAt = Date.parse(user.created_at)
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > NEW_ACCOUNT_WINDOW_MS) return

  try {
    if (sessionStorage.getItem(GOOGLE_SIGNUP_TRACKED_KEY) === user.id) return
    sessionStorage.setItem(GOOGLE_SIGNUP_TRACKED_KEY, user.id)
  } catch {
    /* private mode */
  }

  trackSignupCompletedWithAttribution()
}
