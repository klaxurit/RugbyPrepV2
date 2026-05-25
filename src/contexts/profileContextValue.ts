import { createContext, useContext } from 'react'
import type { useProfileSource } from '../hooks/useProfile'
import { DEFAULT_PROFILE } from '../hooks/useProfile'

/** Inferred from the source hook — keeps a single source of truth. */
export type ProfileContextValue = ReturnType<typeof useProfileSource>

const noop = () => undefined

/**
 * Fallback for integration tests that render pages without ProfileProvider.
 * In production App.tsx always mounts ProfileProvider.
 */
const EMPTY_PROFILE: ProfileContextValue = {
  profile: DEFAULT_PROFILE,
  setProfile: noop,
  updateProfile: noop,
  resetProfile: noop,
}

export const ProfileContext = createContext<ProfileContextValue | null>(null)

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext)
  return ctx ?? EMPTY_PROFILE
}
