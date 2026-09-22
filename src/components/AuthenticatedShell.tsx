import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { BrandLoadingFallback } from './BrandLoadingFallback'

/**
 * Shell authentifié : la BottomNav vit ICI, pas dans chaque page.
 *
 * Avant, chaque route lazy remontait sa propre nav → les icônes disparaissaient
 * le temps du Suspense / remount. En sortant la nav du contenu qui suspend,
 * elle reste montée d’une route à l’autre.
 */
export function AuthenticatedShell() {
  return (
    <>
      <Suspense fallback={<BrandLoadingFallback withBottomNav label="Chargement de la page" />}>
        <Outlet />
      </Suspense>
      <BottomNav />
    </>
  )
}
