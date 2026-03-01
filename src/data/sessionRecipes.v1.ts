// src/data/sessionRecipes.v1.ts
import type { BlockIntent } from '../types/training';

export type SessionRecipeId =
  | 'UPPER_V1'
  | 'LOWER_V1'
  | 'FULL_V1'
  | 'UPPER_HYPER_V1'
  | 'LOWER_HYPER_V1'
  | 'FULL_HYPER_V1'
  // Starter (Niveau 1 — poids du corps / élastiques / haltères légers)
  | 'UPPER_STARTER_V1'
  | 'LOWER_STARTER_V1'
  // Builder (Niveau 2 — supersets haltères / barre)
  | 'UPPER_BUILDER_V1'
  | 'LOWER_BUILDER_V1'
  | 'FULL_BUILDER_V1';

export interface SessionRecipe {
  id: SessionRecipeId;
  title: string;
  sequence: Array<{
    intent: BlockIntent;
    required: boolean;
  }>;
  // tags souhaités pour orienter la sélection sans IA
  preferredTags: string[];
  // tags de focus globaux pour éviter la sélection de blocs hors contexte
  focusTagsAny?: string[];
  // tags de focus par slot (override focusTagsAny pour ce slot précis, null = pas de filtre)
  slotFocusTags?: (string[] | null)[];
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
  },

  UPPER_HYPER_V1: {
    id: 'UPPER_HYPER_V1',
    title: 'Upper Hypertrophie',
    sequence: [
      { intent: 'activation', required: true },
      { intent: 'hypertrophy', required: true }, // push/pull horizontal
      { intent: 'hypertrophy', required: true }, // push/pull vertical
      { intent: 'neck', required: false },
      { intent: 'core', required: false }
    ],
    preferredTags: ['upper', 'push', 'pull', 'hypertrophy', 'shoulder_health'],
    focusTagsAny: ['upper']
  },

  LOWER_HYPER_V1: {
    id: 'LOWER_HYPER_V1',
    title: 'Lower Hypertrophie',
    sequence: [
      { intent: 'activation', required: true },
      { intent: 'hypertrophy', required: true }, // squat ou hinge
      { intent: 'hypertrophy', required: true }, // hinge ou unilateral
      { intent: 'core', required: false },
      { intent: 'prehab', required: false }
    ],
    preferredTags: ['lower', 'squat', 'hinge', 'hypertrophy', 'posterior_chain', 'unilateral'],
    focusTagsAny: ['lower']
  },

  FULL_HYPER_V1: {
    id: 'FULL_HYPER_V1',
    title: 'Full Body Hypertrophie',
    sequence: [
      { intent: 'activation', required: true },
      { intent: 'hypertrophy', required: true }, // upper compound
      { intent: 'hypertrophy', required: true }, // lower compound
      { intent: 'core', required: false },
      { intent: 'carry', required: false }
    ],
    preferredTags: ['upper', 'lower', 'hypertrophy', 'push', 'pull', 'squat', 'hinge'],
    focusTagsAny: []
  },

  // ─── Starter (Niveau 1) ────────────────────────────────────────────────────

  UPPER_STARTER_V1: {
    id: 'UPPER_STARTER_V1',
    title: 'Full Body A — Débutant',
    sequence: [
      { intent: 'activation', required: true },
      { intent: 'hypertrophy', required: true }, // push-pull haut du corps
      { intent: 'hypertrophy', required: true }, // squat-hinge bas du corps
      { intent: 'core', required: false }
    ],
    preferredTags: ['starter', 'upper', 'push', 'pull', 'lower', 'squat', 'hinge'],
    focusTagsAny: [],
    // Slot 0=activation (no filter), slot 1=upper focus, slot 2=lower focus, slot 3=core (no filter)
    slotFocusTags: [null, ['upper'], ['lower'], null]
  },

  LOWER_STARTER_V1: {
    id: 'LOWER_STARTER_V1',
    title: 'Full Body B — Débutant',
    sequence: [
      { intent: 'activation', required: true },
      { intent: 'hypertrophy', required: true }, // squat-hinge bas du corps
      { intent: 'hypertrophy', required: true }, // push-pull haut du corps
      { intent: 'core', required: false }
    ],
    preferredTags: ['starter', 'lower', 'squat', 'hinge', 'posterior_chain', 'upper', 'push', 'pull'],
    focusTagsAny: [],
    // Slot 0=activation (no filter), slot 1=lower focus, slot 2=upper focus, slot 3=core (no filter)
    slotFocusTags: [null, ['lower'], ['upper'], null]
  },

  // ─── Builder (Niveau 2 — Supersets) ──────────────────────────────────────

  UPPER_BUILDER_V1: {
    id: 'UPPER_BUILDER_V1',
    title: 'Upper — Supersets',
    sequence: [
      { intent: 'activation', required: true },
      { intent: 'hypertrophy', required: true }, // superset push/pull horizontal
      { intent: 'hypertrophy', required: true }, // superset push/pull vertical ou accessoire
      { intent: 'core', required: false }
    ],
    preferredTags: ['builder', 'superset', 'upper', 'push', 'pull', 'hypertrophy'],
    focusTagsAny: ['upper']
  },

  LOWER_BUILDER_V1: {
    id: 'LOWER_BUILDER_V1',
    title: 'Lower — Supersets',
    sequence: [
      { intent: 'activation', required: true },
      { intent: 'hypertrophy', required: true }, // superset squat / hinge
      { intent: 'hypertrophy', required: true }, // superset unilateral / posterior chain
      { intent: 'prehab', required: false }
    ],
    preferredTags: ['builder', 'superset', 'lower', 'squat', 'hinge', 'posterior_chain', 'unilateral'],
    focusTagsAny: ['lower']
  },

  FULL_BUILDER_V1: {
    id: 'FULL_BUILDER_V1',
    title: 'Full Body — Supersets',
    sequence: [
      { intent: 'activation', required: true },
      { intent: 'hypertrophy', required: true }, // superset upper push/pull
      { intent: 'hypertrophy', required: true }, // superset lower squat/hinge
      { intent: 'core', required: false }
    ],
    preferredTags: ['builder', 'superset', 'upper', 'lower', 'push', 'pull', 'squat', 'hinge'],
    focusTagsAny: []
  }
};
