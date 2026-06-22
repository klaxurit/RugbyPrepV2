import { Navigate, Outlet } from 'react-router-dom'
import { useStaffCoachAccess } from '../../hooks/useStaffCoachAccess'
import { useAuth } from '../../hooks/useAuth'

export function RequireStaffCoach() {
  const { authState, isInitializing } = useAuth()
  const { loading, isStaffCoach } = useStaffCoachAccess()

  if (isInitializing || loading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (authState.status !== 'authenticated' || !authState.user) {
    return <Navigate to="/auth/login" replace />
  }

  if (!isStaffCoach) {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}
