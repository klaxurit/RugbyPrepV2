import { Icon } from '../ui'

export type PrefillChipVariant = 'previous' | 'suggestion' | 'carry'

interface ExercisePrefillChipProps {
  variant: PrefillChipVariant
  label: string
  value: string
  onClick: () => void
  testId: string
}

const VARIANT_CLASS: Record<PrefillChipVariant, string> = {
  previous:
    'border-fg/12 bg-layer-10 text-fg/75 hover:bg-layer-20',
  suggestion:
    'border-brand/25 bg-brand/[0.06] text-brand hover:bg-brand/10',
  carry:
    'border-brand/20 bg-brand/[0.04] text-brand/90 hover:bg-brand/8',
}

const VARIANT_ICON: Record<PrefillChipVariant, 'calendar' | 'plus'> = {
  previous: 'calendar',
  suggestion: 'plus',
  carry: 'plus',
}

export function ExercisePrefillChip({
  variant,
  label,
  value,
  onClick,
  testId,
}: ExercisePrefillChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`flex min-h-[32px] w-full items-center gap-2 rounded-xl border px-3 py-2 text-left active:scale-[0.99] transition-transform rf-focus-ring ${VARIANT_CLASS[variant]}`}
    >
      <Icon
        name={VARIANT_ICON[variant]}
        size={12}
        strokeWidth={2.2}
        className="flex-shrink-0 opacity-70"
      />
      <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] opacity-80">
        {label}
      </span>
      <span className="ml-auto text-[12px] font-bold tabular-nums">{value}</span>
    </button>
  )
}
