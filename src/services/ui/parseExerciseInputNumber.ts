/** Normalise une saisie décimale (accepte la virgule FR). */
export function sanitizeDecimalInput(raw: string): string {
  let s = raw.replace(/,/g, '.').replace(/[^0-9.]/g, '')
  const dot = s.indexOf('.')
  if (dot !== -1) {
    s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '')
  }
  return s
}

export function parseExerciseInputNumber(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed.replace(/,/g, '.'))
  return Number.isFinite(n) ? n : undefined
}
