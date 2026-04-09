import { Link, Navigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { RugbyForgeLogo } from '../../components/RugbyForgeLogo'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../services/supabase/client'

interface ForgotPasswordLocationState {
  email?: string
}

export function ForgotPasswordPage() {
  const { authState } = useAuth()
  const location = useLocation()
  const state = location.state as ForgotPasswordLocationState | null

  const [email, setEmail] = useState(
    typeof state?.email === 'string' ? state.email : '',
  )
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

    if (!email.includes('@')) {
      setError('Entre une adresse email valide.')
      return
    }

    setIsSubmitting(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (resetError) {
      setError('Impossible d’envoyer le lien. Réessaie dans quelques minutes.')
      setIsSubmitting(false)
      return
    }

    setInfo('Un email de réinitialisation a été envoyé. Vérifie ta boîte mail et tes spams.')
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-app flex flex-col px-6 py-12">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      <main className="relative w-full max-w-md mx-auto flex flex-col flex-1 justify-center gap-10">
        <div className="flex flex-col items-center text-center gap-3">
          <RugbyForgeLogo size="hero" />
          <p className="text-fg-muted text-xs font-bold tracking-[0.2em] uppercase">
            Mot de passe oublié
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-layer-4 border border-border-app rounded-2xl">
            <p className="text-sm text-fg-soft">
              Entre ton email et on t’envoie un lien pour choisir un nouveau mot de passe.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="forgot-email" className="text-xs font-bold text-fg-soft uppercase tracking-wider">
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full h-14 rounded-2xl border-2 border-border-app bg-layer-5 px-5 text-fg placeholder:text-fg-faint rf-focus-ring text-sm transition-colors"
                placeholder="toi@club.fr"
                autoComplete="email"
                required
              />
            </div>

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
              {isSubmitting ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              to="/auth/login"
              className="text-sm text-fg-soft hover:text-fg font-medium transition-colors"
            >
              Retour à la <span className="text-brand font-bold">connexion</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
