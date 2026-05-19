import type { MatchKind } from '../../types/training'

const COPY: Record<
  'fr' | 'en',
  { league: string; cup_final: string; friendly: string }
> = {
  fr: {
    league: 'Championnat',
    cup_final: 'Coupe / phase finale',
    friendly: 'Amical',
  },
  en: {
    league: 'League',
    cup_final: 'Cup / knockouts',
    friendly: 'Friendly',
  },
}

export interface MatchKindPickerProps {
  lang: 'fr' | 'en'
  selected?: MatchKind | null
  disabled?: boolean
  onSelect: (kind: MatchKind) => void
  testIdPrefix?: string
}

export function MatchKindPicker({
  lang,
  selected,
  disabled,
  onSelect,
  testIdPrefix = 'match-kind',
}: MatchKindPickerProps) {
  const labels = COPY[lang]
  return (
    <div className="flex flex-col gap-2">
      {(['league', 'cup_final', 'friendly'] as const).map((kind) => {
        const isSelected = selected === kind
        return (
          <button
            key={kind}
            type="button"
            disabled={disabled}
            data-testid={`${testIdPrefix}-${kind}`}
            onClick={() => onSelect(kind)}
            className={`w-full rounded-2xl border px-4 py-3 text-left text-[13px] font-black transition-colors rf-focus-ring disabled:opacity-50 ${
              isSelected
                ? 'border-brand-border-strong bg-brand-soft text-brand-tint ring-1 ring-brand-border'
                : 'border-border-app bg-layer-5 text-fg hover:border-brand-border-strong'
            }`}
          >
            {labels[kind]}
          </button>
        )
      })}
    </div>
  )
}
