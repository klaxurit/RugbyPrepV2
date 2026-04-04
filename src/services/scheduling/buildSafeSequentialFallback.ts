import { MOTHER_SESSIONS, MOTHER_SESSIONS_BY_ID } from '../../data/motherSessions.generated'
import type { AnnualPlanningContext } from '../../types/annualPlanning'
import type { MotherSession } from '../../types/motherSession'
import type {
  ResolveMotherSessionsForWeekResult,
  ResolvedMotherSessionSlot,
} from '../motherSession/resolveMotherSessionsForWeek'

/**
 * Preferred session IDs — the 2 safest, most generic mother sessions.
 * Both are RPE 4-5, full-body recovery, no position-specific work.
 */
const PREFERRED_A = 'FULL_OFFSEASON_RECOVERY_A_V1'
const PREFERRED_B = 'FULL_OFFSEASON_RECOVERY_B_V1'

/**
 * If preferred IDs are missing, pick from the dataset using these criteria
 * (in priority order): cycle=off_season, sessionType=full, status=validated.
 * Returns the first 2 matches, or whatever is available.
 */
function pickFallbackSessions(
  exclude: Set<string>,
): MotherSession[] {
  const scored = MOTHER_SESSIONS
    .filter((ms) => !exclude.has(ms.metadata.id))
    .map((ms) => {
      let score = 0
      if (ms.metadata.cycle === 'off_season') score += 4
      if (ms.metadata.sessionType === 'full') score += 2
      if (ms.metadata.status === 'validated') score += 1
      return { ms, score }
    })
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, 2).map((s) => s.ms)
}

function toSlot(
  session: MotherSession,
  dayPreference: 'early_week' | 'late_week',
): ResolvedMotherSessionSlot {
  return {
    sessionId: session.metadata.id,
    session,
    role: 'primary',
    dayPreference,
    variant: 'light',
  }
}

/**
 * Builds a safe, minimal sequential program that replaces the old
 * "programme unavailable" state. Never throws, always returns a valid
 * result with at least 1 session (2 when possible).
 *
 * Strategy:
 *  1. Use the 2 preferred recovery sessions if they exist in the dataset.
 *  2. If one or both are missing, fill gaps from the dataset using safe criteria.
 *  3. If the entire dataset is empty (should never happen in production),
 *     return resolved_with_warnings with an empty session list and explicit warning.
 */
export function buildSafeSequentialFallback(
  planningContext: AnnualPlanningContext,
): ResolveMotherSessionsForWeekResult {
  const sessions: ResolvedMotherSessionSlot[] = []
  const usedIds = new Set<string>()

  // Step 1: try preferred sessions
  const preferredA = MOTHER_SESSIONS_BY_ID[PREFERRED_A]
  const preferredB = MOTHER_SESSIONS_BY_ID[PREFERRED_B]

  if (preferredA) {
    sessions.push(toSlot(preferredA, 'early_week'))
    usedIds.add(PREFERRED_A)
  }
  if (preferredB) {
    sessions.push(toSlot(preferredB, 'late_week'))
    usedIds.add(PREFERRED_B)
  }

  // Step 2: fill gaps if preferred sessions were missing
  if (sessions.length < 2) {
    const fallbacks = pickFallbackSessions(usedIds)
    const dayPrefs: Array<'early_week' | 'late_week'> =
      sessions.length === 0 ? ['early_week', 'late_week'] : ['late_week']

    for (let i = 0; i < dayPrefs.length && i < fallbacks.length; i++) {
      sessions.push(toSlot(fallbacks[i], dayPrefs[i]))
    }
  }

  const warnings = [
    'Programme adapté — complète ton profil pour un programme optimal.',
  ]

  if (sessions.length === 0) {
    warnings.push('Aucune session disponible dans le catalogue.')
  }

  return {
    status: 'resolved_with_warnings',
    planningContext,
    sessions,
    warnings,
  }
}
