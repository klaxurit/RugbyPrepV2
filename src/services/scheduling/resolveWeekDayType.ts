/**
 * Type de jour dans le planner semaine — affichage uniquement.
 * Un log gym du jour prime sur la récup éligible (1re séance le jour J).
 */

export type WeekPlannerDayType =
  | 'rest'
  | 'gym'
  | 'recovery'
  | 'match'
  | 'club'
  | 'unavailable'

export function resolveWeekDayType(input: {
  hasMatch: boolean
  hasPlannedGym: boolean
  hasGymLogOnDate: boolean
  activeRecoveryDone: boolean
  activeRecoveryEligible: boolean
  isClubDay: boolean
  isUnavailable: boolean
}): WeekPlannerDayType {
  if (input.hasMatch) return 'match'
  if (input.hasPlannedGym || input.hasGymLogOnDate) return 'gym'
  if (input.activeRecoveryDone || input.activeRecoveryEligible) return 'recovery'
  if (input.isClubDay) return 'club'
  if (input.isUnavailable) return 'unavailable'
  return 'rest'
}

export function isGymSessionLogType(sessionType: string | null | undefined): boolean {
  return sessionType !== 'ACTIVE_RECOVERY' && sessionType !== 'RECOVERY'
}
