import { ChevronRight } from 'lucide-react'
import type { AthleteStaffWeeklyView } from '../../types/staffPlanning'
import type { StaffRosterRowView } from './staffRosterModel'
import { countAlertsBySeverity } from './staffRosterModel'
import { StaffAthleteAvatar } from './StaffAthleteAvatar'

const cycleShort: Record<AthleteStaffWeeklyView['annualPlanning']['cycle'], string> = {
  off_season: 'Inter-saison',
  pre_season: 'Pré-saison',
  in_season: 'En saison',
  playoffs: 'Playoffs',
}

const posShort: Record<AthleteStaffWeeklyView['annualPlanning']['positionGroup'], string> = {
  front_row: 'Avants',
  back_three: '3/4',
}

export type StaffRosterTheme = 'app' | 'dark'

function fatigueStyles(level: AthleteStaffWeeklyView['load']['fatigueLevel']): {
  label: string
  className: string
} {
  switch (level) {
    case 'very_high':
      return {
        label: 'Repos requis',
        className: 'bg-red-500/15 text-red-700 dark:text-red-300',
      }
    case 'high':
      return {
        label: 'Attention',
        className: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
      }
    default:
      return {
        label: 'Prêt',
        className: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300',
      }
  }
}

function adherenceBarPct(athlete: AthleteStaffWeeklyView): number {
  const v = athlete.adherence.completionVsPlanned7d
  if (v === null || Number.isNaN(v)) return 0
  return Math.max(0, Math.min(100, Math.round(v * 100)))
}

export interface StaffRosterTableProps {
  rows: StaffRosterRowView[]
  selectedAthleteId: string | null
  onSelectRow: (athleteId: string) => void
  loading?: boolean
  theme?: StaffRosterTheme
}

export function StaffRosterTable({
  rows,
  selectedAthleteId,
  onSelectRow,
  loading,
  theme = 'app',
}: StaffRosterTableProps) {
  const isDark = theme === 'dark'
  const wrapClass = isDark
    ? 'rounded-xl border border-white/[0.06]'
    : 'rounded-xl border border-brand-border bg-layer-5'
  const emptyClass = isDark
    ? 'rounded-xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400'
    : 'rounded-xl border border-brand-border bg-layer-5 p-8 text-center text-sm text-fg-muted'
  const headClass = isDark
    ? 'text-[10px] font-black uppercase tracking-widest text-slate-400 bg-[#1c2028]/50'
    : 'text-[10px] font-black uppercase tracking-widest text-fg-muted bg-layer-10'
  const rowHover = isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-layer-10'
  const rowBorder = isDark ? 'border-white/[0.04]' : 'border-brand-border'
  const nameClass = isDark ? 'text-white' : 'text-fg'
  const subClass = isDark ? 'text-slate-400' : 'text-fg-muted'
  const valueClass = isDark ? 'text-white' : 'text-fg'
  const mutedClass = isDark ? 'text-slate-400' : 'text-fg-muted'
  const barTrack = isDark ? 'bg-[#1c2028]' : 'bg-layer-10'
  const selectedRow = isDark ? 'bg-[#ff6b35]/[0.08]' : 'bg-brand/10'

  if (loading) {
    return (
      <div className={emptyClass} data-testid="staff-roster-loading">
        Chargement du groupe…
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className={emptyClass} data-testid="staff-roster-empty">
        Aucun joueur ne correspond aux filtres.
      </div>
    )
  }

  return (
    <div className={`overflow-x-auto -mx-1 ${wrapClass}`}>
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className={headClass}>
            <th className="px-4 lg:px-6 py-3">Joueur</th>
            <th className="px-3 lg:px-4 py-3">Readiness</th>
            <th className="px-3 lg:px-4 py-3 hidden md:table-cell">RPE</th>
            <th className="px-3 lg:px-4 py-3">Adhérence</th>
            <th className="px-3 lg:px-4 py-3 text-center hidden md:table-cell">28j</th>
            <th className="px-3 lg:px-4 py-3">Signaux</th>
            <th className="px-3 py-3 w-10" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ athlete, displayName }) => {
            const id = athlete.identity.athleteId ?? ''
            const selected = id === selectedAthleteId
            const f = fatigueStyles(athlete.load.fatigueLevel)
            const counts = countAlertsBySeverity(athlete)
            const pct = adherenceBarPct(athlete)

            return (
              <tr
                key={id || displayName}
                data-testid="staff-roster-row"
                data-athlete-id={id}
                tabIndex={0}
                aria-selected={selected}
                aria-label={`Ouvrir la fiche de ${displayName}`}
                onClick={() => id && onSelectRow(id)}
                onKeyDown={(e) => {
                  if (!id) return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectRow(id)
                  }
                }}
                className={`group cursor-pointer border-b ${rowBorder} transition-all ${rowHover} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 ${
                  selected ? selectedRow : ''
                }`}
                style={selected ? { boxShadow: 'inset 3px 0 0 var(--color-brand, #7a1f2e)' } : undefined}
              >
                <td className="px-4 lg:px-6 py-3">
                  <div className="flex items-center gap-2.5">
                    <StaffAthleteAvatar
                      name={displayName}
                      avatarUrl={athlete.avatarUrl}
                      size="sm"
                      theme={theme}
                    />
                    <div className="min-w-0">
                      <p className={`m-0 text-sm font-bold leading-tight truncate ${nameClass}`}>
                        {displayName}
                      </p>
                      <p className={`m-0 mt-0.5 text-[10px] uppercase truncate ${subClass}`}>
                        {posShort[athlete.annualPlanning.positionGroup]}
                        {' · '}
                        {cycleShort[athlete.annualPlanning.cycle]}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-3 lg:px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide ${f.className}`}
                  >
                    {f.label}
                  </span>
                </td>

                <td className={`px-3 lg:px-4 py-3 hidden md:table-cell font-bold tabular-nums text-xs ${valueClass}`}>
                  {athlete.load.fatigueLevel === 'very_high'
                    ? '9.0+'
                    : athlete.load.fatigueLevel === 'high'
                      ? '8.0'
                      : '6.5'}
                </td>

                <td className="px-3 lg:px-4 py-3 min-w-[100px]">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-[80px]">
                      <div
                        className={`h-1.5 overflow-hidden rounded-full ${barTrack}`}
                        title={`${pct}% vs prévu (7 j)`}
                      >
                        <div
                          className="h-full rounded-full transition-all bg-brand"
                          style={{
                            width: `${pct}%`,
                            opacity: pct >= 85 ? 1 : pct >= 50 ? 0.85 : 0.7,
                          }}
                        />
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold tabular-nums ${mutedClass}`}>{pct}%</span>
                  </div>
                </td>

                <td className={`px-3 lg:px-4 py-3 text-center hidden md:table-cell text-sm font-black tabular-nums ${valueClass}`}>
                  {athlete.adherence.completedSessionsLast28d}
                </td>

                <td className="px-3 lg:px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1">
                    {counts.critical > 0 && (
                      <span
                        data-severity="critical"
                        className="inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500/20 px-1 text-[10px] font-black text-red-700"
                        title={`${counts.critical} alerte(s) critique(s)`}
                      >
                        {counts.critical}
                      </span>
                    )}
                    {counts.warning > 0 && (
                      <span
                        data-severity="warning"
                        className="inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-amber-500/20 px-1 text-[10px] font-black text-amber-800"
                        title={`${counts.warning} alerte(s) attention`}
                      >
                        {counts.warning}
                      </span>
                    )}
                    {counts.critical === 0 && counts.warning === 0 && (
                      <span className={`text-[10px] ${mutedClass}`}>—</span>
                    )}
                  </div>
                </td>

                <td className="px-3 py-3 text-right">
                  <ChevronRight className={`w-4 h-4 ${mutedClass} group-hover:text-fg transition-colors`} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
