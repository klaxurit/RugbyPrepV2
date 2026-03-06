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
      `RugbyForge est destiné aux personnes majeures (18 ans ou plus). Les mineurs doivent obtenir l'accord d'un parent ou tuteur légal.`,
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
      `Nous collectons : adresse email, prénom (optionnel), données de profil sportif (poste, niveau, équipement, zones douloureuses), historique des séances, données de tests physiques.`,
      `Ces données sont nécessaires au fonctionnement du service et ne sont pas vendues à des tiers.`,
    ],
  },
  {
    title: 'Hébergement et sous-traitants',
    content: [
      `Vos données sont hébergées sur Supabase (infrastructure PostgreSQL sécurisée, EU). Des outils d'analyse anonymisés (PostHog) peuvent collecter des données d'usage agrégées pour améliorer l'application.`,
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
    title: 'Conservation des données',
    content: [
      `Vos données sont conservées le temps de votre utilisation du service et supprimées dans un délai de 30 jours après la clôture de votre compte.`,
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
