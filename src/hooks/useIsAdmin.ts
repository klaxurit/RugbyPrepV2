import { useMemo } from 'react'
import { isAdminEmail } from '../config/admin'
import { useAuth } from './useAuth'

export function useIsAdmin(): boolean {
  const { authState } = useAuth()
  return useMemo(() => {
    if (authState.status !== 'authenticated' || !authState.user) return false
    return isAdminEmail(authState.user.email)
  }, [authState])
}
