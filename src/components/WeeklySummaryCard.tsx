import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'
import type { WeeklySummaryResult } from '../services/analytics/computeWeeklySummary'
import { getExerciseName } from '../data/exercises'

export function WeeklySummaryCard({ result }: { result: WeeklySummaryResult }) {
  if (!result.hasSufficientData) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-[24px] p-5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-[#ff6b35]/10">
            <BarChart3 className="w-4 h-4 text-[#ff6b35]" />
          </div>
          <h3 className="text-sm font-black text-white">Bilan de semaine</h3>
        </div>
        <p className="text-xs text-white/40">Commence ta premiere seance pour voir ton bilan ici.</p>
      </div>
    )
  }

  const loadUp = result.loadChangePercent != null && result.loadChangePercent > 0
  const loadDown = result.loadChangePercent != null && result.loadChangePercent < 0

  return (
    <div className="bg-white/5 border border-white/10 rounded-[24px] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-[#ff6b35]/10">
            <BarChart3 className="w-4 h-4 text-[#ff6b35]" />
          </div>
          <h3 className="text-sm font-black text-white">Bilan de semaine</h3>
        </div>
      </div>

      {/* Sessions done / planned */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-white/50">Seances</span>
          <span className="text-xs font-black text-white">
            {result.sessionsDone}/{result.sessionsPlanned}
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full">
          <div
            className="h-full rounded-full bg-[#ff6b35] transition-all"
            style={{ width: `${Math.min(100, result.completionRatio * 100)}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total load */}
        <div>
          <p className="text-[10px] text-white/40 font-bold">Charge</p>
          <p className="text-sm font-black text-white">{result.totalLoad} <span className="text-[10px] font-bold text-white/40">UA</span></p>
          {result.loadChangePercent != null && (
            <div className="flex items-center gap-0.5 mt-0.5">
              {loadUp && <TrendingUp className="w-3 h-3 text-emerald-400" />}
              {loadDown && <TrendingDown className="w-3 h-3 text-red-400" />}
              <span className={`text-[10px] font-bold ${loadUp ? 'text-emerald-400' : loadDown ? 'text-red-400' : 'text-white/40'}`}>
                {result.loadChangePercent > 0 ? '+' : ''}{result.loadChangePercent}%
              </span>
            </div>
          )}
        </div>

        {/* RPE */}
        <div>
          <p className="text-[10px] text-white/40 font-bold">RPE moy.</p>
          <p className="text-sm font-black text-white">
            {result.avgRPE != null ? result.avgRPE : '—'}
            <span className="text-[10px] font-bold text-white/40">/10</span>
          </p>
        </div>

        {/* Top exercise */}
        <div>
          <p className="text-[10px] text-white/40 font-bold">Progression</p>
          {result.topProgressedExercise ? (
            <>
              <p className="text-[10px] font-bold text-emerald-400 truncate">
                {getExerciseName(result.topProgressedExercise.exerciseId, 'fr')}
              </p>
              <p className="text-[10px] font-black text-emerald-400">
                {result.topProgressedExercise.improvementLabel}
              </p>
            </>
          ) : (
            <p className="text-[10px] text-white/30">—</p>
          )}
        </div>
      </div>
    </div>
  )
}
