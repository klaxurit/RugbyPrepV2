import type { InjurySubstitution, InjurySubstitutionArea } from '../../types/motherSession'
import type { AppLang } from '../../services/motherSession/motherSessionLabels'
import { msLabel } from '../../services/motherSession/motherSessionLabels'
import { MotherSessionCollapsible } from './MotherSessionCollapsible'

const AREA_ORDER: InjurySubstitutionArea[] = ['shoulder_pain', 'knee_pain', 'low_back_pain']

const AREA_LABEL_KEY: Record<InjurySubstitutionArea, string> = {
  shoulder_pain: 'shoulder',
  knee_pain: 'knee',
  low_back_pain: 'low_back',
}

function SubList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) {
    return (
      <div className="mt-2">
        <p className="text-xs font-semibold text-fg-muted">{label}</p>
        <p className="mt-1 text-sm text-fg-faint">—</p>
      </div>
    )
  }
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-brand-tint">{label}</p>
      <ul className="mt-1.5 space-y-1">
        {items.map((line, i) => (
          <li key={i} className="text-sm text-fg-secondary">
            {line}
          </li>
        ))}
      </ul>
    </div>
  )
}

function InjuryAreaCard({ substitution, lang }: { substitution: InjurySubstitution; lang: AppLang }) {
  return (
    <div className="rounded-xl border border-border-app bg-black/15 p-3">
      <h3 className="text-sm font-semibold text-fg">{msLabel(AREA_LABEL_KEY[substitution.area], lang)}</h3>
      <SubList label={msLabel('remove', lang)} items={substitution.remove} />
      <SubList label={msLabel('replace', lang)} items={substitution.replaceWith} />
      <SubList label={msLabel('rehab', lang)} items={substitution.rehabFinisher} />
    </div>
  )
}

type MotherSessionInjurySubsProps = {
  injurySubstitutions: InjurySubstitution[]
  lang?: AppLang
}

export function MotherSessionInjurySubs({ injurySubstitutions, lang = 'fr' }: MotherSessionInjurySubsProps) {
  if (!injurySubstitutions.length) return null

  const byArea = new Map(injurySubstitutions.map((s) => [s.area, s]))

  return (
    <MotherSessionCollapsible title={msLabel('injury_substitutions', lang)} defaultOpen={false}>
      <div className="space-y-4">
        {AREA_ORDER.map((area) => {
          const sub = byArea.get(area)
          if (!sub) return null
          return <InjuryAreaCard key={area} substitution={sub} lang={lang} />
        })}
      </div>
    </MotherSessionCollapsible>
  )
}
