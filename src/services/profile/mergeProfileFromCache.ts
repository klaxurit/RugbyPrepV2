import type { UserProfile } from '../../types/training'
import { sanitizePlanningAnchorsForProgression } from '../season/sanitizePlanningAnchors'

export interface MergeProfileFromCacheResult {
  profile: UserProfile
  /** True when local cache had richer user choices than remote — push back to Supabase. */
  shouldHealRemote: boolean
}

/** Champs posés côté serveur (admin / staff) : le remote prime sur le cache local. */
export const SERVER_AUTHORITATIVE_PLANNING_ANCHOR_KEYS = [
  'manualCycleOverride',
  'manualOffSeasonWeekOverride',
  'manualPreSeasonWeekOverride',
  'seasonEndedAt',
  'offSeasonStartAt',
  'returnToTeamTrainingAt',
  'manualPlayoffs',
  'onboardingCycleHint',
  'seasonEndedSource',
  'skipOffSeasonRecoveryIntro',
  'firstMatchDateOverride',
] as const satisfies readonly (keyof NonNullable<UserProfile['planningAnchors']>)[]

export function mergePlanningAnchorsPreferRemote(
  local: UserProfile['planningAnchors'],
  remote: UserProfile['planningAnchors'],
): UserProfile['planningAnchors'] {
  if (!remote && !local) return undefined
  const out: NonNullable<UserProfile['planningAnchors']> = { ...(local ?? {}) }
  if (remote) {
    for (const key of SERVER_AUTHORITATIVE_PLANNING_ANCHOR_KEYS) {
      const value = remote[key]
      if (value !== undefined) {
        ;(out as Record<string, unknown>)[key] = value
      }
    }
  }
  return sanitizePlanningAnchorsForProgression(
    Object.keys(out).length > 0 ? out : undefined,
  )
}

/**
 * Applique les champs serveur (admin) sur un profil local sans écraser le reste des edits.
 * Utilisé quand localEditsSinceLoad > 0 mais que Supabase a des ancres plus récentes.
 */
export function applyServerAuthoritativeProfileFields(
  local: UserProfile,
  remote: UserProfile,
): UserProfile {
  const planningAnchors = mergePlanningAnchorsPreferRemote(
    local.planningAnchors,
    remote.planningAnchors,
  )
  return {
    ...local,
    ...(remote.seasonMode ? { seasonMode: remote.seasonMode } : {}),
    ...(remote.weeklySessions === 2 || remote.weeklySessions === 3 || remote.weeklySessions === 4
      ? { weeklySessions: remote.weeklySessions }
      : {}),
    ...(planningAnchors ? { planningAnchors } : {}),
  }
}

/**
 * When Supabase was clobbered (DEFAULT_PROFILE race) but localStorage still has
 * the user's choices, prefer the cache for critical planning fields.
 */
export function mergeProfileFromCache(
  remote: UserProfile,
  cached: UserProfile | null,
): MergeProfileFromCacheResult {
  if (!cached) {
    return { profile: remote, shouldHealRemote: false }
  }

  let shouldHealRemote = false
  const merged: UserProfile = { ...remote }

  const remoteAnchors = remote.planningAnchors
  const cachedAnchors = cached.planningAnchors

  if (cachedAnchors) {
    const remoteLostSeasonEnd =
      Boolean(cachedAnchors.seasonEndedAt) && !remoteAnchors?.seasonEndedAt
    const remoteLostSkipRecovery =
      cachedAnchors.skipOffSeasonRecoveryIntro === true &&
      remoteAnchors?.skipOffSeasonRecoveryIntro !== true
    const remoteLostOffSeasonHint =
      cachedAnchors.onboardingCycleHint === 'off_season' &&
      remoteAnchors?.onboardingCycleHint !== 'off_season' &&
      !remoteAnchors?.seasonEndedAt

    if (remoteLostSeasonEnd || remoteLostSkipRecovery || remoteLostOffSeasonHint) {
      merged.planningAnchors = { ...remoteAnchors, ...cachedAnchors }
      shouldHealRemote = true
    }
  }

  merged.planningAnchors = mergePlanningAnchorsPreferRemote(
    merged.planningAnchors,
    remoteAnchors,
  )

  if (cached.weeklySessions === 3 && remote.weeklySessions === 2) {
    merged.weeklySessions = 3
    if (cached.scSchedule) merged.scSchedule = cached.scSchedule
    shouldHealRemote = true
  }

  if (
    cached.seasonMode === 'off_season' &&
    remote.seasonMode === 'in_season' &&
    Boolean(cached.planningAnchors?.seasonEndedAt) &&
    !remoteAnchors?.seasonEndedAt
  ) {
    merged.seasonMode = 'off_season'
    shouldHealRemote = true
  }

  return { profile: merged, shouldHealRemote }
}
