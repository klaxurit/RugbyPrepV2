import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AuthState } from '../types/auth'
import type { AuthContextValue } from './authContextValue'
import {
  getSessionUser,
  mapSupabaseUserToAuthUser,
  onAuthStateChanged,
  signIn as signInService,
  signOut as signOutService,
  signUp as signUpService,
  updateAvatar as updateAvatarService,
} from '../services/auth/authService'
import { AuthContext } from './authContextValue'
import { posthog } from '../services/analytics/posthog'
import { clearLegacyUserStorage, clearUserStorage, clearUserStorageForUser } from '../services/storage/clearUserStorage'
import { shouldClearUserStorageOnAuthChange } from '../services/storage/syncUserStoragePolicy'

const initialAuthState: AuthState = { status: 'anonymous', user: null }

/**
 * Tracks the userId of the currently "hydrated" session. When the auth state
 * transitions to a different userId (logout, signup of another account, session
 * restored with a different user), we must wipe user-scoped local state before
 * rendering — otherwise cached data from the previous user bleeds into the new
 * session's initial paint.
 */
const LAST_USER_ID_KEY = 'rugbyprep.auth.lastUserId'

function readLastUserId(): string | null {
  try {
    return localStorage.getItem(LAST_USER_ID_KEY)
  } catch {
    return null
  }
}

function writeLastUserId(userId: string | null): void {
  try {
    if (userId) localStorage.setItem(LAST_USER_ID_KEY, userId)
    else localStorage.removeItem(LAST_USER_ID_KEY)
  } catch { /* ignore */ }
}

/** Wipes previous user's local cache when switching accounts (not the incoming user). */
function syncUserStorage(newUserId: string | null): void {
  const lastUserId = readLastUserId()
  if (shouldClearUserStorageOnAuthChange(lastUserId, newUserId)) {
    if (lastUserId) clearUserStorageForUser(lastUserId)
    clearLegacyUserStorage()
  }
  writeLastUserId(newUserId)
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let active = true

    const restoreSession = async () => {
      const sessionUser = await getSessionUser()
      if (!active) return

      syncUserStorage(sessionUser?.id ?? null)
      if (!sessionUser) {
        setAuthState({ status: 'anonymous', user: null })
      } else {
        setAuthState({ status: 'authenticated', user: sessionUser })
      }
      setIsInitializing(false)
    }

    void restoreSession()

    const subscription = onAuthStateChanged((_event, session) => {
      const newUserId = session?.user?.id ?? null
      syncUserStorage(newUserId)
      if (!session?.user) {
        setAuthState({ status: 'anonymous', user: null })
      } else {
        setAuthState({
          status: 'authenticated',
          user: mapSupabaseUserToAuthUser(session.user),
        })
      }
      setIsInitializing(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = useCallback<AuthContextValue['signUp']>(async (input) => {
    // Wipe any residual local state before creating a new account, so the first
    // paint after authentication never flashes data from a previously logged-in user.
    clearUserStorage()
    const result = await signUpService(input)

    if (!result.ok) return result

    writeLastUserId(result.value.id)
    setAuthState({ status: 'authenticated', user: result.value })
    posthog.identify(result.value.id)
    posthog.capture('signup_completed')
    return result
  }, [])

  const signIn = useCallback<AuthContextValue['signIn']>(async (input) => {
    const result = await signInService(input)

    if (!result.ok) return result

    syncUserStorage(result.value.id)
    setAuthState({ status: 'authenticated', user: result.value })
    posthog.identify(result.value.id)
    return result
  }, [])

  const signOut = useCallback<AuthContextValue['signOut']>(async () => {
    const signingOutUserId =
      authState.status === 'authenticated' ? authState.user?.id ?? null : readLastUserId()
    await signOutService()
    if (signingOutUserId) clearUserStorageForUser(signingOutUserId)
    clearUserStorageForUser(null)
    clearLegacyUserStorage()
    writeLastUserId(null)
    setAuthState({ status: 'anonymous', user: null })
    posthog.reset()
  }, [authState])

  const updateAvatar = useCallback<AuthContextValue['updateAvatar']>(async (file) => {
    const result = await updateAvatarService(file)

    if (!result.ok) return result

    setAuthState({ status: 'authenticated', user: result.value })
    return result
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ authState, isInitializing, signUp, signIn, signOut, updateAvatar }),
    [authState, isInitializing, signIn, signOut, signUp, updateAvatar],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
