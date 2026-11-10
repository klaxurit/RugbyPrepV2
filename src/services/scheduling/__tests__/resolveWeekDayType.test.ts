import { describe, expect, it } from 'vitest'
import { resolveWeekDayType } from '../resolveWeekDayType'

const base = {
  hasMatch: false,
  hasPlannedGym: false,
  hasGymLogOnDate: false,
  activeRecoveryDone: false,
  activeRecoveryEligible: false,
  isClubDay: false,
  isUnavailable: false,
}

describe('resolveWeekDayType', () => {
  it('un log gym du jour prime sur la récup éligible', () => {
    expect(
      resolveWeekDayType({
        ...base,
        hasGymLogOnDate: true,
        activeRecoveryEligible: true,
      }),
    ).toBe('gym')
  })

  it('récup si éligible sans gym', () => {
    expect(
      resolveWeekDayType({
        ...base,
        activeRecoveryEligible: true,
      }),
    ).toBe('recovery')
  })

  it('match prime sur tout', () => {
    expect(
      resolveWeekDayType({
        ...base,
        hasMatch: true,
        hasGymLogOnDate: true,
      }),
    ).toBe('match')
  })
})
