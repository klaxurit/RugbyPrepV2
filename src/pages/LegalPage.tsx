import { PageHeader } from '../components/PageHeader'

interface Section {
  title: string
  content: string[]
}

const CGU_SECTIONS: Section[] = [
  {
    title: '1. Objet',
    content: [
      `RugbyForge est une application mobile de préparation physique destinée aux joueurs de rugby de tous niveaux. Elle génère des programmes d'entraînement personnalisés basés sur votre profil et votre historique.`,
      `En accédant à l'application, vous acceptez sans réserve les présentes Conditions Générales d'Utilisation (CGU).`,
    ],
  },
  {
    title: '2. Accès et inscription',
    content: [
      `L'utilisation de RugbyForge nécessite la création d'un compte. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les actions réalisées depuis votre compte.`,
      `RugbyForge est destiné aux personnes majeures (18 ans ou plus). Les mineurs de moins de 18 ans peuvent créer un compte et un profil, mais l'accès au programme d'entraînement nécessite le consentement explicite d'un parent ou tuteur légal. Ce consentement est recueilli dans le profil utilisateur. Sans consentement validé, le programme d'entraînement n'est pas accessible.`,
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
]

const PRIVACY_SECTIONS: Section[] = [
  {
    title: 'Données collectées',
    content: [
      `Nous collectons : adresse email, prénom (optionnel), données de profil sportif (poste, niveau, équipement), historique des séances, données de tests physiques.`,
      `Nous collectons également des données de santé sensibles : zones douloureuses déclarées (épaule, genou, dos, etc.), programme de réhabilitation en cours (zone, phase, dates), et tranche d'âge (adulte ou moins de 18 ans). Ces données sont utilisées exclusivement pour personnaliser votre programme d'entraînement et appliquer les contre-indications de sécurité appropriées.`,
      `Ces données sont nécessaires au fonctionnement du service et ne sont pas vendues ni partagées à des tiers. Les données analytiques collectées via PostHog (hébergé en UE) sont agrégées et ne contiennent pas de données de santé individuelles.`,
    ],
  },
  {
    title: 'Hébergement et sous-traitants',
    content: [
      `Vos données sont hébergées sur Supabase (infrastructure PostgreSQL sécurisée, EU). Des outils d'analyse anonymisés (PostHog) peuvent collecter des données d'usage agrégées pour améliorer l'application.`,
    ],
  },
  {
    title: 'Paiements et données bancaires',
    content: [
      `Les paiements sont sécurisés par Stripe. RugbyForge ne conserve pas vos informations de carte bancaire. Consultez la politique de confidentialité de Stripe (stripe.com/fr/privacy) pour plus de détails sur le traitement des données de paiement.`,
    ],
  },
  {
    title: 'Mineurs et consentement parental',
    content: [
      `Les utilisateurs de moins de 18 ans doivent obtenir le consentement explicite d'un parent ou tuteur légal pour accéder au programme d'entraînement. Ce consentement couvre spécifiquement le traitement des données de santé (zones douloureuses, programme de réhabilitation, morphologie).`,
      `Sans consentement parental validé dans le profil, l'accès au programme d'entraînement est bloqué. L'utilisateur mineur peut créer un compte et renseigner son profil, mais ne peut pas générer ni consulter de programme tant que le consentement n'est pas activé.`,
      `Les programmes générés pour les mineurs respectent des contraintes de sécurité renforcées (charges maximales réduites, exercices adaptés).`,
    ],
  },
  {
    title: 'Vos droits (RGPD)',
    content: [
      `Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de portabilité et d'effacement de vos données.`,
      `Pour exercer ces droits ou pour toute question, contactez-nous à : bonjour@rugbyforge.fr`,
    ],
  },
  {
    title: 'Suppression de compte et droit à l\'effacement',
    content: [
      `Vous pouvez demander la suppression de votre compte à tout moment en nous contactant à bonjour@rugbyforge.fr. La suppression entraîne l'effacement de toutes vos données personnelles : profil, historique de séances, tests physiques, calendrier, et données de santé (blessures, réhabilitation).`,
      `La suppression est effective dans un délai de 30 jours suivant la demande. Les données analytiques agrégées et anonymisées peuvent être conservées à des fins statistiques.`,
    ],
  },
]

export function LegalPage() {
  return (
    <div className="min-h-screen bg-[#1a100c] font-sans text-white pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(#ff6b35_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader title="Mentions légales" backTo="/profile" />

      <main className="max-w-md mx-auto px-6 py-6 space-y-6 relative">

        {/* Disclaimer santé */}
        <section className="bg-amber-900/20 border border-amber-500/20 rounded-[24px] p-5 space-y-2">
          <p className="text-xs font-black text-amber-400 uppercase tracking-wider">Avertissement santé important</p>
          <p className="text-sm text-amber-200/90 leading-relaxed">
            Les programmes d&apos;entraînement générés par RugbyForge sont fournis à titre indicatif et ne remplacent pas l&apos;avis d&apos;un médecin, kinésithérapeute ou préparateur physique certifié.
          </p>
          <p className="text-sm text-amber-200/90 leading-relaxed">
            Avant de commencer tout programme d&apos;entraînement intensif, consultez un professionnel de santé, en particulier si vous avez des antécédents médicaux, des blessures en cours ou si vous reprenez l&apos;activité après une longue pause.
          </p>
          <p className="text-sm text-amber-200 font-bold leading-relaxed">
            En cas de douleur, arrêtez immédiatement l&apos;exercice et consultez un médecin.
          </p>
        </section>

        {/* CGU */}
        <section className="space-y-4">
          <h1 className="text-lg font-black text-white">Conditions Générales d&apos;Utilisation</h1>
          <p className="text-xs text-white/40">Dernière mise à jour : mars 2026</p>
          {CGU_SECTIONS.map((s) => (
            <div key={s.title} className="bg-white/5 border border-white/10 rounded-[20px] p-5 space-y-2">
              <h2 className="text-sm font-black text-white">{s.title}</h2>
              {s.content.map((p, i) => (
                <p key={i} className="text-sm text-white/70 leading-relaxed">{p}</p>
              ))}
            </div>
          ))}
        </section>

        {/* Confidentialité */}
        <section className="space-y-4">
          <h1 className="text-lg font-black text-white">Politique de Confidentialité</h1>
          <p className="text-xs text-white/40">Conformément au RGPD (UE 2016/679)</p>
          {PRIVACY_SECTIONS.map((s) => (
            <div key={s.title} className="bg-white/5 border border-white/10 rounded-[20px] p-5 space-y-2">
              <h2 className="text-sm font-black text-white">{s.title}</h2>
              {s.content.map((p, i) => (
                <p key={i} className="text-sm text-white/70 leading-relaxed">{p}</p>
              ))}
            </div>
          ))}
        </section>

        {/* Contact */}
        <section className="bg-white/5 border border-white/10 rounded-[24px] p-5 space-y-2">
          <h2 className="text-sm font-black text-white">Contact</h2>
          <p className="text-sm text-white/70">
            Pour toute question relative aux présentes mentions légales ou à vos données personnelles :
          </p>
          <a
            href="mailto:bonjour@rugbyforge.fr"
            className="inline-block text-sm font-bold text-[#ff6b35] hover:underline"
          >
            bonjour@rugbyforge.fr
          </a>
        </section>

      </main>
    </div>
  )
}
