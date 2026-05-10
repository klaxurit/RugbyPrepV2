import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { sanitizeRequestedAppPath } from '../../services/navigation/resolveAppEntryDestination'
import rugbyforgeLogo from '../../assets/rugbyforge-red-full.png'
import type { AuthError } from '../../types/auth'
import { CaptchaGate } from '../../components/auth/CaptchaGate'
import { captchaIsRequired } from '../../components/auth/captchaConfig'

interface RedirectState {
  from?: {
    pathname?: string
    search?: string
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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectPath = useMemo(() => {
    const raw = state?.from?.pathname
      ? state.from.pathname + (state.from.search ?? '')
      : null
    return sanitizeRequestedAppPath(raw) ?? '/program'
  }, [state])

  if (authState.status === 'authenticated' && authState.user) {
    return <Navigate to={redirectPath} replace />
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (captchaIsRequired && !captchaToken) {
      setError('Merci de valider le captcha pour continuer.')
      return
    }

    setIsSubmitting(true)

    const result = await signIn({ email, password, captchaToken: captchaToken ?? undefined })

    if (!result.ok) {
      setError(authErrorLabel[result.error])
      setIsSubmitting(false)
      return
    }

    navigate(redirectPath, { replace: true })
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-app flex flex-col px-6 py-12">
      {/* Decorative dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      <main className="relative w-full max-w-md mx-auto flex flex-col flex-1 justify-center gap-10">

        {/* Logo */}
        <div className="flex flex-col items-center text-center gap-4">
          <img src={rugbyforgeLogo} alt="RugbyForge" className="h-20" />
          <p className="text-fg-muted text-xs font-bold tracking-[0.2em] uppercase">
            Préparation physique rugby
          </p>
        </div>

        {/* Form card */}
        <div className="space-y-4">

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold text-fg-soft uppercase tracking-wider">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 rounded-2xl border-2 border-border-app bg-layer-5 px-5 text-fg placeholder:text-fg-faint rf-focus-ring text-sm transition-colors"
                placeholder="toi@club.fr"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold text-fg-soft uppercase tracking-wider">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 rounded-2xl border-2 border-border-app bg-layer-5 px-5 text-fg placeholder:text-fg-faint rf-focus-ring text-sm transition-colors"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <CaptchaGate
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
            />

            {error && (
              <div className="p-3.5 bg-danger-bg border border-danger-bd rounded-2xl">
                <p className="text-xs text-danger font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-full bg-brand hover:bg-brand-hover text-on-brand font-bold text-sm tracking-wide transition-all active:scale-[0.98] shadow-lg shadow-brand-float disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div className="text-center pt-2 space-y-2">
            <Link
              to="/auth/forgot-password"
              state={email ? { email } : undefined}
              className="text-xs text-fg-faint hover:text-fg-soft transition-colors"
            >
              Mot de passe oublié ?
            </Link>
            <div>
              <Link
                to="/auth/signup"
                className="text-sm text-fg-soft hover:text-fg font-medium transition-colors"
              >
                Pas encore de compte ?{' '}
                <span className="text-brand font-bold">Créer un compte</span>
              </Link>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
