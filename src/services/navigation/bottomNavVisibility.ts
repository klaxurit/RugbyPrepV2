/**
 * Visibilité de la BottomNav du shell authentifié.
 *
 * Sur `/session/:id` (séance live), le sticky CTA est en `bottom-0` :
 * la nav (z-50) le recouvrait. On la masque comme avant le shell unifié.
 * La revue de log (`/session/log/…`) garde la nav.
 */
export function shouldShowAuthenticatedBottomNav(pathname: string): boolean {
  if (!pathname.startsWith('/session/')) return true
  if (pathname.startsWith('/session/log/')) return true
  return false
}
