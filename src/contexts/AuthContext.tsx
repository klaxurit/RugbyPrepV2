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

const initialAuthState: AuthState = { status: 'anonymous', user: null }

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>(initialAuthState)

  useEffect(() => {
    let active = true

    const restoreSession = async () => {
      const sessionUser = await getSessionUser()
      if (!active) return

      if (!sessionUser) {
        setAuthState({ status: 'anonymous', user: null })
        return
      }

      setAuthState({ status: 'authenticated', user: sessionUser })
    }

    void restoreSession()

    const subscription = onAuthStateChanged((_event, session) => {
      if (!session?.user) {
        setAuthState({ status: 'anonymous', user: null })
        return
      }

      setAuthState({
        status: 'authenticated',
        user: mapSupabaseUserToAuthUser(session.user),
      })
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = useCallback<AuthContextValue['signUp']>(async (input) => {
    const result = await signUpService(input)

    if (!result.ok) return result

    setAuthState({ status: 'authenticated', user: result.value })
    return result
  }, [])

  const signIn = useCallback<AuthContextValue['signIn']>(async (input) => {
    const result = await signInService(input)

    if (!result.ok) return result

    setAuthState({ status: 'authenticated', user: result.value })
    return result
  }, [])

  const signOut = useCallback<AuthContextValue['signOut']>(async () => {
    await signOutService()
    setAuthState({ status: 'anonymous', user: null })
  }, [])

  const updateAvatar = useCallback<AuthContextValue['updateAvatar']>(async (file) => {
    const result = await updateAvatarService(file)

    if (!result.ok) return result

    setAuthState({ status: 'authenticated', user: result.value })
    return result
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ authState, signUp, signIn, signOut, updateAvatar }),
    [authState, signIn, signOut, signUp, updateAvatar],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
