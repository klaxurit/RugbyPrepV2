import type { ReactNode } from 'react'
import { ProfileContext } from './profileContextValue'
import { useProfileSource } from '../hooks/useProfile'

/**
 * Single shared profile state for the whole app (same pattern as CalendarProvider).
 * Without this, each `useProfile()` call owned independent state and could
 * persist DEFAULT_PROFILE to Supabase before the remote row loaded.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const value = useProfileSource()
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
