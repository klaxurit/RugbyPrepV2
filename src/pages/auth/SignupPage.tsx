import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { RugbyForgeLogo } from '../../components/RugbyForgeLogo'
import type { AuthError } from '../../types/auth'

const authErrorLabel: Record<AuthError, string> = {
  EMAIL_EXISTS: 'Cet email existe déjà.',
  INVALID_CREDENTIALS: 'Impossible de créer le compte pour le moment.',
  WEAK_PASSWORD: 'Mot de passe trop faible (6 caractères minimum).',
  INVALID_EMAIL: 'Adresse email invalide.',
  RATE_LIMIT: 'Trop de tentatives. Attends 1 à 2 minutes puis réessaie.',
  EMAIL_CONFIRMATION_REQUIRED: 'Compte créé ! Vérifie ton email pour confirmer ton inscription.',
  INVALID_FILE_TYPE: 'Format de fichier invalide.',
  FILE_TOO_LARGE: 'Fichier trop volumineux.',
  UPLOAD_FAILED: 'Upload impossible.',
}

export function SignupPage() {
  const { authState, signUp } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (authState.status === 'authenticated' && authState.user) {
    return <Navigate to="/week" replace />
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setIsSubmitting(true)

    const result = await signUp({ displayName, email, password })

    if (!result.ok) {
      if (result.error === 'EMAIL_CONFIRMATION_REQUIRED') {
        setInfo(authErrorLabel[result.error])
        setDisplayName('')
        setEmail('')
        setPassword('')
        setIsSubmitting(false)
        return
      }

      setError(authErrorLabel[result.error])
      setIsSubmitting(false)
      return
    }

    navigate('/onboarding', { replace: true })
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

        {/* Form */}
        <div className="space-y-4">
          <p className="text-white text-xl font-bold text-center">Créer un compte</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="display-name" className="text-xs font-bold text-white/50 uppercase tracking-wider">
                Prénom
              </label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-14 rounded-2xl border-2 border-white/10 bg-white/5 px-5 text-white placeholder:text-white/25 focus:outline-none focus:border-[#ff6b35] text-sm transition-colors"
                placeholder="Antoine"
                autoComplete="name"
                required
              />
            </div>

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
                placeholder="6 caractères minimum"
                autoComplete="new-password"
                required
              />
            </div>

            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <p className="text-xs text-rose-400 font-medium">{error}</p>
              </div>
            )}
            {info && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <p className="text-xs text-emerald-400 font-medium">{info}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-full bg-[#ff6b35] hover:bg-[#e55a2b] text-white font-bold text-sm tracking-wide transition-all active:scale-[0.98] shadow-lg shadow-[#ff6b35]/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              to="/auth/login"
              className="text-sm text-white/50 hover:text-white font-medium transition-colors"
            >
              Déjà un compte ?{' '}
              <span className="text-[#ff6b35] font-bold">Se connecter</span>
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
