import type { TrainingBlock } from '../../../types/training'
import { getEmomDisplay } from '../formatTraining'

const buildBlock = (exoCount: number): Pick<TrainingBlock, 'exercises'> => ({
  exercises: Array.from({ length: exoCount }).map((_, index) => ({
    exerciseId: `ex_${index}`,
    role: 'prime' as const
  }))
})

const buildVersion = (minutes: number) => ({
  versionId: 'W1' as const,
  sets: 1,
  scheme: { kind: 'emom' as const, minutes },
  restSeconds: 0,
  rer: 3
})

export const emomDisplayCheck = () => {
  const single = getEmomDisplay(buildBlock(1), buildVersion(6))
  const twoExos = getEmomDisplay(buildBlock(2), buildVersion(6))
  const threeExos = getEmomDisplay(buildBlock(3), buildVersion(8))

  return {
    singleLabel: single?.label,
    twoLabel: twoExos?.label,
    threeLabel: threeExos?.label,
    checks: {
      singleOk: !!single?.label && !single.label.includes('alterne'),
      twoOk: !!twoExos?.label && twoExos.label.includes('alterne 2 exos') && twoExos.label.includes('3 tours'),
      threeOk: !!threeExos?.label && threeExos.label.includes('~2 tours')
    }
  }
}
