import { Link } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'
import { motion } from 'framer-motion'
import {
  User,
  LogOut,
  Play,
  Clock,
  Activity,
  Calendar,
  Zap,
  ChevronRight,
  BarChart2,
  History,
  AlertTriangle,
  CheckCircle2,
  Dumbbell,
  TrendingUp,
} from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useFatigue } from '../hooks/useFatigue'
import { useWeek } from '../hooks/useWeek'
import { useHistory } from '../hooks/useHistory'
import { useAuth } from '../hooks/useAuth'
import { getClubLogoUrl, getClubMonogram } from '../services/ui/clubLogos'
import type { CycleWeek, SessionType } from '../types/training'

// ─── Helpers ────────────────────────────────────────────────

const sessionTypeLabel: Record<SessionType, string> = {
  UPPER: 'Haut du Corps',
  LOWER: 'Bas du Corps',
  FULL: 'Corps Complet',
}

const sessionTypeIcon: Record<SessionType, React.ReactNode> = {
  UPPER: <Dumbbell className="w-3 h-3 text-white fill-current" />,
  LOWER: <Activity className="w-3 h-3 text-white" />,
  FULL: <Zap className="w-3 h-3 text-white fill-current" />,
}

const weekLabel = (w: CycleWeek) => (w === 'DELOAD' ? 'Décharge' : `Semaine ${w.replace('W', '')}`)

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ─── Main ────────────────────────────────────────────────────

export function HomePage() {
  const { profile } = useProfile()
  const { authState, signOut } = useAuth()
  const { fatigue } = useFatigue()
  const { week } = useWeek()
  const { logs } = useHistory()

  const clubLogoUrl = getClubLogoUrl(profile.clubCode)
  const clubMonogram = getClubMonogram(profile.clubName)

  const sessionsThisWeek = logs.filter((l) => l.week === week).length
  const recentLogs = logs.slice(0, 2)

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 pb-24">

      {/* ── Header ── */}
      <header className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
        <div>
          <p className="text-xs font-bold tracking-widest text-rose-600 uppercase italic">RugbyPrep</p>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Accueil</h1>
        </div>
        {authState.status === 'authenticated' && authState.user ? (
          <div className="flex items-center gap-2">
            <Link to="/profile">
              <div className="relative h-14 w-14 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center">
                {authState.user.avatarUrl ? (
                  <img src={authState.user.avatarUrl} alt="Avatar" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-slate-400" />
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden">
                  {clubLogoUrl ? (
                    <img src={clubLogoUrl} alt={profile.clubName ?? 'Club'} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-[9px] font-black text-slate-600">{clubMonogram}</span>
                  )}
                </div>
              </div>
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="w-9 h-9 rounded-2xl border border-gray-200 bg-white flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors"
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/auth/login"
            className="px-3 py-2 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-slate-500 hover:border-rose-200 hover:text-rose-600 transition-colors"
          >
            Se connecter
          </Link>
        )}
      </header>

      <main className="px-6 pt-6 space-y-6 max-w-md mx-auto">

        {/* ── Hero Session Card ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">Séance du Jour</h2>
            <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {weekLabel(week)}
            </span>
          </div>

          <motion.div whileHover={{ y: -4 }} className="relative overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl shadow-slate-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600 opacity-20 blur-3xl -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500 opacity-10 blur-2xl -ml-10 -mb-10" />

            <div className="relative p-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-600 rounded-full">
                <Zap className="w-3 h-3 text-white fill-current" />
                <span className="text-[10px] font-black tracking-widest text-white uppercase">
                  {weekLabel(week)}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-3xl font-black text-white leading-tight">Prêt à<br />t'entraîner ?</h3>
                <div className="flex items-center gap-4 text-slate-400">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Clock className="w-4 h-4 text-rose-500" />
                    ~55 min
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Activity className="w-4 h-4 text-blue-400" />
                    {profile.weeklySessions} séances/sem.
                  </div>
                </div>
              </div>

              <Link to="/week">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/20 transition-all mt-2"
                >
                  <span className="font-black text-white tracking-wide uppercase italic">Commencer</span>
                  <div className="bg-white/20 p-1 rounded-full">
                    <Play className="w-4 h-4 text-white fill-current" />
                  </div>
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* ── Stats Row ── */}
        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">Récapitulatif</h2>
          <div className="grid grid-cols-3 gap-3">
            {/* Week */}
            <div className="bg-white border border-gray-100 p-4 rounded-3xl flex flex-col items-center gap-2 shadow-sm">
              <div className="p-2 rounded-2xl bg-gray-50 text-rose-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-lg font-black tracking-tight text-slate-900 leading-none">
                {week === 'DELOAD' ? 'DL' : week}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Cycle</div>
            </div>

            {/* Fatigue */}
            <div className="bg-white border border-gray-100 p-4 rounded-3xl flex flex-col items-center gap-2 shadow-sm">
              <div className={`p-2 rounded-2xl ${fatigue === 'OK' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-500'}`}>
                {fatigue === 'OK'
                  ? <CheckCircle2 className="w-5 h-5" />
                  : <AlertTriangle className="w-5 h-5" />
                }
              </div>
              <div className={`text-lg font-black tracking-tight leading-none ${fatigue === 'OK' ? 'text-emerald-600' : 'text-orange-500'}`}>
                {fatigue === 'OK' ? 'OK' : 'Élevée'}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Fatigue</div>
            </div>

            {/* Sessions */}
            <div className="bg-white border border-gray-100 p-4 rounded-3xl flex flex-col items-center gap-2 shadow-sm">
              <div className="p-2 rounded-2xl bg-gray-50 text-amber-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-lg font-black tracking-tight text-slate-900 leading-none">
                {sessionsThisWeek}/{profile.weeklySessions}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Séances</div>
            </div>
          </div>
        </section>

        {/* ── Quick Access ── */}
        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">Accès Rapide</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { to: '/program', icon: Dumbbell, label: 'Programme', color: 'text-rose-600', bg: 'bg-rose-50' },
              { to: '/week', icon: Calendar, label: 'Semaine', color: 'text-blue-500', bg: 'bg-blue-50' },
              { to: '/progress', icon: BarChart2, label: 'Progression', color: 'text-amber-500', bg: 'bg-amber-50' },
            ].map(({ to, icon: Icon, label, color, bg }) => (
              <Link key={to} to={to}>
                <motion.div
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-white border border-gray-100 p-4 rounded-3xl flex flex-col items-center gap-2 shadow-sm cursor-pointer"
                >
                  <div className={`p-2.5 rounded-2xl ${bg} ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">{label}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Recent History ── */}
        {recentLogs.length > 0 && (
          <section>
            <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Dernières séances</h3>
                <Link
                  to="/history"
                  className="text-xs font-bold text-slate-400 flex items-center hover:text-rose-600 transition-colors"
                >
                  Tout voir <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                        {sessionTypeIcon[log.sessionType]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{sessionTypeLabel[log.sessionType]}</div>
                        <div className="text-xs text-slate-400 italic">{weekLabel(log.week)} · {formatDate(log.dateISO)}</div>
                      </div>
                    </div>
                    <div className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                      log.fatigue === 'OK'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-orange-50 text-orange-500'
                    }`}>
                      {log.fatigue === 'OK' ? 'OK' : 'Fatigue'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Empty state if no history */}
        {recentLogs.length === 0 && (
          <section>
            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                <History className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Aucune séance enregistrée</p>
                <p className="text-xs text-slate-400 mt-0.5">Lance ta première séance pour commencer à tracker ta progression.</p>
              </div>
              <Link to="/week">
                <span className="text-xs font-black text-rose-600 uppercase tracking-wide">Commencer maintenant →</span>
              </Link>
            </div>
          </section>
        )}

      </main>

      <BottomNav />
    </div>
  )
}
