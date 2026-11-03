import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { posthog } from '../../services/analytics/posthog'

/**
 * Remet le défilement en haut à chaque navigation (pathname / query).
 * Les SPA ne restaurent pas le scroll comme une navigation document classique ;
 * sans cela, on reste à la position de la page précédente.
 *
 * Capture aussi un `$pageview` manuel (PostHog a `capture_pageview: false`
 * pour éviter le bruit landing) — indispensable pour lire les funnels UX.
 */
function scrollWindowAndRootsToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  const scrollingEl = document.scrollingElement ?? document.documentElement
  scrollingEl.scrollTop = 0
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0

  document.querySelectorAll<HTMLElement>('[data-app-scroll-root]').forEach((node) => {
    node.scrollTop = 0
  })
}

export function ScrollToTop() {
  const { pathname, search } = useLocation()

  useLayoutEffect(() => {
    scrollWindowAndRootsToTop()
    try {
      posthog.capture?.('$pageview', {
        $current_url: `${window.location.origin}${pathname}${search}`,
        path: pathname,
      })
    } catch {
      /* posthog may be opted out */
    }
  }, [pathname, search])

  return null
}
