import type { UserProfile } from '../../types/training'

export function buildReturnToClubProfilePatch(
  existingAnchors: UserProfile['planningAnchors'],
  payload: { returnDate: string; clubName?: string; clubCode?: string },
): Partial<UserProfile> {
  const patch: Partial<UserProfile> = {
    planningAnchors: {
      ...existingAnchors,
      returnToTeamTrainingAt: payload.returnDate,
    },
    seasonMode: 'pre_season',
  }
  if (payload.clubCode) {
    patch.clubCode = payload.clubCode
    patch.clubName = payload.clubName
  }
  return patch
}
