import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'

const SUPPORT_EMAIL = 'bonjour@rugbyforge.fr'
const PLAY_SUBSCRIPTIONS_URL = 'https://play.google.com/store/account/subscriptions'

export function DeleteAccountPage() {
  const { authState } = useAuth()
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
    <div className="min-h-screen bg-app font-sans text-fg pb-24 relative overflow-hidden">
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

        <section className="bg-layer-5 border border-border-app rounded-[24px] p-5 space-y-3">
          <h2 className="text-sm font-black text-fg">Comment demander la suppression</h2>
          <p className="text-sm text-fg-secondary leading-relaxed">
            Envoie la demande depuis l&apos;adresse email liée à ton compte, ou précise cette adresse dans le message si tu n&apos;es pas connecté. Les demandes sont traitées par l&apos;éditeur du service, <span className="font-bold text-fg">Axurit</span>.
          </p>
          <a
            href={deleteAccountMailto}
            className="inline-flex items-center justify-center rounded-2xl bg-brand px-4 py-2.5 text-sm font-black text-on-brand transition-colors hover:bg-brand-hover"
          >
            Envoyer la demande par email
          </a>
          <p className="text-xs text-fg-muted">
            Adresse de support Axurit : {SUPPORT_EMAIL}
          </p>
        </section>

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
              to="/legal"
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
