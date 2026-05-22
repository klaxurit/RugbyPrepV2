import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { CookieSettingsSection } from '../components/legal/CookieSettingsSection'

interface Section {
  title: string
  content: string[]
}

const PRIVACY_SECTIONS: Section[] = [
  {
    title: '1. Données collectées',
    content: [
      'Compte : adresse e-mail, prénom (optionnel), identifiant utilisateur.',
      'Profil sportif : poste, niveau, équipement, morphologie (taille, poids), zones sensibles déclarées.',
      'Entraînement : historique des séances, tests physiques, calendrier club et matchs.',
      'Coach IA : messages et contexte sportif nécessaires à la réponse (profil, historique récent, zones sensibles).',
      'Notifications : jetons push (FCM) si vous activez les rappels.',
      'Analytique : événements d’usage agrégés via PostHog (hébergé en UE), sans revente de données.',
      'Paiements : RugbyForge ne stocke pas vos coordonnées bancaires. Android via Google Play Billing ; web via Stripe.',
    ],
  },
  {
    title: '2. Finalités et bases légales',
    content: [
      'Les données sont traitées pour fournir le service (programmes personnalisés, suivi, coach IA), gérer votre compte et, le cas échéant, votre abonnement.',
      'Base légale : exécution du contrat (CGU) et, pour l’analytique optionnelle, votre consentement via le bandeau cookies.',
    ],
  },
  {
    title: '3. Sous-traitants',
    content: [
      'Supabase — hébergement base de données (UE).',
      'Anthropic — traitement IA du Coach (API Claude).',
      'PostHog — analytique agrégée (UE).',
      'Google Play Billing / Stripe — paiements.',
      'Google Firebase Cloud Messaging — notifications push (si activées).',
    ],
  },
]

const RETENTION_ROWS: { type: string; duration: string }[] = [
  {
    type: 'Compte, profil, séances, tests, calendrier, messages Coach IA',
    duration: 'Tant que votre compte est actif. Supprimés sous 30 jours après une demande d’effacement (suppression immédiate via l’outil in-app).',
  },
  {
    type: 'Jetons de notification push',
    duration: 'Jusqu’à désactivation des notifications ou suppression du compte (effacement immédiat).',
  },
  {
    type: 'Statut d’abonnement (Premium, Founding)',
    duration: 'Tant que le compte est actif ; métadonnées de facturation chez Google Play ou Stripe selon leurs politiques.',
  },
  {
    type: 'Justificatifs comptables liés aux paiements',
    duration: 'Conservés par Google Play ou Stripe ; RugbyForge ne conserve pas de numéro de carte. Jusqu’à 10 ans chez le prestataire si la loi l’exige.',
  },
  {
    type: 'Logs techniques et sécurité (serveur)',
    duration: 'Maximum 90 jours, sauf obligation légale contraire.',
  },
  {
    type: 'Données analytiques agrégées et anonymisées',
    duration: 'Jusqu’à 24 mois sous forme statistique non identifiable.',
  },
  {
    type: 'Cookies de session (authentification)',
    duration: 'Durée de la session ou jusqu’à déconnexion / suppression du compte.',
  },
]

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-app font-sans text-fg pb-bottom-nav relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader title="Confidentialité" backTo="/" />

      <main className="max-w-md mx-auto px-6 py-6 space-y-6 relative">
        <section className="space-y-4">
          <h1 className="text-lg font-black text-fg">Politique de confidentialité</h1>
          <p className="text-xs text-fg-muted">Dernière mise à jour : mai 2026 · RGPD (UE 2016/679)</p>
          <p className="text-sm text-fg-secondary leading-relaxed">
            RugbyForge est édité par <span className="font-bold text-fg">Axurit</span>.
            Cette page décrit quelles données nous collectons, combien de temps nous les conservons
            et comment vous pouvez les supprimer.
          </p>

          {PRIVACY_SECTIONS.map((s) => (
            <div key={s.title} className="bg-layer-5 border border-border-app rounded-[20px] p-5 space-y-2">
              <h2 className="text-sm font-black text-fg">{s.title}</h2>
              <ul className="space-y-2 pl-4 list-disc">
                {s.content.map((item) => (
                  <li key={item} className="text-sm text-fg-secondary leading-relaxed">{item}</li>
                ))}
              </ul>
            </div>
          ))}

          <div className="bg-layer-5 border border-border-app rounded-[20px] p-5 space-y-3">
            <h2 className="text-sm font-black text-fg">4. Durée de conservation des données</h2>
            <p className="text-sm text-fg-secondary leading-relaxed">
              Nous conservons vos données uniquement le temps nécessaire aux finalités ci-dessous :
            </p>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full min-w-[280px] text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border-app">
                    <th className="py-2 pr-3 font-black text-fg align-top">Type de donnée</th>
                    <th className="py-2 font-black text-fg align-top">Durée</th>
                  </tr>
                </thead>
                <tbody>
                  {RETENTION_ROWS.map((row) => (
                    <tr key={row.type} className="border-b border-border-app/60 last:border-0">
                      <td className="py-2.5 pr-3 text-fg-secondary align-top">{row.type}</td>
                      <td className="py-2.5 text-fg-secondary align-top">{row.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-layer-5 border border-border-app rounded-[20px] p-5 space-y-2">
            <h2 className="text-sm font-black text-fg">5. Suppression de vos données</h2>
            <p className="text-sm text-fg-secondary leading-relaxed">
              Vous pouvez demander la suppression de votre compte à tout moment :
            </p>
            <ol className="space-y-2 pl-4 list-decimal text-sm text-fg-secondary leading-relaxed">
              <li>Connectez-vous à RugbyForge (application Android ou site web).</li>
              <li>
                Ouvrez la page{' '}
                <Link to="/delete-account" className="text-brand font-bold hover:underline">Suppression du compte</Link>.
              </li>
              <li>Saisissez <strong className="text-fg">SUPPRIMER</strong> pour confirmer.</li>
            </ol>
            <p className="text-sm text-fg-secondary leading-relaxed">
              Ou contactez{' '}
              <a href="mailto:bonjour@rugbyforge.fr" className="text-brand font-bold hover:underline">bonjour@rugbyforge.fr</a>
              {' '}depuis l’adresse de votre compte (réponse sous 30 jours).
            </p>
            <p className="text-sm text-fg-secondary leading-relaxed">
              La suppression du compte n’annule pas automatiquement un abonnement Google Play ou Stripe actif.
            </p>
          </div>

          <div className="bg-layer-5 border border-border-app rounded-[20px] p-5 space-y-2">
            <h2 className="text-sm font-black text-fg">6. Vos droits (RGPD)</h2>
            <p className="text-sm text-fg-secondary leading-relaxed">
              Droit d’accès, de rectification, d’effacement, de limitation, de portabilité et d’opposition.
              Contact :{' '}
              <a href="mailto:bonjour@rugbyforge.fr" className="text-brand font-bold hover:underline">bonjour@rugbyforge.fr</a>.
              Réclamation possible auprès de la{' '}
              <a href="https://www.cnil.fr" rel="noopener noreferrer" className="text-brand font-bold hover:underline">CNIL</a>.
            </p>
          </div>
        </section>

        <CookieSettingsSection />

        <section className="bg-layer-5 border border-border-app rounded-[24px] p-5 space-y-2">
          <h2 className="text-sm font-black text-fg">Contact</h2>
          <p className="text-sm text-fg-secondary">
            Service édité par <span className="font-bold text-fg">Axurit</span>.
          </p>
          <a
            href="mailto:bonjour@rugbyforge.fr"
            className="inline-block text-sm font-bold text-brand hover:underline"
          >
            bonjour@rugbyforge.fr
          </a>
          <Link
            to="/legal"
            className="block text-sm font-bold text-brand hover:underline"
          >
            Mentions légales et CGU
          </Link>
        </section>
      </main>
    </div>
  )
}
