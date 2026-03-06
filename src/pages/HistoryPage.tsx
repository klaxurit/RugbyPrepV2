import { Link } from 'react-router-dom'
import { Trash2, Calendar, Activity, Dumbbell, Zap, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useBlockLogs } from '../hooks/useBlockLogs'
import { useHistory } from '../hooks/useHistory'
import { BottomNav } from '../components/BottomNav'
import { PageHeader } from '../components/PageHeader'
import type { SessionType, CycleWeek } from '../types/training'

const sessionTypeLabel: Record<SessionType, string> = {
  UPPER: 'Haut du Corps',
  LOWER: 'Bas du Corps',
  FULL: 'Corps Complet',
  CONDITIONING: 'Conditionnement',
  RECOVERY: 'Récupération',
}

const sessionTypeStyles: Record<SessionType, string> = {
  UPPER: 'bg-blue-900/20 text-blue-400',
  LOWER: 'bg-emerald-900/20 text-emerald-400',
  FULL: 'bg-amber-900/20 text-amber-400',
  CONDITIONING: 'bg-violet-900/20 text-violet-400',
  RECOVERY: 'bg-teal-900/20 text-teal-400',
}

const sessionTypeIcon: Record<SessionType, React.ReactNode> = {
  UPPER: <Dumbbell className="w-4 h-4" />,
  LOWER: <Activity className="w-4 h-4" />,
  FULL: <Zap className="w-4 h-4" />,
  CONDITIONING: <Activity className="w-4 h-4" />,
  RECOVERY: <Activity className="w-4 h-4" />,
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
    <div className="min-h-screen bg-[#1a100c] font-sans text-white pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(#ff6b35_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader
        title="Historique"
        backTo="/"
        right={
          logs.length > 0 ? (
            <button
              type="button"
              onClick={clearLogs}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-white/10 bg-white/5 text-xs font-bold text-white/60 hover:border-[#1a5f3f]/30 hover:text-[#1a5f3f] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Effacer
            </button>
          ) : undefined
        }
      />

      <main className="px-6 pt-6 space-y-6 max-w-md mx-auto relative">

        {/* Stats rapides */}
        {logs.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 border border-white/10 p-4 rounded-[24px] flex flex-col gap-1">
              <div className="text-2xl font-black text-white">{logs.length}</div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Séances totales</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-[24px] flex flex-col gap-1">
              <div className="text-2xl font-black text-white">{blockLogs.length}</div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Blocs enregistrés</div>
            </div>
          </div>
        )}

        {/* Séances */}
        <section>
          <h2 className="text-xs font-black uppercase tracking-wider text-white/40 mb-3">Séances</h2>

          {logs.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-[24px] p-6 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/30">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Aucune séance</p>
                <p className="text-xs text-white/40 mt-0.5">Lance ta première séance depuis la page Semaine.</p>
              </div>
              <Link to="/week" className="text-xs font-black text-[#1a5f3f] uppercase tracking-wide">
                Voir la semaine →
              </Link>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-[24px] overflow-hidden divide-y divide-white/5">
              {logs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${sessionTypeStyles[log.sessionType]}`}>
                      {sessionTypeIcon[log.sessionType]}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{sessionTypeLabel[log.sessionType]}</div>
                      <div className="text-xs text-white/40 italic">
                        {weekLabel(log.week)} · {formatDate(log.dateISO)}
                      </div>
                      {log.notes && (
                        <div className="text-xs text-white/40 mt-0.5 italic">&quot;{log.notes}&quot;</div>
                      )}
                    </div>
                  </div>
                  <div className={`text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0 ${
                    log.fatigue === 'OK' ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'
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
            <h2 className="text-xs font-black uppercase tracking-wider text-white/40 mb-3">Blocs enregistrés</h2>
            <div className="space-y-2">
              {blockLogs.map((log) => (
                <div key={log.id} className="bg-white/5 border border-white/10 rounded-[24px] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedBlockId(expandedBlockId === log.id ? null : log.id)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${sessionTypeStyles[log.sessionType]}`}>
                        {sessionTypeIcon[log.sessionType]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{log.blockName}</div>
                        <div className="text-xs text-white/40 italic">
                          {weekLabel(log.week)} · {formatDateTime(log.dateISO)}
                        </div>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-white/30 transition-transform flex-shrink-0 ${expandedBlockId === log.id ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedBlockId === log.id && (
                    <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                      {log.entries.map((entry, i) => (
                        <div key={`${entry.exerciseId}-${i}`} className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{entry.exerciseId}</span>
                          <span className="text-xs text-white/40">
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
