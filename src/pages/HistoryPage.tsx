import { Link } from 'react-router-dom'
import { ChevronLeft, Trash2, Calendar, Activity, Dumbbell, Zap, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useBlockLogs } from '../hooks/useBlockLogs'
import { useHistory } from '../hooks/useHistory'
import { BottomNav } from '../components/BottomNav'
import type { SessionType, CycleWeek } from '../types/training'

const sessionTypeLabel: Record<SessionType, string> = {
  UPPER: 'Haut du Corps',
  LOWER: 'Bas du Corps',
  FULL: 'Corps Complet',
}

const sessionTypeBg: Record<SessionType, string> = {
  UPPER: 'bg-blue-50 text-blue-600',
  LOWER: 'bg-amber-50 text-amber-600',
  FULL: 'bg-rose-50 text-rose-600',
}

const sessionTypeIcon: Record<SessionType, React.ReactNode> = {
  UPPER: <Dumbbell className="w-4 h-4" />,
  LOWER: <Activity className="w-4 h-4" />,
  FULL: <Zap className="w-4 h-4" />,
}

const weekLabel = (w: CycleWeek) => (w === 'DELOAD' ? 'Décharge' : `S${w.replace('W', '')}`)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })

export function HistoryPage() {
  const { logs, clearLogs } = useHistory()
  const { logs: blockLogs } = useBlockLogs()
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 pb-24">

      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 -ml-2 rounded-xl hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <p className="text-xs font-bold tracking-widest text-rose-600 uppercase italic">RugbyPrep</p>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Historique</h1>
          </div>
        </div>
        {logs.length > 0 && (
          <button
            type="button"
            onClick={clearLogs}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-slate-400 hover:border-rose-200 hover:text-rose-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Effacer
          </button>
        )}
      </header>

      <main className="px-6 pt-6 space-y-6 max-w-md mx-auto">

        {/* Stats rapides */}
        {logs.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 p-4 rounded-3xl flex flex-col gap-1 shadow-sm">
              <div className="text-2xl font-black text-slate-900">{logs.length}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Séances totales</div>
            </div>
            <div className="bg-white border border-gray-100 p-4 rounded-3xl flex flex-col gap-1 shadow-sm">
              <div className="text-2xl font-black text-slate-900">{blockLogs.length}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Blocs enregistrés</div>
            </div>
          </div>
        )}

        {/* Séances */}
        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">Séances</h2>

          {logs.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Aucune séance</p>
                <p className="text-xs text-slate-400 mt-0.5">Lance ta première séance depuis la page Semaine.</p>
              </div>
              <Link to="/week" className="text-xs font-black text-rose-600 uppercase tracking-wide">
                Voir la semaine →
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm divide-y divide-gray-50">
              {logs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${sessionTypeBg[log.sessionType]}`}>
                      {sessionTypeIcon[log.sessionType]}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{sessionTypeLabel[log.sessionType]}</div>
                      <div className="text-xs text-slate-400 italic">
                        {weekLabel(log.week)} · {formatDate(log.dateISO)}
                      </div>
                      {log.notes && (
                        <div className="text-xs text-slate-500 mt-0.5 italic">"{log.notes}"</div>
                      )}
                    </div>
                  </div>
                  <div className={`text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0 ${
                    log.fatigue === 'OK' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-500'
                  }`}>
                    {log.fatigue === 'OK' ? 'OK' : 'Fatigue'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Blocs enregistrés */}
        {blockLogs.length > 0 && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">Blocs enregistrés</h2>
            <div className="space-y-2">
              {blockLogs.map((log) => (
                <div key={log.id} className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedBlockId(expandedBlockId === log.id ? null : log.id)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${sessionTypeBg[log.sessionType]}`}>
                        {sessionTypeIcon[log.sessionType]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{log.blockName}</div>
                        <div className="text-xs text-slate-400 italic">
                          {weekLabel(log.week)} · {formatDateTime(log.dateISO)}
                        </div>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform flex-shrink-0 ${expandedBlockId === log.id ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedBlockId === log.id && (
                    <div className="px-4 pb-4 space-y-2 border-t border-gray-50 pt-3">
                      {log.entries.map((entry, i) => (
                        <div key={`${entry.exerciseId}-${i}`} className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">{entry.exerciseId}</span>
                          <span className="text-xs text-slate-400">
                            {[
                              entry.loadKg !== undefined ? `${entry.loadKg}kg` : null,
                              entry.reps !== undefined ? `${entry.reps} reps` : null,
                              entry.seconds !== undefined ? `${entry.seconds}s` : null,
                              entry.meters !== undefined ? `${entry.meters}m` : null,
                            ]
                              .filter((v): v is string => !!v)
                              .join(' · ')}
                            {entry.note ? ` — ${entry.note}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      <BottomNav />
    </div>
  )
}
