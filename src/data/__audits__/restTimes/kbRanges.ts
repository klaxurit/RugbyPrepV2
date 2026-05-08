/**
 * KB-authoritative rest time ranges per training intent.
 *
 * Sources (verified by Section 8 review v2 dual-voice consensus):
 *   - strength-methods.md:218 (Effort Maximal 3-5 min)
 *   - strength-methods.md:245 (Effort Dynamique 60-90s)
 *   - strength-methods.md:276 (Effort Répété / hypertrophie 60-120s)
 *   - periodization.md:122 (DUP endurance 60s)
 *   - Décision #40 v2 (rest after contrast triplet 120-180s)
 *   - Décision #46 (prehab retag 60-90s)
 *
 * "Soft" intents (activation, prehab, core, sprint, reward) have no hard
 * KB rule; the ranges below are corpus-coherence soft rules with ±s
 * tolerance applied during audit.
 */

export type Intent =
  | 'force'
  | 'power_contrast'
  | 'dynamic'
  | 'hypertrophy'
  | 'dup_endurance'
  | 'activation'
  | 'prehab'
  | 'core'
  | 'sprint'
  | 'reward'
  | 'conditioning'
  | 'unknown'

export interface KbRange {
  /** KB-recommended lower bound (seconds). */
  minSeconds: number
  /** KB-recommended upper bound (seconds). */
  maxSeconds: number
  /** Tolerance ±seconds applied to overlap check (0 = strict). */
  toleranceSeconds: number
  /** True if this intent has no hard KB rule (soft corpus-coherence rule). */
  soft: boolean
  /** Skip range comparison (timed/non-numeric protocols). */
  skip: boolean
  /** KB source citation for findings doc. */
  source: string
}

export const KB_RANGES: Record<Intent, KbRange> = {
  force: {
    minSeconds: 180,
    maxSeconds: 300,
    toleranceSeconds: 0,
    soft: false,
    skip: false,
    source: 'strength-methods.md:218 (Effort Maximal 3-5 min)',
  },
  power_contrast: {
    minSeconds: 120,
    maxSeconds: 180,
    toleranceSeconds: 0,
    soft: false,
    skip: false,
    source: 'Décision #40 v2 (rest after contrast triplet/cluster)',
  },
  dynamic: {
    minSeconds: 60,
    maxSeconds: 90,
    toleranceSeconds: 0,
    soft: false,
    skip: false,
    source: 'strength-methods.md:245 (Effort Dynamique)',
  },
  hypertrophy: {
    minSeconds: 60,
    maxSeconds: 120,
    toleranceSeconds: 0,
    soft: false,
    skip: false,
    source: 'strength-methods.md:276 (Effort Répété / RE)',
  },
  dup_endurance: {
    minSeconds: 60,
    maxSeconds: 90,
    toleranceSeconds: 0,
    soft: false,
    skip: false,
    source: 'periodization.md:122 (DUP Séance C)',
  },
  activation: {
    minSeconds: 30,
    maxSeconds: 60,
    toleranceSeconds: 15,
    soft: true,
    skip: false,
    source: 'KB silent — soft (corpus coherence)',
  },
  prehab: {
    minSeconds: 30,
    maxSeconds: 90,
    toleranceSeconds: 15,
    soft: true,
    skip: false,
    source: 'KB silent — soft (Décision #46)',
  },
  core: {
    minSeconds: 30,
    maxSeconds: 90,
    toleranceSeconds: 15,
    soft: true,
    skip: false,
    source: 'KB silent — soft (corpus coherence)',
  },
  sprint: {
    minSeconds: 60,
    maxSeconds: 180,
    toleranceSeconds: 30,
    soft: true,
    skip: false,
    source: 'KB silent — walk-back varies, soft band',
  },
  reward: {
    minSeconds: 30,
    maxSeconds: 90,
    toleranceSeconds: 15,
    soft: true,
    skip: false,
    source: 'Soft accessory (KB silent)',
  },
  conditioning: {
    minSeconds: 0,
    maxSeconds: 0,
    toleranceSeconds: 0,
    soft: false,
    skip: true,
    source: 'Protocol-specific (EMOM/Tabata/AMRAP) — out of scope',
  },
  unknown: {
    minSeconds: 0,
    maxSeconds: 0,
    toleranceSeconds: 0,
    soft: false,
    skip: true,
    source: 'Intent inference failed — surface in audit',
  },
}

/** True if the parsed range overlaps the KB range (with tolerance). */
export function overlapsKb(
  parsedMin: number,
  parsedMax: number,
  intent: Intent,
): boolean {
  const kb = KB_RANGES[intent]
  if (kb.skip) return true
  const lo = kb.minSeconds - kb.toleranceSeconds
  const hi = kb.maxSeconds + kb.toleranceSeconds
  return parsedMax >= lo && parsedMin <= hi
}
