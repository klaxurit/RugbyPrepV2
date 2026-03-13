import blocksData from '../../data/blocks.v1.json';
import {
  type SessionRecipeId,
  sessionRecipesV1
} from '../../data/sessionRecipes.v1';
import type {
  CycleWeek,
  MicrocycleArchetypeId,
  ProgramPhase,
  QualityScorecard,
  TrainingBlock,
  UserProfile
} from '../../types/training';
import { buildSessionFromRecipe, type BuiltSession } from './buildSessionFromRecipe';
import { resolveProgramFeatureFlags, type ProgramFeatureFlags } from './policies/featureFlags';
import { normalizeProfileInput } from './policies/normalizeProfile';
import { resolvePopulationContext } from './policies/populationRules';
import { RULE_CONSTANTS_V1 } from './policies/ruleConstants.v1';
import { applySafetyContracts } from './policies/safetyContracts';
import { validateSession } from './validateSession';
import { getBaseWeekVersion, getPhaseForWeek, getSessionPhase, PHASE_PREFERENCES } from './programPhases.v1';
import { getIntensityPreferences, getWeekIntensityPattern } from './sessionIntensity';
import { buildSessionIdentity, resolveMicrocycleArchetype } from './resolveMicrocycleArchetype';
import { evaluateQualityGates, type QualityGateResult } from './qualityGates';
import { buildQualityScorecard } from './qualityScorecard';
import { selectEligibleBlocks } from './selectEligibleBlocks';

/**
 * Periodization model (KB periodization.md §4.2 + §2.2):
 *
 * In-season (performance): DUP — each session within a week targets a different quality:
 *   Session 0 (LOWER): Force max (4×4-5 @ 85-90%, heavy)
 *   Session 1 (UPPER): Puissance (5×3 @ 70-75%, medium, contrast/neural)
 *   Session 2 (FULL):  Maintenance (3×10-12 @ 60-65%, light, hypertrophy volume)
 *
 * Off-season: Block periodization — H1-H4 hypertrophy → W1-W4 force → W5-W8 power
 * Pre-season: Force → Power conversion
 *
 * Starter/Builder: No DUP (consistent moderate load, per KB beginner-programming).
 */

// Ordre rugby S&C : LOWER en début de semaine (heavy, loin du match),
// UPPER au milieu (medium), FULL en fin (light/neural, proche du match).
const recipeIdsByPhase: Record<ProgramPhase, Record<UserProfile['weeklySessions'], SessionRecipeId[]>> = {
  FORCE: {
    2: ['LOWER_V1', 'UPPER_V1'],
    3: ['LOWER_V1', 'UPPER_V1', 'FULL_V1']
  },
  POWER: {
    2: ['LOWER_V1', 'UPPER_V1'],
    3: ['LOWER_V1', 'UPPER_V1', 'FULL_V1']
  },
  HYPERTROPHY: {
    2: ['LOWER_HYPER_V1', 'UPPER_HYPER_V1'],
    3: ['LOWER_HYPER_V1', 'UPPER_HYPER_V1', 'FULL_HYPER_V1']
  }
};

// Starter : toujours 2 sessions Full Body, avec dominante lower en début de semaine.
const STARTER_RECIPE_IDS: SessionRecipeId[] = ['LOWER_STARTER_V1', 'UPPER_STARTER_V1'];

// Builder : LOWER d'abord (heavy, loin du match), UPPER puis FULL
const BUILDER_RECIPE_IDS: Record<UserProfile['weeklySessions'], SessionRecipeId[]> = {
  2: ['LOWER_BUILDER_V1', 'UPPER_BUILDER_V1'],
  3: ['LOWER_BUILDER_V1', 'UPPER_BUILDER_V1', 'FULL_BUILDER_V1']
};

// Intents dont les blocs doivent être exclus des sessions suivantes
// (évite qu'Upper, Lower et Full Body partagent les mêmes blocs de travail ou de core)
const CROSS_SESSION_EXCLUSION_INTENTS: TrainingBlock['intent'][] = [
  'hypertrophy', 'force', 'contrast', 'neural', 'core'
];

export type FatigueLevel = 'underload' | 'optimal' | 'caution' | 'danger' | 'critical'

export interface WeekProgramResult {
  week: CycleWeek;
  sessions: BuiltSession[];
  warnings: string[];
  hardConstraintEvents: string[];
  qualityGateEvents: string[];
  selectedArchetypeId: MicrocycleArchetypeId;
  qualityScorecard?: QualityScorecard;
}

const allBlocks = blocksData as TrainingBlock[];
const VALID_WEEKS: CycleWeek[] = ['H1', 'H2', 'H3', 'H4', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'DELOAD'];

interface BuildWeekProgramOptions {
  fatigueLevel?: FatigueLevel
  hasSufficientACWRData?: boolean
  ignoreAcwrOverload?: boolean
  featureFlags?: Partial<ProgramFeatureFlags>
}

// F-04: Derive phase from recipe category for DELOAD scoring alignment.
// HYPER recipes → HYPERTROPHY phase prefs, COND_PRE → POWER, BUILDER → FORCE (neutral),
// else → FORCE. Builder uses same FORCE prefs as normal (their blocks are phase-agnostic).
const derivePhaseFromRecipe = (recipeId: SessionRecipeId): ProgramPhase => {
  if (recipeId.includes('HYPER')) return 'HYPERTROPHY';
  if (recipeId === 'COND_PRE_V1' || recipeId === 'SPEED_FIELD_PRE_V1') return 'POWER';
  return 'FORCE';
};

const EMPTY_GATE_RESULT: QualityGateResult = {
  events: [],
  warnings: [],
  invalidSessionIndexes: [],
  requiredSlotsTotal: 0,
  requiredSlotsSatisfied: 0,
  degradedSessions: 0,
};

export const buildWeekProgram = (
  profileInput: UserProfile,
  week: CycleWeek,
  options?: BuildWeekProgramOptions
): WeekProgramResult => {
  if (!VALID_WEEKS.includes(week)) {
    throw new Error(`Invalid cycle week '${String(week)}'.`);
  }

  const profile = normalizeProfileInput(profileInput);
  const warnings: string[] = [];
  const hardConstraintEvents: string[] = [];
  const qualityGateEvents: string[] = [];
  const featureFlags = resolveProgramFeatureFlags(options?.featureFlags);
  const population = resolvePopulationContext(profile);
  const trainingLevel = profile.trainingLevel ?? 'starter';
  const rawPhase = getPhaseForWeek(week);
  const phase: ProgramPhase = rawPhase ?? 'FORCE';

  // Routing par niveau d'entraînement
  const getPerformanceRecipeIds = (): SessionRecipeId[] => {
    const n = profile.weeklySessions
    if (n === 3) {
      if (profile.seasonMode === 'off_season') return ['LOWER_HYPER_V1', 'UPPER_HYPER_V1', 'COND_OFF_V1']
      if (profile.seasonMode === 'pre_season') {
        if (profile.performanceFocus === 'speed') {
          return ['LOWER_V1', 'UPPER_V1', 'SPEED_FIELD_PRE_V1']
        }
        return ['LOWER_V1', 'UPPER_V1', 'COND_PRE_V1']
      }
    }
    return recipeIdsByPhase[phase][n]
  }

  // H1 / VC-05 — Structured deload: 1 structured session at W1 + 1 mobility session
  // KB periodization.md §5.2: "same structure, volume -40-50%". Issurin 2008: residual power 18-24d.
  // VC-05 fix: max 2 sessions in deload (was 3 with 2 identical mobility — useless duplication).
  // Gold standard terrain: deload = reduced volume, not repeated identical sessions.
  // Starter always gets mobility-only deload (not enough block variety for structured deload).
  const getDeloadRecipeIds = (): SessionRecipeId[] => {
    const mobilityId = RULE_CONSTANTS_V1.deload.recipeId;
    if (trainingLevel === 'starter') {
      return [mobilityId, mobilityId];
    }
    // Get the first recipe from normal routing as structured session
    const normalRecipes = trainingLevel === 'builder'
      ? BUILDER_RECIPE_IDS[profile.weeklySessions]
      : getPerformanceRecipeIds();
    const structuredId = normalRecipes[0]!;
    // Always 2 sessions max in deload: 1 structured + 1 mobility
    return [structuredId, mobilityId];
  };

  // H9 (P1): In-season 3:1 deload ratio (Pritchard 2015: fatigue accumulates faster during
  // competition). W3/W7/H3 become auto-deload for in-season performance profiles.
  // Off/pre-season keep 4:1 (standard block periodization). Starter/builder excluded (fixed cycles).
  const IN_SEASON_DELOAD_WEEKS = new Set<CycleWeek>(['W3', 'W7', 'H3']);
  const isInSeasonAutoDeload =
    trainingLevel === 'performance' &&
    (profile.seasonMode ?? 'in_season') === 'in_season' &&
    IN_SEASON_DELOAD_WEEKS.has(week);

  const baseRecipeIds: SessionRecipeId[] = (week === 'DELOAD' || isInSeasonAutoDeload)
    ? getDeloadRecipeIds()
    : trainingLevel === 'starter'
      ? STARTER_RECIPE_IDS
      : trainingLevel === 'builder'
        ? BUILDER_RECIPE_IDS[profile.weeklySessions]
        : getPerformanceRecipeIds();

  const isDeloadWeek = week === 'DELOAD' || isInSeasonAutoDeload;

  if (isInSeasonAutoDeload) {
    warnings.push(`Deload 3:1 in-season (${week}) : volume réduit automatiquement (Pritchard 2015).`);
    hardConstraintEvents.push(`info:in-season-3-1-deload:${week}`);
  }

  // ENH-1 — ACWR fatigue budget: adjust session count based on workload zone
  // Ne s'applique que si on a assez de données ACWR (2+ semaines)
  // ignoreAcwrOverload : le joueur choisit de garder le programme complet malgré la surcharge détectée
  const fatigueLevel = options?.fatigueLevel;
  const hasSufficientACWRData = options?.hasSufficientACWRData ?? false;
  const ignoreAcwrOverload = options?.ignoreAcwrOverload ?? false;
  const safety = applySafetyContracts({
    recipeIds: baseRecipeIds,
    profile,
    population,
    fatigueLevel,
    hasSufficientACWRData,
    ignoreAcwrOverload,
    featureFlags,
  });
  let recipeIds = safety.recipeIds;
  // F-B03 fix: Don't apply caution W1 override or caution warnings on deload weeks
  // (auto-deload 3:1 or explicit DELOAD) — the week is already volume-reduced.
  if (isDeloadWeek && safety.versionW1OverrideIndexes.length > 0) {
    // Filter out caution-specific warnings/events (already deload, no additional reduction needed)
    warnings.push(...safety.warnings.filter((w) => !w.includes('version W1')));
    hardConstraintEvents.push(...safety.events.filter((e) => e !== 'action:caution-fatigue-version-downgrade'));
  } else {
    warnings.push(...safety.warnings);
    hardConstraintEvents.push(...safety.events);
  }
  const versionW1OverrideIndexes = isDeloadWeek
    ? new Set<number>()
    : new Set(safety.versionW1OverrideIndexes);

  let selectedArchetypeId: MicrocycleArchetypeId = 'LEGACY_V1';
  let archetypeSlots: ReturnType<typeof resolveMicrocycleArchetype>['slots'] = [];
  let hasReliableMatchContext = false;

  if (
    featureFlags.microcycleArchetypesV2 ||
    featureFlags.sessionIdentityV2 ||
    featureFlags.qualityGatesV2 ||
    featureFlags.qualityScorecardV2
  ) {
    const resolvedMicrocycle = resolveMicrocycleArchetype(profile, week, recipeIds);
    selectedArchetypeId = resolvedMicrocycle.archetypeId;
    recipeIds = resolvedMicrocycle.recipeIds;
    archetypeSlots = resolvedMicrocycle.slots;
    hasReliableMatchContext = resolvedMicrocycle.hasReliableMatchContext;
  }

  // Accumule les blockIds des blocs "de travail" déjà attribués dans la semaine
  const usedMainBlockIds = new Set<string>();
  const sessions: BuiltSession[] = [];

  // P1c — Intra-week undulation: assign intensity profiles
  const intensityPattern = isDeloadWeek
    ? []
    : getWeekIntensityPattern(trainingLevel, profile.weeklySessions);
  const shouldAttachIdentity =
    featureFlags.sessionIdentityV2 ||
    featureFlags.qualityGatesV2 ||
    featureFlags.qualityScorecardV2;

  // H11: U18 version cap — precompute once before the session loop
  const VERSION_ORDER = ['W1', 'W2', 'W3', 'W4'] as const;
  const u18MaxVersion = population.isU18 ? RULE_CONSTANTS_V1.u18.maxVersion : null;
  const baseVersionForWeek = getBaseWeekVersion(week);
  const u18VersionCapped = u18MaxVersion !== null &&
    VERSION_ORDER.indexOf(baseVersionForWeek) > VERSION_ORDER.indexOf(u18MaxVersion);
  const u18CappedWeek: CycleWeek = u18VersionCapped ? u18MaxVersion! : week;
  // F-B04 fix: Only emit U18 cap warning when it actually affects the version
  // (not when deload already forces W1, which is lower than the cap)
  if (u18VersionCapped && !isDeloadWeek) {
    warnings.push(`U18 : version plafonnée à ${u18MaxVersion} (pas de progression W3/W4).`);
    hardConstraintEvents.push(`hard:u18-version-cap:${week}:${u18MaxVersion}`);
  }

  // RG-02 — Starter version cap: max W2 (KB load-budgeting.md: starter 10 sets/session cap)
  // W7 maps to W3 via getBaseWeekVersion → starters at W5/W7 get W3 block versions (4 sets/bloc),
  // producing 13 total sets > cap 10. Cap at W2 (3 sets/bloc) to respect starter volume budget.
  const STARTER_MAX_VERSION = 'W2' as const;
  const starterVersionCapped = trainingLevel === 'starter' &&
    VERSION_ORDER.indexOf(baseVersionForWeek) > VERSION_ORDER.indexOf(STARTER_MAX_VERSION);
  const starterCappedWeek: CycleWeek = starterVersionCapped ? STARTER_MAX_VERSION : week;
  if (starterVersionCapped && !isDeloadWeek) {
    warnings.push(`Starter : version plafonnée à ${STARTER_MAX_VERSION} (budget volume débutant).`);
  }

  for (let sessionIndex = 0; sessionIndex < recipeIds.length; sessionIndex++) {
    const recipeId = recipeIds[sessionIndex]!;
    const intensity = intensityPattern[sessionIndex];
    const intensityPrefs = intensity ? getIntensityPreferences(intensity) : undefined;

    // DUP: per-session phase preferences (KB periodization.md §2.2)
    // In-season performance: session 0→FORCE, session 1→POWER, session 2→HYPERTROPHY
    // Off/pre-season: all sessions share the week-level phase (block periodization)
    // F-04 fix: DELOAD phase preferences derive from the structured recipe's category,
    // not from getSessionPhase() which falls back to FORCE for DELOAD week.
    const sessionPhase = isDeloadWeek
      ? derivePhaseFromRecipe(recipeId)
      : getSessionPhase(sessionIndex, week, profile.seasonMode, trainingLevel, profile.weeklySessions);
    const sessionPhasePrefs = PHASE_PREFERENCES[sessionPhase];

    // H12: ACWR caution → force W1 version on overridden sessions (reduced volume/intensity)
    // H9: in-season auto-deload also uses W1 version
    // H11: U18 version cap — max W2 (no peak progression W3/W4)
    let effectiveWeek: CycleWeek;
    if (isDeloadWeek || versionW1OverrideIndexes.has(sessionIndex)) {
      effectiveWeek = 'W1';
    } else if (u18VersionCapped) {
      effectiveWeek = u18CappedWeek;
    } else if (starterVersionCapped) {
      effectiveWeek = starterCappedWeek;
    } else {
      effectiveWeek = week;
    }

    const session = buildSessionFromRecipe(
      profile,
      allBlocks,
      sessionRecipesV1[recipeId]!,
      effectiveWeek,
      {
        excludedBlockIds: new Set(usedMainBlockIds),
        intensity,
        priorityIntents: intensityPrefs?.priorityIntents,
        intensityPreferTags: intensityPrefs?.preferTags,
        intensityAvoidTags: intensityPrefs?.avoidTags,
        phasePreferencesOverride: sessionPhasePrefs,
      }
    );

    if (shouldAttachIdentity) {
      const slot = archetypeSlots[sessionIndex] ?? {
        sessionRole: recipeId.startsWith('LOWER_')
          ? 'lower_strength'
          : recipeId.startsWith('UPPER_')
            ? 'upper_strength'
            : recipeId.startsWith('REHAB_')
              ? 'rehab'
              : recipeId === 'RECOVERY_MOBILITY_V1'
                ? 'recovery'
                : recipeId.startsWith('COND_')
                  ? 'conditioning'
                  : 'full_neural',
        matchDayOffset: 'UNKNOWN' as const,
      };
      session.identity = buildSessionIdentity(
        selectedArchetypeId,
        slot,
        intensity
      );
    }

    // Enregistrer les blocs de travail pour les sessions suivantes.
    // Pour Starter : la variété vient de l'inversion des slots (A: upper→lower, B: lower→upper),
    // pas de blocs différents. Avec 1 seul bloc BW par catégorie, l'exclusion viderait la session B.
    if (trainingLevel !== 'starter') {
      for (const { block } of session.blocks) {
        if (CROSS_SESSION_EXCLUSION_INTENTS.includes(block.intent)) {
          usedMainBlockIds.add(block.blockId);
        }
      }
    }

    const validation = validateSession(session);
    if (!validation.isValid) {
      warnings.push(`${recipeId}: ${validation.warnings.join(' ')}`);
    }
    sessions.push(session);
  }

  // RG-01 — UX guard: hollow UPPER_STARTER sessions → replace with recovery mobility.
  // S5 case: starter + BW_ONLY + shoulder_pain → all upper slots safety-adapted (no upper BW
  // exercises are shoulder-safe at starter level). Displaying "Séance Upper" with zero upper work
  // is misleading UX. Replace with RECOVERY_MOBILITY_V1 which is honest and clinically coherent.
  {
    const UPPER_WORK_INTENTS = new Set(['activation', 'hypertrophy', 'neural', 'force', 'contrast']);
    for (let i = 0; i < sessions.length; i++) {
      const s = sessions[i]!;
      if (s.recipeId !== 'UPPER_STARTER_V1' || !s.isSafetyAdapted) continue;
      const hasRealUpperWork = s.blocks.some(
        (b) => UPPER_WORK_INTENTS.has(b.block.intent) && b.block.tags.includes('upper')
      );
      if (!hasRealUpperWork) {
        const replacement = buildSessionFromRecipe(
          profile,
          allBlocks,
          sessionRecipesV1.RECOVERY_MOBILITY_V1,
          week === 'DELOAD' ? 'W1' : week
        );
        replacement.warnings.push(
          "Séance Upper adaptée : remplacée par récupération mobilité (aucun exercice upper compatible avec les blessures et l'équipement disponible)."
        );
        if (shouldAttachIdentity) {
          replacement.identity = buildSessionIdentity(
            'DELOAD_RECOVERY',
            { sessionRole: 'recovery', matchDayOffset: 'UNKNOWN' },
            undefined
          );
        }
        sessions[i] = replacement;
        warnings.push('RG-01 : UPPER_STARTER_V1 vide → remplacée par RECOVERY_MOBILITY_V1 (shoulder_pain + BW_ONLY).');
      }
    }
  }

  // H5 / VC-01 — ACL prevention for ALL female profiles (KB population-specific.md §1, Hewett 2005)
  // Require a dedicated ACL prevention block (hip_stability tag) — hamstring prehab alone is NOT
  // equivalent (different mechanism: landing mechanics + single-leg stability vs posterior chain).
  // Covers female_senior AND u18_female (U18 females = highest ACL risk population).
  const isFemale = population.segment === 'female_senior' || population.segment === 'u18_female';
  if (isFemale && !isDeloadWeek) {
    const hasAclPrehab = sessions.some((session) =>
      session.blocks.some((b) =>
        b.block.intent === 'prehab' && b.block.tags.includes('hip_stability')
      )
    );
    if (!hasAclPrehab) {
      const eligibleBlocks = selectEligibleBlocks(profile, allBlocks);
      const aclBlock = eligibleBlocks.find(
        (b) => b.intent === 'prehab' && b.tags.includes('hip_stability')
      );
      if (aclBlock && sessions.length > 0) {
        // Respect version caps (U18 + starter) when selecting the prehab block version
        const effectiveAclWeek: CycleWeek = u18VersionCapped
          ? u18CappedWeek
          : starterVersionCapped
            ? starterCappedWeek
            : week;
        const versionId = getBaseWeekVersion(effectiveAclWeek);
        const version = aclBlock.versions.find((v) => v.versionId === versionId);
        if (version) {
          // Insert before first finisher/cooldown for correct session ordering (F-08)
          const FINISHER_INTENTS = new Set(['neck', 'core', 'carry', 'cooldown']);
          const insertIndex = sessions[0]!.blocks.findIndex((b) => FINISHER_INTENTS.has(b.block.intent));
          if (insertIndex >= 0) {
            sessions[0]!.blocks.splice(insertIndex, 0, { block: aclBlock, version });
          } else {
            sessions[0]!.blocks.push({ block: aclBlock, version });
          }
          warnings.push('Prévention ACL : bloc prehab genou/hanche ajouté (profil féminin).');
        }
      }
    }
  }

  // H6 — Volume budget: always-on, independent of qualityGatesV2
  // Checks actual sets against caps and emits events/warnings
  //
  // DESIGN DECISION — prehab excluded from volume count (FP1-01, 2026-03-13):
  // KB population-specific.md §1.3/§2: prehab blocks are medical prevention (not training load).
  // Excluding them from volume count prevents ACL prehab injection from pushing U18/female
  // sessions above the starter cap (10 sets) or performance cap (20 sets) at peak weeks.
  // Keep in sync with VOLUME_INTENTS constant in waveA.test.ts.
  //
  // KNOWN LIMIT: If future prehab blocks accumulate large sets (>4-5 sets), the quality gate
  // will not detect that overload. Keep prehab block sets ≤3 to maintain clinical safety.
  const VOLUME_COUNTED_INTENTS = new Set(['force', 'contrast', 'neural', 'hypertrophy', 'core', 'activation']);
  const volumeMaxSets = RULE_CONSTANTS_V1.volume.maxSetsPerSession[trainingLevel];
  const volumeTolerance = RULE_CONSTANTS_V1.volume.toleranceSets;
  sessions.forEach((session, index) => {
    if (session.recipeId === 'RECOVERY_MOBILITY_V1') return;
    const totalSets = session.blocks
      .filter((b) => VOLUME_COUNTED_INTENTS.has(b.block.intent))
      .reduce((sum, b) => sum + (b.version.sets ?? 0), 0);
    if (totalSets > volumeMaxSets + volumeTolerance) {
      qualityGateEvents.push(`quality:volume-exceeded:${session.recipeId}:${index}:${totalSets}/${volumeMaxSets}`);
      warnings.push(`${session.recipeId}: volume ${totalSets} sets dépasse le cap ${volumeMaxSets} (${trainingLevel}).`);
    }
  });

  let gateResult = EMPTY_GATE_RESULT;
  if (featureFlags.qualityGatesV2) {
    gateResult = evaluateQualityGates(profile, sessions, {
      fatigueLevel,
      enforceMatchProximity:
        featureFlags.enforceMatchProximityGateV2 && hasReliableMatchContext,
    });
    qualityGateEvents.push(...gateResult.events);
    warnings.push(...gateResult.warnings);
  }

  if (gateResult.invalidSessionIndexes.length > 0) {
    for (const index of gateResult.invalidSessionIndexes) {
      const replacement = buildSessionFromRecipe(
        profile,
        allBlocks,
        sessionRecipesV1.RECOVERY_MOBILITY_V1,
        week === 'DELOAD' ? 'W1' : week
      );
      replacement.warnings.push('Session remplacée par un fallback sécurité (quality gate).');
      if (shouldAttachIdentity) {
        const previousOffset = sessions[index]?.identity?.matchDayOffset ?? 'UNKNOWN';
        replacement.identity = buildSessionIdentity(
          'DELOAD_RECOVERY',
          { sessionRole: 'recovery', matchDayOffset: previousOffset },
          undefined
        );
      }
      sessions[index] = replacement;
    }
  }

  let qualityScorecard: QualityScorecard | undefined;
  if (featureFlags.qualityScorecardV2) {
    const scoreInput = featureFlags.qualityGatesV2
      ? gateResult
      : evaluateQualityGates(profile, sessions, {
          fatigueLevel,
          enforceMatchProximity:
            featureFlags.enforceMatchProximityGateV2 && hasReliableMatchContext,
        });
    qualityScorecard = buildQualityScorecard(
      profile,
      sessions,
      hardConstraintEvents,
      scoreInput
    );
  }

  return {
    week,
    sessions,
    warnings,
    hardConstraintEvents,
    qualityGateEvents,
    selectedArchetypeId,
    qualityScorecard,
  };
};
