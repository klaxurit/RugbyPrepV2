import { Link } from 'react-router-dom'
import { PageHeader } from '../components/PageHeader'

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
]

const PRIVACY_SECTIONS: Section[] = [
  {
    title: 'Données collectées',
    content: [
      `Nous collectons : adresse email, prénom (optionnel), données de profil sportif (poste, niveau, équipement), historique des séances, données de tests physiques.`,
      `Nous collectons également des données liées à la personnalisation de votre programme : zones sensibles déclarées (épaule, genou, dos, etc.) et morphologie (taille, poids). Ces données sont utilisées exclusivement pour adapter les exercices et les charges de votre programme d'entraînement.`,
      `Ces données sont nécessaires au fonctionnement du service et ne sont pas vendues.`,
      `Lorsque vous utilisez la fonctionnalité Coach IA, les données nécessaires à la génération de conseils (profil sportif, zones sensibles déclarées, historique récent) sont transmises à un fournisseur externe de traitement par intelligence artificielle (Anthropic). Ces données sont envoyées uniquement pour produire la réponse demandée. Leur conservation éventuelle par le fournisseur est régie par sa politique de conservation des données API en vigueur. Le Coach IA fournit des conseils de préparation physique et ne réalise aucun diagnostic médical.`,
      `Les données analytiques collectées via PostHog (hébergé en UE) sont agrégées et ne contiennent pas de données personnelles individuelles.`,
    ],
  },
  {
    title: 'Hébergement et sous-traitants',
    content: [
      `Vos données sont hébergées sur Supabase (infrastructure PostgreSQL sécurisée, EU). Le traitement IA du Coach est assuré par Anthropic (API Claude). Des outils d'analyse anonymisés (PostHog) peuvent collecter des données d'usage agrégées pour améliorer l'application. Les paiements sont traités par Google Play Billing sur Android et par Stripe sur le web.`,
    ],
  },
  {
    title: 'Paiements et données bancaires',
    content: [
      `RugbyForge ne conserve pas vos informations de carte bancaire. Sur Android, les abonnements sont encaissés via Google Play Billing / Google Payments. Sur le web, les paiements sont sécurisés par Stripe. Consultez les politiques de confidentialité des prestataires de paiement concernés pour plus de détails sur le traitement des données de paiement.`,
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
      `Vous pouvez demander la suppression de votre compte à tout moment depuis la page dédiée /delete-account ou en nous contactant à bonjour@rugbyforge.fr. La suppression entraîne l'effacement de toutes vos données personnelles : profil, historique de séances, tests physiques et calendrier.`,
      `La suppression est effective dans un délai de 30 jours suivant la demande. Les données analytiques agrégées et anonymisées peuvent être conservées à des fins statistiques.`,
    ],
  },
]

export function LegalPage() {
  return (
    <div className="min-h-screen bg-app font-sans text-fg pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader title="Mentions légales" backTo="/" />

      <main className="max-w-md mx-auto px-6 py-6 space-y-6 relative">

        {/* Disclaimer santé */}
        <section className="rounded-[24px] border border-warn-bd bg-warn-bg-muted p-5 space-y-2">
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

        {/* Confidentialité */}
        <section className="space-y-4">
          <h1 className="text-lg font-black text-fg">Politique de Confidentialité</h1>
          <p className="text-xs text-fg-muted">Conformément au RGPD (UE 2016/679)</p>
          {PRIVACY_SECTIONS.map((s) => (
            <div key={s.title} className="bg-layer-5 border border-border-app rounded-[20px] p-5 space-y-2">
              <h2 className="text-sm font-black text-fg">{s.title}</h2>
              {s.content.map((p, i) => (
                <p key={i} className="text-sm text-fg-secondary leading-relaxed">{p}</p>
              ))}
            </div>
          ))}
        </section>

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
