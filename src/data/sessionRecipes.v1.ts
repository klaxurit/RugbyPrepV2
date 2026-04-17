// src/data/sessionRecipes.v1.ts
import type { BlockIntent } from '../types/training';

export type SessionRecipeId =
  | 'UPPER_V1'
  | 'LOWER_V1'
  | 'FULL_V1'
  | 'UPPER_HYPER_V1'
  | 'LOWER_HYPER_V1'
  | 'FULL_HYPER_V1'
  | 'COND_OFF_V1'
  | 'COND_PRE_V1'
  | 'SPEED_FIELD_PRE_V1'
  | 'RECOVERY_MOBILITY_V1';

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
  // ─── Performance — Force / Puissance ────────────────────────────────────

  UPPER_V1: {
    id: 'UPPER_V1',
    title: 'Upper (rugby)',
    sequence: [
      { intent: 'warmup', required: false },
      { intent: 'activation', required: true },
      { intent: 'neural', required: false },
      { intent: 'contrast', required: true }, // ou force en fallback
      // Finisher group (engine keeps at most one for UPPER).
      { intent: 'neck', required: false },
      { intent: 'core', required: false },
      { intent: 'carry', required: false },
      { intent: 'cooldown', required: false }
    ],
    preferredTags: ['upper', 'push', 'pull', 'shoulder_health', 'contact'],
    focusTagsAny: ['upper'],
    // warmup=null, activation upper prep, neural orienté tirage, contrast orienté poussée (équilibre push/pull), neck/core/carry=null, cooldown=null
    slotFocusTags: [null, ['upper'], ['pull', 'posterior_chain'], ['push', 'push_pull'], null, null, null, null]
  },
  LOWER_V1: {
    id: 'LOWER_V1',
    title: 'Lower (rugby)',
    sequence: [
      { intent: 'warmup', required: false },
      { intent: 'activation', required: true },
      { intent: 'neural', required: false },
      { intent: 'contrast', required: true }, // bloc plyo/unilat + groin
      { intent: 'force', required: false },
      { intent: 'prehab', required: false }, // copenhagen/pallof etc
      { intent: 'core', required: false },
      { intent: 'cooldown', required: false }
    ],
    preferredTags: ['lower', 'hinge', 'squat', 'groin', 'posterior_chain'],
    focusTagsAny: ['lower'],
    // warmup=null, activation lower prep, neural lower/full, contrast orienté unilatéral/plyo, force lower squat/hinge, prehab/core/cooldown=null
    slotFocusTags: [null, ['lower'], ['lower', 'full', 'unilateral', 'acceleration'], ['unilateral', 'groin', 'plyo'], ['lower', 'squat', 'hinge', 'full'], null, null, null]
  },
  FULL_V1: {
    id: 'FULL_V1',
    title: 'Full Body (rugby)',
    sequence: [
      { intent: 'warmup', required: false },
      { intent: 'activation', required: true },
      { intent: 'neural', required: true }, // lower-dominant neural stimulus
      { intent: 'force', required: true }, // upper-dominant force stimulus
      { intent: 'core', required: false },
      { intent: 'carry', required: false },
      { intent: 'cooldown', required: false }
    ],
    preferredTags: ['full', 'power', 'posterior_chain'],
    focusTagsAny: [],
    // warmup=null, activation full body, neural lower/full, force upper/full, core=null, carry full/lower/core, cooldown=null
    slotFocusTags: [null, ['upper', 'lower'], ['lower', 'full'], ['upper', 'full'], null, ['full', 'lower', 'core'], null]
  },

  // ─── Performance — Hypertrophie ──────────────────────────────────────────

  UPPER_HYPER_V1: {
    id: 'UPPER_HYPER_V1',
    title: 'Upper Hypertrophie',
    sequence: [
      { intent: 'warmup', required: false },
      { intent: 'activation', required: true },
      { intent: 'hypertrophy', required: true }, // push/pull horizontal
      { intent: 'hypertrophy', required: true }, // push/pull vertical
      { intent: 'neck', required: false },
      { intent: 'core', required: false },
      { intent: 'cooldown', required: false }
    ],
    preferredTags: ['upper', 'push', 'pull', 'hypertrophy', 'shoulder_health'],
    focusTagsAny: ['upper'],
    // warmup=null, activation upper, upper push bias, upper pull bias, neck/core/cooldown=null
    slotFocusTags: [null, ['upper'], ['upper', 'push', 'horizontal'], ['upper', 'pull', 'vertical', 'horizontal'], null, null, null]
  },

  LOWER_HYPER_V1: {
    id: 'LOWER_HYPER_V1',
    title: 'Lower Hypertrophie',
    sequence: [
      { intent: 'warmup', required: false },
      { intent: 'activation', required: true },
      { intent: 'hypertrophy', required: true }, // squat ou hinge
      { intent: 'hypertrophy', required: true }, // hinge ou unilateral
      { intent: 'core', required: false },
      { intent: 'prehab', required: false },
      { intent: 'cooldown', required: false }
    ],
    preferredTags: ['lower', 'squat', 'hinge', 'hypertrophy', 'posterior_chain', 'unilateral'],
    focusTagsAny: ['lower'],
    // warmup=null, activation lower, lower squat bias, lower hinge/unilateral bias, core/prehab/cooldown=null
    slotFocusTags: [null, ['lower'], ['lower', 'squat'], ['lower', 'hinge', 'unilateral'], null, null, null]
  },

  FULL_HYPER_V1: {
    id: 'FULL_HYPER_V1',
    title: 'Full Body Hypertrophie',
    sequence: [
      { intent: 'warmup', required: false },
      { intent: 'activation', required: true },
      { intent: 'hypertrophy', required: true }, // upper compound
      { intent: 'hypertrophy', required: true }, // lower compound
      { intent: 'core', required: false },
      { intent: 'carry', required: false },
      { intent: 'cooldown', required: false }
    ],
    preferredTags: ['upper', 'lower', 'hypertrophy', 'push', 'pull', 'squat', 'hinge'],
    focusTagsAny: [],
    // warmup=null, activation full body, upper hyper, lower hyper, core=null, carry=null, cooldown=null
    slotFocusTags: [null, ['upper', 'lower'], ['upper'], ['lower'], null, null, null]
  },

  // ─── Conditionnement (off/pré-saison — performance 3 sessions/sem) ──────────

  COND_OFF_V1: {
    id: 'COND_OFF_V1',
    title: 'Conditionnement Inter-saison',
    sequence: [
      { intent: 'warmup', required: false },
      { intent: 'activation', required: true },
      { intent: 'conditioning', required: true },
      { intent: 'conditioning', required: false },
      { intent: 'cooldown', required: false },
    ],
    preferredTags: ['conditioning', 'aerobic', 'vo2max'],
    focusTagsAny: ['conditioning'],
    slotFocusTags: [null, ['conditioning'], null, null, null],
  },

  COND_PRE_V1: {
    id: 'COND_PRE_V1',
    title: 'Conditionnement Pré-saison',
    sequence: [
      { intent: 'warmup', required: false },
      { intent: 'activation', required: true },
      { intent: 'conditioning', required: true },
      { intent: 'conditioning', required: false },
      { intent: 'cooldown', required: false },
    ],
    preferredTags: ['conditioning', 'sprint', 'rsa', 'lactate'],
    focusTagsAny: ['conditioning'],
    slotFocusTags: [null, ['conditioning'], null, null, null],
  },

  SPEED_FIELD_PRE_V1: {
    id: 'SPEED_FIELD_PRE_V1',
    title: 'Vitesse terrain Pré-saison',
    sequence: [
      { intent: 'warmup', required: false },
      { intent: 'activation', required: true },
      { intent: 'neural', required: true },
      { intent: 'conditioning', required: true },
      { intent: 'cooldown', required: false },
    ],
    preferredTags: ['speed', 'acceleration', 'rsa', 'conditioning', 'power'],
    focusTagsAny: ['speed', 'conditioning'],
    // warmup=null, activation speed prep, neural speed/lower/full, conditioning speed/rsa/full, cooldown=null
    slotFocusTags: [null, ['speed', 'conditioning'], ['speed', 'lower', 'full'], ['speed', 'rsa', 'conditioning', 'full'], null],
  },

  // ─── Mobilité & Récupération active (pas de warmup/cooldown — session 100% mobilité)

  RECOVERY_MOBILITY_V1: {
    id: 'RECOVERY_MOBILITY_V1',
    title: 'Mobilité & Récupération Active',
    sequence: [
      { intent: 'mobility', required: true },
      { intent: 'mobility', required: true },
    ],
    preferredTags: ['hip', 'thoracic', 'mobility', 'recovery'],
    focusTagsAny: ['mobility'],
  },

};
