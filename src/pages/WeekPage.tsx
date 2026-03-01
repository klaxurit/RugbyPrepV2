import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, TrendingUp, Info, Dumbbell } from 'lucide-react'
import { useFatigue } from '../hooks/useFatigue'
import { useBlockLogs } from '../hooks/useBlockLogs'
import { useHistory } from '../hooks/useHistory'
import { useProfile } from '../hooks/useProfile'
import { useWeek } from '../hooks/useWeek'
import { useViewMode } from '../hooks/useViewMode'
import { buildWeekProgram, validateSession } from '../services/program'
import { applyDeloadToSessions } from '../services/ui/applyDeload'
import { shouldRecommendDeload } from '../services/ui/recommendations'
import { getSessionRecap } from '../services/ui/progression'
import { getCycleWeekNumber, getPhaseForWeek } from '../services/program/programPhases.v1'
import type { CycleWeek, DayOfWeek, SessionType } from '../types/training'
import { TRAINING_DAYS_DEFAULT } from '../services/program/scheduleOptimizer'
import { BottomNav } from '../components/BottomNav'

const WEEK_OPTIONS: CycleWeek[] = ['H1', 'H2', 'H3', 'H4', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'DELOAD']

const getSessionType = (recipeId: string): SessionType => {
  if (recipeId === 'UPPER_V1' || recipeId === 'UPPER_HYPER_V1' || recipeId === 'UPPER_BUILDER_V1') return 'UPPER'
  if (recipeId === 'LOWER_V1' || recipeId === 'LOWER_HYPER_V1' || recipeId === 'LOWER_BUILDER_V1') return 'LOWER'
  return 'FULL'
}

// Day labels (Sun=0 … Sat=6)
const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

const SESSION_TYPE_STYLES: Record<SessionType, { bg: string; text: string; label: string }> = {
  UPPER: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'UPPER' },
  LOWER: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'LOWER' },
  FULL:  { bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'FULL'  },
}

export function WeekPage() {
  const { profile } = useProfile()
  const { week, setWeek, lastNonDeloadWeek } = useWeek()
  const { setViewMode } = useViewMode()
  const { fatigue, setFatigue } = useFatigue()
  const { logs: blockLogs } = useBlockLogs()
  const { logs } = useHistory()

  const effectiveWeek = week === 'DELOAD' ? lastNonDeloadWeek : week
  const phase = getPhaseForWeek(effectiveWeek)
  const cycleWeekNumber = getCycleWeekNumber(week)
  const recommendation = shouldRecommendDeload(logs, week)
  const isDeloadWeek = week === 'DELOAD'
  const hasEquipment = profile.equipment.length > 0

  // Training day detection — use scSchedule if available, otherwise defaults
  const todayDow = new Date().getDay() as DayOfWeek
  const trainingDays: DayOfWeek[] =
    profile.scSchedule?.sessions.map((s) => s.day) ??
    TRAINING_DAYS_DEFAULT[profile.weeklySessions]
  const todaySessionIndex = trainingDays.indexOf(todayDow)
  const isTrainingToday = todaySessionIndex !== -1

  const builtWeekProgram = hasEquipment ? buildWeekProgram(profile, effectiveWeek) : null
  const weekProgram = builtWeekProgram
    ? {
        ...builtWeekProgram,
        week,
        sessions: isDeloadWeek
          ? applyDeloadToSessions(builtWeekProgram.sessions)
          : builtWeekProgram.sessions,
      }
    : null

  const recapRows =
    weekProgram?.sessions.map((session) => ({
      type: getSessionType(session.recipeId),
      recap: getSessionRecap(blockLogs, session, getSessionType(session.recipeId), week),
    })) ?? []

  const seasonMode = profile.seasonMode ?? 'in_season'

  const weeklyBannerText =
    week === 'DELOAD'
      ? 'Semaine de décharge — priorité récupération'
      : seasonMode === 'off_season'
        ? 'Inter-saison : hypertrophie & reconstruction musculaire'
        : seasonMode === 'pre_season'
          ? 'Pré-saison : force-puissance & réathlétisation'
          : week === 'W4'
            ? 'Fin de bloc — consulte tes progrès'
            : 'Objectif : régularité + qualité d\'exécution'

  const SEASON_MODE_BADGE: Record<string, { label: string; color: string }> = {
    off_season: { label: '🌿 Inter-saison', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    pre_season: { label: '🔥 Pré-saison',   color: 'bg-amber-50 text-amber-700 border-amber-100' },
    in_season:  { label: '⚡ Saison',        color: 'bg-slate-100 text-slate-600 border-slate-200' },
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] font-sans text-[#1f2937] pb-24">

      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 -ml-2 rounded-xl hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <p className="text-xs font-bold tracking-widest text-rose-600 uppercase italic">RugbyPrep</p>
            <h1 className="text-xl font-extrabold tracking-tight text-[#1f2937]">
              Plan Semaine
              <span className="ml-2 text-sm font-bold text-[#6b7280]">{week}</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="px-6 pt-6 space-y-5 max-w-md mx-auto">

        {/* Séance du jour CTA */}
        {isTrainingToday && weekProgram && (
          <Link
            to={`/session/${todaySessionIndex}`}
            onClick={() => setViewMode('compact')}
            className="flex items-center justify-between gap-3 px-5 py-4 bg-rose-600 text-white rounded-[2rem] shadow-lg shadow-rose-900/20 hover:bg-rose-500 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Aujourd'hui</p>
                <p className="text-sm font-black">C'est jour de séance !</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 opacity-60 flex-shrink-0" />
          </Link>
        )}

        {/* Week selector chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {WEEK_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setWeek(opt)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-2xl text-xs font-black transition-all ${
                opt === week
                  ? 'bg-[#1a5f3f] text-white shadow-sm'
                  : 'bg-white border border-gray-100 text-slate-500 hover:border-[#1a5f3f]/20'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Phase info + Season mode badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {(phase || cycleWeekNumber) && (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-2xl">
              <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <p className="text-xs text-slate-300">
                {phase && <span>Bloc {phase} ({phase === 'FORCE' ? 'S1–4' : phase === 'HYPERTROPHY' ? 'H1–4' : 'S5–8'})</span>}
                {phase && cycleWeekNumber && ' · '}
                {cycleWeekNumber && <span>Wk {cycleWeekNumber}/8</span>}
              </p>
            </div>
          )}
          {SEASON_MODE_BADGE[seasonMode] && (
            <span className={`px-3 py-2 rounded-2xl text-xs font-black border ${SEASON_MODE_BADGE[seasonMode].color}`}>
              {SEASON_MODE_BADGE[seasonMode].label}
            </span>
          )}
        </div>

        {/* Banner */}
        <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl ${
          isDeloadWeek ? 'bg-[#1a5f3f]/10 border border-[#1a5f3f]/20' : 'bg-[#ff6b35]/10 border border-[#ff6b35]/20'
        } shadow-sm`}>
          <p className={`text-xs font-bold ${isDeloadWeek ? 'text-[#1a5f3f]' : 'text-[#ff6b35]'}`}>
            {weeklyBannerText}
          </p>
          <Link to="/progress" className="text-[10px] font-black text-[#1a5f3f] uppercase tracking-wide flex-shrink-0">
            Progrès →
          </Link>
        </div>

        {/* Fatigue toggle */}
        <section className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#6b7280] mb-3">Niveau de fatigue aujourd'hui</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFatigue('OK')}
              className={`py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                fatigue === 'OK'
                  ? 'bg-[#10b981] text-white shadow-sm'
                  : 'bg-gray-50 text-slate-500 border border-gray-100 hover:border-[#10b981]/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Je suis frais
            </button>
            <button
              type="button"
              onClick={() => setFatigue('FATIGUE')}
              className={`py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                fatigue === 'FATIGUE'
                  ? 'bg-[#f59e0b] text-white shadow-sm'
                  : 'bg-gray-50 text-slate-500 border border-gray-100 hover:border-[#f59e0b]/20'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Je suis fatigué
            </button>
          </div>

          {fatigue === 'FATIGUE' && week !== 'DELOAD' && (
            <div className="mt-3 p-3 bg-[#f59e0b]/10 rounded-2xl border border-[#f59e0b]/20 flex items-center justify-between gap-3">
              <p className="text-xs text-[#f59e0b] font-medium">Décharge recommandée.</p>
              <button
                type="button"
                onClick={() => setWeek('DELOAD')}
                className="text-[10px] font-black text-[#f59e0b] uppercase tracking-wide flex-shrink-0"
              >
                Basculer →
              </button>
            </div>
          )}
          {(week === 'W4' || week === 'W8') && (
            <p className="mt-3 text-xs text-[#6b7280] text-center">Semaine de décharge recommandée la suivante.</p>
          )}
        </section>

        {/* Deload recommendation */}
        {recommendation.recommend && (
          <div className="p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-2xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#f59e0b] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[#f59e0b]">
                <strong>Décharge recommandée.</strong> {recommendation.reason}
              </p>
            </div>
            {week !== 'DELOAD' && (
              <button
                type="button"
                onClick={() => setWeek('DELOAD')}
                className="text-[10px] font-black text-[#f59e0b] uppercase flex-shrink-0"
              >
                Passer →
              </button>
            )}
          </div>
        )}

        {/* Deload info */}
        {recommendation.recommend && (
          <div className="px-4 py-3 bg-orange-50 border border-orange-100 rounded-2xl">
            <p className="text-xs text-orange-700 leading-relaxed">
              <strong>Protocole décharge :</strong> réduis le volume de 40–60 %, maintiens l'intensité. Priorité sommeil et nutrition. Durée : 1 semaine. (Issurin 2008)
            </p>
          </div>
        )}

        {/* No equipment warning */}
        {!hasEquipment && (
          <div className="p-4 bg-[#ff6b35]/10 border border-[#ff6b35]/20 rounded-2xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-[#ff6b35] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#ff6b35]">
              Ajoute au moins un équipement dans ton{' '}
              <Link to="/profile" className="font-bold underline">profil</Link> pour générer le plan.
            </p>
          </div>
        )}

        {/* Recap */}
        {recapRows.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-xl bg-[#ff6b35]/10 text-[#ff6b35]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#6b7280]">Récap semaine</h3>
            </div>
            <div className="space-y-1.5">
              {recapRows.map((row) => (
                <div key={row.type} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1f2937]">{row.type}</span>
                  <span className="text-[#6b7280]">
                    {row.recap.loggedExercises}/{row.recap.totalExercises} exercices · charge {row.recap.loadProxy}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Session cards — compact, tap to go to detail */}
        {weekProgram?.sessions.map((session, index) => {
          const validation = validateSession(session)
          const type = getSessionType(session.recipeId)
          const style = SESSION_TYPE_STYLES[type]
          const recap = recapRows[index]?.recap

          return (
            <Link
              key={`${session.recipeId}-${index}`}
              to={`/session/${index}`}
              onClick={() => setViewMode('compact')}
              className="flex items-center gap-4 bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm hover:border-rose-200 hover:shadow-md transition-all"
            >
              {/* Type badge */}
              <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 ${style.bg}`}>
                <span className={`text-[10px] font-black tracking-wide ${style.text}`}>{style.label}</span>
                {index === todaySessionIndex && isTrainingToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-sm truncate">
                    {trainingDays[index] !== undefined
                      ? `${DAY_LABELS[trainingDays[index]]} · ${session.title}`
                      : session.title}
                  </h3>
                  <span className={`flex-shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    validation.isValid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                  }`}>
                    {validation.isValid ? '✓' : '!'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {session.blocks.length} blocs
                  {recap && ` · ${recap.loggedExercises}/${recap.totalExercises} faits`}
                  {!!recap?.loadProxy && ` · ${recap.loadProxy}`}
                </p>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
            </Link>
          )
        })}

      </main>

      <BottomNav />
    </div>
  )
}
