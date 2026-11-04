import { useEffect, type ReactNode } from 'react'
import { ProfileContext } from './profileContextValue'
import { useProfileSource, isOnboardingComplete } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import {
  equipmentBucketFromProfile,
  syncProductPersonProperties,
} from '../services/analytics/trackProduct'

/**
 * Single shared profile state for the whole app (same pattern as CalendarProvider).
 * Without this, each `useProfile()` call owned independent state and could
 * persist DEFAULT_PROFILE to Supabase before the remote row loaded.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const value = useProfileSource()
  const { profile } = value
  const { authState } = useAuth()
  const userId =
    authState.status === 'authenticated' && authState.user
      ? authState.user.id
      : null

  useEffect(() => {
    if (!userId) return
    syncProductPersonProperties({
      onboardingComplete: isOnboardingComplete(userId),
      trainingLevel: profile.trainingLevel ?? null,
      weeklySessions: profile.weeklySessions ?? null,
      equipmentBucket: equipmentBucketFromProfile(profile.equipment),
    })
  }, [userId, profile.trainingLevel, profile.weeklySessions, profile.equipment])

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
