import { useEffect } from 'react'

/** Close on Escape and lock body scroll while `open` is true. */
export function useEscapeAndScrollLock(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
}
