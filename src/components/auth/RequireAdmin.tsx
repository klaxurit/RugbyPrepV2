import { Navigate, Outlet } from 'react-router-dom'
import { useIsAdmin } from '../../hooks/useIsAdmin'
import { useAuth } from '../../hooks/useAuth'

export function RequireAdmin() {
  const { authState, isInitializing } = useAuth()
  const isAdmin = useIsAdmin()

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (authState.status !== 'authenticated' || !authState.user) {
    return <Navigate to="/auth/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}
