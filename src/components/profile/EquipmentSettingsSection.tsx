import { Building2, Dumbbell, Home, StretchHorizontal } from 'lucide-react'
import { CollapsibleSection } from '../ui'
import type { UserProfile } from '../../types/training'
import { tr, type Lang } from '../../i18n/appLabels'
import {
  EQUIPMENT_PRESET_DEFS,
  inferEquipmentPreset,
  resolveEquipmentFromPreset,
  type EquipmentPreset,
} from '../../services/equipment/equipmentPresets'

const PRESET_ICONS = {
  bodyweight: Home,
  bands: StretchHorizontal,
  home_gym: Dumbbell,
  full_gym: Building2,
} as const

type EquipmentSettingsSectionProps = {
  profile: UserProfile
  updateProfile: (patch: Partial<UserProfile>) => void
  lang: Lang
}

export function EquipmentSettingsSection({
  profile,
  updateProfile,
  lang,
}: EquipmentSettingsSectionProps) {
  const activePreset = inferEquipmentPreset(profile.equipment)

  const handleSelect = (preset: EquipmentPreset) => {
    if (preset === activePreset) return
    updateProfile({ equipment: resolveEquipmentFromPreset(preset) })
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

      <div className="space-y-2">
        {EQUIPMENT_PRESET_DEFS.map((opt) => {
          const selected = activePreset === opt.value
          const Icon = PRESET_ICONS[opt.value]
          return (
            <button
              key={opt.value}
              type="button"
              data-testid={`profile-equipment-${opt.value}`}
              onClick={() => handleSelect(opt.value)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all active:scale-[.98] rf-focus-ring ${
                selected
                  ? 'border-brand bg-brand-soft shadow-[0_0_0_3px_var(--color-accent-glow)]'
                  : 'border-border-app bg-layer-5 hover:border-border-dashed-app'
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${selected ? 'text-brand' : 'text-fg-muted'}`}
                strokeWidth={2.25}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-black ${selected ? 'text-brand-tint' : 'text-fg'}`}>
                  {tr(opt.labelKey, lang)}
                </p>
                <p className="text-[10px] text-fg-muted mt-0.5 leading-snug">{tr(opt.subKey, lang)}</p>
              </div>
            </button>
          )
        })}
      </div>
    </CollapsibleSection>
  )
}
