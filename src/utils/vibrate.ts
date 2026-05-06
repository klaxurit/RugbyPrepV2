/**
 * Vibre selon le pattern donné si l'API `navigator.vibrate` est disponible.
 * No-op silencieux sur les plateformes / navigateurs qui ne supportent pas.
 *
 * Patterns courants :
 *   - `[120, 80, 120]` : "fini" (timer rest, set validé)
 *   - `[60, 40, 60]`   : "switch" (changement de phase iso, prep window)
 */
export function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined') return
  const nav = navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean }
  try {
    nav.vibrate?.(pattern)
  } catch {
    // ignore (browsers sans support)
  }
}
