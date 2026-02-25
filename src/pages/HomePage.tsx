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
    <div className="min-h-screen bg-[#faf9f7] font-sans text-[#1f2937] pb-24">

      {/* ── Header ── */}
      <header className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
        <div>
          <p className="text-xs font-bold tracking-widest text-rose-600 uppercase italic">RugbyPrep</p>
          <h1 className="text-xl font-extrabold tracking-tight text-[#1f2937]">Accueil</h1>
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
              className="w-9 h-9 rounded-2xl border border-gray-200 bg-white flex items-center justify-center text-slate-400 hover:text-[#1a5f3f] hover:border-[#1a5f3f]/20 transition-colors"
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/auth/login"
            className="px-3 py-2 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-slate-500 hover:border-[#1a5f3f]/20 hover:text-[#1a5f3f] transition-colors"
          >
            Se connecter
          </Link>
        )}
      </header>

      <main className="px-6 pt-6 space-y-6 max-w-md mx-auto">

        {/* ── Hero Session Card ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-[#6b7280]">Séance du Jour</h2>
            <span className="text-xs font-bold text-[#1a5f3f] flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {weekLabel(week)}
            </span>
          </div>

          <motion.div whileHover={{ y: -4 }} className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1a5f3f] to-[#ff6b35] shadow-2xl shadow-[#1a5f3f]/20">
            {/* Formes géométriques subtiles en arrière-plan */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -ml-10 -mb-10" />

            <div className="relative p-7 space-y-5">
              {/* Badge semaine style maillot */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30">
                <span className="text-lg font-black tracking-tight text-white">
                  {week === 'DELOAD' ? 'DL' : week.replace('W', '')}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-3xl font-black text-white leading-tight">Prêt à<br />t'entraîner ?</h3>
                <div className="flex items-center gap-4 text-white/90">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    ~55 min
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Activity className="w-4 h-4" />
                    {profile.weeklySessions} séances/sem.
                  </div>
                </div>
              </div>

              <Link to="/program">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 bg-white hover:bg-white/95 shadow-lg shadow-black/10 transition-all mt-2"
                >
                  <span className="font-black text-[#1a5f3f] tracking-wide uppercase italic">Commencer</span>
                  <div className="bg-[#1a5f3f]/10 p-1 rounded-full">
                    <Play className="w-4 h-4 text-[#1a5f3f] fill-current" />
                  </div>
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* ── Stats Row ── */}
        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-[#6b7280] mb-3">Récapitulatif</h2>
          <div className="grid grid-cols-3 gap-3">
            {/* Week */}
            <div className="bg-white border border-gray-100 p-4 rounded-[24px] flex flex-col items-center gap-2 shadow-sm">
              <div className="p-2 rounded-2xl bg-gray-50 text-[#1a5f3f]">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-lg font-black tracking-tight text-[#1f2937] leading-none">
                {week === 'DELOAD' ? 'DL' : week}
              </div>
              <div className="text-[10px] font-bold text-[#6b7280] uppercase tracking-tighter">Cycle</div>
            </div>

            {/* Fatigue */}
            <div className="bg-white border border-gray-100 p-4 rounded-[24px] flex flex-col items-center gap-2 shadow-sm">
              <div className={`p-2 rounded-2xl ${fatigue === 'OK' ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#f59e0b]/10 text-[#f59e0b]'}`}>
                {fatigue === 'OK'
                  ? <CheckCircle2 className="w-5 h-5" />
                  : <AlertTriangle className="w-5 h-5" />
                }
              </div>
              <div className={`text-lg font-black tracking-tight leading-none ${fatigue === 'OK' ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>
                {fatigue === 'OK' ? 'OK' : 'Élevée'}
              </div>
              <div className="text-[10px] font-bold text-[#6b7280] uppercase tracking-tighter">Fatigue</div>
            </div>

            {/* Sessions */}
            <div className="bg-white border border-gray-100 p-4 rounded-[24px] flex flex-col items-center gap-2 shadow-sm">
              <div className="p-2 rounded-2xl bg-[#ff6b35]/10 text-[#ff6b35]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-lg font-black tracking-tight text-[#1f2937] leading-none">
                {sessionsThisWeek}/{profile.weeklySessions}
              </div>
              <div className="text-[10px] font-bold text-[#6b7280] uppercase tracking-tighter">Séances</div>
            </div>
          </div>
        </section>

        {/* ── Quick Access ── */}
        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-[#6b7280] mb-3">Accès Rapide</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { to: '/program', icon: Dumbbell, label: 'Programme', color: 'text-[#1a5f3f]', bg: 'bg-[#1a5f3f]/10' },
              { to: '/week', icon: Calendar, label: 'Semaine', color: 'text-[#1a5f3f]', bg: 'bg-[#1a5f3f]/10' },
              { to: '/progress', icon: BarChart2, label: 'Progression', color: 'text-[#ff6b35]', bg: 'bg-[#ff6b35]/10' },
            ].map(({ to, icon: Icon, label, color, bg }) => (
              <Link key={to} to={to}>
                <motion.div
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-white border border-gray-100 p-4 rounded-[24px] flex flex-col items-center gap-2 shadow-sm cursor-pointer"
                >
                  <div className={`p-2.5 rounded-2xl ${bg} ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-[#1f2937] text-center leading-tight">{label}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Recent History ── */}
        {recentLogs.length > 0 && (
          <section>
            <div className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#1f2937]">Dernières séances</h3>
                <Link
                  to="/history"
                  className="text-xs font-bold text-[#6b7280] flex items-center hover:text-[#1a5f3f] transition-colors"
                >
                  Tout voir <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-[#1a5f3f]/10 group-hover:text-[#1a5f3f] transition-colors">
                        {sessionTypeIcon[log.sessionType]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#1f2937]">{sessionTypeLabel[log.sessionType]}</div>
                        <div className="text-xs text-[#6b7280] italic">{weekLabel(log.week)} · {formatDate(log.dateISO)}</div>
                      </div>
                    </div>
                    <div className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                      log.fatigue === 'OK'
                        ? 'bg-[#10b981]/10 text-[#10b981]'
                        : 'bg-[#f59e0b]/10 text-[#f59e0b]'
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
            <div className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                <History className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1f2937]">Aucune séance enregistrée</p>
                <p className="text-xs text-[#6b7280] mt-0.5">Lance ta première séance pour commencer à tracker ta progression.</p>
              </div>
              <Link to="/program">
                <span className="text-xs font-black text-[#1a5f3f] uppercase tracking-wide">Commencer maintenant →</span>
              </Link>
            </div>
          </section>
        )}

      </main>

      <BottomNav />
    </div>
  )
}
