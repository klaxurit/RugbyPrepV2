import type { ViewMode } from '../hooks/useViewMode'

interface ViewModeToggleProps {
  viewMode: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
  return (
    <div className="viewmode-toggle" role="group" aria-label="Mode d'affichage">
      <button
        type="button"
        className={viewMode === 'compact' ? 'week-button active' : 'week-button'}
        onClick={() => onChange('compact')}
      >
        Compact
      </button>
      <button
        type="button"
        className={viewMode === 'detail' ? 'week-button active' : 'week-button'}
        onClick={() => onChange('detail')}
      >
        Détail
      </button>
    </div>
  )
}
