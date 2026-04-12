import { Link } from 'react-router-dom'
import { useState } from 'react'
import rugbyforgeLogo from '../../assets/rugbyforge-red-full.png'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../services/supabase/client'

const MIN_PASSWORD_LENGTH = 6

const resolvePasswordError = (message: string): string => {
  const normalized = message.toLowerCase()

  if (normalized.includes('same password')) {
    return 'Choisis un mot de passe différent de l’ancien.'
  }

  if (normalized.includes('password')) {
    return 'Mot de passe invalide. Utilise au moins 6 caractères.'
  }

  return 'Impossible de mettre à jour le mot de passe pour le moment.'
}

export function ResetPasswordPage() {
  const { authState, isInitializing } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const isAuthenticated = authState.status === 'authenticated' && authState.user

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError('Mot de passe trop faible (6 caractères minimum).')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(resolvePasswordError(updateError.message))
      setIsSubmitting(false)
      return
    }

    setPassword('')
    setConfirmPassword('')
    setIsSubmitting(false)
    setIsSuccess(true)
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-app font-sans flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-fg-muted">Vérification du lien…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-app flex flex-col px-6 py-12">
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

        <main className="relative w-full max-w-md mx-auto flex flex-col flex-1 justify-center gap-10">
          <div className="flex flex-col items-center text-center gap-4">
            <img src={rugbyforgeLogo} alt="RugbyForge" className="h-20" />
            <p className="text-fg-muted text-xs font-bold tracking-[0.2em] uppercase">
              Réinitialisation du mot de passe
            </p>
          </div>

          <div className="space-y-4 text-center">
            <div className="p-4 bg-danger-bg border border-danger-bd rounded-2xl">
              <p className="text-sm font-medium text-danger">
                Ce lien de réinitialisation est invalide ou expiré.
              </p>
            </div>

            <Link
              to="/auth/login"
              className="inline-flex items-center justify-center w-full h-14 rounded-full bg-brand hover:bg-brand-hover text-on-brand font-bold text-sm tracking-wide transition-all active:scale-[0.98] shadow-lg shadow-brand-float"
            >
              Retour à la connexion
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-app flex flex-col px-6 py-12">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      <main className="relative w-full max-w-md mx-auto flex flex-col flex-1 justify-center gap-10">
        <div className="flex flex-col items-center text-center gap-4">
          <img src={rugbyforgeLogo} alt="RugbyForge" className="h-20" />
          <p className="text-fg-muted text-xs font-bold tracking-[0.2em] uppercase">
            Nouveau mot de passe
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-4">
            <div className="p-4 bg-ok-bg-muted border border-ok-bd rounded-2xl">
              <p className="text-sm font-medium text-ok">
                Mot de passe mis à jour. Tu peux continuer dans l&apos;application.
              </p>
            </div>

            <Link
              to="/program"
              className="inline-flex items-center justify-center w-full h-14 rounded-full bg-brand hover:bg-brand-hover text-on-brand font-bold text-sm tracking-wide transition-all active:scale-[0.98] shadow-lg shadow-brand-float"
            >
              Continuer
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-layer-4 border border-border-app rounded-2xl">
              <p className="text-sm text-fg-soft">
                Choisis un nouveau mot de passe pour sécuriser ton compte.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="text-xs font-bold text-fg-soft uppercase tracking-wider">
                  Nouveau mot de passe
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full h-14 rounded-2xl border-2 border-border-app bg-layer-5 px-5 text-fg placeholder:text-fg-faint rf-focus-ring text-sm transition-colors"
                  placeholder="6 caractères minimum"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="text-xs font-bold text-fg-soft uppercase tracking-wider">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full h-14 rounded-2xl border-2 border-border-app bg-layer-5 px-5 text-fg placeholder:text-fg-faint rf-focus-ring text-sm transition-colors"
                  placeholder="Répète ton mot de passe"
                  autoComplete="new-password"
                  required
                />
              </div>

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
                {isSubmitting ? 'Mise à jour…' : 'Mettre à jour mon mot de passe'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
