import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import rugbyforgeLogo from '../../assets/rugbyforge-red-full.png'
import type { AuthError } from '../../types/auth'
import { CaptchaGate, captchaIsRequired } from '../../components/auth/CaptchaGate'

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
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [medicalConsent, setMedicalConsent] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (authState.status === 'authenticated' && authState.user) {
    return <Navigate to="/program" replace />
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setIsSubmitting(true)

    if (!medicalConsent || !ageConfirmed) {
      setError('Merci d\'accepter les deux engagements ci-dessous pour continuer.')
      setIsSubmitting(false)
      return
    }

    if (captchaIsRequired && !captchaToken) {
      setError('Merci de valider le captcha pour continuer.')
      setIsSubmitting(false)
      return
    }

    const result = await signUp({
      displayName,
      email,
      password,
      medicalConsentAcceptedAt: new Date().toISOString(),
      captchaToken: captchaToken ?? undefined,
    })

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

        {/* Form */}
        <div className="space-y-4">

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="display-name" className="text-xs font-bold text-fg-soft uppercase tracking-wider">
                Prénom
              </label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full h-14 rounded-2xl border-2 border-border-app bg-layer-5 px-5 text-fg placeholder:text-fg-faint rf-focus-ring text-sm transition-colors"
                placeholder="Antoine"
                autoComplete="name"
                required
              />
            </div>

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
                placeholder="6 caractères minimum"
                autoComplete="new-password"
                required
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border-app accent-brand"
                required
              />
              <span className="text-[11px] leading-relaxed text-fg-muted">
                Je confirme avoir au moins 18 ans et j&apos;accepte les{' '}
                <Link to="/legal" className="text-brand underline">conditions d&apos;utilisation</Link>
                {' '}et la{' '}
                <Link to="/legal" className="text-brand underline">politique de confidentialite</Link>.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={medicalConsent}
                onChange={(e) => setMedicalConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border-app accent-brand"
                required
                aria-describedby="medical-consent-text"
              />
              <span id="medical-consent-text" className="text-[11px] leading-relaxed text-fg-muted">
                Je comprends que RugbyForge propose des programmes basés sur des règles générales et ne remplace pas l&apos;avis d&apos;un médecin ou d&apos;un kinésithérapeute. Je m&apos;engage à arrêter en cas de douleur.{' '}
                <Link to="/legal#disclaimer" className="text-brand underline">Lire le détail</Link>
              </span>
            </label>

            <CaptchaGate
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
            />

            {error && (
              <div className="p-3.5 bg-danger-bg border border-danger-bd rounded-2xl">
                <p className="text-xs text-danger font-medium">{error}</p>
              </div>
            )}
            {info && (
              <div className="p-3.5 bg-ok-bg-muted border border-ok-bd rounded-2xl">
                <p className="text-xs text-ok font-medium">{info}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-full bg-brand hover:bg-brand-hover text-on-brand font-bold text-sm tracking-wide transition-all active:scale-[0.98] shadow-lg shadow-brand-float disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              to="/auth/login"
              className="text-sm text-fg-soft hover:text-fg font-medium transition-colors"
            >
              Déjà un compte ?{' '}
              <span className="text-brand font-bold">Se connecter</span>
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
