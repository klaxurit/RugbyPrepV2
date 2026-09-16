import type { AthleteLevel, LeagueTier } from '../../types/gamification'
import { LEAGUE_TIER_ORDER, LEVEL_THRESHOLDS } from './scoreConstants'

export interface LevelProgress {
  level: AthleteLevel
  /** Palier suivant, ou null si l'athlète est au dernier niveau. */
  nextLevel: AthleteLevel | null
  /** XP à atteindre pour le palier suivant, ou null au dernier niveau. */
  nextLevelXp: number | null
  /** XP acquise dans le palier courant. */
  xpIntoLevel: number
  /** XP nécessaire pour traverser le palier courant, ou null au dernier. */
  xpForLevel: number | null
  /** Avancement dans le palier courant, entre 0 et 1. 1 au dernier niveau. */
  ratio: number
}

/**
 * Niveau correspondant à une XP cumulée.
 *
 * L'XP ne décroît jamais, donc un athlète ne peut pas être rétrogradé de
 * niveau — une blessure ou une coupure ne défait pas le travail accompli. La
 * pression de récurrence est portée par la ligue hebdomadaire, qui elle se
 * réinitialise.
 */
export function resolveLevel(totalXp: number): AthleteLevel {
  const xp = Number.isFinite(totalXp) ? Math.max(0, totalXp) : 0
  let resolved: AthleteLevel = LEVEL_THRESHOLDS[0].level
  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp >= threshold.minXp) resolved = threshold.level
  }
  return resolved
}

export function resolveLevelProgress(totalXp: number): LevelProgress {
  const xp = Number.isFinite(totalXp) ? Math.max(0, totalXp) : 0
  const level = resolveLevel(xp)
  const index = LEVEL_THRESHOLDS.findIndex((t) => t.level === level)
  const current = LEVEL_THRESHOLDS[index]
  const next = LEVEL_THRESHOLDS[index + 1] ?? null

  if (!next) {
    return {
      level,
      nextLevel: null,
      nextLevelXp: null,
      xpIntoLevel: xp - current.minXp,
      xpForLevel: null,
      ratio: 1,
    }
  }

  const xpForLevel = next.minXp - current.minXp
  const xpIntoLevel = xp - current.minXp

  return {
    level,
    nextLevel: next.level,
    nextLevelXp: next.minXp,
    xpIntoLevel,
    xpForLevel,
    ratio: xpForLevel > 0 ? Math.min(1, xpIntoLevel / xpForLevel) : 1,
  }
}

/** True si le passage de `previousXp` à `nextXp` franchit un palier. */
export function hasLeveledUp(previousXp: number, nextXp: number): boolean {
  return resolveLevel(previousXp) !== resolveLevel(nextXp)
}

export function promoteTier(tier: LeagueTier): LeagueTier {
  const index = LEAGUE_TIER_ORDER.indexOf(tier)
  if (index < 0) return LEAGUE_TIER_ORDER[0]
  return LEAGUE_TIER_ORDER[Math.min(index + 1, LEAGUE_TIER_ORDER.length - 1)]
}

export function relegateTier(tier: LeagueTier): LeagueTier {
  const index = LEAGUE_TIER_ORDER.indexOf(tier)
  if (index < 0) return LEAGUE_TIER_ORDER[0]
  return LEAGUE_TIER_ORDER[Math.max(index - 1, 0)]
}
