/**
 * Keep in sync with src/services/calendar/inferMatchKindFromFfrJournee.ts (edge Deno bundle).
 */
export type FfrMatchKind = 'league' | 'friendly' | 'cup_final'

function normalizeJourneeLabel(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

const PLAYOFF_KEYWORDS = [
  'finale',
  'demi-finale',
  'demi finale',
  'quart de finale',
  'quart-finale',
  'huitieme de finale',
  'huitième de finale',
  '8eme de finale',
  '8ème de finale',
  'seizieme de finale',
  'seizième de finale',
  '16eme de finale',
  '16ème de finale',
  'barrage',
  'phase finale',
]

const LEAGUE_JOURNEE = /^journee\s+\d+\b/

export function inferMatchKindFromFfrJournee(
  journeeName: string | null | undefined,
): FfrMatchKind | null {
  if (!journeeName?.trim()) return null

  const normalized = normalizeJourneeLabel(journeeName)

  if (PLAYOFF_KEYWORDS.some((kw) => normalized.includes(normalizeJourneeLabel(kw)))) {
    return 'cup_final'
  }

  if (LEAGUE_JOURNEE.test(normalized)) {
    return 'league'
  }

  return null
}

export function resolveMatchKindOnFfrSync(
  existingMatchKind: FfrMatchKind | null | undefined,
  journeeName: string | null | undefined,
): FfrMatchKind | null {
  if (existingMatchKind) return null
  return inferMatchKindFromFfrJournee(journeeName)
}
