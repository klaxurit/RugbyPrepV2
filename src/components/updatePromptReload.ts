/** Préfixes de routes SPA — alignés sur App.tsx + public/_redirects. */
const SPA_ROUTE_PREFIXES = [
  '/home',
  '/onboarding',
  '/profile',
  '/week',
  '/history',
  '/progress',
  '/program',
  '/session/',
  '/chat',
  '/staff-sandbox',
  '/feedback',
  '/founding',
  '/delete-account',
  '/auth/',
  '/login',
  '/signup',
  '/landing',
] as const

export type ReloadLocation = Pick<Location, 'pathname' | 'search' | 'hash'>

/**
 * Cible de reload sûre après activation d'un nouveau Service Worker.
 * Conserve query + hash ; retombe sur /home si l'URL courante n'est pas une route app.
 */
export function resolveSafeReloadTarget(
  location: ReloadLocation = window.location,
): string {
  const { pathname, search, hash } = location
  if (pathname === '/') {
    return `/home${search}${hash}`
  }
  const isSpaRoute = SPA_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  )
  if (isSpaRoute) {
    return `${pathname}${search}${hash}`
  }
  return `/home${search}${hash}`
}
