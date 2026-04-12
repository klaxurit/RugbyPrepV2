import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'
import type { WeeklySummaryResult } from '../services/analytics/computeWeeklySummary'
import { getExerciseName } from '../data/exercises'

export function WeeklySummaryCard({ result }: { result: WeeklySummaryResult }) {
  if (!result.hasSufficientData) {
    return (
      <div className="bg-layer-5 border border-border-app rounded-[24px] p-5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="rounded-2xl bg-brand-soft p-2">
            <BarChart3 className="h-4 w-4 text-brand-tint" />
          </div>
          <h3 className="text-sm font-black text-fg">Bilan de semaine</h3>
        </div>
        <p className="text-xs text-fg-muted">Commence ta premiere seance pour voir ton bilan ici.</p>
      </div>
    )
  }

  const loadUp = result.loadChangePercent != null && result.loadChangePercent > 0
  const loadDown = result.loadChangePercent != null && result.loadChangePercent < 0

  return (
    <div className="bg-layer-5 border border-border-app rounded-[24px] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-2xl bg-brand-soft p-2">
            <BarChart3 className="h-4 w-4 text-brand-tint" />
          </div>
          <h3 className="text-sm font-black text-fg">Bilan de semaine</h3>
        </div>
      </div>

      {/* Sessions done / planned */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-fg-muted">Seances</span>
          <span className="text-xs font-black text-fg">
            {result.sessionsDone}/{result.sessionsPlanned}
          </span>
        </div>
        <div className="h-2 bg-layer-10 rounded-full">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${Math.min(100, result.completionRatio * 100)}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total load */}
        <div>
          <p className="text-[10px] text-fg-muted font-bold">Charge</p>
          <p className="text-sm font-black text-fg">{result.totalLoad} <span className="text-[10px] font-bold text-fg-muted">pts</span></p>
          {result.loadChangePercent != null && (
            <div className="flex items-center gap-0.5 mt-0.5">
              {loadUp && <TrendingUp className="h-3 w-3 text-ok" />}
              {loadDown && <TrendingDown className="h-3 w-3 text-danger" />}
              <span className={`text-[10px] font-bold ${loadUp ? 'text-ok' : loadDown ? 'text-danger' : 'text-fg-muted'}`}>
                {result.loadChangePercent > 0 ? '+' : ''}{result.loadChangePercent}%
              </span>
            </div>
          )}
        </div>

        {/* RPE */}
        <div>
          <p className="text-[10px] text-fg-muted font-bold">RPE moy.</p>
          <p className="text-sm font-black text-fg">
            {result.avgRPE != null ? result.avgRPE : '—'}
            <span className="text-[10px] font-bold text-fg-muted">/10</span>
          </p>
        </div>

        {/* Top exercise */}
        <div>
          <p className="text-[10px] text-fg-muted font-bold">Progression</p>
          {result.topProgressedExercise ? (
            <>
              <p className="truncate text-[10px] font-bold text-ok">
                {getExerciseName(result.topProgressedExercise.exerciseId, 'fr')}
              </p>
              <p className="text-[10px] font-black text-ok">
                {result.topProgressedExercise.improvementLabel}
              </p>
            </>
          ) : (
            <p className="text-[10px] text-fg-faint">—</p>
          )}
        </div>
      </div>
    </div>
  )
}
