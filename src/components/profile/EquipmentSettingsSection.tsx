import { Building2, Check, Dumbbell } from 'lucide-react'
import { CollapsibleSection } from '../ui'
import type { UserProfile } from '../../types/training'
import { tr, type Lang } from '../../i18n/appLabels'
import { GYM_PRESET } from '../../services/equipment/equipmentPresets'
import {
  BODYWEIGHT_EQUIPMENT_CHECKS,
  isChecklistItemActive,
  isFullGymEquipment,
  toggleBodyweightCheck,
  type BodyweightEquipmentCheckId,
} from '../../services/equipment/bodyweightEquipmentChecklist'
import { bodyweightProgramMissingMorphology } from '../../services/bodyweight/bodyweightMorphologyWarning'
import { BodyweightMorphologyBanner } from './BodyweightMorphologyBanner'

type EquipmentSettingsSectionProps = {
  profile: UserProfile
  updateProfile: (patch: Partial<UserProfile>) => void
  lang: Lang
  /** Charges d'entrée BW = fonctionnalité Premium uniquement. */
  isPremium?: boolean
}

export function EquipmentSettingsSection({
  profile,
  updateProfile,
  lang,
  isPremium = false,
}: EquipmentSettingsSectionProps) {
  const fullGym = isFullGymEquipment(profile.equipment)
  const showMorphoWarning = isPremium && bodyweightProgramMissingMorphology(profile)

  const handleToggleCheck = (checkId: BodyweightEquipmentCheckId) => {
    const def = BODYWEIGHT_EQUIPMENT_CHECKS.find((item) => item.id === checkId)
    if (!def) return
    const enabled = !isChecklistItemActive(profile.equipment, def)
    updateProfile({ equipment: toggleBodyweightCheck(profile.equipment, checkId, enabled) })
  }

  const handleSelectFullGym = () => {
    if (fullGym) return
    updateProfile({ equipment: [...GYM_PRESET] })
  }

  return (
    <CollapsibleSection
      title={tr('profile_section_equipment', lang)}
      subtitle={tr('profile_section_equipment_sub', lang)}
      icon={<Dumbbell className="w-4 h-4" />}
      iconClassName="bg-brand-soft text-brand-tint border border-brand-border"
      testId="profile-section-equipment"
      defaultOpen
    >
      <p className="text-[11px] text-fg-muted leading-relaxed" data-testid="profile-equipment-hint">
        {tr('profile_equipment_stay_in_program', lang)}
      </p>

      {showMorphoWarning ? <BodyweightMorphologyBanner lang={lang} /> : null}

      <div className="space-y-1.5" data-testid="profile-equipment-checklist">
        {BODYWEIGHT_EQUIPMENT_CHECKS.map((item) => {
          const checked = isChecklistItemActive(profile.equipment, item)
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`profile-equipment-check-${item.id}`}
              aria-pressed={checked}
              onClick={() => handleToggleCheck(item.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-2xl border-2 text-left transition-all active:scale-[.98] rf-focus-ring ${
                checked && !fullGym
                  ? 'border-brand bg-brand-soft shadow-[0_0_0_3px_var(--color-accent-glow)]'
                  : 'border-border-app bg-layer-5 hover:border-border-dashed-app'
              }`}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                  checked && !fullGym
                    ? 'border-brand bg-brand text-white'
                    : 'border-border-app bg-layer-3'
                }`}
                aria-hidden
              >
                {checked && !fullGym ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-black ${checked && !fullGym ? 'text-brand-tint' : 'text-fg'}`}>
                  {tr(item.labelKey, lang)}
                </p>
                <p className="text-[10px] text-fg-muted mt-0.5 leading-snug">{tr(item.hintKey, lang)}</p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="pt-1">
        <button
          type="button"
          data-testid="profile-equipment-full_gym"
          onClick={handleSelectFullGym}
          className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all active:scale-[.98] rf-focus-ring ${
            fullGym
              ? 'border-brand bg-brand-soft shadow-[0_0_0_3px_var(--color-accent-glow)]'
              : 'border-border-app bg-layer-5 hover:border-border-dashed-app'
          }`}
        >
          <Building2
            className={`w-4 h-4 flex-shrink-0 ${fullGym ? 'text-brand' : 'text-fg-muted'}`}
            strokeWidth={2.25}
          />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-black ${fullGym ? 'text-brand-tint' : 'text-fg'}`}>
              {tr('equipment_full_gym_cta', lang)}
            </p>
            <p className="text-[10px] text-fg-muted mt-0.5 leading-snug">
              {tr('equipment_full_gym_cta_sub', lang)}
            </p>
          </div>
        </button>
      </div>
    </CollapsibleSection>
  )
}
