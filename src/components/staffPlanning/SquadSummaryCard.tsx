import type { SquadWeeklySummary } from '../../types/staffPlanning'

const accent = '#ff6b35'

const cycleLabel: Record<keyof SquadWeeklySummary['byCycle'], string> = {
  off_season: 'Hors-saison',
  pre_season: 'Pré-saison',
  in_season: 'En saison',
  playoffs: 'Playoffs',
}

export interface SquadSummaryCardProps {
  summary: SquadWeeklySummary | null
  loading?: boolean
}

export function SquadSummaryCard({ summary, loading }: SquadSummaryCardProps) {
  if (loading) {
    return (
      <section
        className="rounded-xl border border-white/10 bg-white/5 p-4 text-neutral-200"
        aria-busy="true"
      >
        <p className="m-0 text-sm opacity-70">Chargement du résumé équipe…</p>
      </section>
    )
  }

  if (!summary) return null

  return (
    <section
      className="rounded-xl border border-white/10 bg-white/5 p-4 text-neutral-100"
      data-testid="squad-summary-card"
    >
      <h2 className="m-0 mb-3 text-lg font-semibold tracking-tight" style={{ color: accent }}>
        Résumé groupe
      </h2>
      <p className="m-0 mb-4 text-2xl font-bold text-white">{summary.totalAthletes} athlètes</p>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(summary.byCycle) as (keyof SquadWeeklySummary['byCycle'])[]).map((key) => (
          <div
            key={key}
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center"
          >
            <div className="text-xs uppercase tracking-wide text-neutral-400">{cycleLabel[key]}</div>
            <div className="text-lg font-semibold text-white">{summary.byCycle[key]}</div>
          </div>
        ))}
      </div>

      <dl className="m-0 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-lg border border-white/5 bg-black/15 px-3 py-2">
          <dt className="text-neutral-400">Semaines de match</dt>
          <dd className="m-0 font-medium text-white">{summary.matchWeekCount}</dd>
        </div>
        <div className="rounded-lg border border-white/5 bg-black/15 px-3 py-2">
          <dt className="text-neutral-400">Fatigue élevée</dt>
          <dd className="m-0 font-medium text-white">{summary.highFatigueCount}</dd>
        </div>
        <div className="rounded-lg border border-white/5 bg-black/15 px-3 py-2">
          <dt className="text-neutral-400">Fatigue très élevée</dt>
          <dd className="m-0 font-medium text-amber-200">{summary.veryHighFatigueCount}</dd>
        </div>
        <div className="rounded-lg border border-white/5 bg-black/15 px-3 py-2">
          <dt className="text-neutral-400">Adhérence faible (7j)</dt>
          <dd className="m-0 font-medium text-amber-200">{summary.lowAdherenceCount}</dd>
        </div>
        <div className="rounded-lg border border-white/5 bg-black/15 px-3 py-2 sm:col-span-2">
          <dt className="text-neutral-400">Données séances manquantes</dt>
          <dd className="m-0 font-medium text-red-200">{summary.missingSessionDataCount}</dd>
        </div>
      </dl>
    </section>
  )
}
