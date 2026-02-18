import { Link } from 'react-router-dom'
import { ChevronLeft, TrendingUp, TrendingDown, Minus, AlertCircle, BarChart2 } from 'lucide-react'
import blocksData from '../data/blocks.v1.json'
import { getExerciseName } from '../data/exercises'
import { useBlockLogs } from '../hooks/useBlockLogs'
import { getExerciseDeltaW1W4 } from '../services/ui/progression'
import { BottomNav } from '../components/BottomNav'
import type { TrainingBlock } from '../types/training'

const statusConfig = {
  up: {
    icon: <TrendingUp className="w-4 h-4" />,
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'Progression',
  },
  down: {
    icon: <TrendingDown className="w-4 h-4" />,
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    badge: 'bg-rose-100 text-rose-700',
    label: 'Régression',
  },
  same: {
    icon: <Minus className="w-4 h-4" />,
    bg: 'bg-slate-50',
    text: 'text-slate-500',
    badge: 'bg-slate-100 text-slate-500',
    label: 'Stable',
  },
  unknown: {
    icon: <AlertCircle className="w-4 h-4" />,
    bg: 'bg-gray-50',
    text: 'text-gray-400',
    badge: 'bg-gray-100 text-gray-500',
    label: '–',
  },
}

export function ProgressPage() {
  const { logs } = useBlockLogs()

  const exerciseIds = Array.from(
    new Set(logs.flatMap((log) => log.entries.map((entry) => entry.exerciseId)))
  )

  const progressRows = exerciseIds
    .map((exerciseId) => ({
      exerciseId,
      delta: getExerciseDeltaW1W4(logs, exerciseId),
    }))
    .filter((row) => row.delta.status !== 'unknown')
    .sort((a, b) => b.delta.deltaValue - a.delta.deltaValue)
    .slice(0, 10)

  const exerciseFrequency = (blocksData as TrainingBlock[]).flatMap((block) =>
    block.exercises.map((exercise) => exercise.exerciseId)
  )
  const frequencyMap = exerciseFrequency.reduce<Record<string, number>>((acc, exerciseId) => {
    acc[exerciseId] = (acc[exerciseId] ?? 0) + 1
    return acc
  }, {})
  const loggedExerciseIds = new Set(
    logs.flatMap((log) => log.entries.map((entry) => entry.exerciseId))
  )
  const missingRows = Object.entries(frequencyMap)
    .filter(([exerciseId]) => !loggedExerciseIds.has(exerciseId))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)

  const progressCount = progressRows.filter((r) => r.delta.status === 'up').length
  const regressionCount = progressRows.filter((r) => r.delta.status === 'down').length

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 pb-24">

      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-gray-100 flex items-center gap-3 sticky top-0 z-50">
        <Link to="/" className="p-2 -ml-2 rounded-xl hover:bg-gray-50 transition-colors">
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </Link>
        <div>
          <p className="text-xs font-bold tracking-widest text-rose-600 uppercase italic">RugbyPrep</p>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Progression</h1>
        </div>
      </header>

      <main className="px-6 pt-6 space-y-6 max-w-md mx-auto">

        {/* Résumé rapide */}
        {progressRows.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-100 p-4 rounded-3xl flex flex-col items-center gap-1.5 shadow-sm">
              <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-xl font-black text-emerald-600">{progressCount}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter text-center">En hausse</div>
            </div>
            <div className="bg-white border border-gray-100 p-4 rounded-3xl flex flex-col items-center gap-1.5 shadow-sm">
              <div className="p-2 rounded-2xl bg-rose-50 text-rose-500">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div className="text-xl font-black text-rose-500">{regressionCount}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter text-center">En baisse</div>
            </div>
            <div className="bg-white border border-gray-100 p-4 rounded-3xl flex flex-col items-center gap-1.5 shadow-sm">
              <div className="p-2 rounded-2xl bg-slate-50 text-slate-500">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div className="text-xl font-black text-slate-700">{progressRows.length}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter text-center">Suivis</div>
            </div>
          </div>
        )}

        {/* Top progrès */}
        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">Top progrès (W1 → W4)</h2>

          {progressRows.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Données insuffisantes</p>
                <p className="text-xs text-slate-400 mt-0.5">Enregistre des séances en W1 et W4 pour voir ta progression.</p>
              </div>
              <Link to="/week" className="text-xs font-black text-rose-600 uppercase tracking-wide">
                Aller s'entraîner →
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm divide-y divide-gray-50">
              {progressRows.map((row) => {
                const cfg = statusConfig[row.delta.status]
                return (
                  <div key={row.exerciseId} className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                        {cfg.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">{getExerciseName(row.exerciseId)}</div>
                        <div className="text-xs text-slate-400 italic">
                          {row.delta.fromText} → {row.delta.toText}
                        </div>
                      </div>
                    </div>
                    <div className={`text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.badge}`}>
                      {row.delta.deltaText}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* À renseigner */}
        {missingRows.length > 0 && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">À renseigner</h2>
            <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm space-y-2">
              {missingRows.length === 0 ? (
                <p className="text-sm text-slate-400">Tout est loggé sur les exercices fréquents.</p>
              ) : (
                missingRows.map(([exerciseId, count]) => (
                  <div key={exerciseId} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-sm font-medium text-slate-700">{getExerciseName(exerciseId)}</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                      {count} blocs
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

      </main>

      <BottomNav />
    </div>
  )
}
