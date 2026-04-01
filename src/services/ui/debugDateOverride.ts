const STORAGE_KEY = 'rugbyforge_debug_date'

/**
 * Returns today's date as YYYY-MM-DD.
 * In development mode, checks localStorage for a date override.
 *
 * Usage (browser console):
 *   localStorage.setItem('rugbyforge_debug_date', '2026-05-15')  // simulate May 15
 *   localStorage.removeItem('rugbyforge_debug_date')              // back to real date
 */
export function getToday(): string {
  if (import.meta.env.DEV) {
    try {
      const override = localStorage.getItem(STORAGE_KEY)
      if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) {
        return override
      }
    } catch { /* ignore */ }
  }

  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
