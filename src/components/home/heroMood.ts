import type { FatigueStatus } from '../../types/training'

export type HeroMood = 'fit' | 'tired' | null

/** Mapping helper : mood UI ↔ FatigueStatus persisté. */
export function moodToFatigue(mood: HeroMood): FatigueStatus | null {
  if (mood === 'fit') return 'OK'
  if (mood === 'tired') return 'FATIGUE'
  return null
}

/** Réciproque : FatigueStatus → mood (sert quand on veut hydrater l'UI depuis le store). */
export function fatigueToMood(f: FatigueStatus | null | undefined): HeroMood {
  if (f === 'OK') return 'fit'
  if (f === 'FATIGUE') return 'tired'
  return null
}
