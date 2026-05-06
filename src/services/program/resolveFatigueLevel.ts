import type { FatigueLevel, FatigueStatus } from '../../types/training'
import type { ACWRZone } from '../../hooks/useACWR'

export interface ResolveFatigueLevelOptions {
  /**
   * Quand la saison est explicitement finie, les pics ACWR liés aux derniers
   * matchs sont attendus et transitoires — on plafonne à `'high'` pour que le
   * moteur réduise le volume sans remplacer toute la semaine par de la récup.
   */
  seasonEnded?: boolean
}

/**
 * Source unique de vérité pour résoudre `(FatigueStatus, ACWRZone) → FatigueLevel`.
 *
 * Règles métier (kept stable from previous local implementation in
 * `buildAthletePlanningInputs.ts`) :
 *  - `seasonEnded` :
 *      `FATIGUE`        → `high`
 *      `OK`             → `normal`
 *  - Saison active :
 *      `acwrZone in {critical, danger}`        → `very_high`
 *      `FATIGUE` ou `acwrZone === 'caution'`   → `high`
 *      sinon                                   → `normal`
 *
 * L'ACWR (charge accumulée) prime sur le ressenti manuel quand il est en
 * danger/critical : c'est volontaire, ça protège l'utilisateur contre la
 * sous-estimation de sa charge réelle.
 */
export function resolveFatigueLevel(
  fatigue: FatigueStatus,
  acwrZone: ACWRZone | null | undefined,
  options?: ResolveFatigueLevelOptions,
): FatigueLevel {
  if (options?.seasonEnded) {
    return fatigue === 'FATIGUE' ? 'high' : 'normal'
  }
  if (acwrZone === 'critical' || acwrZone === 'danger') return 'very_high'
  if (fatigue === 'FATIGUE' || acwrZone === 'caution') return 'high'
  return 'normal'
}
