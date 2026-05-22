import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../services/supabase/client'

const SUPPORT_EMAIL = 'bonjour@rugbyforge.fr'
const PLAY_SUBSCRIPTIONS_URL = 'https://play.google.com/store/account/subscriptions?package=fr.rugbyforge.app'

export function DeleteAccountPage() {
  const { authState, signOut } = useAuth()
  const navigate = useNavigate()
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const currentUser = authState.status === 'authenticated' ? authState.user : null
  const backTo = currentUser ? '/profile' : '/legal'

  const emailBody = [
    'Bonjour,',
    '',
    'Je souhaite supprimer mon compte RugbyForge et les donnees associees.',
    currentUser ? `Email du compte : ${currentUser.email}` : 'Email du compte :',
    currentUser ? `ID du compte : ${currentUser.id}` : '',
    '',
    'Merci de confirmer la prise en charge de ma demande.',
  ]
    .filter(Boolean)
    .join('\n')

  const deleteAccountMailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Demande de suppression de compte RugbyForge')}&body=${encodeURIComponent(emailBody)}`

  return (
    <div className="min-h-screen bg-app font-sans text-fg pb-bottom-nav relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader title="Suppression du compte" backTo={backTo} />

      <main className="max-w-md mx-auto px-6 py-6 space-y-6 relative">
        <section className="rounded-[24px] border border-warn-bd bg-warn-bg-muted p-5 space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-warn-strong">Avant de supprimer</p>
          <p className="text-sm text-warn-body leading-relaxed">
            La suppression efface ton profil RugbyForge, ton historique d&apos;entraînement, tes tests physiques, ton calendrier et tes préférences associées.
          </p>
          <p className="text-sm text-warn-body leading-relaxed">
            Les justificatifs de paiement ou éléments conservés pour des obligations légales ou comptables peuvent rester archivés pendant la durée strictement nécessaire.
          </p>
        </section>

        {currentUser ? (
          <section className="bg-layer-5 border border-border-app rounded-[24px] p-5 space-y-3">
            <h2 className="text-sm font-black text-fg">Supprimer mon compte</h2>
            <p className="text-sm text-fg-secondary leading-relaxed">
              Tape <span className="font-bold text-danger">SUPPRIMER</span> pour confirmer. Cette action est irreversible.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Tape SUPPRIMER"
              className="w-full h-12 rounded-2xl border-2 border-border-app bg-layer-5 px-4 text-sm text-fg placeholder:text-fg-faint rf-focus-ring transition-colors"
            />
            {deleteError && (
              <div className="p-3 bg-danger-bg border border-danger-bd rounded-2xl">
                <p className="text-xs text-danger font-medium">{deleteError}</p>
              </div>
            )}
            <button
              type="button"
              disabled={confirmText !== 'SUPPRIMER' || deleting}
              onClick={async () => {
                setDeleting(true)
                setDeleteError(null)
                try {
                  // Server-side erasure via service-role Edge Function.
                  // Client-side DELETEs would silently fail (RLS SELECT-only
                  // on user_subscriptions / user_entitlements) and leave the
                  // auth.users row alive — RGPD violation.
                  const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
                    'delete-account',
                    { method: 'POST' },
                  )
                  if (error || !data?.ok) {
                    throw new Error(data?.error ?? error?.message ?? 'Suppression refusée par le serveur.')
                  }
                  // The auth.users row is gone — local session is now stale.
                  // signOut() clears localStorage even if the refresh fails.
                  await signOut()
                  navigate('/', { replace: true })
                } catch (err) {
                  setDeleteError(err instanceof Error ? err.message : 'Erreur lors de la suppression.')
                  setDeleting(false)
                }
              }}
              className="w-full rounded-2xl bg-danger px-4 py-3 text-sm font-black text-white transition-colors hover:bg-danger/90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {deleting ? 'Suppression en cours...' : 'Supprimer definitivement mon compte'}
            </button>
            <p className="text-[10px] text-fg-muted">
              Tu peux aussi contacter {SUPPORT_EMAIL} pour toute question.
            </p>
          </section>
        ) : (
          <section className="bg-layer-5 border border-border-app rounded-[24px] p-5 space-y-3">
            <h2 className="text-sm font-black text-fg">Comment demander la suppression</h2>
            <p className="text-sm text-fg-secondary leading-relaxed">
              Connecte-toi pour supprimer ton compte directement, ou envoie une demande par email a <span className="font-bold text-fg">{SUPPORT_EMAIL}</span>.
            </p>
            <a
              href={deleteAccountMailto}
              className="inline-flex items-center justify-center rounded-2xl bg-brand px-4 py-2.5 text-sm font-black text-on-brand transition-colors hover:bg-brand-hover"
            >
              Envoyer la demande par email
            </a>
          </section>
        )}

        <section className="bg-layer-5 border border-border-app rounded-[24px] p-5 space-y-3">
          <h2 className="text-sm font-black text-fg">Abonnements actifs</h2>
          <p className="text-sm text-fg-secondary leading-relaxed">
            La suppression du compte RugbyForge n&apos;annule pas automatiquement un abonnement Google Play ou Stripe. Pense à résilier le renouvellement séparément si nécessaire.
          </p>
          <a
            href={PLAY_SUBSCRIPTIONS_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-2xl border border-border-app px-4 py-2.5 text-sm font-bold text-fg-secondary transition-colors hover:border-border-app hover:text-fg"
          >
            Gérer mon abonnement Google Play
          </a>
        </section>

        <section className="bg-layer-5 border border-border-app rounded-[24px] p-5 space-y-3">
          <h2 className="text-sm font-black text-fg">Références utiles</h2>
          <div className="grid gap-2">
            <Link
              to="/privacy"
              className="inline-flex items-center justify-between rounded-2xl border border-border-app px-4 py-3 text-sm font-semibold text-fg-secondary transition-colors hover:border-border-app hover:text-fg"
            >
              <span>Politique de confidentialité</span>
              <span className="text-xs text-fg-muted">Ouvrir</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
