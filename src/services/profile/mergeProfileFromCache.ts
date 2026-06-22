import type { UserProfile } from '../../types/training'

export interface MergeProfileFromCacheResult {
  profile: UserProfile
  /** True when local cache had richer user choices than remote — push back to Supabase. */
  shouldHealRemote: boolean
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
