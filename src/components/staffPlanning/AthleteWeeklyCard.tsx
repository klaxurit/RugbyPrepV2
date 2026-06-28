import type { AthleteStaffWeeklyView } from '../../types/staffPlanning'
import { AthleteAlertsList } from './AthleteAlertsList'
import { AthleteMotherSessionsPreview } from './AthleteMotherSessionsPreview'
import type { StaffRosterTheme } from './StaffRosterTable'

const cycleFr: Record<AthleteStaffWeeklyView['annualPlanning']['cycle'], string> = {
  off_season: 'Inter-saison',
  pre_season: 'Pré-saison',
  in_season: 'En saison',
  playoffs: 'Playoffs',
}

const posFr: Record<AthleteStaffWeeklyView['annualPlanning']['positionGroup'], string> = {
  front_row: 'Avants (première ligne)',
  back_three: 'Trois-quarts',
}

function fatigueFr(level: AthleteStaffWeeklyView['load']['fatigueLevel']): string {
  if (level === 'very_high') return 'Très élevée'
  if (level === 'high') return 'Élevée'
  return 'Normale'
}

export interface AthleteWeeklyCardProps {
  athlete: AthleteStaffWeeklyView
  displayName?: string
  theme?: StaffRosterTheme
}

export function AthleteWeeklyCard({ athlete, displayName, theme = 'app' }: AthleteWeeklyCardProps) {
  const isDark = theme === 'dark'
  const { identity, annualPlanning, load, adherence, alerts, motherSessions } = athlete
  const id = identity.athleteId ?? '—'
  const mainWarnings = alerts.filter((a) => a.severity === 'warning' || a.severity === 'critical')

  const nextMatch =
    annualPlanning.daysUntilNextMatch !== null
      ? `J-${annualPlanning.daysUntilNextMatch} prochain match`
      : null

  const adherenceLabel =
    adherence.completionVsPlanned7d !== null
      ? `${adherence.completedSessionsLast7d} réalisées / ${adherence.plannedSessionsThisWeek} prévues (7j)`
      : `${adherence.completedSessionsLast7d} réalisées · prévu N/A`

  const cardClass = isDark
    ? 'rounded-xl border border-white/10 bg-white/5 text-neutral-100'
    : 'rounded-xl border border-brand-border bg-layer-5 text-fg'
  const headerBorder = isDark ? 'border-white/10' : 'border-brand-border'
  const labelClass = isDark ? 'text-neutral-500' : 'text-fg-muted'
  const titleClass = isDark ? 'text-white' : 'text-fg'
  const idClass = isDark ? 'text-neutral-500 font-mono' : 'text-fg-muted font-mono'
  const badgeAccent = isDark
    ? 'border-[#ff6b35]/40 text-[#ff6b35]'
    : 'border-brand/30 text-brand'
  const matchWeekBadge = isDark
    ? 'bg-[#ff6b35]/20 text-[#ff6b35]'
    : 'bg-brand/10 text-brand'
  const matchBadge = isDark ? 'border-white/15' : 'border-brand-border'
  const warningText = isDark ? 'text-amber-100' : 'text-amber-800'

  return (
    <article className={`${cardClass} p-4`}>
      <header className={`mb-3 border-b pb-3 ${headerBorder}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className={`m-0 text-base font-semibold truncate ${titleClass}`}>
              {displayName ?? id}
            </h3>
            <p className={`m-0 mt-1 text-xs truncate ${idClass}`}>{id}</p>
          </div>
          <span
            className={`inline-flex w-fit max-w-full rounded-full border px-2 py-0.5 text-[11px] font-medium ${badgeAccent}`}
          >
            {cycleFr[annualPlanning.cycle]} · {annualPlanning.weekLabel}
          </span>
        </div>
      </header>

      <div className="mb-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <span className={`text-xs ${labelClass}`}>Groupe poste</span>
          <div className="font-medium">{posFr[annualPlanning.positionGroup]}</div>
        </div>
        <div>
          <span className={`text-xs ${labelClass}`}>Fatigue</span>
          <div className="font-medium">{fatigueFr(load.fatigueLevel)}</div>
        </div>
        <div className="sm:col-span-2">
          <span className={`text-xs ${labelClass}`}>Adhérence</span>
          <div className="font-medium">{adherenceLabel}</div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs sm:col-span-2">
          {annualPlanning.isMatchWeek && (
            <span className={`rounded-md px-2 py-1 ${matchWeekBadge}`}>Semaine de match</span>
          )}
          {nextMatch && (
            <span className={`rounded-md border px-2 py-1 ${matchBadge}`}>{nextMatch}</span>
          )}
        </div>
      </div>

      {mainWarnings.length > 0 && (
        <div className="mb-3">
          <div className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${labelClass}`}>
            Points d’attention
          </div>
          <ul className={`m-0 list-disc space-y-0.5 pl-4 text-sm ${warningText}`}>
            {mainWarnings.slice(0, 3).map((a, i) => (
              <li key={i}>{a.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-3">
        <div className={`mb-2 text-[10px] font-semibold uppercase tracking-wide ${labelClass}`}>
          Alertes
        </div>
        <AthleteAlertsList alerts={alerts} theme={theme} />
      </div>

      <AthleteMotherSessionsPreview motherSessions={motherSessions} theme={theme} />
    </article>
  )
}
