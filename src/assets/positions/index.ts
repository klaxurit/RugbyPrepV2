import frontRow from './front-row.png'
import secondRow from './second-row.png'
import backRow from './back-row.png'
import halfBacks from './half-backs.png'
import centers from './centers.png'
import backThree from './back-three.png'
import type { UserProfile } from '../../types/training'

type PositionValue = NonNullable<UserProfile['position']>

export const POSITION_ILLUSTRATIONS: Record<PositionValue, string> = {
  FRONT_ROW: frontRow,
  SECOND_ROW: secondRow,
  BACK_ROW: backRow,
  HALF_BACKS: halfBacks,
  CENTERS: centers,
  BACK_THREE: backThree,
}

/**
 * Illustration abstraite associée au poste — utilisée pour le compagnon
 * coach, l'avatar par défaut et le hero d'onboarding. Retourne `null` si
 * la position n'est pas encore sélectionnée.
 */
export function getPositionIllustration(
  position: PositionValue | null | undefined,
): string | null {
  if (!position) return null
  return POSITION_ILLUSTRATIONS[position] ?? null
}
