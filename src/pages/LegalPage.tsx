import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { RugbyForgeLogo } from '../components/RugbyForgeLogo'

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
      `Pour exercer ces droits ou pour toute question, contactez-nous à : contact@rugbyprep.app`,
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
    <div className="min-h-screen bg-[#faf9f7] font-sans text-slate-900 pb-16">
      <header className="sticky top-0 z-10 bg-[#faf9f7]/95 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link to="/profile" className="p-2 rounded-2xl hover:bg-gray-100 transition-colors text-slate-500">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <RugbyForgeLogo size="sm" />
          <span className="text-xs font-bold tracking-widest text-[#1a5f3f] uppercase italic">RugbyForge</span>
        </div>
        <span className="text-sm font-black text-slate-900">Mentions légales</span>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-8">

        {/* Disclaimer santé */}
        <section className="bg-amber-50 border border-amber-200 rounded-[24px] p-5 space-y-2">
          <p className="text-xs font-black text-amber-800 uppercase tracking-wider">Avertissement santé important</p>
          <p className="text-sm text-amber-900 leading-relaxed">
            Les programmes d&apos;entraînement générés par RugbyForge sont fournis à titre indicatif et ne remplacent pas l&apos;avis d&apos;un médecin, kinésithérapeute ou préparateur physique certifié.
          </p>
          <p className="text-sm text-amber-900 leading-relaxed">
            Avant de commencer tout programme d&apos;entraînement intensif, consultez un professionnel de santé, en particulier si vous avez des antécédents médicaux, des blessures en cours ou si vous reprenez l&apos;activité après une longue pause.
          </p>
          <p className="text-sm text-amber-900 leading-relaxed font-bold">
            En cas de douleur, arrêtez immédiatement l&apos;exercice et consultez un médecin.
          </p>
        </section>

        {/* CGU */}
        <section className="space-y-4">
          <h1 className="text-lg font-black text-slate-900">Conditions Générales d&apos;Utilisation</h1>
          <p className="text-xs text-slate-400">Dernière mise à jour : mars 2026</p>
          {CGU_SECTIONS.map((s) => (
            <div key={s.title} className="bg-white border border-gray-100 rounded-[20px] p-5 space-y-2">
              <h2 className="text-sm font-black text-slate-900">{s.title}</h2>
              {s.content.map((p, i) => (
                <p key={i} className="text-sm text-slate-600 leading-relaxed">{p}</p>
              ))}
            </div>
          ))}
        </section>

        {/* Confidentialité */}
        <section className="space-y-4">
          <h1 className="text-lg font-black text-slate-900">Politique de Confidentialité</h1>
          <p className="text-xs text-slate-400">Conformément au RGPD (UE 2016/679)</p>
          {PRIVACY_SECTIONS.map((s) => (
            <div key={s.title} className="bg-white border border-gray-100 rounded-[20px] p-5 space-y-2">
              <h2 className="text-sm font-black text-slate-900">{s.title}</h2>
              {s.content.map((p, i) => (
                <p key={i} className="text-sm text-slate-600 leading-relaxed">{p}</p>
              ))}
            </div>
          ))}
        </section>

        {/* Contact */}
        <section className="bg-white border border-gray-100 rounded-[24px] p-5 space-y-2">
          <h2 className="text-sm font-black text-slate-900">Contact</h2>
          <p className="text-sm text-slate-600">
            Pour toute question relative aux présentes mentions légales ou à vos données personnelles :
          </p>
          <a
            href="mailto:contact@rugbyprep.app"
            className="inline-block text-sm font-bold text-[#1a5f3f] hover:underline"
          >
            contact@rugbyprep.app
          </a>
        </section>

      </main>
    </div>
  )
}
