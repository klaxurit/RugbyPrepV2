import { Link } from 'react-router-dom'
import { Trash2, Calendar, Activity, Dumbbell, Zap, ChevronDown, Lock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useBlockLogs } from '../hooks/useBlockLogs'
import { useHistory } from '../hooks/useHistory'
import { useFeatureAccess } from '../hooks/useFeatureAccess'
import { BottomNav } from '../components/BottomNav'
import { PageHeader } from '../components/PageHeader'
import { getProgramHistorySummary } from '../services/program/programHistoryAnalytics'
import {
  getSessionLogDisplayTitle,
  getSessionLogCycleLabel,
} from '../services/program/sessionLogPresentation'
import type { SessionType, CycleWeek } from '../types/training'

const sessionTypeStyles: Record<SessionType, string> = {
  UPPER: 'bg-blue-50 text-blue-600 border border-blue-200',
  LOWER: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  FULL: 'bg-amber-50 text-amber-600 border border-amber-200',
  CONDITIONING: 'bg-violet-50 text-violet-600 border border-violet-200',
  RECOVERY: 'bg-teal-50 text-teal-600 border border-teal-200',
  ACTIVE_RECOVERY: 'bg-sky-50 text-sky-600 border border-sky-200',
}

const sessionTypeIcon: Record<SessionType, React.ReactNode> = {
  UPPER: <Dumbbell className="w-4 h-4" />,
  LOWER: <Activity className="w-4 h-4" />,
  FULL: <Zap className="w-4 h-4" />,
  CONDITIONING: <Activity className="w-4 h-4" />,
  RECOVERY: <Activity className="w-4 h-4" />,
  ACTIVE_RECOVERY: <Activity className="w-4 h-4" />,
}

const weekLabel = (w: CycleWeek) => (w === 'DELOAD' ? 'Semaine légère' : `Semaine ${w.replace('W', '')}`)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })

export function HistoryPage() {
  const { logs, clearLogs } = useHistory()
  const { logs: blockLogs } = useBlockLogs()
  const { isPremium } = useFeatureAccess()
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const summary = useMemo(() => getProgramHistorySummary(logs, today), [logs, today])

  return (
    <div className="min-h-screen bg-app font-sans text-fg pb-bottom-nav relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader
        title="Historique"
        backTo="/home"
        right={
          isPremium && logs.length > 0 ? (
            <button
              type="button"
              onClick={clearLogs}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-white/20 bg-white/15 text-xs font-bold text-shell-text-muted hover:bg-white/30 hover:text-shell-text transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Effacer
            </button>
          ) : undefined
        }
      />

      <main className="px-6 pt-6 space-y-6 max-w-md mx-auto relative">

        {/* Free tier: upsell */}
        {!isPremium && (
          <div className="bg-layer-5 border border-border-app rounded-[24px] p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 bg-brand-soft rounded-2xl flex items-center justify-center">
              <Lock className="w-6 h-6 text-brand-tint" />
            </div>
            <div>
              <p className="text-sm font-bold text-fg">Historique complet</p>
              <p className="text-xs text-fg-muted mt-1 leading-relaxed">
                Retrouve toutes tes seances, charges et exercices. Suis ta progression semaine apres semaine.
              </p>
            </div>
            <Link
              to="/profile#premium"
              className="px-6 py-3 rounded-full bg-brand hover:bg-brand-hover text-on-brand text-sm font-bold transition-colors"
            >
              Activer Premium
            </Link>
          </div>
        )}

        {/* Stats rapides */}
        {isPremium && logs.length > 0 && (
          <div className="grid grid-cols-2 gap-3" data-testid="history-stats">
            <div className="bg-layer-5 border border-border-app p-4 rounded-[24px] flex flex-col gap-1">
              <div className="text-2xl font-black text-fg" data-testid="stat-total">{summary.totalSessions}</div>
              <div className="text-[10px] font-bold text-fg-muted uppercase tracking-tighter">Séances totales</div>
            </div>
            <div className="bg-layer-5 border border-border-app p-4 rounded-[24px] flex flex-col gap-1">
              <div className="text-2xl font-black text-fg" data-testid="stat-7d">{summary.sessionsLast7d}</div>
              <div className="text-[10px] font-bold text-fg-muted uppercase tracking-tighter">7 derniers jours</div>
            </div>
            <div className="bg-layer-5 border border-border-app p-4 rounded-[24px] flex flex-col gap-1">
              <div className="text-2xl font-black text-fg" data-testid="stat-28d">{summary.sessionsLast28d}</div>
              <div className="text-[10px] font-bold text-fg-muted uppercase tracking-tighter">28 derniers jours</div>
            </div>
            <div className="bg-layer-5 border border-border-app p-4 rounded-[24px] flex flex-col gap-1">
              <div className="text-xs font-black text-fg-secondary flex items-center gap-2">
                <span className="text-emerald-400" data-testid="stat-mother">{summary.motherSessions}</span>
                <span className="text-fg-ghost">/</span>
                <span className="text-blue-400" data-testid="stat-legacy">{summary.legacySessions}</span>
              </div>
              <div className="text-[10px] font-bold text-fg-muted uppercase tracking-tighter">Annuel / Legacy</div>
            </div>
          </div>
        )}

        {/* Séances */}
        {isPremium && <section>
          <h2 className="text-xs font-black uppercase tracking-wider text-fg-muted mb-3">Séances</h2>

          {logs.length === 0 ? (
            <div className="bg-layer-5 border border-border-app rounded-[24px] p-6 flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 bg-layer-5 rounded-2xl flex items-center justify-center text-fg-faint">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-fg">Aucune séance</p>
                <p className="text-xs text-fg-muted mt-0.5">Lance ta première séance depuis la page Semaine.</p>
              </div>
              <Link to="/week" className="text-xs font-black text-brand-tint uppercase tracking-wide">
                Voir la semaine →
              </Link>
            </div>
          ) : (
            <div className="bg-layer-5 border border-border-app rounded-[24px] overflow-hidden divide-y divide-border-app">
              {logs.map((log) => {
                const title = getSessionLogDisplayTitle(log)
                const cyclePart = getSessionLogCycleLabel(log)

                return (
                  <div key={log.id} className="p-4 flex items-start justify-between gap-2" data-testid="history-log-entry">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 ${sessionTypeStyles[log.sessionType]}`}>
                        {sessionTypeIcon[log.sessionType]}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-fg truncate block" data-testid="log-title">{title}</span>
                        <div className="text-xs text-fg-muted mt-0.5">
                          {cyclePart && <><span data-testid="log-cycle-label">{cyclePart}</span> · </>}
                          {formatDate(log.dateISO)}
                        </div>
                        {log.notes && (
                          <div className="text-xs text-fg-faint mt-0.5 italic">&quot;{log.notes}&quot;</div>
                        )}
                      </div>
                    </div>
                    <div className={`text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5 ${
                      log.fatigue === 'OK' ? 'bg-ok-bg text-ok-strong' : 'bg-warn-bg text-warn-strong'
                    }`}>
                      {log.fatigue === 'OK' ? 'OK' : 'Fatigue'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>}

        {/* Blocs enregistrés */}
        {isPremium && blockLogs.length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-wider text-fg-muted mb-3">Détail des exercices</h2>
            <div className="space-y-2">
              {blockLogs.map((log) => (
                <div key={log.id} className="bg-layer-5 border border-border-app rounded-[24px] overflow-hidden">
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
                        <div className="text-sm font-bold text-fg">{log.blockName}</div>
                        <div className="text-xs text-fg-muted italic">
                          {weekLabel(log.week)} · {formatDateTime(log.dateISO)}
                        </div>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-fg-faint transition-transform flex-shrink-0 ${expandedBlockId === log.id ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedBlockId === log.id && (
                    <div className="px-4 pb-4 space-y-2 border-t border-border-app pt-3">
                      {log.entries.map((entry, i) => (
                        <div key={`${entry.exerciseId}-${i}`} className="flex items-center justify-between">
                          <span className="text-xs font-bold text-fg">{entry.exerciseId}</span>
                          <span className="text-xs text-fg-muted">
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
