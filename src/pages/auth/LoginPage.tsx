import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import RugbyPrepLogo from '../../assets/RugbyPrepLogo.png'
import { useAuth } from '../../hooks/useAuth'
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
  RATE_LIMIT: 'Trop de tentatives. Attends 1 a 2 minutes puis reessaie.',
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
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 px-6 py-10">
      <main className="w-full max-w-md mx-auto min-h-[calc(100vh-5rem)] flex flex-col justify-center">
        <div className="flex flex-col items-center text-center mb-8">
          <img src={RugbyPrepLogo} alt="RugbyPrep" className="h-16 w-auto mb-3" />
          <p className="text-xs font-bold tracking-widest text-rose-600 uppercase italic">RugbyPrep</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Se connecter</h1>
          <p className="text-xs text-slate-400 mt-1">Accède à ton plan hebdo en quelques secondes.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full h-11 rounded-2xl border border-gray-200 px-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-300"
              placeholder="toi@club.fr"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full h-11 rounded-2xl border border-gray-200 px-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-300"
              placeholder="••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl">
              <p className="text-xs text-rose-700 font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-rose-600 text-white text-sm font-black uppercase tracking-wide hover:bg-rose-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Connexion...' : 'Connexion'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/auth/signup" className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors">
            Créer un compte
          </Link>
        </div>
      </main>
    </div>
  )
}
