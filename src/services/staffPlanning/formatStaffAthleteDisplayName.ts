import { positionShortLabel, type Lang } from '../../i18n/appLabels'
import type { UserProfile } from '../../types/training'

/** Nom lisible pour le tableau coach (display_name > poste > id court). */
export function formatStaffAthleteDisplayName(
  profile: Pick<UserProfile, 'displayName' | 'rugbyPosition' | 'position'>,
  athleteId: string,
  lang: Lang = 'fr'
): string {
  const fromProfile = profile.displayName?.trim()
  if (fromProfile) return fromProfile

  const position = positionShortLabel(profile.rugbyPosition ?? profile.position, lang)
  if (position) return position

  return `Joueur ${athleteId.slice(0, 6)}`
}
