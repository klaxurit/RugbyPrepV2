import type {
  MatchDayOffset,
  MicrocycleArchetypeId,
  SessionRole,
} from '../types/training';

type SessionFrequency = 1 | 2 | 3;

export interface MicrocycleSlotTemplate {
  sessionRole: SessionRole;
  defaultMatchDayOffset: MatchDayOffset;
}

export interface MicrocycleArchetypeDefinition {
  id: MicrocycleArchetypeId;
  slotsByFrequency: Partial<Record<SessionFrequency, MicrocycleSlotTemplate[]>>;
}

export const MICROCYCLE_ARCHETYPES_V1: Record<
  MicrocycleArchetypeId,
  MicrocycleArchetypeDefinition
> = {
  LEGACY_V1: {
    id: 'LEGACY_V1',
    slotsByFrequency: {
      2: [
        { sessionRole: 'lower_strength', defaultMatchDayOffset: 'UNKNOWN' },
        { sessionRole: 'upper_strength', defaultMatchDayOffset: 'UNKNOWN' },
      ],
      3: [
        { sessionRole: 'lower_strength', defaultMatchDayOffset: 'UNKNOWN' },
        { sessionRole: 'upper_strength', defaultMatchDayOffset: 'UNKNOWN' },
        { sessionRole: 'full_neural', defaultMatchDayOffset: 'UNKNOWN' },
      ],
    },
  },
  IN_SEASON_2X_STD: {
    id: 'IN_SEASON_2X_STD',
    slotsByFrequency: {
      2: [
        { sessionRole: 'lower_strength', defaultMatchDayOffset: 'MD-4' },
        { sessionRole: 'upper_strength', defaultMatchDayOffset: 'MD-2' },
      ],
    },
  },
  IN_SEASON_3X_STD: {
    id: 'IN_SEASON_3X_STD',
    slotsByFrequency: {
      3: [
        { sessionRole: 'lower_strength', defaultMatchDayOffset: 'MD-4' },
        { sessionRole: 'upper_strength', defaultMatchDayOffset: 'MD-3' },
        { sessionRole: 'full_neural', defaultMatchDayOffset: 'MD-2' },
      ],
    },
  },
  DELOAD_RECOVERY: {
    id: 'DELOAD_RECOVERY',
    slotsByFrequency: {
      1: [{ sessionRole: 'recovery', defaultMatchDayOffset: 'UNKNOWN' }],
      2: [{ sessionRole: 'recovery', defaultMatchDayOffset: 'UNKNOWN' }],
      3: [{ sessionRole: 'recovery', defaultMatchDayOffset: 'UNKNOWN' }],
    },
  },
  REHAB_UPPER: {
    id: 'REHAB_UPPER',
    slotsByFrequency: {
      1: [{ sessionRole: 'rehab', defaultMatchDayOffset: 'UNKNOWN' }],
      2: [
        { sessionRole: 'rehab', defaultMatchDayOffset: 'UNKNOWN' },
        { sessionRole: 'rehab', defaultMatchDayOffset: 'UNKNOWN' },
      ],
      3: [
        { sessionRole: 'rehab', defaultMatchDayOffset: 'UNKNOWN' },
        { sessionRole: 'rehab', defaultMatchDayOffset: 'UNKNOWN' },
        { sessionRole: 'rehab', defaultMatchDayOffset: 'UNKNOWN' },
      ],
    },
  },
  REHAB_LOWER: {
    id: 'REHAB_LOWER',
    slotsByFrequency: {
      1: [{ sessionRole: 'rehab', defaultMatchDayOffset: 'UNKNOWN' }],
      2: [
        { sessionRole: 'rehab', defaultMatchDayOffset: 'UNKNOWN' },
        { sessionRole: 'rehab', defaultMatchDayOffset: 'UNKNOWN' },
      ],
      3: [
        { sessionRole: 'rehab', defaultMatchDayOffset: 'UNKNOWN' },
        { sessionRole: 'rehab', defaultMatchDayOffset: 'UNKNOWN' },
        { sessionRole: 'rehab', defaultMatchDayOffset: 'UNKNOWN' },
      ],
    },
  },
};

