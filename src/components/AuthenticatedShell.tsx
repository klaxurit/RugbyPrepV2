import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { BrandLoadingFallback } from './BrandLoadingFallback'
import { shouldShowAuthenticatedBottomNav } from '../services/navigation/bottomNavVisibility'

/**
 * Shell authentifié : la BottomNav vit ICI, pas dans chaque page.
 *
 * Avant, chaque route lazy remontait sa propre nav → les icônes disparaissaient
 * le temps du Suspense / remount. En sortant la nav du contenu qui suspend,
 * elle reste montée d’une route à l’autre.
 *
 * Exception : séance live (`/session/:id`) — sticky CTA en bas ; on masque
 * la nav pour ne pas le recouvrir (régression du shell unifié).
 */
export function AuthenticatedShell() {
  const { pathname } = useLocation()
  const showNav = shouldShowAuthenticatedBottomNav(pathname)

  return (
    <>
      <Suspense
        fallback={
          <BrandLoadingFallback
            withBottomNav={showNav}
            label="Chargement de la page"
          />
        }
      >
        <Outlet />
      </Suspense>
      {showNav ? <BottomNav /> : null}
    </>
  )
}
