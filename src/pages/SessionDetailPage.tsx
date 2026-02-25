import { Link, Navigate, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { ChevronLeft, Info, Clock, Activity } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useWeek } from '../hooks/useWeek'
import { useViewMode } from '../hooks/useViewMode'
import { useFatigue } from '../hooks/useFatigue'
import { useBlockLogs } from '../hooks/useBlockLogs'
import { useHistory } from '../hooks/useHistory'
import { buildWeekProgram, validateSession } from '../services/program'
import { applyDeloadToSessions } from '../services/ui/applyDeload'
import { getBaseWeekVersion, getCycleWeekNumber, getPhaseForWeek } from '../services/program/programPhases.v1'
import type { SessionType } from '../types/training'
import { SessionView } from '../components/SessionView'
import { BottomNav } from '../components/BottomNav'

interface SessionDetailLocationState {
  sessionIndex?: number
}

const getSessionType = (recipeId: string): SessionType => {
  if (recipeId === 'UPPER_V1') return 'UPPER'
  if (recipeId === 'LOWER_V1') return 'LOWER'
  return 'FULL'
}

const sessionTypeLabel: Record<SessionType, string> = {
  UPPER: 'Haut du Corps',
  LOWER: 'Bas du Corps',
  FULL: 'Corps Complet'
}

export function SessionDetailPage() {
  const { profile } = useProfile()
  const { week, lastNonDeloadWeek } = useWeek()
  const { viewMode, setViewMode } = useViewMode()
  const { fatigue } = useFatigue()
  const { logs: blockLogs } = useBlockLogs()
  const { logs, addLog } = useHistory()
  const location = useLocation()
  const state = location.state as SessionDetailLocationState | null

  const effectiveWeek = week === 'DELOAD' ? lastNonDeloadWeek : week
  const baseWeek = getBaseWeekVersion(effectiveWeek)
  const phase = getPhaseForWeek(effectiveWeek)
  const cycleWeekNumber = getCycleWeekNumber(week)
  const isDeloadWeek = week === 'DELOAD'
  const hasEquipment = profile.equipment.length > 0

  const builtWeekProgram = hasEquipment ? buildWeekProgram(profile, effectiveWeek) : null
  const weekProgram = builtWeekProgram
    ? {
        ...builtWeekProgram,
        week,
        sessions: isDeloadWeek
          ? applyDeloadToSessions(builtWeekProgram.sessions)
          : builtWeekProgram.sessions
      }
    : null

  const sessions = weekProgram?.sessions ?? []

  const sessionIndex = useMemo(() => {
    if (!sessions.length) return 0
    const indexFromState = state?.sessionIndex ?? 0
    if (indexFromState < 0 || indexFromState >= sessions.length) return 0
    return indexFromState
  }, [sessions.length, state?.sessionIndex])

  const session = sessions[sessionIndex]

  if (!hasEquipment || !session) {
    return <Navigate to="/week" replace />
  }

  const validation = validateSession(session)
  const sessionWarnings = [...session.warnings, ...validation.warnings]
  const sessionType = getSessionType(session.recipeId)

  const handleMarkComplete = () => {
    addLog({
      dateISO: new Date().toISOString(),
      week,
      sessionType,
      fatigue
    })
  }

  const weeklyText =
    week === 'DELOAD'
      ? 'Semaine de décharge — priorité récupération'
      : week === 'W4'
        ? 'Fin de bloc — consulte ta progression'
        : 'Objectif : régularité + qualité d’exécution'

  return (
    <div className="min-h-screen bg-[#faf9f7] font-sans text-[#1f2937] pb-24">
      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/week" className="p-2 -ml-2 rounded-xl hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <p className="text-xs font-bold tracking-widest text-rose-600 uppercase italic">RugbyPrep</p>
            <h1 className="text-xl font-extrabold tracking-tight text-[#1f2937]">
              Séance {sessionTypeLabel[sessionType]}
            </h1>
          </div>
        </div>
      </header>

      <main className="px-6 pt-6 space-y-5 max-w-md mx-auto">
        {/* Session info banner */}
        <section className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-[#1a5f3f]/10 text-[#1a5f3f]">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">
                Semaine {week}
                {phase && ` · Bloc ${phase}`}
                {cycleWeekNumber && ` · Wk ${cycleWeekNumber}/8`}
              </p>
              {profile.rugbyPosition && (
                <p className="text-xs text-[#6b7280] mt-0.5">
                  Poste : <span className="font-semibold">{profile.rugbyPosition}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-[#6b7280]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#1a5f3f]" />
              <span>~55 min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#ff6b35]" />
              <span>{sessionTypeLabel[sessionType]}</span>
            </div>
          </div>
          <p className="text-xs text-[#6b7280]">{weeklyText}</p>
        </section>

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

        {/* Session content */}
        <section className="bg-white border border-gray-100 rounded-[24px] overflow-hidden shadow-sm">
          <SessionView
            session={session}
            availableEquipment={profile.equipment}
            sessionType={sessionType}
            viewMode={viewMode}
            isDeload={isDeloadWeek}
            isValid={validation.isValid}
            warnings={sessionWarnings}
            onMarkComplete={handleMarkComplete}
            statusLabel={validation.isValid ? 'Valide' : 'À vérifier'}
          />
        </section>
      </main>

      <BottomNav />
    </div>
  )
}

