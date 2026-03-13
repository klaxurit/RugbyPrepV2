import type { PerformanceFocus, SeasonMode, TrainingLevel, UserProfile } from '../../../types/training'

type UserProfileInput = UserProfile | (Partial<UserProfile> & {
  injuries?: UserProfile['injuries'] | null
  equipment?: UserProfile['equipment'] | null
  weeklySessions?: number
})

const TRAINING_LEVELS: TrainingLevel[] = ['starter', 'builder', 'performance']
const SEASON_MODES: SeasonMode[] = ['in_season', 'off_season', 'pre_season']
const PERFORMANCE_FOCUSES: PerformanceFocus[] = ['balanced', 'speed', 'strength']

const isTrainingLevel = (value: unknown): value is TrainingLevel =>
  typeof value === 'string' && TRAINING_LEVELS.includes(value as TrainingLevel)

const isSeasonMode = (value: unknown): value is SeasonMode =>
  typeof value === 'string' && SEASON_MODES.includes(value as SeasonMode)

const isPerformanceFocus = (value: unknown): value is PerformanceFocus =>
  typeof value === 'string' && PERFORMANCE_FOCUSES.includes(value as PerformanceFocus)

export const normalizeProfileInput = (profileInput: UserProfileInput): UserProfile => {
  const trainingLevel: TrainingLevel = isTrainingLevel(profileInput.trainingLevel)
    ? profileInput.trainingLevel
    : 'starter'

  const requestedSessions = profileInput.weeklySessions
  const weeklySessions = trainingLevel === 'starter'
    ? 2
    : requestedSessions === 2 || requestedSessions === 3
      ? requestedSessions
      : 2

  const injuries = Array.isArray(profileInput.injuries)
    ? profileInput.injuries
    : []
  const equipment = Array.isArray(profileInput.equipment)
    ? profileInput.equipment
    : []

  return {
    ...profileInput,
    trainingLevel,
    weeklySessions,
    injuries,
    equipment,
    level: profileInput.level === 'beginner' ? 'beginner' : 'intermediate',
    seasonMode: isSeasonMode(profileInput.seasonMode) ? profileInput.seasonMode : 'in_season',
    performanceFocus: isPerformanceFocus(profileInput.performanceFocus)
      ? profileInput.performanceFocus
      : 'balanced',
  }
}
