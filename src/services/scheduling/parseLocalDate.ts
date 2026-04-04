/**
 * Parse a YYYY-MM-DD string as a local-timezone Date anchored at noon.
 *
 * `new Date("2026-04-06")` is parsed as UTC midnight, which can shift
 * to the previous calendar day in negative-UTC offsets (e.g. UTC-5).
 * Anchoring at noon avoids this class of bugs entirely.
 */
export function parseLocalDate(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`)
}
