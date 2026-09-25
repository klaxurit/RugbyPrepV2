/**
 * Toast PWA « Recharger » : uniquement dans l’app authentifiée.
 * Landing / login / signup (anonymous) → jamais.
 */
export function shouldShowUpdatePrompt(
  needRefresh: boolean,
  authStatus: string,
): boolean {
  return needRefresh && authStatus === 'authenticated'
}
