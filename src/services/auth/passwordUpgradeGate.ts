const STORAGE_KEY = 'rugbyprep.auth.passwordNeedsUpgrade'

export function notePasswordNeedsUpgrade(needsUpgrade: boolean): void {
  try {
    if (needsUpgrade) sessionStorage.setItem(STORAGE_KEY, '1')
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* private mode / SSR */
  }
}

export function peekPasswordNeedsUpgrade(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function clearPasswordNeedsUpgradeNote(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function resolvePasswordNeedsUpgrade(
  profileFlag: boolean | null | undefined,
  sessionFlag = peekPasswordNeedsUpgrade(),
): boolean {
  return profileFlag === true || sessionFlag
}
