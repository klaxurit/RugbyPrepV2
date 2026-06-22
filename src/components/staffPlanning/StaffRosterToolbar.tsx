import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import type {
  AdherenceFilter,
  FatigueFilter,
  MatchWeekFilter,
  PositionFilter,
  SortKey,
  StaffRosterFilters,
} from './staffRosterModel'
import type { StaffRosterTheme } from './StaffRosterTable'

export interface StaffRosterToolbarProps {
  filters: StaffRosterFilters
  onFiltersChange: (next: StaffRosterFilters) => void
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  onSortKeyChange: (key: SortKey) => void
  onSortDirToggle: () => void
  resultCount: number
  totalCount: number
  theme?: StaffRosterTheme
}

const sortLabels: Record<SortKey, string> = {
  name: 'Nom',
  fatigue: 'Fatigue',
  adherence: 'Adhérence',
  sessions28: 'Séances 28j',
}

export function StaffRosterToolbar({
  filters,
  onFiltersChange,
  sortKey,
  sortDir,
  onSortKeyChange,
  onSortDirToggle,
  resultCount,
  totalCount,
  theme = 'app',
}: StaffRosterToolbarProps) {
  const set = (patch: Partial<StaffRosterFilters>) => onFiltersChange({ ...filters, ...patch })
  const isDark = theme === 'dark'

  const inputClass = isDark
    ? 'w-full rounded-lg border border-white/10 bg-[#0b0e14] pl-9 pr-3 py-1.5 text-[10px] font-bold text-white placeholder:text-slate-500 focus:ring-1 focus:outline-none'
    : 'w-full rounded-lg border border-brand-border bg-layer-10 pl-9 pr-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:ring-1 focus:outline-none focus:ring-brand/30'
  const selectClass = isDark
    ? 'rounded-lg border border-white/10 bg-[#0b0e14] px-2 py-1.5 text-[10px] font-bold uppercase tracking-tight text-white focus:ring-1 focus:outline-none min-w-0'
    : 'rounded-lg border border-brand-border bg-layer-10 px-2 py-1.5 text-xs font-semibold text-fg focus:ring-1 focus:outline-none focus:ring-brand/30 min-w-0'
  const iconMuted = isDark ? 'text-slate-500' : 'text-fg-muted'
  const countClass = isDark ? 'text-slate-500' : 'text-fg-muted'
  const divider = isDark ? 'bg-white/10' : 'bg-brand-border'
  const sortBtn = isDark
    ? 'rounded-md border border-white/10 bg-[#0b0e14] px-2 py-1.5 text-[10px] font-bold text-slate-400 hover:text-white'
    : 'rounded-md border border-brand-border bg-layer-10 px-2 py-1.5 text-xs font-bold text-fg-muted hover:text-fg'

  return (
    <div data-testid="staff-roster-toolbar" className="space-y-3 overflow-hidden">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${iconMuted}`} />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Rechercher joueur…"
            className={inputClass}
            data-testid="staff-roster-search"
          />
        </div>
        <span className={`text-[10px] font-bold tabular-nums whitespace-nowrap ${countClass}`}>
          {resultCount}/{totalCount}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal className={`w-3.5 h-3.5 shrink-0 ${iconMuted}`} />

        <select
          className={selectClass}
          value={filters.fatigue}
          onChange={(e) => set({ fatigue: e.target.value as FatigueFilter })}
          data-testid="staff-filter-fatigue"
        >
          <option value="all">Fatigue</option>
          <option value="normal">Normale</option>
          <option value="high">Élevée</option>
          <option value="very_high">Très élevée</option>
        </select>

        <select
          className={selectClass}
          value={filters.adherence}
          onChange={(e) => set({ adherence: e.target.value as AdherenceFilter })}
          data-testid="staff-filter-adherence"
        >
          <option value="all">Adhérence</option>
          <option value="low">Faible</option>
          <option value="ok">Correcte</option>
        </select>

        <select
          className={selectClass}
          value={filters.position}
          onChange={(e) => set({ position: e.target.value as PositionFilter })}
          data-testid="staff-filter-position"
        >
          <option value="all">Postes</option>
          <option value="front_row">Avants</option>
          <option value="back_three">3/4</option>
        </select>

        <select
          className={selectClass}
          value={filters.matchWeek}
          onChange={(e) => set({ matchWeek: e.target.value as MatchWeekFilter })}
          data-testid="staff-filter-match-week"
        >
          <option value="all">Match</option>
          <option value="yes">Oui</option>
          <option value="no">Non</option>
        </select>

        <div className={`h-4 w-px hidden sm:block ${divider}`} />

        <div className="flex items-center gap-1.5">
          <ArrowUpDown className={`w-3.5 h-3.5 shrink-0 ${iconMuted}`} />
          <select
            className={selectClass}
            value={sortKey}
            onChange={(e) => onSortKeyChange(e.target.value as SortKey)}
            data-testid="staff-sort-key"
          >
            {(Object.keys(sortLabels) as SortKey[]).map((k) => (
              <option key={k} value={k}>
                {sortLabels[k]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onSortDirToggle}
            className={sortBtn}
            title={sortDir === 'asc' ? 'Ordre croissant' : 'Ordre décroissant'}
            data-testid="staff-sort-dir"
          >
            {sortDir === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>
    </div>
  )
}
