import { Mail, Ruler, Settings2 } from 'lucide-react'
import { CollapsibleSection } from '../ui'
import type { UserProfile } from '../../types/training'
import { tr, type Lang } from '../../i18n/appLabels'
import { newsletterPreferencePatch } from '../../services/auth/accountUpgradePrompts'

const LANGUAGE_OPTIONS = [
  { value: 'fr' as const, label: 'Français', sub: 'Programme affiché en français' },
  { value: 'en' as const, label: 'English', sub: 'Program and exercises in english' },
]

type ProfilePreferencesSectionProps = {
  profile: UserProfile
  updateProfile: (patch: Partial<UserProfile>) => void
  lang: Lang
  heightInput: string
  weightInput: string
  onHeightInputChange: (value: string) => void
  onWeightInputChange: (value: string) => void
  morphoBmi: number | null
}

export function ProfilePreferencesSection({
  profile,
  updateProfile,
  lang,
  heightInput,
  weightInput,
  onHeightInputChange,
  onWeightInputChange,
  morphoBmi,
}: ProfilePreferencesSectionProps) {
  return (
    <CollapsibleSection
      title={tr('profile_section_preferences', lang)}
      subtitle={tr('profile_section_preferences_sub', lang)}
      icon={<Settings2 className="w-4 h-4" />}
      iconClassName="bg-layer-10 text-fg-soft border border-border-app"
      testId="profile-section-preferences"
      defaultOpen={false}
    >
      <div className="space-y-3" data-testid="profile-section-language">
        <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">{tr('profile_section_lang', lang)}</label>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGE_OPTIONS.map((opt) => {
            const active = (profile.preferredLanguage ?? 'fr') === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateProfile({ preferredLanguage: opt.value })}
                className={`py-2.5 px-3 rounded-2xl text-left transition-all ${
                  active
                    ? 'bg-brand text-on-brand shadow-sm'
                    : 'bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20'
                }`}
              >
                <p className="text-xs font-black">{opt.label}</p>
                <p className={`mt-0.5 text-[10px] ${active ? 'text-on-brand/80' : 'text-fg-muted'}`}>{opt.sub}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-border-app" data-testid="profile-section-newsletter">
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-brand" />
          <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">{tr('profile_section_newsletter', lang)}</label>
        </div>
        <p className="text-xs text-fg-muted leading-relaxed">{tr('profile_section_newsletter_sub', lang)}</p>
        <button
          type="button"
          role="switch"
          aria-checked={profile.newsletterOptIn === true}
          onClick={() => updateProfile(newsletterPreferencePatch(profile.newsletterOptIn !== true, 'profile'))}
          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors rf-focus-ring ${
            profile.newsletterOptIn === true
              ? 'border-brand/30 bg-brand/10'
              : 'border-border-app bg-layer-5 hover:border-brand/30'
          }`}
        >
          <span className="text-xs font-black text-fg">
            {profile.newsletterOptIn === true
              ? tr('profile_section_newsletter_on', lang)
              : tr('profile_section_newsletter_off', lang)}
          </span>
          <span
            className={`relative h-6 w-11 rounded-full transition-colors ${
              profile.newsletterOptIn === true ? 'bg-brand' : 'bg-layer-20'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                profile.newsletterOptIn === true ? 'left-5' : 'left-0.5'
              }`}
            />
          </span>
        </button>
      </div>

      <div className="space-y-3 pt-4 border-t border-border-app" data-testid="profile-section-morphology">
        <div className="flex items-center gap-2">
          <Ruler className="w-3.5 h-3.5 text-violet-600" />
          <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">{tr('profile_section_morpho', lang)}</label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">{tr('profile_label_height', lang)}</label>
            <input
              type="number"
              inputMode="numeric"
              min={140}
              max={230}
              value={heightInput}
              onChange={(e) => onHeightInputChange(e.target.value)}
              onBlur={() => {
                const v = parseInt(heightInput, 10)
                if (!isNaN(v) && v >= 140 && v <= 230) updateProfile({ heightCm: v })
              }}
              placeholder="182"
              className="w-full h-11 rounded-2xl border border-border-app bg-layer-5 px-3 text-sm font-black text-fg placeholder:text-fg-ghost focus:outline-none focus:border-brand rf-focus-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">{tr('profile_label_weight', lang)}</label>
            <input
              type="number"
              inputMode="decimal"
              min={40}
              max={200}
              step={0.5}
              value={weightInput}
              onChange={(e) => onWeightInputChange(e.target.value)}
              onBlur={() => {
                const v = parseFloat(weightInput.replace(',', '.'))
                if (!isNaN(v) && v >= 40 && v <= 200) updateProfile({ weightKg: v })
              }}
              placeholder="95"
              className="w-full h-11 rounded-2xl border border-border-app bg-layer-5 px-3 text-sm font-black text-fg placeholder:text-fg-ghost focus:outline-none focus:border-brand rf-focus-ring"
            />
          </div>
        </div>

        {morphoBmi != null && (() => {
          const bmi = morphoBmi
          const isForward =
            profile.rugbyPosition === 'FRONT_ROW' ||
            profile.rugbyPosition === 'SECOND_ROW' ||
            profile.rugbyPosition === 'BACK_ROW'
          const label =
            bmi < 20
              ? tr('bmi_underweight', lang)
              : bmi < 24
                ? tr(isForward ? 'profile_bmi_light_forward' : 'bmi_optimal_back', lang)
                : bmi < 27
                  ? tr(isForward ? 'bmi_adequate_forward' : 'bmi_above_back', lang)
                  : bmi < 31
                    ? tr(isForward ? 'bmi_optimal_forward' : 'bmi_above_norm', lang)
                    : tr(isForward ? 'bmi_big_forward' : 'bmi_surcharge_back', lang)
          return (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-violet-50 border border-violet-200">
              <div>
                <p className="text-xs font-bold text-violet-600 uppercase tracking-wide">IMC</p>
                <p className="text-sm font-bold text-fg-emphasis mt-0.5">{label}</p>
              </div>
              <span className="text-2xl font-black text-violet-600">{bmi.toFixed(1)}</span>
            </div>
          )
        })()}
      </div>
    </CollapsibleSection>
  )
}
