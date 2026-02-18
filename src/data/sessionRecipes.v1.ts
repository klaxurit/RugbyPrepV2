// src/data/sessionRecipes.v1.ts
import type { BlockIntent } from '../types/training';

export type SessionRecipeId = 'UPPER_V1' | 'LOWER_V1' | 'FULL_V1';

export interface SessionRecipe {
  id: SessionRecipeId;
  title: string;
  sequence: Array<{
    intent: BlockIntent;
    required: boolean;
  }>;
  // tags souhaités pour orienter la sélection sans IA
  preferredTags: string[];
  // tags de focus pour éviter la sélection de blocs hors contexte
  focusTagsAny?: string[];
}

export const sessionRecipesV1: Record<SessionRecipeId, SessionRecipe> = {
  UPPER_V1: {
    id: 'UPPER_V1',
    title: 'Upper (rugby)',
    sequence: [
      { intent: 'activation', required: true },
      { intent: 'neural', required: false },
      { intent: 'contrast', required: true }, // ou force en fallback
      // Finisher group (engine keeps at most one for UPPER).
      { intent: 'neck', required: false },
      { intent: 'core', required: false },
      { intent: 'carry', required: false }
    ],
    preferredTags: ['upper', 'push', 'pull', 'shoulder_health', 'contact'],
    focusTagsAny: ['upper']
  },
  LOWER_V1: {
    id: 'LOWER_V1',
    title: 'Lower (rugby)',
    sequence: [
      { intent: 'activation', required: true },
      { intent: 'neural', required: false },
      { intent: 'contrast', required: true }, // bloc plyo/unilat + groin
      { intent: 'force', required: false },
      { intent: 'prehab', required: false }, // copenhagen/pallof etc
      { intent: 'core', required: false }
    ],
    preferredTags: ['lower', 'hinge', 'squat', 'groin', 'posterior_chain'],
    focusTagsAny: ['lower']
  },
  FULL_V1: {
    id: 'FULL_V1',
    title: 'Full Body (rugby)',
    sequence: [
      { intent: 'activation', required: true },
      { intent: 'neural', required: true },
      { intent: 'force', required: true },
      { intent: 'core', required: false },
      { intent: 'carry', required: false }
    ],
    preferredTags: ['full', 'power', 'posterior_chain'],
    focusTagsAny: []
  }
};
