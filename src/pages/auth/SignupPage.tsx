import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import RugbyPrepLogo from '../../assets/RugbyPrepLogo.png'
import { useAuth } from '../../hooks/useAuth'
import type { AuthError } from '../../types/auth'

const authErrorLabel: Record<AuthError, string> = {
  EMAIL_EXISTS: 'Cet email existe déjà.',
  INVALID_CREDENTIALS: 'Impossible de créer le compte pour le moment.',
  WEAK_PASSWORD: 'Mot de passe trop faible (6 caractères minimum).',
  INVALID_EMAIL: 'Adresse email invalide.',
  RATE_LIMIT: 'Trop de tentatives. Attends 1 a 2 minutes puis reessaie.',
  EMAIL_CONFIRMATION_REQUIRED: 'Compte créé. Vérifie ton email pour confirmer ton inscription.',
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

    navigate('/week', { replace: true })
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 px-6 py-10">
      <main className="w-full max-w-md mx-auto min-h-[calc(100vh-5rem)] flex flex-col justify-center">
        <div className="flex flex-col items-center text-center mb-8">
          <img src={RugbyPrepLogo} alt="RugbyPrep" className="h-16 w-auto mb-3" />
          <p className="text-xs font-bold tracking-widest text-rose-600 uppercase italic">RugbyPrep</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Créer un compte</h1>
          <p className="text-xs text-slate-400 mt-1">Sauvegarde ton profil et retrouve ton plan instantanément.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="display-name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prénom</label>
            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full h-11 rounded-2xl border border-gray-200 px-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-300"
              placeholder="Antoine"
              autoComplete="name"
              required
            />
          </div>

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
              placeholder="6 caractères minimum"
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl">
              <p className="text-xs text-rose-700 font-medium">{error}</p>
            </div>
          )}
          {info && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <p className="text-xs text-emerald-700 font-medium">{info}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-rose-600 text-white text-sm font-black uppercase tracking-wide hover:bg-rose-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/auth/login" className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors">
            J&apos;ai déjà un compte
          </Link>
        </div>
      </main>
    </div>
  )
}
