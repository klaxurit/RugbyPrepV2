// src/services/program/sessionIntensity.ts
//
// P1c — Intra-week undulation: assign an intensity profile to each session
// position within the week. This drives block scoring biases and priority
// intent ordering so that sessions within the same week feel distinct.

import type { BlockIntent, SessionIntensity, TrainingLevel } from '../../types/training';

export interface IntensityPreferences {
  /** Tags that boost block scoring for this intensity */
  preferTags: string[];
  /** Tags that penalise block scoring for this intensity */
  avoidTags: string[];
  /** Intents tried first when the primary intent can't be filled */
  priorityIntents: BlockIntent[];
}

// ── Intensity preferences ─────────────────────────────────────────

const HEAVY_PREFS: IntensityPreferences = {
  preferTags: ['force', 'power', 'contrast', 'contact', 'squat', 'hinge', 'olympic_variant'],
  avoidTags: ['prehab', 'recovery', 'mobility'],
  priorityIntents: ['force', 'contrast'],
};

const MEDIUM_PREFS: IntensityPreferences = {
  preferTags: ['hypertrophy', 'superset', 'push', 'pull', 'unilateral', 'posterior_chain'],
  avoidTags: [],
  priorityIntents: ['hypertrophy'],
};

const LIGHT_PREFS: IntensityPreferences = {
  preferTags: ['neural', 'speed', 'plyo', 'activation', 'prehab', 'injury_prevention'],
  avoidTags: ['force'],
  priorityIntents: ['neural', 'prehab'],
};

export const INTENSITY_PREFERENCES: Record<SessionIntensity, IntensityPreferences> = {
  heavy: HEAVY_PREFS,
  medium: MEDIUM_PREFS,
  light: LIGHT_PREFS,
};

// ── Session intensity patterns by week shape ─────────────────────

type IntensityPattern = SessionIntensity[];

const PATTERNS: Record<TrainingLevel, Record<2 | 3, IntensityPattern>> = {
  // Starter: never heavy — beginners benefit from consistent moderate load
  starter: {
    2: ['medium', 'medium'],
    3: ['medium', 'medium', 'light'], // starter is always 2, but guard
  },
  // Builder: introduce undulation with medium/light (no heavy — superset focus)
  builder: {
    2: ['medium', 'light'],
    3: ['medium', 'medium', 'light'],
  },
  // Performance: full undulation
  performance: {
    2: ['heavy', 'medium'],
    3: ['heavy', 'medium', 'light'],
  },
};

/**
 * Returns the intensity profile for each session position in the week.
 * The returned array length matches the number of recipes/sessions.
 */
export const getWeekIntensityPattern = (
  trainingLevel: TrainingLevel,
  weeklySessions: 2 | 3
): IntensityPattern => {
  return PATTERNS[trainingLevel][weeklySessions];
};

/**
 * Returns the intensity preferences (prefer/avoid tags, priority intents)
 * for a given session intensity.
 */
export const getIntensityPreferences = (intensity: SessionIntensity): IntensityPreferences => {
  return INTENSITY_PREFERENCES[intensity];
};
