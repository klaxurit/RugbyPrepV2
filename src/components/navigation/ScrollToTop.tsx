import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Remet le défilement en haut à chaque navigation (pathname / query).
 * Les SPA ne restaurent pas le scroll comme une navigation document classique ;
 * sans cela, on reste à la position de la page précédente.
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
  }, [pathname, search])

  return null
}
