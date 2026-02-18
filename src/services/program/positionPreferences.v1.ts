import type { UserProfile } from '../../types/training'

export type RugbyPosition =
  | 'FRONT_ROW'
  | 'SECOND_ROW'
  | 'BACK_ROW'
  | 'HALF_BACKS'
  | 'CENTERS'
  | 'BACK_THREE'

export interface PositionPreferences {
  preferTags: string[]
  avoidTags?: string[]
}

export const POSITION_PREFERENCES: Record<RugbyPosition, PositionPreferences> = {
  FRONT_ROW: {
    preferTags: ['scrum', 'neck', 'contact', 'carry', 'hinge', 'posterior_chain'],
    avoidTags: ['speed']
  },
  SECOND_ROW: {
    preferTags: ['carry', 'hinge', 'posterior_chain', 'power', 'contact', 'trunk']
  },
  BACK_ROW: {
    preferTags: ['power', 'unilateral', 'conditioning', 'carry', 'contact']
  },
  HALF_BACKS: {
    preferTags: ['speed', 'unilateral', 'trunk', 'shoulder_health'],
    avoidTags: ['heavy_scrum']
  },
  CENTERS: {
    preferTags: ['power', 'contact', 'acceleration', 'trunk']
  },
  BACK_THREE: {
    preferTags: ['speed', 'acceleration', 'unilateral', 'posterior_chain'],
    avoidTags: ['scrum']
  }
}

const DEFAULT_POSITION: RugbyPosition = 'BACK_ROW'

export const getPositionPreferences = (profile: UserProfile): PositionPreferences => {
  const position = profile.rugbyPosition ?? profile.position ?? DEFAULT_POSITION
  return POSITION_PREFERENCES[position] ?? POSITION_PREFERENCES[DEFAULT_POSITION]
}
