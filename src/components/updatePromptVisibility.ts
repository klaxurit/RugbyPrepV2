/**
 * Toast PWA « Recharger » : uniquement dans l’app authentifiée,
 * jamais pendant une sheet programme, et au plus une fois / 24 h.
 */

export const UPDATE_PROMPT_STORAGE_KEY = 'rf.updatePrompt.lastPresentedAt'
export const UPDATE_PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000

export type UpdatePromptVisibilityOptions = {
  /** Sheet programme (match / cycle / feature) ouverte → toast masqué. */
  suppressForProgramSheet?: boolean
  /** Epoch ms du dernier affichage (localStorage). */
  lastPresentedAt?: number | null
  now?: number
}

export function shouldShowUpdatePrompt(
  needRefresh: boolean,
  authStatus: string,
  options: UpdatePromptVisibilityOptions = {},
): boolean {
  if (!needRefresh || authStatus !== 'authenticated') return false
  if (options.suppressForProgramSheet) return false

  const now = options.now ?? Date.now()
  const last = options.lastPresentedAt
  if (typeof last === 'number' && Number.isFinite(last) && now - last < UPDATE_PROMPT_COOLDOWN_MS) {
    return false
  }

  return true
}

export function readUpdatePromptLastPresentedAt(
  storage: Pick<Storage, 'getItem'> | null | undefined = typeof localStorage !== 'undefined'
    ? localStorage
    : null,
): number | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(UPDATE_PROMPT_STORAGE_KEY)
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

export function writeUpdatePromptLastPresentedAt(
  at: number,
  storage: Pick<Storage, 'setItem'> | null | undefined = typeof localStorage !== 'undefined'
    ? localStorage
    : null,
): void {
  if (!storage) return
  try {
    storage.setItem(UPDATE_PROMPT_STORAGE_KEY, String(at))
  } catch {
    // quota / private mode — ignore
  }
}
