import type { RugbyPositionGroup, UserProfile } from '../../types/training';

export type PositionPreferences = {
  preferIntents: Record<string, number>;
  requiredIntents: string[];
};

const POSITION_PREFERENCES: Record<RugbyPositionGroup, PositionPreferences> = {
  FRONT_ROW: {
    preferIntents: {
      neck: 1.35,
      carry: 1.25,
      force: 1.2,
      prehab: 1.15,
      core: 1.1
    },
    requiredIntents: ['neck', 'carry']
  },
  SECOND_ROW: {
    preferIntents: {
      force: 1.25,
      contrast: 1.2,
      core: 1.1,
      carry: 1.1
    },
    requiredIntents: ['force']
  },
  BACK_ROW: {
    preferIntents: {
      contrast: 1.2,
      neural: 1.15,
      carry: 1.2,
      core: 1.15,
      prehab: 1.15
    },
    requiredIntents: ['core']
  },
  HALF_BACKS: {
    preferIntents: {
      neural: 1.2,
      contrast: 1.15,
      prehab: 1.2,
      core: 1.1
    },
    requiredIntents: ['prehab']
  },
  CENTERS: {
    preferIntents: {
      contrast: 1.2,
      force: 1.15,
      neck: 1.2,
      core: 1.1,
      carry: 1.15
    },
    requiredIntents: ['neck']
  },
  BACK_THREE: {
    preferIntents: {
      neural: 1.2,
      contrast: 1.15,
      core: 1.1,
      carry: 1.1,
      prehab: 1.15
    },
    requiredIntents: ['core']
  }
};

export const getPositionPreferences = (
  position?: UserProfile['position']
): PositionPreferences => POSITION_PREFERENCES[position ?? 'BACK_ROW'];
