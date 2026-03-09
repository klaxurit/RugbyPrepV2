import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { WeekProvider } from '../../contexts/WeekProvider'
import { useAuth } from '../../hooks/useAuth'
import { isOnboardingComplete } from '../../hooks/useProfile'

export function RequireAuth() {
  const { authState, isInitializing } = useAuth()
  const location = useLocation()

  // Pendant la restauration de session, ne pas rediriger trop vite
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1a5f3f] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (authState.status === 'anonymous' || !authState.user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  const userId = authState.user.id

  if (!isOnboardingComplete(userId) && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <WeekProvider>
      <Outlet />
    </WeekProvider>
  )
}
