import type { CalendarEvent, MatchKind, UserProfile } from '../../types/training'

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

/**
 * Conservative inference from FFR `Journee.nom`. Returns null when unsure
 * (user classification or sync match_kind remains authoritative).
 */
export function inferMatchKindFromFfrJournee(
  journeeName: string | null | undefined,
): MatchKind | null {
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

export function hasFuturePlayoffCalendarSignal(
  events: Array<{
    type: string
    date: string
    match_kind?: MatchKind | null
    journee_name?: string | null
  }>,
  today: string,
): boolean {
  return events.some((e) => {
    if (e.type !== 'match' || e.date < today) return false
    if (e.match_kind === 'cup_final') return true
    return inferMatchKindFromFfrJournee(e.journee_name) === 'cup_final'
  })
}

/** match_kind to write on sync when the row has no user classification yet. */
export function resolveMatchKindOnFfrSync(
  existingMatchKind: MatchKind | null | undefined,
  journeeName: string | null | undefined,
): MatchKind | null {
  if (existingMatchKind) return null
  return inferMatchKindFromFfrJournee(journeeName)
}

/** Planning-only: auto manualPlayoffs when FFR calendar already signals finals. */
export function shouldAutoManualPlayoffsFromCalendar(
  profile: UserProfile,
  visibleEvents: CalendarEvent[],
  today: string,
): boolean {
  const pa = profile.planningAnchors
  const offSeasonManuallyConfirmed =
    (pa?.seasonEndedSource === 'manual' && !!pa?.seasonEndedAt) ||
    (profile.seasonMode === 'off_season' && !!pa?.seasonEndedAt)
  if (offSeasonManuallyConfirmed || pa?.manualPlayoffs) return false
  return hasFuturePlayoffCalendarSignal(visibleEvents, today)
}
