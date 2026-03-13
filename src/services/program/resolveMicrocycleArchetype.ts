import type { SessionRecipeId } from '../../data/sessionRecipes.v1';
import { MICROCYCLE_ARCHETYPES_V1 } from '../../data/microcycleArchetypes.v1';
import {
  TRAINING_DAYS_DEFAULT,
} from './scheduleOptimizer';
import type {
  DayOfWeek,
  MatchDayOffset,
  MicrocycleArchetypeId,
  SessionIdentity,
  SessionIntensity,
  SessionRole,
  UserProfile,
} from '../../types/training';

interface ResolvedSlot {
  sessionRole: SessionRole;
  matchDayOffset: MatchDayOffset;
}

export interface ResolvedMicrocyclePlan {
  archetypeId: MicrocycleArchetypeId;
  recipeIds: SessionRecipeId[];
  slots: ResolvedSlot[];
  hasReliableMatchContext: boolean;
}

const isLowerRecipe = (recipeId: SessionRecipeId): boolean =>
  recipeId.startsWith('LOWER_') || recipeId.startsWith('REHAB_LOWER_');

const isUpperRecipe = (recipeId: SessionRecipeId): boolean =>
  recipeId.startsWith('UPPER_') || recipeId.startsWith('REHAB_UPPER_');

const toSessionRole = (recipeId: SessionRecipeId): SessionRole => {
  if (recipeId.startsWith('REHAB_')) return 'rehab';
  if (recipeId === 'RECOVERY_MOBILITY_V1') return 'recovery';
  if (recipeId === 'SPEED_FIELD_PRE_V1') return 'speed_field';
  if (recipeId.startsWith('COND_')) return 'conditioning';
  if (recipeId.startsWith('LOWER_')) return 'lower_strength';
  if (recipeId.startsWith('UPPER_')) return 'upper_strength';
  if (recipeId.startsWith('FULL_')) return 'full_neural';
  return 'conditioning';
};

const takeFirst = (
  source: SessionRecipeId[],
  predicate: (recipeId: SessionRecipeId) => boolean
): SessionRecipeId | null => {
  const index = source.findIndex(predicate);
  if (index < 0) return null;
  return source.splice(index, 1)[0] ?? null;
};

const reorderInSeasonRecipes = (recipeIds: SessionRecipeId[]): SessionRecipeId[] => {
  const remaining = [...recipeIds];
  const ordered: SessionRecipeId[] = [];

  const lower = takeFirst(remaining, isLowerRecipe);
  if (lower) ordered.push(lower);

  const upper = takeFirst(remaining, isUpperRecipe);
  if (upper) ordered.push(upper);

  ordered.push(...remaining);
  return ordered;
};

const resolveArchetypeId = (
  profile: UserProfile,
  week: string,
  recipeIds: SessionRecipeId[]
): MicrocycleArchetypeId => {
  if (week === 'DELOAD') return 'DELOAD_RECOVERY';
  if (profile.rehabInjury?.zone === 'upper') return 'REHAB_UPPER';
  if (profile.rehabInjury?.zone === 'lower') return 'REHAB_LOWER';
  if (
    profile.trainingLevel === 'performance' &&
    profile.seasonMode === 'in_season'
  ) {
    return recipeIds.length >= 3 ? 'IN_SEASON_3X_STD' : 'IN_SEASON_2X_STD';
  }
  return 'LEGACY_V1';
};

const toMatchDayOffset = (daysUntilMatch: number): MatchDayOffset => {
  if (daysUntilMatch === 0) return 'MD';
  if (daysUntilMatch === 1) return 'MD-1';
  if (daysUntilMatch === 2) return 'MD-2';
  if (daysUntilMatch === 3) return 'MD-3';
  if (daysUntilMatch === 4) return 'MD-4';
  if (daysUntilMatch === 5) return 'MD-5';
  return 'MD-6';
};

const resolveSessionDay = (
  profile: UserProfile,
  sessionIndex: number
): DayOfWeek | null => {
  const mappedDay = profile.scSchedule?.sessions.find(
    (slot) => slot.sessionIndex === sessionIndex
  )?.day;
  if (mappedDay !== undefined) return mappedDay;
  const defaults = TRAINING_DAYS_DEFAULT[profile.weeklySessions];
  return defaults[sessionIndex] ?? null;
};

const resolveMatchDayOffset = (
  profile: UserProfile,
  sessionIndex: number,
  fallbackOffset: MatchDayOffset
): MatchDayOffset => {
  const matchDay = profile.clubSchedule?.matchDay;
  if (matchDay === undefined) return 'UNKNOWN';
  const sessionDay = resolveSessionDay(profile, sessionIndex);
  if (sessionDay === null) return fallbackOffset;
  const daysUntilMatch = (matchDay - sessionDay + 7) % 7;
  return toMatchDayOffset(daysUntilMatch);
};

export const resolveMicrocycleArchetype = (
  profile: UserProfile,
  week: string,
  recipeIds: SessionRecipeId[]
): ResolvedMicrocyclePlan => {
  const archetypeId = resolveArchetypeId(profile, week, recipeIds);

  const orderedRecipeIds =
    archetypeId === 'IN_SEASON_2X_STD' || archetypeId === 'IN_SEASON_3X_STD'
      ? reorderInSeasonRecipes(recipeIds)
      : [...recipeIds];

  const frequency = Math.max(
    1,
    Math.min(3, orderedRecipeIds.length)
  ) as 1 | 2 | 3;
  const templateSlots =
    MICROCYCLE_ARCHETYPES_V1[archetypeId].slotsByFrequency[frequency] ?? [];

  const slots: ResolvedSlot[] = orderedRecipeIds.map((recipeId, sessionIndex) => {
    const template = templateSlots[sessionIndex];
    const sessionRole = template?.sessionRole ?? toSessionRole(recipeId);
    const fallbackOffset = template?.defaultMatchDayOffset ?? 'UNKNOWN';
    const matchDayOffset = resolveMatchDayOffset(profile, sessionIndex, fallbackOffset);
    return { sessionRole, matchDayOffset };
  });

  return {
    archetypeId,
    recipeIds: orderedRecipeIds,
    slots,
    hasReliableMatchContext: slots.some((slot) => slot.matchDayOffset !== 'UNKNOWN'),
  };
};

const resolveSessionIntensity = (
  role: SessionRole,
  intensity: SessionIntensity | undefined
): SessionIdentity['sessionIntensity'] => {
  if (intensity) return intensity;
  if (role === 'recovery' || role === 'rehab') return 'recovery';
  if (role === 'full_neural') return 'light';
  if (role === 'conditioning' || role === 'speed_field') return 'medium';
  return 'medium';
};

const getObjectiveLabel = (role: SessionRole): string => {
  if (role === 'lower_strength') return 'Renforcer le bas du corps';
  if (role === 'upper_strength') return 'Renforcer le haut du corps';
  if (role === 'full_neural') return 'Stimuler puissance et coordination';
  if (role === 'conditioning') return 'Développer la capacité de conditionnement';
  if (role === 'speed_field') return 'Travailler vitesse et accélération terrain';
  if (role === 'rehab') return 'Progression de réathlétisation';
  return 'Récupération active et mobilité';
};

const getWhyTodayLabel = (matchDayOffset: MatchDayOffset): string => {
  if (matchDayOffset === 'MD-1') return 'Veille de match: séance allégée obligatoire.';
  if (matchDayOffset === 'MD-2') return 'Deux jours avant match: qualité technique et fraîcheur.';
  if (matchDayOffset === 'MD-3' || matchDayOffset === 'MD-4') {
    return 'Fenêtre adaptée pour stimulus principal.';
  }
  if (matchDayOffset === 'MD') return 'Jour de match: éviter toute charge additionnelle.';
  return 'Positionnée selon le microcycle hebdomadaire.';
};

export const buildSessionIdentity = (
  archetypeId: MicrocycleArchetypeId,
  slot: ResolvedSlot,
  intensity: SessionIntensity | undefined
): SessionIdentity => ({
  archetypeId,
  sessionRole: slot.sessionRole,
  sessionIntensity: resolveSessionIntensity(slot.sessionRole, intensity),
  matchDayOffset: slot.matchDayOffset,
  objectiveLabel: getObjectiveLabel(slot.sessionRole),
  whyTodayLabel: getWhyTodayLabel(slot.matchDayOffset),
});
