import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { isOnboardingComplete } from '../../hooks/useProfile'

/**
 * Page de callback après confirmation d'email Supabase.
 * Le client Supabase échange automatiquement le ?code= contre une session.
 * On attend que l'AuthContext soit prêt puis on route vers la bonne page.
 */
export function CallbackPage() {
  const { authState, isInitializing } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isInitializing) return

    if (authState.status === 'authenticated' && authState.user) {
      const dest = isOnboardingComplete(authState.user.id) ? '/week' : '/onboarding'
      navigate(dest, { replace: true })
      return
    }

    // Pas de session après l'init → confirmation invalide ou expirée
    navigate('/auth/login', { replace: true })
  }, [authState, isInitializing, navigate])

  return (
    <div className="min-h-screen bg-[#faf9f7] font-sans flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-2 border-[#1a5f3f] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-bold text-slate-400">Confirmation en cours…</p>
    </div>
  )
}
