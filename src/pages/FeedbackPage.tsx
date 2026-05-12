import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { supabase } from '../services/supabase/client'
import { posthog } from '../services/analytics/posthog'
import { tr, type Lang } from '../i18n/appLabels'

type FeedbackKind = 'bug' | 'feature' | 'usability' | 'other'

const KIND_LABEL_KEYS: Record<FeedbackKind, 'feedback_kind_bug' | 'feedback_kind_feature' | 'feedback_kind_ux' | 'feedback_kind_other'> = {
  bug: 'feedback_kind_bug',
  feature: 'feedback_kind_feature',
  usability: 'feedback_kind_ux',
  other: 'feedback_kind_other',
}

export function FeedbackPage() {
  const { authState } = useAuth()
  const { profile } = useProfile()
  const navigate = useNavigate()
  const lang: Lang = (profile.preferredLanguage as Lang | undefined) ?? 'fr'

  const [kind, setKind] = useState<FeedbackKind>('bug')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (authState.status !== 'authenticated' || !authState.user) {
    return <Navigate to="/auth/login?redirectTo=/feedback" replace />
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (message.trim().length < 5) {
      setError(lang === 'fr' ? 'Message trop court (5 caractères minimum).' : 'Message too short (5 characters minimum).')
      return
    }
    if (message.length > 4000) {
      setError(lang === 'fr' ? 'Message trop long (4000 caractères maximum).' : 'Message too long (4000 characters maximum).')
      return
    }

    if (!authState.user) {
      setError(lang === 'fr' ? 'Tu dois être connecté pour envoyer un feedback.' : 'You must be signed in to send feedback.')
      return
    }

    setSubmitting(true)
    const appVersion = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? null
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null

    const { error: insertError } = await supabase.from('beta_feedback').insert({
      user_id: authState.user.id,
      kind,
      message: message.trim(),
      app_version: appVersion,
      user_agent: userAgent,
    })

    if (insertError) {
      setSubmitting(false)
      setError(
        lang === 'fr'
          ? "Échec de l'envoi. Réessaye dans quelques secondes ou écris-moi à bonjour@rugbyforge.fr."
          : 'Send failed. Try again in a few seconds or email bonjour@rugbyforge.fr.',
      )
      return
    }

    try {
      posthog.capture?.('feedback_submitted', { kind })
    } catch { /* posthog might be opted-out */ }

    setSuccess(true)
    setSubmitting(false)
    setTimeout(() => navigate('/profile', { replace: true }), 1800)
  }

  return (
    <div className="min-h-screen bg-app font-sans text-fg pb-bottom-nav relative overflow-hidden">
      <PageHeader title="Envoyer un feedback" backTo="/profile" />

      <main className="max-w-md mx-auto px-6 py-6 space-y-6 relative">
        <section className="bg-layer-5 border border-border-app rounded-[24px] p-5 space-y-2">
          <h1 className="text-base font-black text-fg">Aide-nous à améliorer RugbyForge</h1>
          <p className="text-sm text-fg-secondary leading-relaxed">
            Décris en quelques mots ce qui ne marche pas, ce qui manque, ou ce qui te dérange.
            Tous les retours sont lus pendant la phase bêta.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-fg-soft uppercase tracking-wider" htmlFor="kind">
              Type de retour
            </label>
            <select
              id="kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as FeedbackKind)}
              className="w-full h-12 rounded-2xl border-2 border-border-app bg-layer-5 px-4 text-sm text-fg rf-focus-ring"
            >
              {(Object.entries(KIND_LABEL_KEYS) as [FeedbackKind, typeof KIND_LABEL_KEYS[FeedbackKind]][]).map(([k, labelKey]) => (
                <option key={k} value={k}>{tr(labelKey, lang)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-fg-soft uppercase tracking-wider" htmlFor="message">
              Ton message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={6}
              maxLength={4000}
              className="w-full rounded-2xl border-2 border-border-app bg-layer-5 px-4 py-3 text-sm text-fg placeholder:text-fg-faint rf-focus-ring resize-y"
              placeholder="Ex : sur l'écran Semaine, la carte du match disparaît si je passe en mode avion puis reviens…"
            />
            <p className="text-[11px] text-fg-muted text-right">{message.length} / 4000</p>
          </div>

          {error && (
            <div className="p-3.5 bg-danger-bg border border-danger-bd rounded-2xl">
              <p className="text-xs text-danger font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="p-3.5 bg-ok-bg-muted border border-ok-bd rounded-2xl">
              <p className="text-xs text-ok font-medium">
                {lang === 'fr' ? 'Merci, ton retour est bien arrivé. Redirection…' : 'Thanks, your feedback was received. Redirecting…'}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || success}
            className="w-full h-14 rounded-full bg-brand hover:bg-brand-hover text-on-brand font-bold text-sm tracking-wide transition-all active:scale-[0.98] shadow-lg shadow-brand-float disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Envoi…' : success ? 'Envoyé' : 'Envoyer le feedback'}
          </button>
        </form>

        <p className="text-xs text-fg-muted text-center">
          Tu peux aussi écrire directement à{' '}
          <a href="mailto:bonjour@rugbyforge.fr" className="text-brand underline">bonjour@rugbyforge.fr</a>{' '}
          ou retourner à <Link to="/profile" className="text-brand underline">ton profil</Link>.
        </p>
      </main>
    </div>
  )
}
