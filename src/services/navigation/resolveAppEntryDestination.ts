/**
 * Pure helpers for resolving where to send the user after login / callback / onboarding.
 * No side effects, no router dependency — returns path strings.
 */

const DEFAULT_DESTINATION = '/home'

/** Routes that must never be a post-auth destination (would cause loops or are meaningless). */
const EXCLUDED_DESTINATIONS = new Set([
  '/',
  '/landing',
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
])

/** All known protected routes that make sense as a deep-link destination. */
const VALID_PROTECTED_PREFIXES = [
  '/home',
  '/program',
  '/week',
  '/session',
  '/history',
  '/progress',
  '/profile',
  '/mobility',
  '/chat',
  '/staff',
]

// ── Public API ──────────────────────────────────────────────────────────────

export interface ResolveAppEntryDestinationParams {
  onboardingStatus: 'complete' | 'incomplete'
  requestedPath?: string | null
}

/**
 * Sanitize a requested path: returns a valid internal protected path, or null.
 * Strips external URLs, auth routes, public-only routes.
 */
export function sanitizeRequestedAppPath(path: string | null | undefined): string | null {
  if (!path || typeof path !== 'string') return null
  const trimmed = path.trim()
  if (!trimmed.startsWith('/')) return null
  // Extract pathname only (before ? or #) for validation, but return the full string if valid.
  const pathOnly = trimmed.split(/[?#]/)[0]
  if (EXCLUDED_DESTINATIONS.has(pathOnly)) return null
  // /onboarding is excluded as a destination when onboarding is complete (handled by caller)
  if (pathOnly === '/onboarding') return null
  if (!VALID_PROTECTED_PREFIXES.some((prefix) => pathOnly === prefix || pathOnly.startsWith(prefix + '/'))) return null
  return trimmed
}

/**
 * After authentication is confirmed, decide where to send the user.
 * - Incomplete onboarding → /onboarding (requestedPath is preserved for after onboarding)
 * - Complete onboarding + valid requestedPath → that path
 * - Otherwise → /program
 */
export function resolveAuthenticatedAppDestination(
  params: ResolveAppEntryDestinationParams,
): string {
  if (params.onboardingStatus === 'incomplete') return '/onboarding'
  const sanitized = sanitizeRequestedAppPath(params.requestedPath)
  return sanitized ?? DEFAULT_DESTINATION
}

/**
 * After onboarding completes, decide where to send the user.
 * - Valid requestedPath → that path
 * - Otherwise → /program
 */
export function resolvePostOnboardingDestination(
  requestedPath?: string | null,
): string {
  const sanitized = sanitizeRequestedAppPath(requestedPath)
  return sanitized ?? DEFAULT_DESTINATION
}
