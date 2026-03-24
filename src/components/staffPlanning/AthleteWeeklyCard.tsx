import type { AthleteStaffWeeklyView } from '../../types/staffPlanning'
import { AthleteAlertsList } from './AthleteAlertsList'
import { AthleteMotherSessionsPreview } from './AthleteMotherSessionsPreview'

const accent = '#ff6b35'

const cycleFr: Record<AthleteStaffWeeklyView['annualPlanning']['cycle'], string> = {
  off_season: 'Hors-saison',
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
}

export function AthleteWeeklyCard({ athlete, displayName }: AthleteWeeklyCardProps) {
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

  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-4 text-neutral-100">
      <header className="mb-3 border-b border-white/10 pb-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="m-0 text-base font-semibold text-white">
              {displayName ?? id}
            </h3>
            <p className="m-0 mt-1 font-mono text-xs text-neutral-500">{id}</p>
          </div>
          <span
            className="mt-2 inline-flex w-fit rounded-full border px-2 py-0.5 text-[11px] font-medium sm:mt-0"
            style={{ borderColor: `${accent}66`, color: accent }}
          >
            {cycleFr[annualPlanning.cycle]} · {annualPlanning.weekLabel}
          </span>
        </div>
      </header>

      <div className="mb-3 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <span className="text-neutral-500">Groupe poste</span>
          <div className="font-medium">{posFr[annualPlanning.positionGroup]}</div>
        </div>
        <div>
          <span className="text-neutral-500">Fatigue</span>
          <div className="font-medium">{fatigueFr(load.fatigueLevel)}</div>
        </div>
        <div className="sm:col-span-2">
          <span className="text-neutral-500">Adhérence</span>
          <div className="font-medium">{adherenceLabel}</div>
        </div>
        <div className="sm:col-span-2 flex flex-wrap gap-2 text-xs">
          {annualPlanning.isMatchWeek && (
            <span className="rounded-md bg-[#ff6b35]/20 px-2 py-1 text-[#ff6b35]">
              Semaine de match
            </span>
          )}
          {nextMatch && <span className="rounded-md border border-white/15 px-2 py-1">{nextMatch}</span>}
        </div>
      </div>

      {mainWarnings.length > 0 && (
        <div className="mb-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            Points d’attention
          </div>
          <ul className="m-0 list-disc space-y-0.5 pl-4 text-sm text-amber-100">
            {mainWarnings.slice(0, 3).map((a, i) => (
              <li key={i}>{a.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
          Alertes
        </div>
        <AthleteAlertsList alerts={alerts} />
      </div>

      <AthleteMotherSessionsPreview motherSessions={motherSessions} />
    </article>
  )
}
