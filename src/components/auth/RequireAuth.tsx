import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function RequireAuth() {
  const { authState } = useAuth()
  const location = useLocation()

  if (authState.status === 'anonymous' || !authState.user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
