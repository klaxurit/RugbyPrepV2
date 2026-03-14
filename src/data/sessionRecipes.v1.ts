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
  | 'FULL_BUILDER_V1'
  // Conditionnement (off/pré-saison — performance 3 sessions)
  | 'COND_OFF_V1'
  | 'COND_PRE_V1'
  // Vitesse terrain dédiée (pré-saison, focus speed)
  | 'SPEED_FIELD_PRE_V1'
  // Mobilité & Récupération active
  | 'RECOVERY_MOBILITY_V1'
  // Réhab (3 phases × 2 zones)
  | 'REHAB_UPPER_P1_V1'
  | 'REHAB_UPPER_P2_V1'
  | 'REHAB_UPPER_P3_V1'
  | 'REHAB_LOWER_P1_V1'
  | 'REHAB_LOWER_P2_V1'
  | 'REHAB_LOWER_P3_V1';

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

  // ─── Starter (Niveau 1) ────────────────────────────────────────────────────

  UPPER_STARTER_V1: {
    id: 'UPPER_STARTER_V1',
    title: 'Full Body A — Débutant',
    sequence: [
      { intent: 'warmup', required: false },
      { intent: 'activation', required: true },
      { intent: 'contrast', required: false },    // explosif quand SNC frais (squat→jump, push→throw)
      { intent: 'hypertrophy', required: true },   // push-pull haut du corps
      { intent: 'hypertrophy', required: true },   // squat-hinge bas du corps
      { intent: 'core', required: false },
      { intent: 'cooldown', required: false }
    ],
    preferredTags: ['starter', 'upper', 'push', 'pull', 'lower', 'squat', 'hinge'],
    focusTagsAny: [],
    // warmup=null, activation upper, contrast lower/upper/power, upper hyper, lower hyper, core=null, cooldown=null
    slotFocusTags: [null, ['upper'], ['lower', 'upper', 'power'], ['upper'], ['lower'], null, null]
  },

  LOWER_STARTER_V1: {
    id: 'LOWER_STARTER_V1',
    title: 'Full Body B — Débutant',
    sequence: [
      { intent: 'warmup', required: false },
      { intent: 'activation', required: true },
      { intent: 'contrast', required: false },    // explosif quand SNC frais (hinge→jump, push→throw)
      { intent: 'hypertrophy', required: true },   // squat-hinge bas du corps
      { intent: 'hypertrophy', required: true },   // push-pull haut du corps
      { intent: 'core', required: false },
      { intent: 'cooldown', required: false }
    ],
    preferredTags: ['starter', 'lower', 'squat', 'hinge', 'posterior_chain', 'upper', 'push', 'pull'],
    focusTagsAny: [],
    // warmup=null, activation lower, contrast lower/upper/power, lower hyper, upper hyper, core=null, cooldown=null
    slotFocusTags: [null, ['lower'], ['lower', 'upper', 'power'], ['lower'], ['upper'], null, null]
  },

  // ─── Builder (Niveau 2 — Supersets) ──────────────────────────────────────

  UPPER_BUILDER_V1: {
    id: 'UPPER_BUILDER_V1',
    title: 'Upper — Supersets',
    sequence: [
      { intent: 'warmup', required: false },
      { intent: 'activation', required: true },
      { intent: 'contrast', required: false },    // explosif upper quand SNC frais (push→throw)
      { intent: 'hypertrophy', required: true },   // superset push/pull horizontal
      { intent: 'hypertrophy', required: true },   // superset push/pull vertical ou accessoire
      { intent: 'core', required: false },
      { intent: 'cooldown', required: false }
    ],
    preferredTags: ['builder', 'superset', 'upper', 'push', 'pull', 'hypertrophy'],
    focusTagsAny: ['upper'],
    // warmup=null, activation upper, contrast upper/power, upper push bias, upper pull bias, core/cooldown=null
    slotFocusTags: [null, ['upper'], ['upper', 'power'], ['upper', 'push', 'horizontal'], ['upper', 'pull', 'vertical', 'horizontal'], null, null]
  },

  LOWER_BUILDER_V1: {
    id: 'LOWER_BUILDER_V1',
    title: 'Lower — Supersets',
    sequence: [
      { intent: 'warmup', required: false },
      { intent: 'activation', required: true },
      { intent: 'contrast', required: false },    // explosif lower quand SNC frais (squat→jump)
      { intent: 'hypertrophy', required: true },   // superset squat / hinge
      { intent: 'hypertrophy', required: true },   // superset unilateral / posterior chain
      { intent: 'prehab', required: false },
      { intent: 'cooldown', required: false }
    ],
    preferredTags: ['builder', 'superset', 'lower', 'squat', 'hinge', 'posterior_chain', 'unilateral'],
    focusTagsAny: ['lower'],
    // warmup=null, activation lower, contrast lower/power, lower squat bias, lower hinge/unilateral bias, prehab/cooldown=null
    slotFocusTags: [null, ['lower'], ['lower', 'power'], ['lower', 'squat'], ['lower', 'hinge', 'unilateral'], null, null]
  },

  FULL_BUILDER_V1: {
    id: 'FULL_BUILDER_V1',
    title: 'Full Body — Supersets',
    sequence: [
      { intent: 'warmup', required: false },
      { intent: 'activation', required: true },
      { intent: 'contrast', required: false },    // explosif quand SNC frais (lower ou full body)
      { intent: 'hypertrophy', required: true },   // superset upper push/pull
      { intent: 'hypertrophy', required: true },   // superset lower squat/hinge
      { intent: 'core', required: false },
      { intent: 'cooldown', required: false }
    ],
    preferredTags: ['builder', 'superset', 'upper', 'lower', 'push', 'pull', 'squat', 'hinge'],
    focusTagsAny: [],
    // warmup=null, activation full body, contrast lower/power, upper, lower, core=null, cooldown=null
    slotFocusTags: [null, ['upper', 'lower'], ['lower', 'power'], ['upper'], ['lower'], null, null]
  },

  // ─── Conditionnement (off/pré-saison — performance 3 sessions/sem) ──────────

  COND_OFF_V1: {
    id: 'COND_OFF_V1',
    title: 'Conditionnement Hors-saison',
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

  // ─── Réhab Phase 1 — Protection (pas de warmup — séance très légère)

  REHAB_UPPER_P1_V1: {
    id: 'REHAB_UPPER_P1_V1',
    title: 'Réhab Épaule — Phase 1 Protection',
    sequence: [
      { intent: 'activation', required: true },
      { intent: 'prehab', required: true },
      { intent: 'core', required: false },
    ],
    preferredTags: ['rehab', 'upper', 'shoulder_health', 'pain_management'],
    slotFocusTags: [['upper'], ['upper', 'shoulder_health'], null],
  },

  REHAB_LOWER_P1_V1: {
    id: 'REHAB_LOWER_P1_V1',
    title: 'Réhab Bas du corps — Phase 1 Protection',
    sequence: [
      { intent: 'activation', required: true },
      { intent: 'prehab', required: true },
      { intent: 'core', required: true },
    ],
    preferredTags: ['rehab', 'lower', 'pain_management'],
    slotFocusTags: [['lower'], ['lower', 'knee_health', 'hip_stability'], null],
  },

  // ─── Réhab Phase 2 — Renforcement (warmup + cooldown ajoutés)

  REHAB_UPPER_P2_V1: {
    id: 'REHAB_UPPER_P2_V1',
    title: 'Réhab Épaule — Phase 2 Renforcement',
    sequence: [
      { intent: 'warmup', required: false },
      { intent: 'activation', required: true },
      { intent: 'hypertrophy', required: true },
      { intent: 'prehab', required: false },
      { intent: 'core', required: false },
      { intent: 'cooldown', required: false },
    ],
    preferredTags: ['rehab', 'upper', 'shoulder_health'],
    slotFocusTags: [null, ['upper'], ['upper'], ['upper', 'shoulder_health'], null, null],
  },

  REHAB_LOWER_P2_V1: {
    id: 'REHAB_LOWER_P2_V1',
    title: 'Réhab Bas du corps — Phase 2 Renforcement',
    sequence: [
      { intent: 'warmup', required: false },
      { intent: 'activation', required: true },
      { intent: 'hypertrophy', required: true },
      { intent: 'prehab', required: false },
      { intent: 'core', required: true },
      { intent: 'cooldown', required: false },
    ],
    preferredTags: ['rehab', 'lower', 'posterior_chain'],
    slotFocusTags: [null, ['lower'], ['lower'], ['lower', 'knee_health', 'hip_stability'], null, null],
  },

  // ─── Réhab Phase 3 — Retour sport (warmup + cooldown ajoutés)

  REHAB_UPPER_P3_V1: {
    id: 'REHAB_UPPER_P3_V1',
    title: 'Réhab Épaule — Phase 3 Retour sport',
    sequence: [
      { intent: 'warmup', required: false },
      { intent: 'activation', required: true },
      { intent: 'hypertrophy', required: true },
      { intent: 'force', required: true },
      { intent: 'contrast', required: false },
      { intent: 'cooldown', required: false },
    ],
    preferredTags: ['rehab', 'upper', 'shoulder_health'],
    slotFocusTags: [null, ['upper'], ['upper'], ['upper'], ['upper'], null],
  },

  REHAB_LOWER_P3_V1: {
    id: 'REHAB_LOWER_P3_V1',
    title: 'Réhab Bas du corps — Phase 3 Retour sport',
    sequence: [
      { intent: 'warmup', required: false },
      { intent: 'activation', required: true },
      { intent: 'hypertrophy', required: true },
      { intent: 'force', required: true },
      { intent: 'contrast', required: false },
      { intent: 'cooldown', required: false },
    ],
    preferredTags: ['rehab', 'lower', 'knee_health', 'posterior_chain'],
    slotFocusTags: [null, ['lower'], ['lower'], ['lower'], ['lower'], null],
  },
};
