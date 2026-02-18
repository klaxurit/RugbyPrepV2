import { Link } from 'react-router-dom'
import { useState } from 'react'
import { ChevronLeft, User, Target, AlertTriangle, CheckCircle2, TrendingUp, Info } from 'lucide-react'
import { weekGuidanceV1 } from '../data/weekGuidance.v1'
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
import { getBaseWeekVersion, getCycleWeekNumber, getPhaseForWeek } from '../services/program/programPhases.v1'
import type { CycleWeek, SessionType } from '../types/training'
import { SessionView } from '../components/SessionView'
import { ProfileModal } from '../components/modals/ProfileModal'
import { WeekObjectiveModal } from '../components/modals/WeekObjectiveModal'
import { BottomNav } from '../components/BottomNav'

const WEEK_OPTIONS: CycleWeek[] = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'DELOAD']

const getSessionType = (recipeId: string): SessionType => {
  if (recipeId === 'UPPER_V1') return 'UPPER'
  if (recipeId === 'LOWER_V1') return 'LOWER'
  return 'FULL'
}

export function WeekPage() {
  const { profile } = useProfile()
  const { week, setWeek, lastNonDeloadWeek } = useWeek()
  const { viewMode, setViewMode } = useViewMode()
  const { fatigue, setFatigue } = useFatigue()
  const { logs: blockLogs } = useBlockLogs()
  const { logs, addLog } = useHistory()
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false)

  const effectiveWeek = week === 'DELOAD' ? lastNonDeloadWeek : week
  const baseWeek = getBaseWeekVersion(effectiveWeek)
  const guidance = week === 'DELOAD' ? weekGuidanceV1.DELOAD : weekGuidanceV1[baseWeek]
  const phase = getPhaseForWeek(effectiveWeek)
  const cycleWeekNumber = getCycleWeekNumber(week)
  const recommendation = shouldRecommendDeload(logs, week)
  const isDeloadWeek = week === 'DELOAD'
  const hasEquipment = profile.equipment.length > 0

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

  const weeklyBannerText =
    week === 'W4'
      ? 'Fin de bloc — consulte tes progrès'
      : week === 'DELOAD'
        ? 'Semaine de décharge — priorité récupération'
        : 'Objectif : régularité + qualité d\'exécution'

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
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Plan Semaine
              <span className="ml-2 text-sm font-bold text-slate-400">{week}</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="p-2 rounded-2xl bg-gray-50 border border-gray-100 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors"
          >
            <User className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsObjectiveModalOpen(true)}
            className="p-2 rounded-2xl bg-gray-50 border border-gray-100 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors"
          >
            <Target className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="px-6 pt-6 space-y-5 max-w-md mx-auto">

        {/* Week selector chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {WEEK_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setWeek(opt)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-2xl text-xs font-black transition-all ${
                opt === week
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white border border-gray-100 text-slate-500 hover:border-rose-200'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Phase info */}
        {(phase || cycleWeekNumber) && (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-2xl">
            <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <p className="text-xs text-slate-300">
              {phase && <span>Bloc {phase} ({phase === 'FORCE' ? 'S1–4' : 'S5–8'})</span>}
              {phase && cycleWeekNumber && ' · '}
              {cycleWeekNumber && <span>Wk {cycleWeekNumber}/8</span>}
            </p>
          </div>
        )}

        {/* View mode toggle */}
        <div className="flex gap-2">
          {(['compact', 'detail'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`flex-1 py-2 rounded-2xl text-xs font-bold transition-all ${
                viewMode === mode
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-gray-100 text-slate-500 hover:border-slate-300'
              }`}
            >
              {mode === 'compact' ? 'Compact' : 'Détail'}
            </button>
          ))}
        </div>

        {/* Banner */}
        <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl ${
          isDeloadWeek ? 'bg-blue-50 border border-blue-100' : 'bg-white border border-gray-100'
        } shadow-sm`}>
          <p className={`text-xs font-bold ${isDeloadWeek ? 'text-blue-700' : 'text-slate-600'}`}>
            {weeklyBannerText}
          </p>
          <Link to="/progress" className="text-[10px] font-black text-rose-600 uppercase tracking-wide flex-shrink-0">
            Progrès →
          </Link>
        </div>

        {/* Fatigue toggle */}
        <section className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Niveau de fatigue aujourd'hui</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFatigue('OK')}
              className={`py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all ${
                fatigue === 'OK'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-gray-50 text-slate-500 border border-gray-100 hover:border-emerald-200'
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
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-gray-50 text-slate-500 border border-gray-100 hover:border-orange-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Je suis fatigué
            </button>
          </div>

          {fatigue === 'FATIGUE' && week !== 'DELOAD' && (
            <div className="mt-3 p-3 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-between gap-3">
              <p className="text-xs text-orange-700 font-medium">Décharge recommandée.</p>
              <button
                type="button"
                onClick={() => setWeek('DELOAD')}
                className="text-[10px] font-black text-orange-600 uppercase tracking-wide flex-shrink-0"
              >
                Basculer →
              </button>
            </div>
          )}
          {(week === 'W4' || week === 'W8') && (
            <p className="mt-3 text-xs text-slate-400 text-center">Semaine de décharge recommandée la suivante.</p>
          )}
        </section>

        {/* Deload recommendation */}
        {recommendation.recommend && (
          <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-700">
                <strong>Décharge recommandée.</strong> {recommendation.reason}
              </p>
            </div>
            {week !== 'DELOAD' && (
              <button
                type="button"
                onClick={() => setWeek('DELOAD')}
                className="text-[10px] font-black text-orange-600 uppercase flex-shrink-0"
              >
                Passer →
              </button>
            )}
          </div>
        )}

        {/* No equipment warning */}
        {!hasEquipment && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700">
              Ajoute au moins un équipement dans ton{' '}
              <Link to="/profile" className="font-bold underline">profil</Link> pour générer le plan.
            </p>
          </div>
        )}

        {/* Recap */}
        {recapRows.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-xl bg-amber-50 text-amber-500">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Récap semaine</h3>
            </div>
            <div className="space-y-1.5">
              {recapRows.map((row) => (
                <div key={row.type} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">{row.type}</span>
                  <span className="text-slate-400">
                    {row.recap.loggedExercises}/{row.recap.totalExercises} exercices · charge {row.recap.loadProxy}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Week warnings */}
        {weekProgram && weekProgram.warnings.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
            <ul className="space-y-1">
              {weekProgram.warnings.map((warning) => (
                <li key={warning} className="text-xs text-amber-700 flex items-start gap-1.5">
                  <span className="mt-0.5">⚠</span> {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sessions */}
        {weekProgram?.sessions.map((session, index) => {
          const validation = validateSession(session)
          const sessionWarnings = [...session.warnings, ...validation.warnings]
          return (
            <div key={`${session.recipeId}-${index}`} className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
              <SessionView
                session={session}
                availableEquipment={profile.equipment}
                sessionType={getSessionType(session.recipeId)}
                viewMode={viewMode}
                isDeload={isDeloadWeek}
                isValid={validation.isValid}
                warnings={sessionWarnings}
                onMarkComplete={() => {
                  addLog({
                    dateISO: new Date().toISOString(),
                    week,
                    sessionType: getSessionType(session.recipeId),
                    fatigue,
                  })
                  setSavedSessionId(session.recipeId)
                }}
                statusLabel={validation.isValid ? 'Valide' : 'À vérifier'}
              />
            </div>
          )
        })}

        {savedSessionId && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="text-xs text-emerald-700 font-bold">Séance enregistrée !</p>
          </div>
        )}

      </main>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
      />
      <WeekObjectiveModal
        isOpen={isObjectiveModalOpen}
        onClose={() => setIsObjectiveModalOpen(false)}
        week={week}
        guidance={guidance}
      />

      <BottomNav />
    </div>
  )
}
