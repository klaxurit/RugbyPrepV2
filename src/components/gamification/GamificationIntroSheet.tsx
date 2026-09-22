import { Link } from 'react-router-dom'
import { Flame, RotateCcw, Shield, Target, Users } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import type { Lang } from '../../i18n/appLabels'

export interface GamificationIntroSheetProps {
  open: boolean
  onClose: () => void
  lang: Lang
}

interface FeatureRow {
  icon: typeof Target
  title: { fr: string; en: string }
  detail: { fr: string; en: string }
}

/**
 * Bottom sheet de première découverte de la gamification.
 *
 * Copy produit figée (voix rugby amateur, courte). Explique la règle d'or
 * avant que l'athlète tombe sur un classement vide ou un opt-in sans contexte.
 */
const FEATURES: readonly FeatureRow[] = [
  {
    icon: Target,
    title: {
      fr: 'Le score de rigueur',
      en: 'The rigor score',
    },
    detail: {
      fr: 'Ta séance faite, ton repos pris, ta décharge respectée : des points. Le tonnage, on s’en fiche.',
      en: 'Session done, rest taken, deload respected: points. Tonnage doesn’t matter.',
    },
  },
  {
    icon: Flame,
    title: {
      fr: 'Ta régularité',
      en: 'Your consistency',
    },
    detail: {
      fr: 'Tes 14 derniers jours et ton palier (de la Buvette au Bouclier) sont sur la carte d’accueil. Un coup d’œil et tu sais où tu en es.',
      en: 'Your last 14 days and your level (Club bar to Shield) live on the Home card. One glance and you know where you stand.',
    },
  },
  {
    icon: Users,
    title: {
      fr: 'L’onglet Groupe',
      en: 'The Squad tab',
    },
    detail: {
      fr: 'Le classement du club, une ligue hebdo de 20 à 30 athlètes, un défi commun, des duels si ça te chante, et des kudos à balancer.',
      en: 'Club board, a weekly league of 20–30 athletes, a shared challenge, duels if you feel like it, and kudos to hand out.',
    },
  },
  {
    icon: Shield,
    title: {
      fr: 'Tu montres ce que tu veux',
      en: 'You show what you want',
    },
    detail: {
      fr: 'Privé par défaut. Tu peux t’afficher au club, ou au club et à la ligue. Ton RPE, ta fatigue, tes bobos, tes charges : ça reste chez toi.',
      en: 'Private by default. Show yourself to the club, or club and league. Your RPE, fatigue, niggles and loads stay yours.',
    },
  },
  {
    icon: RotateCcw,
    title: {
      fr: 'Lundi, tout le monde repart de zéro',
      en: 'Monday, everyone starts over',
    },
    detail: {
      fr: 'Personne ne s’installe en haut. De la Buvette au Bouclier : montées et descentes le dimanche soir.',
      en: 'Nobody camps at the top. From the club bar to the Shield: promotions and relegations Sunday night.',
    },
  },
]

export function GamificationIntroSheet({
  open,
  onClose,
  lang,
}: GamificationIntroSheetProps) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabel={
        lang === 'fr'
          ? 'Nouveau : ton score, ton groupe'
          : 'New: your score, your squad'
      }
      eyebrow={lang === 'fr' ? 'Nouveau' : 'New'}
      title={
        lang === 'fr'
          ? 'Ton score, ton groupe'
          : 'Your score, your squad'
      }
    >
      <div className="space-y-4 pb-1" data-testid="gamification-intro-sheet">
        <p className="text-[13px] leading-relaxed text-fg-muted [text-wrap:balance]">
          {lang === 'fr'
            ? 'Ici, faire plus ne rapporte rien. Ce qui rapporte, c’est faire ce qui est prévu. Même quand ce qui est prévu, c’est lever le pied.'
            : 'Here, doing more earns nothing. What earns is doing what’s planned — even when what’s planned is easing off.'}
        </p>

        <ul className="space-y-2.5">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <li
                key={feature.title.fr}
                className="flex gap-3 rounded-2xl border border-border-app bg-layer-5 px-3.5 py-3"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Icon className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold text-fg">
                    {feature.title[lang]}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-relaxed text-fg-muted">
                    {feature.detail[lang]}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>

        <div className="space-y-2.5 pt-1">
          <Link
            to="/squad"
            onClick={onClose}
            data-testid="gamification-intro-cta"
            className="flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-black text-on-brand shadow-brand-float transition-colors hover:bg-brand-hover rf-focus-ring"
          >
            {lang === 'fr' ? 'Voir mon groupe' : 'See my squad'}
          </Link>
          <button
            type="button"
            onClick={onClose}
            data-testid="gamification-intro-dismiss"
            className="flex h-11 w-full items-center justify-center rounded-full border border-border-app text-sm font-bold text-fg-muted transition-colors hover:border-brand/30 hover:text-fg rf-focus-ring"
          >
            {lang === 'fr' ? 'Pas maintenant' : 'Not now'}
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}
