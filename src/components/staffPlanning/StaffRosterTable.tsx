import { ChevronRight } from 'lucide-react'
import type { AthleteStaffWeeklyView } from '../../types/staffPlanning'
import type { StaffRosterRowView } from './staffRosterModel'
import { countAlertsBySeverity } from './staffRosterModel'

const ORANGE = '#ff6b35'
const SURFACE_HIGH = '#1c2028'

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

function fatigueStyles(level: AthleteStaffWeeklyView['load']['fatigueLevel']): {
  label: string
  className: string
} {
  switch (level) {
    case 'very_high':
      return {
        label: 'Repos requis',
        className: 'bg-red-500/10 text-red-400',
      }
    case 'high':
      return {
        label: 'Attention',
        className: 'bg-amber-500/10 text-amber-400',
      }
    default:
      return {
        label: 'Prêt',
        className: 'bg-emerald-500/10 text-emerald-400',
      }
  }
}

function adherenceBarPct(athlete: AthleteStaffWeeklyView): number {
  const v = athlete.adherence.completionVsPlanned7d
  if (v === null || Number.isNaN(v)) return 0
  return Math.max(0, Math.min(100, Math.round(v * 100)))
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export interface StaffRosterTableProps {
  rows: StaffRosterRowView[]
  selectedAthleteId: string | null
  onSelectRow: (athleteId: string) => void
  loading?: boolean
}

export function StaffRosterTable({
  rows,
  selectedAthleteId,
  onSelectRow,
  loading,
}: StaffRosterTableProps) {
  if (loading) {
    return (
      <div
        className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-500 font-['Lexend']"
        data-testid="staff-roster-loading"
      >
        Chargement du groupe…
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div
        className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-500 font-['Lexend']"
        data-testid="staff-roster-empty"
      >
        Aucun joueur ne correspond aux filtres.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.06] -mx-1">
      <table className="w-full min-w-[640px] border-collapse text-left font-['Lexend']">
        <thead>
          <tr
            className="text-[10px] font-black uppercase tracking-widest text-slate-500"
            style={{ backgroundColor: `${SURFACE_HIGH}80` }}
          >
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
            const initials = getInitials(displayName)

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
                className={`group cursor-pointer border-b border-white/[0.04] transition-all hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset ${
                  selected ? 'bg-[#ff6b35]/[0.08]' : ''
                }`}
                style={selected ? { boxShadow: `inset 3px 0 0 ${ORANGE}` } : undefined}
              >
                {/* Player */}
                <td className="px-4 lg:px-6 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-[10px] shrink-0"
                      style={{ backgroundColor: SURFACE_HIGH }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="m-0 text-xs font-bold text-white uppercase tracking-tight leading-none truncate">
                        {displayName}
                      </p>
                      <p className="m-0 mt-0.5 text-[10px] text-slate-500 uppercase truncate">
                        {posShort[athlete.annualPlanning.positionGroup]}
                        {' · '}
                        {cycleShort[athlete.annualPlanning.cycle]}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Readiness badge */}
                <td className="px-3 lg:px-4 py-3">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide ${f.className}`}
                  >
                    {f.label}
                  </span>
                </td>

                {/* RPE (hidden on mobile) */}
                <td className="px-3 lg:px-4 py-3 hidden md:table-cell">
                  <span className="font-bold text-white tabular-nums text-xs">
                    {athlete.load.fatigueLevel === 'very_high'
                      ? '9.0+'
                      : athlete.load.fatigueLevel === 'high'
                        ? '8.0'
                        : '6.5'}
                  </span>
                </td>

                {/* Adherence bar */}
                <td className="px-3 lg:px-4 py-3 min-w-[100px]">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-[80px]">
                      <div
                        className="h-1.5 overflow-hidden rounded-full"
                        style={{ backgroundColor: SURFACE_HIGH }}
                        title={`${pct}% vs prévu (7 j)`}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              pct >= 85 ? '#34d399' : pct >= 50 ? ORANGE : '#f87171',
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold tabular-nums text-slate-400">
                      {pct}%
                    </span>
                  </div>
                </td>

                {/* Sessions 28d (hidden on mobile) */}
                <td className="px-3 lg:px-4 py-3 text-center hidden md:table-cell">
                  <span className="text-sm font-black tabular-nums text-white">
                    {athlete.adherence.completedSessionsLast28d}
                  </span>
                </td>

                {/* Alerts */}
                <td className="px-3 lg:px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1">
                    {counts.critical > 0 && (
                      <span
                        data-severity="critical"
                        className="inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500/20 px-1 text-[10px] font-black text-red-300"
                        title={`${counts.critical} alerte(s) critique(s)`}
                      >
                        {counts.critical}
                      </span>
                    )}
                    {counts.warning > 0 && (
                      <span
                        data-severity="warning"
                        className="inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-amber-500/15 px-1 text-[10px] font-black text-amber-300"
                        title={`${counts.warning} alerte(s) attention`}
                      >
                        {counts.warning}
                      </span>
                    )}
                    {athlete.load.acwrZone && athlete.load.acwrZone !== 'optimal' && (
                      <span className="rounded border border-white/10 px-1 py-0.5 text-[9px] font-bold uppercase text-slate-500 hidden lg:inline">
                        ACWR {athlete.load.acwrZone}
                      </span>
                    )}
                    {counts.critical === 0 && counts.warning === 0 && (
                      <span className="text-[10px] text-slate-600">—</span>
                    )}
                  </div>
                </td>

                {/* Chevron */}
                <td className="px-3 py-3 text-right">
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
