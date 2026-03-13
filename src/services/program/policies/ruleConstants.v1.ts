import type { SessionRecipeId } from '../../../data/sessionRecipes.v1'

export const RULE_CONSTANTS_V1 = {
  acwr: {
    // Hulin 2016 (BJSM): 0.8–1.3 optimal, 1.3–1.5 caution, ≥1.5 danger (×2.12 risk), ≥2.0 critical
    optimalCeiling: 1.3,
    cautionThreshold: 1.3,
    dangerThreshold: 1.5,
    criticalThreshold: 2.0,
  },
  deload: {
    recipeId: 'RECOVERY_MOBILITY_V1' as SessionRecipeId,
    maxSessions: 1,
  },
  u18: {
    maxMatchMinutesPerWeek: 120,
    minHoursBetweenMatches: 72,
    maxHighContactMinutesPerWeek: 15,
    maxMediumContactMinutesPerWeek: 30,
    maxMatchesPerSeason: 30,
    // H11 (P1): U18 version cap — no W3/W4 peak progression (KB population-specific.md §2:
    // growth plates + immature tendons → avoid peak loading). Max version = W2.
    maxVersion: 'W2' as const,
  },
  // H6 — Volume caps per training level (sets of main work per session)
  // Source: KB load-budgeting.md, domain-preparation-physique-rugby-research
  volume: {
    maxSetsPerSession: {
      starter: 10,
      builder: 14,
      performance: 20,
    },
    // Tolerance: 1 set above cap is warning, 2+ is hard violation
    toleranceSets: 1,
  },
  // H5 — Female ACL prevention
  femalePrevention: {
    aclPrehabTags: ['knee_health', 'hip_stability'] as readonly string[],
  },
} as const

export type RuleConstants = typeof RULE_CONSTANTS_V1
