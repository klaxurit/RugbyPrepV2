export type AppTheme = 'forge' | 'paper'

const STORAGE_KEY = 'rugbyforge-theme'

export function getTheme(): AppTheme {
  if (typeof document === 'undefined') return 'forge'
  const v = document.documentElement.getAttribute('data-theme')
  return v === 'paper' ? 'paper' : 'forge'
}

export function setTheme(theme: AppTheme, persist = true): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
  if (persist && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
  }
}

/** À appeler tôt (ex. main.tsx) si tu veux réappliquer le choix utilisateur. */
export function initThemeFromStorage(): void {
  if (typeof localStorage === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'paper' || raw === 'forge') {
      document.documentElement.setAttribute('data-theme', raw)
    }
  } catch {
    /* ignore */
  }
}
