import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { RugbyForgeLogo } from '../../components/RugbyForgeLogo'
import type { AuthError } from '../../types/auth'

interface RedirectState {
  from?: {
    pathname?: string
  }
}

const authErrorLabel: Record<AuthError, string> = {
  EMAIL_EXISTS: 'Cet email existe déjà.',
  INVALID_CREDENTIALS: 'Email ou mot de passe invalide.',
  WEAK_PASSWORD: 'Mot de passe trop faible (6 caractères minimum).',
  INVALID_EMAIL: 'Adresse email invalide.',
  RATE_LIMIT: 'Trop de tentatives. Attends 1 à 2 minutes puis réessaie.',
  INVALID_FILE_TYPE: 'Format de fichier invalide.',
  FILE_TOO_LARGE: 'Fichier trop volumineux.',
  UPLOAD_FAILED: 'Upload impossible.',
  EMAIL_CONFIRMATION_REQUIRED: 'Confirme ton email avant de te connecter.',
}

export function LoginPage() {
  const { authState, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as RedirectState | null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectPath = useMemo(() => state?.from?.pathname || '/week', [state])

  if (authState.status === 'authenticated' && authState.user) {
    return <Navigate to={redirectPath} replace />
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = await signIn({ email, password })

    if (!result.ok) {
      setError(authErrorLabel[result.error])
      setIsSubmitting(false)
      return
    }

    navigate(redirectPath, { replace: true })
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-[#1a100c] flex flex-col px-6 py-12">
      {/* Decorative dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#ff6b35_1px,transparent_1px)] [background-size:20px_20px]" />

      <main className="relative w-full max-w-md mx-auto flex flex-col flex-1 justify-center gap-10">

        {/* Wordmark */}
        <div className="flex flex-col items-center text-center gap-3">
          <RugbyForgeLogo size="hero" />
          <p className="text-white/40 text-xs font-bold tracking-[0.2em] uppercase">
            Préparation physique rugby
          </p>
        </div>

        {/* Form card */}
        <div className="space-y-4">

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold text-white/50 uppercase tracking-wider">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 rounded-2xl border-2 border-white/10 bg-white/5 px-5 text-white placeholder:text-white/25 focus:outline-none focus:border-[#ff6b35] text-sm transition-colors"
                placeholder="toi@club.fr"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold text-white/50 uppercase tracking-wider">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 rounded-2xl border-2 border-white/10 bg-white/5 px-5 text-white placeholder:text-white/25 focus:outline-none focus:border-[#ff6b35] text-sm transition-colors"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <p className="text-xs text-rose-400 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-full bg-[#ff6b35] hover:bg-[#e55a2b] text-white font-bold text-sm tracking-wide transition-all active:scale-[0.98] shadow-lg shadow-[#ff6b35]/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              to="/auth/signup"
              className="text-sm text-white/50 hover:text-white font-medium transition-colors"
            >
              Pas encore de compte ?{' '}
              <span className="text-[#ff6b35] font-bold">Créer un compte</span>
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
