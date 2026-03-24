import type {
  LevelAxisScore,
  LevelModifierProfileV1,
  LevelOnboardingAnswersV1,
  LevelSafetyCap,
  TrainingLevel,
} from '../../types/training'

const LEVEL_ORDER: Record<TrainingLevel, number> = {
  starter: 1,
  builder: 2,
  performance: 3,
}

type AxisAverage = LevelAxisScore['average']

const toAxisAverage = (total: number): AxisAverage => {
  const avg = total / 2
  if (avg === 1 || avg === 1.5 || avg === 2 || avg === 2.5 || avg === 3) {
    return avg
  }
  throw new Error(`Unexpected axis average '${avg}'.`)
}

const bandAverage = (average: AxisAverage): TrainingLevel => {
  if (average === 1) return 'starter'
  if (average === 1.5 || average === 2) return 'builder'
  return 'performance'
}

const minState = (...states: TrainingLevel[]): TrainingLevel =>
  states.reduce((lowest, current) =>
    LEVEL_ORDER[current] < LEVEL_ORDER[lowest] ? current : lowest
  )

const minAverage = (...averages: AxisAverage[]): AxisAverage =>
  averages.reduce((lowest, current) => (current < lowest ? current : lowest))

const createAxisScore = (
  average: AxisAverage,
  source: LevelAxisScore['source'],
  forcedState?: TrainingLevel
): LevelAxisScore => ({
  average,
  state: forcedState ?? bandAverage(average),
  source,
})

export interface ScoreOnboardingLevelProfileResult {
  profile: LevelModifierProfileV1
  visibleLabel: TrainingLevel
}

export const getVisibleTrainingLevelFromLevelModifierProfile = (
  profile: LevelModifierProfileV1 | null | undefined
): TrainingLevel | undefined => profile?.visibleLabel

export const scoreOnboardingLevelProfile = (
  answers: LevelOnboardingAnswersV1,
  nowIso: string
): ScoreOnboardingLevelProfileResult => {
  const safetyCaps: LevelSafetyCap[] = []

  const complexityAverage = toAxisAverage(answers.trainingAge + answers.patternConfidence)
  const volumeAverage = toAxisAverage(answers.recentConsistency + answers.recoveryCapacity)
  const explosiveAverage = toAxisAverage(answers.explosiveExposure + answers.currentPain)

  let complexityState = bandAverage(complexityAverage)
  let volumeState = bandAverage(volumeAverage)
  let explosiveState = bandAverage(explosiveAverage)

  if (answers.currentPain === 1) {
    explosiveState = 'starter'
    safetyCaps.push({
      code: 'pain_caps_explosive',
      appliedTo: ['explosive_readiness'],
      note: 'Current pain caps explosive readiness at starter for safe onboarding.',
    })
  }

  if (answers.trainingAge === 1 && answers.patternConfidence === 1) {
    complexityState = 'starter'
    safetyCaps.push({
      code: 'true_beginner_caps_complexity',
      appliedTo: ['exercise_complexity'],
      note: 'True beginner combination caps exercise complexity at starter.',
    })
  }

  if (answers.recentConsistency === 1 && answers.recoveryCapacity === 1) {
    volumeState = 'starter'
    safetyCaps.push({
      code: 'inconsistent_recovery_caps_volume',
      appliedTo: ['volume_tolerance'],
      note: 'Low recent consistency plus poor recovery caps volume tolerance at starter.',
    })
  }

  const exerciseComplexity = createAxisScore(complexityAverage, 'onboarding', complexityState)
  const volumeTolerance = createAxisScore(volumeAverage, 'onboarding', volumeState)
  const explosiveReadiness = createAxisScore(explosiveAverage, 'onboarding', explosiveState)
  const intensityTolerance = createAxisScore(
    minAverage(exerciseComplexity.average, volumeTolerance.average),
    'derived',
    minState(exerciseComplexity.state, volumeTolerance.state)
  )
  const optionalBlockTolerance = createAxisScore(
    volumeTolerance.average,
    'derived',
    volumeTolerance.state
  )

  const visibleLabel = minState(
    exerciseComplexity.state,
    volumeTolerance.state,
    explosiveReadiness.state
  )

  const profile: LevelModifierProfileV1 = {
    schemaVersion: 'v1',
    visibleLabel,
    axes: {
      exerciseComplexity,
      volumeTolerance,
      explosiveReadiness,
      intensityTolerance,
      optionalBlockTolerance,
    },
    safetyCaps,
    source: 'onboarding_only',
    scoredAt: nowIso,
  }

  return {
    profile,
    visibleLabel,
  }
}
