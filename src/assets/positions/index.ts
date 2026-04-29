import frontRow from './front-row.webp'
import secondRow from './second-row.webp'
import backRow from './back-row.webp'
import halfBacks from './half-backs.webp'
import centers from './centers.webp'
import backThree from './back-three.webp'
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
