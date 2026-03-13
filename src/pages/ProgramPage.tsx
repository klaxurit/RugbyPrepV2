import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { posthog } from '../services/analytics/posthog'
import { User, Target, AlertTriangle, CheckCircle2, TrendingUp, Info, FileText, Activity, ChevronDown, ChevronUp } from 'lucide-react'
import { weekGuidanceV1 } from '../data/weekGuidance.v1'
import { useFatigue } from '../hooks/useFatigue'
import { useBlockLogs } from '../hooks/useBlockLogs'
import { useHistory } from '../hooks/useHistory'
import { useCalendar } from '../hooks/useCalendar'
import { useACWR } from '../hooks/useACWR'
import { useAcwrOverride } from '../hooks/useAcwrOverride'
import { useAcwrBlockCollapsed } from '../hooks/useAcwrBlockCollapsed'
import { useProfile } from '../hooks/useProfile'
import { useWeek } from '../hooks/useWeek'
import { useProgramFeatureFlags } from '../hooks/useProgramFeatureFlags'
import { buildWeekProgram } from '../services/program/buildWeekProgram'
import { validateSession } from '../services/program'
import { applyDeloadToSession } from '../services/ui/applyDeload'
import { shouldRecommendDeload } from '../services/ui/recommendations'
import { getSessionRecap } from '../services/ui/progression'
import { getProgramSafetyMessages } from '../services/ui/safetyMessaging'
import { getBaseWeekVersion, getCycleWeekNumber, getPhaseForWeek } from '../services/program/programPhases.v1'
import type { CycleWeek, SessionType } from '../types/training'
import { SessionView } from '../components/SessionView'
import { ProfileModal } from '../components/modals/ProfileModal'
import { WeekObjectiveModal } from '../components/modals/WeekObjectiveModal'
import { BottomNav } from '../components/BottomNav'
import { PageHeader } from '../components/PageHeader'

const ALL_WEEK_OPTIONS: CycleWeek[] = ['H1', 'H2', 'H3', 'H4', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'DELOAD']
// H9 (F-B02 fix): In-season 3:1 skips W4/W8/H4 (deload is at W3/W7/H3 instead)
const IN_SEASON_3_1_HIDDEN: CycleWeek[] = ['W4', 'W8', 'H4']

const SESSION_TYPE_MAP: Record<string, SessionType> = {
  UPPER_V1: 'UPPER', UPPER_HYPER_V1: 'UPPER', UPPER_BUILDER_V1: 'UPPER', UPPER_STARTER_V1: 'UPPER',
  LOWER_V1: 'LOWER', LOWER_HYPER_V1: 'LOWER', LOWER_BUILDER_V1: 'LOWER', LOWER_STARTER_V1: 'LOWER',
  FULL_V1: 'FULL', FULL_HYPER_V1: 'FULL', FULL_BUILDER_V1: 'FULL',
  SPEED_FIELD_PRE_V1: 'CONDITIONING',
}

const PHASE_LABEL: Record<string, string> = {
  HYPERTROPHY: 'Hypertrophie · H1–4',
  FORCE: 'Force · W1–8',
  POWER: 'Puissance',
}

export function ProgramPage() {
  const { profile } = useProfile()
  const { week, setWeek, lastNonDeloadWeek } = useWeek()
  const { fatigue, setFatigue } = useFatigue()
  const { logs: blockLogs } = useBlockLogs()
  const { logs, addLog } = useHistory()
  const { events } = useCalendar()
  const [sessionIndex, setSessionIndex] = useState(0)
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false)

  const isInSeason3_1 = (profile?.trainingLevel ?? 'starter') === 'performance' &&
    (profile?.seasonMode ?? 'in_season') === 'in_season'
  const weekOptions = isInSeason3_1
    ? ALL_WEEK_OPTIONS.filter((w) => !IN_SEASON_3_1_HIDDEN.includes(w))
    : ALL_WEEK_OPTIONS

  useEffect(() => { posthog.capture('program_viewed') }, [])

  const acwrResult = useACWR(logs, events)
  const acwr = acwrResult.acwr
  const acwrZone = acwrResult.zone
  const { ignoreAcwrOverload, setOverride } = useAcwrOverride()
  const { collapsed: acwrBlockCollapsed, toggle: toggleAcwrBlock } = useAcwrBlockCollapsed()
  const { featureFlags: programFeatureFlags } = useProgramFeatureFlags()
  const effectiveWeek = week === 'DELOAD' ? lastNonDeloadWeek : week
  const baseWeek = getBaseWeekVersion(effectiveWeek)
  const guidance = week === 'DELOAD' ? weekGuidanceV1.DELOAD : weekGuidanceV1[baseWeek]
  const phase = getPhaseForWeek(effectiveWeek)
  const cycleWeekNumber = getCycleWeekNumber(week)
  const recommendation = shouldRecommendDeload(logs, week, acwr)
  const isDeloadWeek = week === 'DELOAD'

  // Use buildWeekProgram to match exactly the routing logic of /week
  const weekResult = buildWeekProgram(profile, effectiveWeek, {
    fatigueLevel: acwrResult.hasSufficientData ? (acwrZone ?? undefined) : undefined,
    hasSufficientACWRData: acwrResult.hasSufficientData,
    ignoreAcwrOverload,
    featureFlags: programFeatureFlags,
  })
  const sessions = weekResult.sessions
  const weekSafetyMessages = Array.from(
    new Set(getProgramSafetyMessages(weekResult.warnings, weekResult.hardConstraintEvents))
  )

  // Clamp index when week changes (e.g. 3x → 2x profile)
  const safeIndex = Math.min(sessionIndex, Math.max(0, sessions.length - 1))
  const builtSession = sessions[safeIndex] ?? null
  const session = builtSession ? (isDeloadWeek ? applyDeloadToSession(builtSession) : builtSession) : null
  const validation = session ? validateSession(session) : null
  const warnings = Array.from(
    new Set(
      session
        ? [...weekSafetyMessages, ...session.warnings, ...(validation?.warnings ?? [])]
        : weekSafetyMessages
    )
  )
  const sessionType: SessionType = session ? (SESSION_TYPE_MAP[session.recipeId] ?? 'FULL') : 'FULL'
  const recap = session ? getSessionRecap(blockLogs, session, sessionType, week) : null

  return (
    <div className="min-h-screen bg-[#1a100c] font-sans text-white pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(#ff6b35_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader
        title="Programme"
        backTo="/"
        titleSuffix={session ? session.title : week}
        right={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="p-2 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-[#ff6b35] hover:border-[#ff6b35]/20 transition-colors"
              aria-label="Profil"
            >
              <User className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsObjectiveModalOpen(true)}
              className="p-2 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-[#ff6b35] hover:border-[#ff6b35]/20 transition-colors"
              aria-label="Objectif semaine"
            >
              <Target className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <main className="px-6 pt-6 space-y-5 max-w-md mx-auto relative">

        {/* Week selector chips */}
        <div className="relative -mx-1">
          <div
            className="flex gap-2 overflow-x-auto pb-1 pt-2 px-4 scrollbar-none [mask-image:linear-gradient(to_right,transparent_0%,black_2rem,black_calc(100%-2rem),transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_2rem,black_calc(100%-2rem),transparent_100%)] [mask-size:100%_100%]"
          >
          {weekOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { setWeek(opt); setSessionIndex(0) }}
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
          </div>

        {/* Session tabs (si plusieurs séances) */}
        {sessions.length > 1 && (
          <div className="flex gap-2">
            {sessions.map((s, i) => (
              <button
                key={s.recipeId}
                type="button"
                onClick={() => setSessionIndex(i)}
                className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold transition-all truncate flex items-center justify-center gap-1 ${
                  i === safeIndex
                    ? 'bg-white/20 text-white'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:border-white/30'
                }`}
              >
                <span className="truncate">{s.title}</span>
                {s.isSafetyAdapted && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-900/30 text-amber-400 text-[9px] font-black">
                    ADAPT
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* CTA vers Plan Semaine */}
        <Link
          to="/week"
          className="block w-full py-3 px-4 rounded-2xl bg-[#1a5f3f] text-white text-center text-sm font-bold hover:bg-[#1a5f3f]/90 transition-colors"
        >
          Voir le plan de la semaine →
        </Link>

        {/* Phase info */}
        {(phase || cycleWeekNumber) && (
          <div className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-2xl">
            <Info className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
            <p className="text-xs text-white/60">
              {phase && <span>{PHASE_LABEL[phase] ?? phase}</span>}
              {phase && cycleWeekNumber && ' · '}
              {cycleWeekNumber && <span>Semaine {cycleWeekNumber}</span>}
              {profile.rugbyPosition && ` · ${profile.rugbyPosition}`}
            </p>
          </div>
        )}

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
          {(week === 'W4' || week === 'W8' || week === 'H4') && (
            <p className="mt-3 text-xs text-white/40 text-center">Semaine de décharge recommandée la suivante.</p>
          )}
        </section>

        {/* Bloc unique ACWR + décharge — repliable (effet tiroir, même logique que WeekPage) */}
        {!isDeloadWeek && (acwrZone && ['caution', 'danger', 'critical'].includes(acwrZone) || recommendation.recommend) && (
          <div className={`rounded-3xl border overflow-hidden ${
            (acwrZone === 'danger' || acwrZone === 'critical')
              ? 'bg-rose-900/20 border-rose-500/20'
              : 'bg-amber-900/20 border-amber-500/20'
          }`}>
            <button
              type="button"
              onClick={toggleAcwrBlock}
              className="w-full p-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
              aria-expanded={!acwrBlockCollapsed}
            >
              <Activity className={`w-4 h-4 flex-shrink-0 ${
                (acwrZone === 'danger' || acwrZone === 'critical') ? 'text-rose-400' : 'text-amber-400'
              }`} />
              <span className={`flex-1 text-xs font-black ${
                (acwrZone === 'danger' || acwrZone === 'critical') ? 'text-rose-400' : 'text-amber-400'
              }`}>
                {acwrZone === 'danger' || acwrZone === 'critical'
                  ? `Surcharge (ACWR ${acwr?.toFixed(2)}) — priorité récupération`
                  : recommendation.recommend && !acwrZone
                    ? `Décharge recommandée — ${recommendation.reason}`
                    : acwrZone === 'caution'
                      ? `Vigilance (ACWR ${acwr?.toFixed(2)}) — réduis l'intensité si fatigue`
                      : `Décharge recommandée — ${recommendation.reason}`}
              </span>
              {acwrBlockCollapsed ? (
                <ChevronDown className="w-4 h-4 text-white/50 flex-shrink-0" aria-hidden />
              ) : (
                <ChevronUp className="w-4 h-4 text-white/50 flex-shrink-0" aria-hidden />
              )}
            </button>
            {!acwrBlockCollapsed && (
              <div className="px-4 pb-4 pt-0 flex items-start gap-3">
                <div className="w-4 flex-shrink-0" aria-hidden />
                <div className="flex-1 space-y-2 min-w-0">
                  <p className="text-xs text-white/60 leading-snug">
                    Volume −40 à −60 %, intensité maintenue. Sommeil et nutrition prioritaires. (Issurin 2008)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(acwrZone === 'danger' || acwrZone === 'critical' || recommendation.recommend) && (
                      <button
                        type="button"
                        onClick={() => setWeek('DELOAD')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff6b35] text-white text-xs font-black uppercase tracking-wide"
                      >
                        Passer en mode récup
                      </button>
                    )}
                    {(acwrZone === 'danger' || acwrZone === 'critical') && (
                      <button
                        type="button"
                        onClick={() => setOverride(!ignoreAcwrOverload)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 text-white/80 text-xs font-bold hover:bg-white/10 transition-colors"
                      >
                        {ignoreAcwrOverload ? 'Réappliquer la mobilité' : 'Je me sens bien — garder Lower + Upper'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Session warnings */}
        {warnings.length > 0 && (
          <div className="p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-wide text-[#f59e0b] mb-2">
              Adaptations moteur
            </p>
            <ul className="space-y-1">
              {warnings.map((warning) => (
                <li key={warning} className="text-xs text-[#f59e0b] flex items-start gap-1.5">
                  <span className="mt-0.5">⚠</span> {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {session?.identity && (
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-wide text-white/40">
              Identité de séance
            </p>
            <p className="text-sm font-bold text-white">
              {session.identity.objectiveLabel}
            </p>
            <p className="text-xs text-white/45 leading-snug">
              {session.identity.whyTodayLabel}
            </p>
          </div>
        )}

        {/* Recap */}
        {recap && (
          <div className="bg-white/5 border border-white/10 rounded-[24px] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-xl bg-amber-900/20 text-amber-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white/40">Récap {session?.title}</h3>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white/70">Exercices loggés</span>
              <span className="text-white/40">{recap.loggedExercises}/{recap.totalExercises}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="font-bold text-white/70">Charge (proxy)</span>
              <span className="text-white/40">{recap.loadProxy}</span>
            </div>
          </div>
        )}

        {/* Session */}
        {session && (
          <>
            <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
              <SessionView
                session={session}
                availableEquipment={profile.equipment}
                sessionType={sessionType}
                viewMode="compact"
                isDeload={isDeloadWeek}
                isValid={validation?.isValid}
                warnings={warnings}
              />
            </div>

            {/* Mark complete */}
            <section className="bg-white/5 border border-white/10 rounded-[2rem] p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-rose-900/20 text-rose-400">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-black text-white">Séance terminée ?</h2>
              </div>

              <div>
                <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Comment s'est passée la séance ?"
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-sm text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-[#ff6b35] transition-all [color-scheme:dark]"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  addLog({
                    dateISO: new Date().toISOString(),
                    week,
                    sessionType,
                    fatigue,
                    notes: notes.trim() || undefined,
                  })
                  setNotes('')
                  setSaved(true)
                }}
                className="w-full py-4 rounded-2xl bg-[#ff6b35] hover:bg-[#e55a2b] text-white font-black uppercase italic tracking-wide transition-all shadow-lg shadow-[#ff6b35]/20 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Marquer comme faite
              </button>

              {saved && (
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-900/20 border border-emerald-500/20 rounded-2xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-xs text-emerald-400 font-bold">Séance enregistrée !</p>
                </div>
              )}
            </section>
          </>
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
