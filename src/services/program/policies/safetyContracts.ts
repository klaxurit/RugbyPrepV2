import type { SessionRecipeId } from '../../../data/sessionRecipes.v1'
import type { RehabInjury, UserProfile } from '../../../types/training'
import type { ProgramFeatureFlags } from './featureFlags'
import type { PopulationContext } from './populationRules'
import { RULE_CONSTANTS_V1 } from './ruleConstants.v1'

type FatigueLevel = 'underload' | 'optimal' | 'caution' | 'danger' | 'critical'

export interface ApplySafetyContractsInput {
  recipeIds: SessionRecipeId[]
  profile: UserProfile
  population: PopulationContext
  fatigueLevel?: FatigueLevel
  hasSufficientACWRData: boolean
  ignoreAcwrOverload: boolean
  featureFlags: ProgramFeatureFlags
}

export interface ApplySafetyContractsOutput {
  recipeIds: SessionRecipeId[]
  warnings: string[]
  events: string[]
  /** H12: Index of session(s) that should be downgraded to version W1 (ACWR caution) */
  versionW1OverrideIndexes: number[]
}

const UPPER_RECIPE_IDS: SessionRecipeId[] = [
  'UPPER_V1',
  'UPPER_HYPER_V1',
  'UPPER_BUILDER_V1',
  'UPPER_STARTER_V1',
]

const LOWER_RECIPE_IDS: SessionRecipeId[] = [
  'LOWER_V1',
  'LOWER_HYPER_V1',
  'LOWER_BUILDER_V1',
  'LOWER_STARTER_V1',
]

const FULL_OR_COND_RECIPE_IDS = new Set<SessionRecipeId>([
  'FULL_V1',
  'FULL_HYPER_V1',
  'FULL_BUILDER_V1',
  'COND_OFF_V1',
  'COND_PRE_V1',
])

const asRehabRecipeId = (rehab: RehabInjury): SessionRecipeId =>
  `REHAB_${rehab.zone.toUpperCase()}_P${rehab.phase}_V1` as SessionRecipeId

const applyRehabRouting = (
  recipeIds: SessionRecipeId[],
  rehabInjury?: RehabInjury
): SessionRecipeId[] => {
  if (!rehabInjury) return recipeIds
  const rehabId = asRehabRecipeId(rehabInjury)
  const zoneTargets = rehabInjury.zone === 'upper' ? UPPER_RECIPE_IDS : LOWER_RECIPE_IDS
  return recipeIds.map((id) =>
    zoneTargets.includes(id) || FULL_OR_COND_RECIPE_IDS.has(id) ? rehabId : id
  )
}

const hoursBetween = (a?: string, b?: string): number | null => {
  if (!a || !b) return null
  const start = Date.parse(a)
  const end = Date.parse(b)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  return Math.abs(end - start) / (1000 * 60 * 60)
}

const applyU18HardCaps = (
  recipeIds: SessionRecipeId[],
  profile: UserProfile,
  population: PopulationContext
): { recipeIds: SessionRecipeId[]; events: string[] } => {
  if (!population.isU18) return { recipeIds, events: [] }

  const events: string[] = []
  const load = profile.weeklyLoadContext
  const fallback = [RULE_CONSTANTS_V1.deload.recipeId] as SessionRecipeId[]

  if (profile.parentalConsentHealthData === false) {
    events.push('hard:u18-parental-consent-missing')
    return { recipeIds: fallback, events }
  }

  if (!load) return { recipeIds, events }

  const totalMatchMinutes = (load.playedMatchMinutesWeek ?? 0) + (load.scheduledMatchMinutes ?? 0)
  if (totalMatchMinutes > RULE_CONSTANTS_V1.u18.maxMatchMinutesPerWeek) {
    events.push('hard:u18-max-match-minutes')
    return { recipeIds: fallback, events }
  }

  if ((load.contactHighMinutesWeek ?? 0) > RULE_CONSTANTS_V1.u18.maxHighContactMinutesPerWeek) {
    events.push('hard:u18-max-high-contact')
    return { recipeIds: fallback, events }
  }

  if ((load.contactMediumMinutesWeek ?? 0) > RULE_CONSTANTS_V1.u18.maxMediumContactMinutesPerWeek) {
    events.push('hard:u18-max-medium-contact')
    return { recipeIds: fallback, events }
  }

  if ((load.matchesPlayedSeason ?? 0) > RULE_CONSTANTS_V1.u18.maxMatchesPerSeason) {
    events.push('hard:u18-max-season-matches')
    return { recipeIds: fallback, events }
  }

  const matchGapHours = hoursBetween(load.lastMatchAt, load.nextMatchAt)
  if (
    matchGapHours !== null &&
    matchGapHours < RULE_CONSTANTS_V1.u18.minHoursBetweenMatches
  ) {
    events.push('hard:u18-min-recovery-between-matches')
    return { recipeIds: fallback, events }
  }

  return { recipeIds, events }
}

export const applySafetyContracts = ({
  recipeIds: initialRecipeIds,
  profile,
  population,
  fatigueLevel,
  hasSufficientACWRData,
  ignoreAcwrOverload,
  featureFlags,
}: ApplySafetyContractsInput): ApplySafetyContractsOutput => {
  const warnings: string[] = []
  const events: string[] = []
  const versionW1OverrideIndexes: number[] = []

  let recipeIds = initialRecipeIds

  if (featureFlags.safetyContractsV1 && profile.rehabInjury) {
    recipeIds = applyRehabRouting(recipeIds, profile.rehabInjury)
  }

  if (
    featureFlags.populationProfileV1 &&
    featureFlags.u18HardCapsV1
  ) {
    const guarded = applyU18HardCaps(recipeIds, profile, population)
    recipeIds = guarded.recipeIds
    events.push(...guarded.events)
    if (guarded.events.length > 0) {
      warnings.push('Contraintes U18 actives: la semaine a été réduite pour sécurité.')
    }
  }

  if (
    featureFlags.safetyContractsV1 &&
    !ignoreAcwrOverload &&
    hasSufficientACWRData &&
    fatigueLevel === 'critical' &&
    recipeIds.length > 1
  ) {
    if (profile.rehabInjury) {
      const rehabId = asRehabRecipeId(profile.rehabInjury)
      recipeIds = [recipeIds.find((id) => id === rehabId) ?? rehabId]
      warnings.push('ACWR critique + rehab : programme réduit à 1 séance rehab-compatible.')
      events.push('hard:critical-fatigue-rehab-priority')
    } else {
      recipeIds = recipeIds.slice(0, 1)
      warnings.push('ACWR critique : programme réduit à 1 séance. Récupération prioritaire.')
      events.push('hard:critical-fatigue-reduction')
    }
  } else if (
    featureFlags.safetyContractsV1 &&
    !ignoreAcwrOverload &&
    hasSufficientACWRData &&
    fatigueLevel === 'danger' &&
    recipeIds.length > 1
  ) {
    recipeIds = [...recipeIds.slice(0, recipeIds.length - 1), RULE_CONSTANTS_V1.deload.recipeId]
    warnings.push('ACWR surcharge : dernière séance remplacée par mobilité.')
    events.push('hard:danger-fatigue-mobility')
  } else if (
    featureFlags.safetyContractsV1 &&
    !ignoreAcwrOverload &&
    hasSufficientACWRData &&
    fatigueLevel === 'caution'
  ) {
    // H12 (P1): ACWR caution (1.3–1.5) — reduce volume on last session via W1 version override.
    // KB load-budgeting.md §2: caution = "reduce training load magnitude" (not replace session).
    // W1 = lowest progression version → effectively -20-30% volume vs current week version.
    // Distinct from danger (session replaced by mobility) and critical (programme reduced to 1).
    if (recipeIds.length > 1) {
      versionW1OverrideIndexes.push(recipeIds.length - 1)
      warnings.push('ACWR vigilance : volume réduit sur la dernière séance (version W1).')
      events.push('action:caution-fatigue-version-downgrade')
    } else {
      warnings.push('ACWR vigilance : surveille ta récupération, réduis l\'intensité si fatigue.')
      events.push('info:caution-fatigue-warning')
    }
  }

  return { recipeIds, warnings, events, versionW1OverrideIndexes }
}
