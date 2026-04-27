import type { UserProfile } from '../../types/training'

/**
 * Durée (en jours) du protocole "rampe de reprise" déclenché par
 * trainingBaseline = 'restart'. Source KB : population-specific.md §3
 * (Return After Long Break) — volume -40-50% sur W1-W2.
 */
export const RESTART_RAMP_UP_DAYS = 14

/**
 * Renvoie true si le profil est en mode 'restart' actif (déclaré il y a moins de
 * RESTART_RAMP_UP_DAYS jours). Au-delà, le mode reste stocké en BDD mais n'a plus
 * d'effet sur le programme — le moteur retombe sur le calcul standard.
 *
 * Cas couverts :
 *   - baseline ≠ 'restart' → false (active/peak/null)
 *   - baseline = 'restart' mais trainingBaselineSetAt absent (legacy users) → false
 *   - baseline = 'restart' et trainingBaselineSetAt < 14j → true
 */
export const isRestartRampUpActive = (
  profile: Pick<UserProfile, 'trainingBaseline' | 'trainingBaselineSetAt'>,
  now: Date = new Date()
): boolean => {
  if (profile.trainingBaseline !== 'restart') return false
  if (!profile.trainingBaselineSetAt) return false
  const setAt = new Date(profile.trainingBaselineSetAt)
  if (Number.isNaN(setAt.getTime())) return false
  const ageMs = now.getTime() - setAt.getTime()
  return ageMs >= 0 && ageMs < RESTART_RAMP_UP_DAYS * 86_400_000
}
