/**
 * Règle de consentement à l'exposition sociale, côté TypeScript.
 *
 * Miroir exact de la fonction SQL `gamification_is_exposable`. Les deux
 * existent parce que les RPC de lecture filtrent en base tandis que le cron de
 * nudges travaille sur des lignes déjà chargées, mais il ne doit y avoir
 * qu'**une** définition de la règle de chaque côté : un second filtre écrit à
 * la main dans une Edge Function finirait par oublier un cas, et le cas oublié
 * serait une fuite.
 *
 * Trois conditions cumulatives :
 *  1. Opt-in explicite au périmètre demandé (`cohort` inclut `club`).
 *  2. Nom d'affichage renseigné — sans nom, il n'y a rien à montrer.
 *  3. Pour un mineur, consentement santé accordé.
 */

export type ExposureScope = 'club' | 'cohort'

/**
 * Forme minimale attendue. Volontairement structurelle : la fonction est
 * appelée côté client comme depuis Deno, sur des lignes `profiles` brutes.
 */
export interface ExposureCandidate {
  display_name?: string | null
  social_visibility?: string | null
  age_band?: string | null
  health_consent_status?: string | null
}

export function isSociallyExposable(
  candidate: ExposureCandidate | null | undefined,
  required: ExposureScope,
): boolean {
  if (!candidate) return false

  if ((candidate.display_name ?? '').trim().length === 0) return false

  const isMinor = (candidate.age_band ?? 'adult') !== 'adult'
  if (isMinor && candidate.health_consent_status !== 'granted') return false

  const visibility = candidate.social_visibility
  if (required === 'cohort') return visibility === 'cohort'
  return visibility === 'club' || visibility === 'cohort'
}
