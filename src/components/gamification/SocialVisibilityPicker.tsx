import { Check, Lock } from 'lucide-react'
import type { Lang } from '../../i18n/appLabels'
import type { SocialVisibility } from '../../types/gamification'

export interface SocialVisibilityPickerProps {
  value: SocialVisibility
  onChange: (next: SocialVisibility) => void
  /** Prénom courant. Sans prénom, l'opt-in n'a aucun effet. */
  displayName: string | null
  lang: Lang
}

interface Option {
  value: SocialVisibility
  title: { fr: string; en: string }
  detail: { fr: string; en: string }
}

/**
 * Choix du périmètre de visibilité sociale.
 *
 * Consentement explicite, recueilli sur un écran dédié et **distinct des
 * CGU** : exposer son nom à ses coéquipiers est une finalité propre, qui n'est
 * pas couverte par le consentement santé ni par la visibilité staff. Le défaut
 * reste `private`, et rien n'est exposé avant un choix actif.
 *
 * Aucune option « monde entier » nominative : un classement public d'athlètes
 * identifiables n'apporte rien ici et élargit inutilement l'exposition.
 */
const OPTIONS: readonly Option[] = [
  {
    value: 'private',
    title: { fr: 'Privé', en: 'Private' },
    detail: {
      fr: 'Personne ne voit ta rigueur. Tu gardes niveau, points et régularité pour toi.',
      en: 'Nobody sees your rigor. Level, points and streak stay yours.',
    },
  },
  {
    value: 'club',
    title: { fr: 'Mon club', en: 'My club' },
    detail: {
      fr: 'Tes coéquipiers voient ton nom, ton niveau et tes points de la semaine. Jamais tes RPE, ta fatigue ni tes blessures.',
      en: 'Teammates see your name, level and weekly points. Never your RPE, fatigue or injuries.',
    },
  },
  {
    value: 'cohort',
    title: { fr: 'Club + ligue hebdo', en: 'Club + weekly league' },
    detail: {
      fr: 'Ajoute les ligues hebdomadaires : une arène de 20 à 30 athlètes appariés, avec promotion et relégation.',
      en: 'Adds weekly leagues: an arena of 20 to 30 matched athletes, with promotion and relegation.',
    },
  },
]

export function SocialVisibilityPicker({
  value,
  onChange,
  displayName,
  lang,
}: SocialVisibilityPickerProps) {
  const hasName = (displayName ?? '').trim().length > 0

  return (
    <div className="space-y-2" data-testid="social-visibility-picker">
      {OPTIONS.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            data-testid={`social-visibility-${option.value}`}
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={`flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors rf-focus-ring ${
              selected
                ? 'border-brand bg-brand-soft'
                : 'border-border-app bg-layer-6 hover:border-brand-border'
            }`}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                selected ? 'border-brand bg-brand text-on-brand' : 'border-fg/30 text-transparent'
              }`}
              aria-hidden
            >
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-bold text-fg">
                {option.title[lang]}
              </span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-fg-muted">
                {option.detail[lang]}
              </span>
            </span>
          </button>
        )
      })}

      {/* Sans nom d'affichage, l'opt-in ne produit rien : `gamification_is_exposable`
          exige un nom renseigné. On le dit au lieu de laisser croire à une
          exposition qui n'aura pas lieu. */}
      {!hasName && value !== 'private' && (
        <p className="flex items-start gap-1.5 rounded-2xl border border-warn-bd bg-warn-bg-muted px-3.5 py-2.5 text-[11px] leading-relaxed text-warn-body">
          <Lock className="mt-0.5 h-3 w-3 shrink-0 text-warn" />
          <span>
            {lang === 'fr'
              ? 'Indique ton prénom ci-dessus pour apparaître dans les classements.'
              : 'Add your first name above to appear on the boards.'}
          </span>
        </p>
      )}

      <p className="text-[10px] leading-relaxed text-fg-faint">
        {lang === 'fr'
          ? 'Réversible à tout moment. Aucune donnée de santé (RPE, fatigue, blessures, poids, charges) n’est jamais partagée.'
          : 'Reversible at any time. No health data (RPE, fatigue, injuries, weight, loads) is ever shared.'}
      </p>
    </div>
  )
}
