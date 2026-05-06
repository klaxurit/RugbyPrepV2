export type WeekViewMode = 'week' | 'month'

interface WeekViewToggleProps {
  value: WeekViewMode
  onChange: (next: WeekViewMode) => void
  className?: string
}

const ITEMS: Array<{ id: WeekViewMode; label: string }> = [
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
]

/**
 * Toggle Semaine ↔ Mois — pill bordeaux/cream-deep, esprit éditorial.
 */
export function WeekViewToggle({ value, onChange, className = '' }: WeekViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Vue semaine ou mois"
      className={`inline-flex rounded-[10px] bg-paper-deep p-[3px] ${className}`}
    >
      {ITEMS.map((t) => {
        const isActive = value === t.id
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(t.id)}
            className={`rounded-[8px] px-4 py-1.5 text-[12px] font-bold tracking-[0.02em] transition-colors rf-focus-ring ${
              isActive ? 'bg-brand text-app' : 'bg-transparent text-fg'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
