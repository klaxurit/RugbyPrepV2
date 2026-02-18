import { useCallback, useEffect, useState } from 'react'
import type { UserProfile } from '../types/training'

const STORAGE_KEY = 'rugbyprep.profile.v1'

const DEFAULT_PROFILE: UserProfile = {
  level: 'intermediate',
  weeklySessions: 2,
  equipment: ['dumbbell', 'band', 'bench', 'pullup_bar'],
  injuries: [],
  position: 'BACK_ROW',
  rugbyPosition: 'BACK_ROW'
}

const isValidProfile = (value: unknown): value is UserProfile => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<UserProfile>
  return (
    (candidate.level === 'beginner' || candidate.level === 'intermediate') &&
    (candidate.weeklySessions === 2 || candidate.weeklySessions === 3) &&
    Array.isArray(candidate.equipment) &&
    Array.isArray(candidate.injuries) &&
    (candidate.position === undefined ||
      candidate.position === 'FRONT_ROW' ||
      candidate.position === 'SECOND_ROW' ||
      candidate.position === 'BACK_ROW' ||
      candidate.position === 'HALF_BACKS' ||
      candidate.position === 'CENTERS' ||
      candidate.position === 'BACK_THREE')
      &&
    (candidate.rugbyPosition === undefined ||
      candidate.rugbyPosition === 'FRONT_ROW' ||
      candidate.rugbyPosition === 'SECOND_ROW' ||
      candidate.rugbyPosition === 'BACK_ROW' ||
      candidate.rugbyPosition === 'HALF_BACKS' ||
      candidate.rugbyPosition === 'CENTERS' ||
      candidate.rugbyPosition === 'BACK_THREE') &&
    (candidate.leagueLevel === undefined || typeof candidate.leagueLevel === 'string') &&
    (candidate.clubCode === undefined || typeof candidate.clubCode === 'string') &&
    (candidate.clubName === undefined || typeof candidate.clubName === 'string') &&
    (candidate.clubLigue === undefined || typeof candidate.clubLigue === 'string') &&
    (candidate.clubDepartmentCode === undefined || typeof candidate.clubDepartmentCode === 'string')
  )
}

const readProfile = (): UserProfile => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PROFILE
    const parsed = JSON.parse(raw) as unknown
    if (!isValidProfile(parsed)) return DEFAULT_PROFILE
    return {
      ...DEFAULT_PROFILE,
      ...(parsed as Partial<UserProfile>),
      rugbyPosition:
        (parsed as Partial<UserProfile>).rugbyPosition ??
        (parsed as Partial<UserProfile>).position ??
        DEFAULT_PROFILE.rugbyPosition,
      position: (parsed as Partial<UserProfile>).position ?? DEFAULT_PROFILE.position
    }
  } catch {
    return DEFAULT_PROFILE
  }
}

export const useProfile = () => {
  const [profile, setProfileState] = useState<UserProfile>(readProfile)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [profile])

  const setProfile = useCallback((next: UserProfile) => {
    setProfileState(next)
  }, [])

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfileState((current) => ({ ...current, ...patch }))
  }, [])

  const resetProfile = useCallback(() => {
    setProfileState(DEFAULT_PROFILE)
  }, [])

  return { profile, setProfile, updateProfile, resetProfile }
}
