import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'
import { CookieSettingsSection } from '../components/legal/CookieSettingsSection'

interface Section {
  title: string
  content: string[]
}

const CGU_SECTIONS: Section[] = [
  {
    title: '0. Éditeur du service',
    content: [
      `RugbyForge est un service édité par Axurit, organisation responsable de la publication de l'application et du site rugbyforge.fr.`,
      `Pour toute demande liée au compte développeur Google Play, au support utilisateur ou à la protection des données, vous pouvez nous contacter à bonjour@rugbyforge.fr.`,
    ],
  },
  {
    title: '1. Objet',
    content: [
      `RugbyForge est une application de préparation physique destinée aux joueurs et joueuses de rugby adultes (18 ans et plus). Elle génère des programmes d'entraînement personnalisés basés sur votre profil et votre historique.`,
      `En accédant à l'application, vous acceptez sans réserve les présentes Conditions Générales d'Utilisation (CGU).`,
    ],
  },
  {
    title: '2. Accès et inscription',
    content: [
      `L'utilisation de RugbyForge nécessite la création d'un compte. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les actions réalisées depuis votre compte.`,
      `RugbyForge est réservé aux personnes majeures (18 ans ou plus). En créant un compte, vous confirmez avoir au moins 18 ans.`,
    ],
  },
  {
    title: '3. Propriété intellectuelle',
    content: [
      `L'ensemble du contenu de l'application (programmes, algorithmes, textes, design) est la propriété exclusive de RugbyForge. Toute reproduction, modification ou redistribution est interdite sans autorisation écrite préalable.`,
    ],
  },
  {
    title: '4. Limitation de responsabilité',
    content: [
      `RugbyForge est fourni "tel quel", sans garantie d'adéquation à un usage particulier. Nous ne sommes pas responsables des blessures, pertes de performances ou tout autre préjudice résultant de l'utilisation des programmes générés.`,
      `Les programmes sont générés automatiquement par algorithme et ne se substituent pas à l'accompagnement d'un professionnel de santé ou d'un coach qualifié.`,
    ],
  },
  {
    title: '5. Modifications',
    content: [
      `RugbyForge se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entrent en vigueur dès leur publication dans l'application. L'utilisation continuée du service vaut acceptation des nouvelles CGU.`,
    ],
  },
  {
    title: '6. Abonnements et paiements',
    content: [
      `Sur Android, les abonnements RugbyForge Premium sont encaissés exclusivement via Google Play Billing (Google Payments). Les conditions de paiement, de renouvellement automatique et de remboursement sont régies par le Contrat Google Play que vous acceptez à l'inscription au Play Store.`,
      `Sur le web (PWA), les abonnements sont encaissés via Stripe Payments Europe Ltd. Les conditions de Stripe s'appliquent au traitement de la transaction.`,
      `Droit de rétractation : conformément à l'article L221-28 du Code de la consommation, vous disposez d'un délai de rétractation de 14 jours à compter de l'achat de l'abonnement. Pour exercer ce droit, contactez Google Play (Android) ou Stripe (web) selon le canal d'achat. RugbyForge ne traite pas directement les remboursements.`,
      `Les abonnements souscrits via Play Store sont gérés exclusivement depuis votre compte Google (paramètres Play Store → Paiements et abonnements). Les abonnements Stripe sont gérés depuis votre espace utilisateur RugbyForge.`,
      `En cas de litige paiement, RugbyForge vous oriente vers le canal de paiement concerné (Google Play ou Stripe) qui assume la responsabilité de la transaction.`,
    ],
  },
]

export function LegalPage() {
  return (
    <div className="min-h-screen bg-app font-sans text-fg pb-bottom-nav relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader title="Mentions légales" backTo="/" />

      <main className="max-w-md mx-auto px-6 py-6 space-y-6 relative">

        {/* Disclaimer santé — anchor target for SignupPage hard-gate "Lire le détail" link */}
        <section id="disclaimer" className="rounded-[24px] border border-warn-bd bg-warn-bg-muted p-5 space-y-2 scroll-mt-20">
          <p className="text-xs font-black uppercase tracking-wider text-warn-strong">Avertissement important</p>
          <p className="text-sm text-warn-body leading-relaxed">
            Les programmes d&apos;entraînement générés par RugbyForge sont fournis à titre indicatif et ne remplacent pas l&apos;avis d&apos;un médecin, kinésithérapeute ou préparateur physique certifié.
          </p>
          <p className="text-sm text-warn-body leading-relaxed">
            Avant de commencer tout programme d&apos;entraînement intensif, consultez un professionnel de santé, en particulier si vous avez des antécédents médicaux, des blessures en cours ou si vous reprenez l&apos;activité après une longue pause.
          </p>
          <p className="text-sm font-bold text-warn-strong leading-relaxed">
            En cas de douleur, arrêtez immédiatement l&apos;exercice et consultez un médecin.
          </p>
        </section>

        {/* CGU */}
        <section className="space-y-4">
          <h1 className="text-lg font-black text-fg">Conditions Générales d&apos;Utilisation</h1>
          <p className="text-xs text-fg-muted">Dernière mise à jour : avril 2026</p>
          {CGU_SECTIONS.map((s) => (
            <div key={s.title} className="bg-layer-5 border border-border-app rounded-[20px] p-5 space-y-2">
              <h2 className="text-sm font-black text-fg">{s.title}</h2>
              {s.content.map((p, i) => (
                <p key={i} className="text-sm text-fg-secondary leading-relaxed">{p}</p>
              ))}
            </div>
          ))}
        </section>

        {/* Confidentialité — ancre pour Play Store / stores (#privacy) */}
        <section id="privacy" className="bg-layer-5 border border-border-app rounded-[20px] p-5 space-y-2 scroll-mt-20">
          <h2 className="text-sm font-black text-fg">Politique de confidentialité</h2>
          <p className="text-sm text-fg-secondary leading-relaxed">
            Données collectées, durées de conservation, droits RGPD et suppression de compte.
          </p>
          <Link to="/privacy" className="inline-flex text-sm font-bold text-brand hover:underline">
            Lire la politique de confidentialité
          </Link>
        </section>

        <CookieSettingsSection />

        {/* Contact */}
        <section className="bg-layer-5 border border-border-app rounded-[24px] p-5 space-y-2">
          <h2 className="text-sm font-black text-fg">Contact</h2>
          <p className="text-sm text-fg-secondary">
            Service édité par <span className="font-bold text-fg">Axurit</span>.
          </p>
          <p className="text-sm text-fg-secondary">
            Pour toute question relative aux présentes mentions légales ou à vos données personnelles :
          </p>
          <a
            href="mailto:bonjour@rugbyforge.fr"
            className="inline-block text-sm font-bold text-brand hover:underline"
          >
            bonjour@rugbyforge.fr
          </a>
          <Link
            to="/delete-account"
            className="inline-flex items-center text-sm font-bold text-brand hover:underline"
          >
            Demander la suppression du compte
          </Link>
        </section>

      </main>
    </div>
  )
}
