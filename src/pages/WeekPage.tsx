import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, AlertTriangle, CheckCircle2, TrendingUp, Info, Dumbbell, Activity, Leaf, HeartPulse } from 'lucide-react'
import { posthog } from '../services/analytics/posthog'
import { useFatigue } from '../hooks/useFatigue'
import { useBlockLogs } from '../hooks/useBlockLogs'
import { useHistory } from '../hooks/useHistory'
import { useProfile } from '../hooks/useProfile'
import { useWeek } from '../hooks/useWeek'
import { useCalendar } from '../hooks/useCalendar'
import { useACWR } from '../hooks/useACWR'
import { buildWeekProgram, validateSession } from '../services/program'
import { applyDeloadToSessions } from '../services/ui/applyDeload'
import { shouldRecommendDeload } from '../services/ui/recommendations'
import { getSessionRecap } from '../services/ui/progression'
import { getCycleWeekNumber, getPhaseForWeek } from '../services/program/programPhases.v1'
import type { CycleWeek, DayOfWeek, RehabPhase, SessionType } from '../types/training'
import { TRAINING_DAYS_DEFAULT } from '../services/program/scheduleOptimizer'
import { BottomNav } from '../components/BottomNav'
import { PageHeader } from '../components/PageHeader'

const WEEK_OPTIONS: CycleWeek[] = ['H1', 'H2', 'H3', 'H4', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'DELOAD']

const getSessionType = (recipeId: string): SessionType => {
  if (recipeId === 'UPPER_V1' || recipeId === 'UPPER_HYPER_V1' || recipeId === 'UPPER_BUILDER_V1') return 'UPPER'
  if (recipeId === 'LOWER_V1' || recipeId === 'LOWER_HYPER_V1' || recipeId === 'LOWER_BUILDER_V1') return 'LOWER'
  if (recipeId === 'COND_OFF_V1' || recipeId === 'COND_PRE_V1') return 'CONDITIONING'
  return 'FULL'
}

// Day labels (Sun=0 … Sat=6)
const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

const SESSION_TYPE_STYLES: Record<SessionType, { bg: string; text: string; label: string }> = {
  UPPER:        { bg: 'bg-blue-900/20',   text: 'text-blue-400',   label: 'UPPER' },
  LOWER:        { bg: 'bg-emerald-900/20', text: 'text-emerald-400', label: 'LOWER' },
  FULL:         { bg: 'bg-amber-900/20',   text: 'text-amber-400',   label: 'FULL'  },
  CONDITIONING: { bg: 'bg-violet-900/20',  text: 'text-violet-400',  label: 'COND'  },
  RECOVERY:     { bg: 'bg-teal-900/20',    text: 'text-teal-400',    label: 'RECOV' },
}

const REHAB_CRITERIA: Record<RehabPhase, string> = {
  1: 'P2 : absence douleur au repos · mobilité partielle retrouvée · 1-2 semaines',
  2: 'P3 : force ≥ 70% côté sain · ROM complet sans douleur · 2-4 semaines',
  3: 'Fin : force ≥ 90% · tests fonctionnels OK · course/sauts sans douleur',
}

export function WeekPage() {
  const { profile } = useProfile()
  const { week, setWeek, lastNonDeloadWeek } = useWeek()
  const { fatigue, setFatigue } = useFatigue()
  const { logs: blockLogs } = useBlockLogs()
  const { logs } = useHistory()
  const { events } = useCalendar()

  // Match non chargé hier → bannière rappel + suggestion mobilité
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  const unmatchedYesterdayMatch = events.find(
    (e) => e.type === 'match' && e.date === yesterdayStr && !e.rpe
  ) ?? null
  const isRecoveryDay = events.some((e) => e.type === 'match' && e.date === yesterdayStr)

  const acwrResult = useACWR(logs, events)
  const acwr = acwrResult.acwr
  const acwrZone = acwrResult.zone

  useEffect(() => { posthog.capture('week_viewed') }, [])

  const effectiveWeek = week === 'DELOAD' ? lastNonDeloadWeek : week
  const phase = getPhaseForWeek(effectiveWeek)
  const cycleWeekNumber = getCycleWeekNumber(week)
  const recommendation = shouldRecommendDeload(logs, week, acwr)
  const isDeloadWeek = week === 'DELOAD'

  // Training day detection — use scSchedule if available, otherwise defaults
  const todayDow = new Date().getDay() as DayOfWeek
  const trainingDays: DayOfWeek[] =
    profile.scSchedule?.sessions.map((s) => s.day) ??
    TRAINING_DAYS_DEFAULT[profile.weeklySessions]
  const todaySessionIndex = trainingDays.indexOf(todayDow)
  const isTrainingToday = todaySessionIndex !== -1

  const builtWeekProgram = buildWeekProgram(profile, effectiveWeek, {
    fatigueLevel: acwrZone ?? undefined,
  })
  const weekProgram = {
    ...builtWeekProgram,
    week,
    sessions: isDeloadWeek
      ? applyDeloadToSessions(builtWeekProgram.sessions)
      : builtWeekProgram.sessions,
  }

  const recapRows = weekProgram.sessions.map((session) => ({
    type: getSessionType(session.recipeId),
    recap: getSessionRecap(blockLogs, session, getSessionType(session.recipeId), week),
  }))

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
    off_season: { label: '🌿 Inter-saison', color: 'bg-emerald-900/20 text-emerald-400 border-emerald-500/20' },
    pre_season: { label: '🔥 Pré-saison',   color: 'bg-amber-900/20 text-amber-400 border-amber-500/20' },
    in_season:  { label: '⚡ Saison',        color: 'bg-white/10 text-white/60 border-white/20' },
  }

  return (
    <div className="min-h-screen bg-[#1a100c] font-sans text-white pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(#ff6b35_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader title="Plan Semaine" backTo="/" titleSuffix={week} />

      <main className="px-6 pt-6 space-y-5 max-w-md mx-auto relative">

        {/* Séance du jour CTA */}
        {isTrainingToday && weekProgram && (
          <Link
            to={`/session/${todaySessionIndex}`}
            className="flex items-center justify-between gap-3 px-5 py-4 bg-[#ff6b35] text-white rounded-[2rem] shadow-lg shadow-[#ff6b35]/20 hover:bg-[#e55a2b] transition-colors"
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

        {/* Bannière match hier sans charge */}
        {unmatchedYesterdayMatch && (
          <Link
            to="/calendar"
            className="flex items-center gap-3 px-4 py-3 bg-amber-900/20 border border-amber-500/20 rounded-2xl hover:bg-amber-900/30 transition-colors"
          >
            <div className="p-1.5 rounded-xl bg-amber-900/20 text-amber-400 flex-shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-amber-300">
                🏉 Match hier{unmatchedYesterdayMatch.opponent ? ` vs ${unmatchedYesterdayMatch.opponent}` : ''} — enregistre ta charge
              </p>
              <p className="text-[10px] text-amber-400 mt-0.5">Mise à jour ACWR → Calendrier</p>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
          </Link>
        )}

        {/* Bannière mobilité (lendemain de match) */}
        {isRecoveryDay && !isDeloadWeek && (
          <Link
            to="/mobility"
            className="flex items-center gap-3 px-4 py-3 bg-teal-900/20 border border-teal-500/20 rounded-2xl hover:bg-teal-900/30 transition-colors"
          >
            <div className="p-1.5 rounded-xl bg-teal-900/20 text-teal-400 flex-shrink-0">
              <Leaf className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-teal-300">Session mobilité suggérée</p>
              <p className="text-[10px] text-teal-400 mt-0.5">Récupération active · 10-15 min</p>
            </div>
            <ChevronRight className="w-4 h-4 text-teal-400 flex-shrink-0" />
          </Link>
        )}

        {/* Bannière rehab active */}
        {profile.rehabInjury && (
          <div className="p-4 bg-rose-900/20 border border-rose-500/20 rounded-3xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <p className="text-xs font-black text-rose-400">
                  Mode Réhab — Phase {profile.rehabInjury.phase}/3
                </p>
              </div>
              <span className="text-[10px] text-rose-400">
                {profile.rehabInjury.zone === 'upper' ? 'Épaule/Bras/Cou' : 'Genou/Hanche/Cheville'}
              </span>
            </div>
            <p className="text-xs text-rose-400 leading-snug">
              {REHAB_CRITERIA[profile.rehabInjury.phase]}
            </p>
          </div>
        )}

        {/* Bannière ACWR (caution / danger / critical) */}
        {!isDeloadWeek && acwrZone && ['caution', 'danger', 'critical'].includes(acwrZone) && (
          <div className={`flex items-start gap-3 p-4 rounded-3xl border ${
            acwrZone === 'caution'
              ? 'bg-amber-900/20 border-amber-500/20'
              : 'bg-rose-900/20 border-rose-500/20'
          }`}>
            <Activity className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
              acwrZone === 'caution' ? 'text-amber-400' : 'text-rose-400'
            }`} />
            <div className="flex-1 space-y-2">
              <p className={`text-xs font-black ${
                acwrZone === 'caution' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                ACWR {acwr?.toFixed(2)} —{' '}
                {acwrZone === 'caution' ? 'Zone vigilance' : 'Surcharge détectée'}
              </p>
              <p className={`text-xs leading-snug ${
                acwrZone === 'caution' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {acwrZone === 'caution'
                  ? "Charge élevée cette semaine. Réduis l'intensité si tu ressens de la fatigue."
                  : 'Charge critique. Une semaine de récupération est fortement recommandée.'}
              </p>
              {(acwrZone === 'danger' || acwrZone === 'critical') && (
                <button
                  type="button"
                  onClick={() => setWeek('DELOAD')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff6b35] text-white text-xs font-black uppercase tracking-wide"
                >
                  Passer en mode récup
                </button>
              )}
            </div>
          </div>
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
                  : 'bg-white/5 border border-white/10 text-white/60 hover:border-[#1a5f3f]/20'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Phase info + Season mode badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {(phase || cycleWeekNumber) && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-2xl">
              <Info className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
              <p className="text-xs text-white/60">
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
        <section className="bg-white/5 border border-white/10 rounded-[24px] p-5">
          <h2 className="text-xs font-black uppercase tracking-wider text-white/40 mb-3">Niveau de fatigue aujourd'hui</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFatigue('OK')}
              className={`py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                fatigue === 'OK'
                  ? 'bg-[#10b981] text-white shadow-sm'
                  : 'bg-white/5 text-white/50 border border-white/10 hover:border-[#10b981]/20'
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
                  : 'bg-white/5 text-white/50 border border-white/10 hover:border-[#f59e0b]/20'
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
            <p className="mt-3 text-xs text-white/40 text-center">Semaine de décharge recommandée la suivante.</p>
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
          <div className="px-4 py-3 bg-orange-900/20 border border-orange-500/20 rounded-2xl">
            <p className="text-xs text-orange-300 leading-relaxed">
              <strong>Protocole décharge :</strong> réduis le volume de 40–60 %, maintiens l'intensité. Priorité sommeil et nutrition. Durée : 1 semaine. (Issurin 2008)
            </p>
          </div>
        )}


        {/* Recap */}
        {recapRows.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-[24px] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-xl bg-[#ff6b35]/10 text-[#ff6b35]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white/40">Récap semaine</h3>
            </div>
            <div className="space-y-1.5">
              {recapRows.map((row) => (
                <div key={row.type} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{row.type}</span>
                  <span className="text-white/40">
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
              className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-[2rem] p-5 hover:border-white/30 hover:shadow-md transition-all"
            >
              {/* Type badge */}
              <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 ${style.bg}`}>
                <span className={`text-[10px] font-black tracking-wide ${style.text}`}>{style.label}</span>
                {index === todaySessionIndex && isTrainingToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b35]" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-sm truncate">
                    {trainingDays[index] !== undefined
                      ? `${DAY_LABELS[trainingDays[index]]} · ${session.title}`
                      : session.title}
                  </h3>
                  <span className={`flex-shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    validation.isValid ? 'bg-emerald-900/20 text-emerald-400' : 'bg-rose-900/20 text-rose-400'
                  }`}>
                    {validation.isValid ? '✓' : '!'}
                  </span>
                </div>
                <p className="text-xs text-white/40 mt-0.5">
                  {session.blocks.length} blocs
                  {recap && ` · ${recap.loggedExercises}/${recap.totalExercises} faits`}
                  {!!recap?.loadProxy && ` · ${recap.loadProxy}`}
                </p>
              </div>

              <ChevronRight className="w-5 h-5 text-white/30 flex-shrink-0" />
            </Link>
          )
        })}

      </main>

      <BottomNav />
    </div>
  )
}
