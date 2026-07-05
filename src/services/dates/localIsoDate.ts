/** Bornes réalistes pour les ancres de planning (reprise club, fin de saison, etc.). */
export const MIN_PLANNING_YEAR = 2000
export const MAX_PLANNING_YEAR = 2100

/** Extrait YYYY-MM-DD depuis une chaîne ISO date ou datetime. */
export function extractIsoDatePart(value: string): string {
  const trimmed = value.trim()
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed)
  return m ? m[1] : trimmed
}

/** Parse une date locale sans fuseau (midi local) ; null si invalide ou hors bornes. */
export function parseLocalDateOnly(iso: string): Date | null {
  const part = extractIsoDatePart(iso)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(part)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (y < MIN_PLANNING_YEAR || y > MAX_PLANNING_YEAR) return null
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const dt = new Date(y, mo - 1, d, 12, 0, 0, 0)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  return dt
}

export function isValidPlanningIsoDate(value: string | undefined | null): boolean {
  if (!value?.trim()) return false
  return parseLocalDateOnly(value) !== null
}

/** Normalise ou supprime une date d'ancre invalide (ex. `0002-08-10` saisi au clavier). */
export function sanitizePlanningIsoDate(value: string | undefined | null): string | undefined {
  if (!value?.trim()) return undefined
  const part = extractIsoDatePart(value)
  return parseLocalDateOnly(part) ? part : undefined
}

export function toIsoDateLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
