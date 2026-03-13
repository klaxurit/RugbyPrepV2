import type { AgeBand, PopulationSegment, UserProfile } from '../../../types/training'

export interface PopulationContext {
  segment: PopulationSegment
  ageBand: AgeBand
  isU18: boolean
}

const SEGMENTS: PopulationSegment[] = [
  'male_senior',
  'female_senior',
  'u18_female',
  'u18_male',
  'unknown',
]

const isPopulationSegment = (value: unknown): value is PopulationSegment =>
  typeof value === 'string' && SEGMENTS.includes(value as PopulationSegment)

const resolveAgeBand = (profile: UserProfile, segment: PopulationSegment): AgeBand => {
  if (profile.ageBand === 'u18' || profile.ageBand === 'adult') return profile.ageBand
  if (segment === 'u18_female' || segment === 'u18_male') return 'u18'
  return 'adult'
}

export const resolvePopulationContext = (profile: UserProfile): PopulationContext => {
  const segment = isPopulationSegment(profile.populationSegment)
    ? profile.populationSegment
    : 'unknown'
  const ageBand = resolveAgeBand(profile, segment)
  return {
    segment,
    ageBand,
    isU18: ageBand === 'u18',
  }
}
