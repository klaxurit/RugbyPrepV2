import { useEffect } from 'react'

const BORDEAUX = '#7B0D1E'
const CREAM = '#F5F2EE'

/**
 * Switches the browser status-bar colour between bordeaux (top of page)
 * and cream (once the user scrolls past the header).
 *
 * Works on Chrome Android, Safari iOS 15+ (standalone PWA), and inside the TWA.
 */
export function useScrollThemeColor(threshold = 10) {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) return

    let current = BORDEAUX

    const update = () => {
      const next = window.scrollY > threshold ? CREAM : BORDEAUX
      if (next !== current) {
        meta.setAttribute('content', next)
        current = next
      }
    }

    window.addEventListener('scroll', update, { passive: true })
    update()

    return () => {
      window.removeEventListener('scroll', update)
      meta.setAttribute('content', BORDEAUX)
    }
  }, [threshold])
}
