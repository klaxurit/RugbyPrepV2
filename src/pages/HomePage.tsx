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
  Trophy,
  Swords,
  Sparkles,
} from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useFatigue } from '../hooks/useFatigue'
import { useWeek } from '../hooks/useWeek'
import { useHistory } from '../hooks/useHistory'
import { useAuth } from '../hooks/useAuth'
import { useCalendar } from '../hooks/useCalendar'
import { useACWR, ACWR_ZONE_CONFIG } from '../hooks/useACWR'
import { getClubLogoUrl, getClubMonogram } from '../services/ui/clubLogos'
import type { CycleWeek, SessionType, SeasonPhase, SeasonMode } from '../types/training'

// ─── Helpers ────────────────────────────────────────────────

const seasonPhaseLabel: Record<SeasonPhase, { label: string; color: string; bg: string }> = {
  'off-season': { label: 'Hors-saison', color: 'text-slate-600', bg: 'bg-slate-100' },
  'pre-season': { label: 'Pré-saison', color: 'text-amber-700', bg: 'bg-amber-50' },
  'in-season': { label: 'En saison', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  'playoffs': { label: 'Playoffs', color: 'text-rose-700', bg: 'bg-rose-50' },
}

const diffDays = (dateStr: string): number => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

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

const weekLabel = (w: CycleWeek) => (w === 'DELOAD' ? 'Décharge' : w.startsWith('H') ? `Hypert. ${w.replace('H', '')}` : `Semaine ${w.replace('W', '')}`)

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Durée estimée par niveau (4 blocs × séries × récup)
const LEVEL_DURATION: Record<string, string> = {
  starter:     '~30 min',
  builder:     '~45 min',
  performance: '~55 min',
}

// Mapping SeasonPhase (calendrier) → SeasonMode (profil)
const CALENDAR_TO_SEASON_MODE: Record<SeasonPhase, SeasonMode> = {
  'in-season':  'in_season',
  'playoffs':   'in_season',
  'pre-season': 'pre_season',
  'off-season': 'off_season',
}

const SEASON_MODE_LABEL: Record<SeasonMode, string> = {
  in_season:  '⚡ Saison',
  off_season: '🌿 Inter-saison',
  pre_season: '🔥 Pré-saison',
}

const TRAINING_LEVEL_LABEL: Record<string, string> = {
  starter:     '🌱 Débutant',
  builder:     '💪 Intermédiaire',
  performance: '🏆 Avancé',
}

// ─── Main ────────────────────────────────────────────────────

export function HomePage() {
  const { profile, updateProfile } = useProfile()
  const { authState, signOut } = useAuth()
  const { fatigue } = useFatigue()
  const { week } = useWeek()
  const { logs } = useHistory()
  const { nextMatch, seasonPhase, isMatchDay } = useCalendar()
  const acwr = useACWR(logs)

  const clubLogoUrl = getClubLogoUrl(profile.clubCode)
  const clubMonogram = getClubMonogram(profile.clubName)

  const sessionsThisWeek = logs.filter((l) => l.week === week).length
  const recentLogs = logs.slice(0, 2)

  const sessionDuration = LEVEL_DURATION[profile.trainingLevel ?? 'performance']
  const trainingLevelLabel = TRAINING_LEVEL_LABEL[profile.trainingLevel ?? 'performance']

  // Auto-suggestion: if calendar phase differs from profile.seasonMode (Performance only)
  const currentSeasonMode = profile.seasonMode ?? 'in_season'
  const suggestedSeasonMode = seasonPhase ? CALENDAR_TO_SEASON_MODE[seasonPhase] : null
  const showSeasonSuggestion =
    profile.trainingLevel === 'performance' &&
    suggestedSeasonMode !== null &&
    suggestedSeasonMode !== currentSeasonMode

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
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              {SEASON_MODE_LABEL[currentSeasonMode]}
            </span>
          </div>

          <motion.div whileHover={{ y: -4 }} className="relative overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl shadow-slate-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600 opacity-20 blur-3xl -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500 opacity-10 blur-2xl -ml-10 -mb-10" />

            <div className="relative p-7 space-y-5">
              {/* Level + Season badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full">
                  <span className="text-[10px] font-black tracking-wide text-white/80 uppercase">{trainingLevelLabel}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 rounded-full">
                  <Zap className="w-3 h-3 text-white fill-current" />
                  <span className="text-[10px] font-black tracking-widest text-white uppercase">
                    {weekLabel(week)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-3xl font-black text-white leading-tight">Prêt à<br />t'entraîner ?</h3>
                <div className="flex items-center gap-4 text-slate-400">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Clock className="w-4 h-4 text-rose-500" />
                    {sessionDuration}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Activity className="w-4 h-4 text-blue-400" />
                    {profile.weeklySessions} séance{profile.weeklySessions > 1 ? 's' : ''}/sem.
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

        {/* ── Auto-suggestion mode saison (Performance only, quand calendrier diverge) ── */}
        {showSeasonSuggestion && suggestedSeasonMode && (
          <section>
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-[2rem]">
              <div className="p-2 rounded-2xl bg-amber-100 text-amber-600 flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-amber-800">Programme adapté à ta saison</p>
                <p className="text-[10px] text-amber-600 mt-0.5">
                  Ton calendrier suggère : {SEASON_MODE_LABEL[suggestedSeasonMode]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => updateProfile({ seasonMode: suggestedSeasonMode })}
                className="flex-shrink-0 px-3 py-2 rounded-2xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-wide hover:bg-amber-400 transition-colors"
              >
                Appliquer
              </button>
            </div>
          </section>
        )}

        {/* ── ACWR Widget ── */}
        <section>
          {acwr.hasSufficientData && acwr.zone ? (() => {
            const cfg = ACWR_ZONE_CONFIG[acwr.zone]
            const pct = Math.min((acwr.acwr ?? 0) / 2, 1) // 0→2 mapped to 0→100%
            return (
              <div className={`bg-white border rounded-[2rem] p-5 shadow-sm space-y-3 ${cfg.border}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Charge d'entraînement</h3>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Bar */}
                <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  {/* Optimal zone highlight */}
                  <div className="absolute top-0 bottom-0 bg-emerald-100 rounded-full"
                    style={{ left: '40%', width: '25%' }} />
                  {/* ACWR indicator */}
                  <div
                    className={`absolute top-0 bottom-0 rounded-full transition-all ${
                      acwr.zone === 'optimal' ? 'bg-emerald-500'
                      : acwr.zone === 'underload' ? 'bg-slate-400'
                      : acwr.zone === 'caution' ? 'bg-amber-500'
                      : 'bg-rose-500'
                    }`}
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <div className={`text-2xl font-black ${cfg.color}`}>
                      {acwr.acwr?.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-400">ACWR cette semaine</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-700">{acwr.acuteLoad} UA</div>
                    <div className="text-[10px] text-slate-400">charge aiguë</div>
                  </div>
                </div>

                <p className={`text-xs font-medium ${cfg.color}`}>{cfg.message}</p>
              </div>
            )
          })() : (
            <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-slate-300" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700">Charge d'entraînement</p>
                  <p className="text-xs text-slate-400">
                    {acwr.weeksOfData === 0
                      ? 'Disponible après ta 1re semaine de séances.'
                      : `Sem. ${acwr.weeksOfData}/2 — encore ${2 - acwr.weeksOfData} sem. pour activer l'ACWR.`}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    {acwr.weeksOfData === 0 ? 'Étape 1 sur 2' : 'Étape 2 sur 2'}
                  </span>
                  <span className="text-[10px] font-bold text-rose-500">
                    {acwr.weeksOfData === 0 ? 'Note ton RPE après chaque séance' : 'Continue — presque là !'}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-400 rounded-full transition-all duration-500"
                    style={{ width: acwr.weeksOfData === 0 ? '15%' : '60%' }}
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Season + Next Match ── */}
        <section>
          <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Saison</h3>
              {(() => {
                const cfg = seasonPhaseLabel[seasonPhase]
                return (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${cfg.bg} ${cfg.color}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                    {cfg.label}
                  </span>
                )
              })()}
            </div>

            {isMatchDay && (
              <div className="flex items-center gap-2 py-2 px-3 bg-rose-50 rounded-2xl">
                <Trophy className="w-4 h-4 text-rose-600 fill-current" />
                <span className="text-xs font-black text-rose-700 uppercase tracking-wide">Jour de match !</span>
              </div>
            )}

            {nextMatch && !isMatchDay && (
              <Link to="/calendar">
                <div className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-900">
                      Prochain match — J−{diffDays(nextMatch.date)}
                    </div>
                    {nextMatch.opponent && (
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Swords className="w-2.5 h-2.5" />
                        vs {nextMatch.opponent}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-600 transition-colors" />
                </div>
              </Link>
            )}

            {!nextMatch && (
              <Link to="/calendar">
                <div className="flex items-center gap-3 text-slate-400 hover:text-rose-600 transition-colors">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold">Ajoute tes matchs →</span>
                </div>
              </Link>
            )}
          </div>
        </section>

        {/* ── Quick Access ── */}
        <section>
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-3">Accès Rapide</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { to: '/week', icon: Dumbbell, label: 'Programme', color: 'text-rose-600', bg: 'bg-rose-50' },
              { to: '/calendar', icon: Calendar, label: 'Calendrier', color: 'text-blue-500', bg: 'bg-blue-50' },
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
