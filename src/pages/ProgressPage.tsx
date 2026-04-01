import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { posthog } from '../services/analytics/posthog'
import {
  TrendingUp, TrendingDown, Minus, AlertCircle, BarChart2,
  Plus, X, FlaskConical, Dumbbell, ChevronDown, Lock, Activity, Trophy
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import blocksData from '../data/blocks.v1.json'
import { getExerciseName } from '../data/exercises'
import { useBlockLogs } from '../hooks/useBlockLogs'
import { useHistory } from '../hooks/useHistory'
import { useAthleteTests } from '../hooks/useAthleteTests'
import { useProfile } from '../hooks/useProfile'
import { getProgramHistorySummary, getRecentProgramSessions } from '../services/program/programHistoryAnalytics'
import { getSessionLogDisplayTitle, getSessionLogPrimaryWeekLabel, getSessionLogSourceLabel, getSessionLogSourceTone, getSessionLogCycleLabel, SOURCE_BADGE_STYLES } from '../services/program/sessionLogPresentation'
import { getExerciseDeltaW1W4, getExerciseRecentHistory } from '../services/ui/progression'
import { getExerciseSuggestion } from '../services/ui/suggestions'
import { getExerciseMetricType } from '../services/ui/exerciseMetrics'
import { estimateOneRM } from '../services/athleticTesting/estimateOneRM'
import {
  getPositionBaseline,
  getBaselineForLevel,
  getBaselineLevelLabel,
} from '../services/athleticTesting/getPositionBaseline'
import { seedDemoData, clearDemoMode, isDemoModeActive } from '../data/fakeDataForProgress'
import { PageHeader } from '../components/PageHeader'
import { BottomNav } from '../components/BottomNav'
import { PremiumBlurredPreview } from '../components/PremiumBlurredPreview'
import { ProgressCurveSkeleton } from '../components/SkeletonCard'
import { PRBoard } from '../components/pr/PRBoard'
import { useFeatureAccess } from '../hooks/useFeatureAccess'
import { useUpsellTiming, isDismissed } from '../hooks/useUpsellTiming'
import type { TrainingBlock } from '../types/training'
import type { PhysicalTestType, PhysicalTest } from '../types/athleticTesting'

// ─── Sessions tab — existing config ─────────────────────────────────────────

const statusConfig = {
  up: {
    icon: <TrendingUp className="w-4 h-4" />,
    bg: 'bg-[#10b981]/10',
    text: 'text-[#10b981]',
    badge: 'bg-[#10b981]/10 text-[#10b981]',
    label: 'Progression',
  },
  down: {
    icon: <TrendingDown className="w-4 h-4" />,
    bg: 'bg-[#ff6b35]/10',
    text: 'text-[#ff6b35]',
    badge: 'bg-[#ff6b35]/10 text-[#ff6b35]',
    label: 'Régression',
  },
  same: {
    icon: <Minus className="w-4 h-4" />,
    bg: 'bg-white/5',
    text: 'text-white/50',
    badge: 'bg-white/10 text-white/50',
    label: 'Stable',
  },
  unknown: {
    icon: <AlertCircle className="w-4 h-4" />,
    bg: 'bg-white/5',
    text: 'text-white/50',
    badge: 'bg-white/10 text-white/50',
    label: '–',
  },
}

// ─── Tests tab — config ───────────────────────────────────────────────────────

type TestCardConfig = {
  type: PhysicalTestType
  label: string
  unit: string
  higherIsBetter: boolean
  color: string
  is1RM?: boolean
}

const TEST_CARDS: TestCardConfig[] = [
  { type: 'cmj',              label: 'Counter-Movement Jump', unit: 'cm',  higherIsBetter: true,  color: '#e11d48' },
  { type: 'sprint_10m',       label: 'Sprint 10m',            unit: 's',   higherIsBetter: false, color: '#f97316' },
  { type: 'one_rm_squat',     label: '1RM Squat',             unit: 'kg',  higherIsBetter: true,  color: '#6366f1', is1RM: true },
  { type: 'one_rm_deadlift',  label: '1RM Soulevé de terre',  unit: 'kg',  higherIsBetter: true,  color: '#8b5cf6', is1RM: true },
  { type: 'yyir1',            label: 'Yo-Yo IR1',             unit: 'm',   higherIsBetter: true,  color: '#0ea5e9' },
]

type TestTypeGroup = 'direct' | 'oneRM'
type OneRMFormula = 'brzycki' | 'epley'

interface ModalState {
  open: boolean
  type: PhysicalTestType
  label: string
  unit: string
  is1RM: boolean
}

function formatValue(value: number, type: PhysicalTestType): string {
  if (type === 'sprint_10m') return value.toFixed(2)
  return Math.round(value).toString()
}

function formatVariation(delta: number, higherIsBetter: boolean): { text: string; color: string } {
  const isPositive = higherIsBetter ? delta > 0 : delta < 0
  const isNegative = higherIsBetter ? delta < 0 : delta > 0
  const pct = Math.abs(delta * 100).toFixed(1)
  if (isPositive)  return { text: `+${pct}%`, color: 'text-[#10b981]' }
  if (isNegative)  return { text: `-${pct}%`, color: 'text-[#ff6b35]' }
  return { text: '0%', color: 'text-white/40' }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProgressPage() {
  const [tab, setTab] = useState<'sessions' | 'tests' | 'records'>('sessions')
  const { logs, getLastEntryForExercise, allPRsWithDates } = useBlockLogs()
  const { logs: sessionLogs } = useHistory()
  const { addTest, getHistoryFor, getBestFor } = useAthleteTests()
  const { profile } = useProfile()
  const lang = (profile.preferredLanguage as 'fr' | 'en' | undefined) ?? 'fr'
  const { features, isPremium, loading: entitlementsLoading } = useFeatureAccess()
  const premiumResolved = !entitlementsLoading
  const { canShowUpsell } = useUpsellTiming()
  const [dismissedCards] = useState<Set<string>>(() => {
    const set = new Set<string>()
    if (isDismissed('progress_objectives')) set.add('progress_objectives')
    if (isDismissed('progress_curves')) set.add('progress_curves')
    if (isDismissed('progress_tests')) set.add('progress_tests')
    return set
  })
  // Upsell card helpers — prepared for future premium upsells on this page
  void dismissedCards; void canShowUpsell

  // ─── Program adherence data ───────────────────────────────────
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const adherenceSummary = useMemo(() => getProgramHistorySummary(sessionLogs, today), [sessionLogs, today])
  const recentSessions = useMemo(() => getRecentProgramSessions(sessionLogs, 5), [sessionLogs])

  // ─── Modal state ────────────────────────────────────────────
  const [modal, setModal] = useState<ModalState | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [inputNotes, setInputNotes] = useState('')
  const [inputMode, setInputMode] = useState<TestTypeGroup>('direct')
  const [inputLoad, setInputLoad] = useState('')
  const [inputReps, setInputReps] = useState('')
  const [inputFormula, setInputFormula] = useState<OneRMFormula>('brzycki')

  // ─── Sessions tab data ────────────────────────────────────────
  const exerciseIds = Array.from(
    new Set(logs.flatMap((log) => log.entries.map((entry) => entry.exerciseId)))
  )

  const progressRows = exerciseIds
    .map((exerciseId) => ({
      exerciseId,
      delta: getExerciseDeltaW1W4(logs, exerciseId),
    }))
    .filter((row) => row.delta.status !== 'unknown')
    .sort((a, b) => b.delta.deltaValue - a.delta.deltaValue)
    .slice(0, 10)

  const exerciseFrequency = (blocksData as TrainingBlock[]).flatMap((block) =>
    block.exercises.map((exercise) => exercise.exerciseId)
  )
  const frequencyMap = exerciseFrequency.reduce<Record<string, number>>((acc, exerciseId) => {
    acc[exerciseId] = (acc[exerciseId] ?? 0) + 1
    return acc
  }, {})
  const loggedExerciseIds = new Set(
    logs.flatMap((log) => log.entries.map((entry) => entry.exerciseId))
  )
  const missingRows = Object.entries(frequencyMap)
    .filter(([exerciseId]) => !loggedExerciseIds.has(exerciseId))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)

  const progressCount = progressRows.filter((r) => r.delta.status === 'up').length
  const regressionCount = progressRows.filter((r) => r.delta.status === 'down').length

  const nextTargetRows = exerciseIds
    .map((exerciseId) => {
      const lastEntry = getLastEntryForExercise(exerciseId)
      if (!lastEntry) return null
      const metricType = getExerciseMetricType({ exerciseId })
      if (metricType !== 'load_reps') return null
      const suggestion = getExerciseSuggestion({
        exerciseId,
        week: 'W2',
        fatigue: 'OK',
        targetRer: 3,
        lastEntry
      })
      if (suggestion.suggestedLoadKg === undefined) return null
      const target = `${suggestion.suggestedLoadKg} kg${suggestion.suggestedReps ? ` × ${suggestion.suggestedReps}` : ''}`
      return { exerciseId, target }
    })
    .filter((row): row is { exerciseId: string; target: string } => row !== null)
    .slice(0, 8)
  void nextTargetRows // prepared for future use

  const historyRows = exerciseIds
    .map((exerciseId) => ({
      exerciseId,
      history: getExerciseRecentHistory(logs, exerciseId, 6)
    }))
    .filter((row) => row.history.length >= 3)

  // ─── Modal handlers ────────────────────────────────────────────
  function openModal(card: TestCardConfig) {
    setModal({ open: true, type: card.type, label: card.label, unit: card.unit, is1RM: !!card.is1RM })
    setInputValue('')
    setInputNotes('')
    setInputMode('direct')
    setInputLoad('')
    setInputReps('')
    setInputFormula('brzycki')
  }

  function closeModal() {
    setModal(null)
  }

  const estimatedLive = (() => {
    const load = parseFloat(inputLoad)
    const reps = parseInt(inputReps, 10)
    if (!isNaN(load) && !isNaN(reps) && load > 0 && reps > 0) {
      return estimateOneRM(load, reps, inputFormula)
    }
    return null
  })()

  async function handleSave() {
    if (!modal) return

    let value: number
    if (modal.is1RM && inputMode === 'oneRM') {
      if (estimatedLive === null) return
      value = estimatedLive
    } else {
      const parsed = parseFloat(inputValue)
      if (isNaN(parsed) || parsed <= 0) return
      value = parsed
    }

    const today = new Date().toISOString().slice(0, 10)
    const testData: Omit<PhysicalTest, 'id'> = {
      dateISO: today,
      type: modal.type,
      value,
      notes: inputNotes || undefined,
    }

    if (modal.is1RM && inputMode === 'oneRM' && estimatedLive !== null) {
      testData.estimatedFrom = {
        loadKg: parseFloat(inputLoad),
        reps: parseInt(inputReps, 10),
        formula: inputFormula,
      }
    }

    await addTest(testData)
    posthog.capture('test_added', { type: modal.type })
    closeModal()
  }

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#1a100c] font-sans text-white pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(#ff6b35_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader title={lang === 'fr' ? 'Progression' : 'Progress'} backTo="/home" />

      <main className="relative px-6 pt-5 space-y-6 max-w-md mx-auto">

        {/* Mode démo — visible en dev pour tester graphiques */}
        {import.meta.env.DEV && (
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-[20px] p-4 space-y-2">
            <p className="text-xs font-black text-amber-400 uppercase tracking-wider">
              Mode démo {isDemoModeActive() && '· actif'}
            </p>
            {isDemoModeActive() ? (
              <>
                <p className="text-sm text-amber-200/90">
                  Tu visualises des données fictives. Les graphiques et le suivi utilisent ces données.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clearDemoMode()
                    window.location.reload()
                  }}
                  className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wide transition-colors"
                >
                  Quitter le mode démo
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-amber-200/90">
                  Charge des données fictives pour tester les graphiques et le suivi de performance.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    seedDemoData()
                    window.location.reload()
                  }}
                  className="w-full py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase tracking-wide transition-colors"
                >
                  Charger les données de démo
                </button>
              </>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 bg-white/5 border border-white/10 rounded-[18px] p-1">
          <button
            onClick={() => setTab('sessions')}
            className={`flex-1 py-2 rounded-[14px] text-xs font-black uppercase tracking-wider transition-all ${
              tab === 'sessions'
                ? 'bg-[#1a5f3f] text-white shadow-sm'
                : 'text-white/40 hover:text-white'
            }`}
          >
            Séances
          </button>
          <button
            onClick={() => setTab('tests')}
            className={`flex-1 py-2 rounded-[14px] text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tab === 'tests'
                ? 'bg-[#1a5f3f] text-white shadow-sm'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Tests
            {!features.premiumAnalytics && <Lock className="w-3 h-3 text-white/30" />}
          </button>
          <button
            onClick={() => setTab('records')}
            className={`flex-1 py-2 rounded-[14px] text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tab === 'records'
                ? 'bg-[#1a5f3f] text-white shadow-sm'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Records
          </button>
        </div>

        {/* ─── SESSIONS TAB ─────────────────────────────────────── */}
        {tab === 'sessions' && (
          <>
            {/* Adhérence programme */}
            {sessionLogs.length > 0 && (
              <section data-testid="adherence-section">
                <h2 className="text-sm font-black uppercase tracking-wider text-white/40 mb-3">Adhérence programme</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-[24px] flex flex-col gap-1">
                    <div className="text-2xl font-black text-white" data-testid="adherence-7d">{adherenceSummary.sessionsLast7d}</div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Séances 7j</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-[24px] flex flex-col gap-1">
                    <div className="text-2xl font-black text-white" data-testid="adherence-28d">{adherenceSummary.sessionsLast28d}</div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Séances 28j</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-[24px] flex flex-col gap-1">
                    <div className="text-2xl font-black text-emerald-400" data-testid="adherence-mother">{adherenceSummary.motherSessions}</div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Moteur annuel</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-[24px] flex flex-col gap-1">
                    <div className="text-2xl font-black text-blue-400" data-testid="adherence-legacy">{adherenceSummary.legacySessions}</div>
                    <div className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Legacy</div>
                  </div>
                </div>
              </section>
            )}

            {/* Activité récente programme */}
            {recentSessions.length > 0 && (
              <section data-testid="recent-activity-section">
                <h2 className="text-sm font-black uppercase tracking-wider text-white/40 mb-3">Activité récente</h2>
                <div className="bg-white/5 border border-white/10 rounded-[24px] overflow-hidden divide-y divide-white/5">
                  {recentSessions.map((log) => {
                    const title = getSessionLogDisplayTitle(log)
                    const weekPart = getSessionLogPrimaryWeekLabel(log)
                    const cyclePart = getSessionLogCycleLabel(log)
                    const sourceLabel = getSessionLogSourceLabel(log)
                    const sourceTone = getSessionLogSourceTone(log)
                    const datePart = new Date(log.dateISO).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

                    return (
                      <div key={log.id} className="px-4 py-3 flex items-center justify-between gap-2" data-testid="recent-session-entry">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 text-white/30">
                            <Activity className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-white truncate" data-testid="recent-title">{title}</span>
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${SOURCE_BADGE_STYLES[sourceTone]}`} data-testid="recent-source-badge">
                                {sourceLabel}
                              </span>
                            </div>
                            <div className="text-[10px] text-white/40">
                              <span data-testid="recent-week-label">{weekPart}</span>
                              {cyclePart && <> · {cyclePart}</>}
                              {' · '}{datePart}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {progressRows.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/10 p-4 rounded-[24px] flex flex-col items-center gap-1.5">
                  <div className="p-2 rounded-2xl bg-[#10b981]/10 text-[#10b981]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="text-xl font-black text-[#10b981]">{progressCount}</div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-tighter text-center">En hausse</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-[24px] flex flex-col items-center gap-1.5">
                  <div className="p-2 rounded-2xl bg-[#ff6b35]/10 text-[#ff6b35]">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div className="text-xl font-black text-[#ff6b35]">{regressionCount}</div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-tighter text-center">En baisse</div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-[24px] flex flex-col items-center gap-1.5">
                  <div className="p-2 rounded-2xl bg-white/5 text-white/50">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div className="text-xl font-black text-white">{progressRows.length}</div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-tighter text-center">Suivis</div>
                </div>
              </div>
            )}

            <section>
              <h2 className="text-sm font-black uppercase tracking-wider text-white/40 mb-3">Top progrès (W1 → W4)</h2>
              {progressRows.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-[24px] p-6 flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/20">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Données insuffisantes</p>
                    <p className="text-xs text-white/40 mt-0.5">Enregistre des séances en W1 et W4 pour voir ta progression.</p>
                  </div>
                  <Link to="/week" className="text-xs font-black text-[#1a5f3f] uppercase tracking-wide">
                    Aller s'entraîner →
                  </Link>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-[24px] overflow-hidden divide-y divide-white/10">
                  {progressRows.map((row) => {
                    const cfg = statusConfig[row.delta.status]
                    return (
                      <div key={row.exerciseId} className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                            {cfg.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">{getExerciseName(row.exerciseId, lang)}</div>
                            <div className="text-xs text-white/40 italic">
                              {row.delta.fromText} → {row.delta.toText}
                            </div>
                          </div>
                        </div>
                        <div className={`text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.badge}`}>
                          {row.delta.deltaText}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Objectifs prochaine séance retirés — les suggestions de charge sont déjà dans le logger de chaque bloc */}

            {(() => {
              const FAKE_HISTORY = [
                { week: 'W1', loadProxy: 60, text: '60kg × 8' },
                { week: 'W2', loadProxy: 65, text: '65kg × 8' },
                { week: 'W3', loadProxy: 67.5, text: '67.5kg × 7' },
                { week: 'W4', loadProxy: 70, text: '70kg × 6' },
              ]
              const rows = features.premiumAnalytics ? historyRows : (
                historyRows.length > 0 ? historyRows : [
                  { exerciseId: 'ph_squat', history: FAKE_HISTORY },
                  { exerciseId: 'ph_bench', history: FAKE_HISTORY.map(h => ({ ...h, loadProxy: h.loadProxy * 0.7, text: h.text.replace(/\d+kg/, `${Math.round(h.loadProxy * 0.7)}kg`) })) },
                ]
              )

              const curvesContent = rows.length > 0 && (
                <section>
                  <h2 className="text-sm font-black uppercase tracking-wider text-white/40 mb-3">
                    Progression saison
                  </h2>
                  <div className="space-y-4">
                    {rows.slice(0, 6).map(({ exerciseId, history }) => {
                      const chartData = history.map((h) => ({ w: h.week, v: h.loadProxy }))
                      return (
                        <div key={exerciseId} className="bg-white/5 border border-white/10 rounded-[24px] p-4">
                          <p className="text-sm font-bold text-white mb-2">
                            {exerciseId.startsWith('ph_') ? (exerciseId === 'ph_squat' ? 'Back Squat' : 'Bench Press') : getExerciseName(exerciseId, lang)}
                          </p>
                          <ResponsiveContainer width="100%" height={80}>
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id={`grad-${exerciseId}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#1a5f3f" stopOpacity={0.4} />
                                  <stop offset="100%" stopColor="#1a5f3f" stopOpacity={0.05} />
                                </linearGradient>
                              </defs>
                              <Area
                                type="monotone"
                                dataKey="v"
                                stroke="#1a5f3f"
                                strokeWidth={2}
                                fill={`url(#grad-${exerciseId})`}
                                dot={{ r: 3, fill: '#1a5f3f', strokeWidth: 0 }}
                              />
                              <XAxis dataKey="w" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} axisLine={false} tickLine={false} />
                              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} width={30} axisLine={false} tickLine={false} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#1a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 11, color: '#fff' }}
                                formatter={(value) => [`${value} kg`, 'Charge']}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                          <p className="text-[10px] text-white/40 mt-1 font-mono">
                            {history[0].text} → {history[history.length - 1].text}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )

              if (features.premiumAnalytics) return curvesContent
              if (!premiumResolved) return <ProgressCurveSkeleton />
              return curvesContent ? (
                <PremiumBlurredPreview label="Courbes de progression">
                  {curvesContent}
                </PremiumBlurredPreview>
              ) : null
            })()}

            {features.premiumAnalytics && missingRows.length > 0 && (
              <section>
                <h2 className="text-sm font-black uppercase tracking-wider text-white/40 mb-3">À renseigner</h2>
                <div className="bg-white/5 border border-white/10 rounded-[24px] p-5 space-y-2">
                  {missingRows.map(([exerciseId, count]) => (
                    <div key={exerciseId} className="flex items-center justify-between py-1.5 border-b border-white/10 last:border-0">
                      <span className="text-sm font-medium text-white">{getExerciseName(exerciseId, lang)}</span>
                      <span className="text-[10px] font-bold text-white/40 bg-white/10 px-2 py-1 rounded-full">
                        {count} blocs
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="bg-[#1a5f3f]/5 border border-[#1a5f3f]/10 rounded-[24px] p-5 space-y-2">
                <p className="text-xs font-black uppercase tracking-wider text-[#1a5f3f]">Méthode double progression</p>
                <p className="text-xs text-white/60 leading-relaxed">
                  Remplis d'abord ta plage de reps cible (ex: 4×8-12), puis ajoute +2.5kg.
                  La force max se maintient jusqu'à 25-35j sans stimulation — régularité &gt; intensité.
                </p>
                <p className="text-[10px] text-white/30 italic">Rippetoe (2011), Issurin (2008)</p>
              </div>
            </section>
          </>
        )}

        {/* ─── TESTS PHYSIQUES TAB ─────────────────────────────────── */}
        {tab === 'tests' && (
          <>
            <p className="text-xs text-white/40 -mt-2">
              Mesure tes performances athlétiques et suis leur évolution dans le temps.
            </p>

            {/* Les charts et baselines sont maintenant visibles en version floutée pour les free users */}

            <div className="space-y-4">
              {TEST_CARDS.map((card) => {
                const history = getHistoryFor(card.type, 8)
                const last = history[0]
                const best = getBestFor(card.type)
                const baseline = getPositionBaseline(
                  profile?.position,
                  profile?.trainingLevel,
                  card.type,
                  profile?.weightKg
                )
                const baselineValue = baseline ? getBaselineForLevel(baseline, profile?.trainingLevel) : null
                const baselineLabel = getBaselineLevelLabel(profile?.trainingLevel)
                const positionLabel = profile?.position
                  ? { FRONT_ROW: '1ère ligne', SECOND_ROW: '2ème ligne', BACK_ROW: '3ème ligne', HALF_BACKS: 'Demis', CENTERS: 'Centres', BACK_THREE: 'Arrières' }[profile.position]
                  : null

                // Variation vs record
                const variation = last && best !== null && best !== last.value
                  ? (last.value - best) / Math.abs(best)
                  : null

                // ⚠️ badge : CMJ/sprint régressent > 10% vs record
                const isRegressing =
                  features.premiumAnalytics &&
                  variation !== null &&
                  (card.type === 'cmj' || card.type === 'sprint_10m') &&
                  (card.higherIsBetter ? variation < -0.10 : variation > 0.10)

                const chartData = [...history].reverse().map((t) => ({
                  d: t.dateISO.slice(5),
                  v: t.value,
                }))

                return (
                  <div key={card.type} className="bg-white/5 border border-white/10 rounded-[24px] overflow-hidden">
                    {/* Card header */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-2xl flex items-center justify-center"
                          style={{ backgroundColor: card.color + '20', color: card.color }}>
                          {card.is1RM ? <Dumbbell className="w-4 h-4" /> : <FlaskConical className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{card.label}</p>
                          {isRegressing && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-900/20 px-2 py-0.5 rounded-full">
                              ⚠️ Régression &gt;10%
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => openModal(card)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
                        style={{ color: card.color }}
                        title="Ajouter un test"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Stats row */}
                    {last ? (
                      <div className="px-4 pb-3 flex items-end justify-between gap-4">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black" style={{ color: card.color }}>
                              {formatValue(last.value, card.type)}
                            </span>
                            <span className="text-xs font-bold text-white/40">{card.unit}</span>
                            {variation !== null && (() => {
                              const vari = formatVariation(variation, card.higherIsBetter)
                              return (
                                <span className={`text-[11px] font-black ${vari.color}`}>{vari.text}</span>
                              )
                            })()}
                          </div>
                          <p className="text-[10px] text-white/40 mt-0.5">
                            {last.dateISO.split('-').reverse().join('/')}
                            {best !== null && best !== last.value && (
                              <> · Record : <span className="font-bold text-white/50">{formatValue(best, card.type)} {card.unit}</span></>
                            )}
                          </p>
                        </div>
                        {baselineValue !== null && positionLabel && (
                          features.premiumAnalytics ? (
                            <div className="text-right flex-shrink-0">
                              <p className="text-[10px] text-white/40">Baseline {positionLabel}</p>
                              <p className="text-xs font-bold text-white/50">
                                {formatValue(baselineValue, card.type)} {card.unit}
                                <span className="text-[9px] text-white/30 ml-1">({baselineLabel})</span>
                              </p>
                            </div>
                          ) : (
                            <div className="text-right flex-shrink-0 blur-[4px] opacity-50" aria-hidden>
                              <p className="text-[10px] text-white/40">Baseline {positionLabel}</p>
                              <p className="text-xs font-bold text-white/50">
                                {formatValue(baselineValue, card.type)} {card.unit}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="px-4 pb-3">
                        <p className="text-sm text-white/40 italic">Aucun test enregistré</p>
                        {features.premiumAnalytics && baselineValue !== null && positionLabel && (
                          <p className="text-[10px] text-white/40 mt-1">
                            Baseline {positionLabel} ({baselineLabel}) : <span className="font-bold">{formatValue(baselineValue, card.type)} {card.unit}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* LineChart */}
                    {chartData.length > 0 && (
                      <div className={`px-2 pb-3 ${!features.premiumAnalytics ? 'blur-[5px] opacity-50 pointer-events-none' : ''}`}>
                        <ResponsiveContainer width="100%" height={100}>
                          <LineChart data={chartData}>
                            <Line
                              type="monotone"
                              dataKey="v"
                              stroke={card.color}
                              strokeWidth={2}
                              dot={{ r: 3, fill: card.color }}
                            />
                            <XAxis dataKey="d" tick={{ fontSize: 9 }} />
                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9 }} width={28} />
                            {features.premiumAnalytics && <Tooltip contentStyle={{ fontSize: 11 }} />}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* T3.3: 1RM trend projection (≥3 data points, 1RM type) */}
                    {card.is1RM && chartData.length >= 3 && (() => {
                      // Simple linear regression
                      const n = chartData.length
                      const xs = chartData.map((_, i) => i)
                      const ys = chartData.map(d => d.v)
                      const sumX = xs.reduce((a, b) => a + b, 0)
                      const sumY = ys.reduce((a, b) => a + b, 0)
                      const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0)
                      const sumX2 = xs.reduce((a, x) => a + x * x, 0)
                      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
                      if (slope <= 0) return null // no projection if declining

                      const intercept = (sumY - slope * sumX) / n
                      const currentEstimate = slope * (n - 1) + intercept
                      const targets = [100, 120, 140, 160, 180, 200]
                      const nextTarget = targets.find(t => t > currentEstimate)
                      if (!nextTarget) return null

                      const weeksToTarget = Math.ceil((nextTarget - currentEstimate) / slope)
                      if (weeksToTarget <= 0 || weeksToTarget > 52) return null

                      return (
                        <div className={`px-4 pb-3 ${!features.premiumAnalytics ? 'blur-[4px] opacity-50' : ''}`}>
                          <p className="text-[10px] text-[#ff6b35]/70">
                            A ce rythme, {nextTarget} kg dans ~{weeksToTarget} semaine{weeksToTarget > 1 ? 's' : ''}
                          </p>
                        </div>
                      )
                    })()}
                  </div>
                )
              })}
            </div>

            {/* Science card */}
            <section>
              <div className={`${isPremium ? 'bg-rose-900/20 border-rose-500/20' : 'bg-white/5 border-white/10'} border rounded-[24px] p-5 space-y-2`}>
                <p className="text-xs font-black uppercase tracking-wider text-rose-400">Règle clinique CMJ</p>
                <p className="text-xs text-white/60 leading-relaxed">
                  ↓ CMJ ≥ 10% vs baseline = fatigue neuromusculaire non résolue → ne pas augmenter la charge cette semaine.
                  Mesure idéalement le lundi matin à jeun.
                </p>
                <p className="text-[10px] text-white/30 italic">Duthie et al. 2003, Cahill et al. 2013</p>
              </div>
            </section>
          </>
        )}

        {/* ─── RECORDS TAB ─────────────────────────────────────────── */}
        {tab === 'records' && (
          <PRBoard
            prs={allPRsWithDates}
            isPremium={isPremium}
            lang={lang}
          />
        )}

      </main>

      {/* ─── Modal saisie ─────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-4 pb-32 sm:items-center sm:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-md"
            onClick={closeModal}
          />

          {/* Modal */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="progress-test-modal-title"
            className="relative z-10 flex max-h-[calc(100vh-11rem)] w-full max-w-[22rem] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#23140f] shadow-2xl shadow-black/60 sm:max-h-[min(620px,calc(100vh-3rem))] sm:max-w-md"
          >
            <div className="border-b border-white/10 px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#ff6b35]/12 text-[#ff6b35] sm:h-10 sm:w-10">
                    {modal.is1RM ? <Dumbbell className="h-4.5 w-4.5" /> : <FlaskConical className="h-4.5 w-4.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#ffb08f]">
                      Nouveau test
                    </p>
                    <h3 id="progress-test-modal-title" className="mt-1 text-base font-black tracking-tight text-white sm:text-lg">
                      {modal.label}
                    </h3>
                    <p className="mt-1 text-[11px] text-white/45 sm:text-xs">
                      Enregistre une mesure propre pour suivre ta progression semaine après semaine.
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-2xl border border-white/10 bg-white/5 p-2 text-white/50 transition-colors hover:border-white/20 hover:text-white"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">
              <div className="space-y-3.5 sm:space-y-4">
                {modal.is1RM && (
                  <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setInputMode('direct')}
                        className={`rounded-[16px] px-3 py-2 text-sm font-black transition-all ${
                          inputMode === 'direct'
                            ? 'bg-[#ff6b35] text-white shadow-lg shadow-[#ff6b35]/20'
                            : 'bg-white/5 text-white/45 hover:text-white'
                        }`}
                      >
                        Direct
                        <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">Valeur testée</span>
                      </button>
                      <button
                        onClick={() => setInputMode('oneRM')}
                        className={`rounded-[16px] px-3 py-2 text-sm font-black transition-all ${
                          inputMode === 'oneRM'
                            ? 'bg-[#ff6b35] text-white shadow-lg shadow-[#ff6b35]/20'
                            : 'bg-white/5 text-white/45 hover:text-white'
                        }`}
                      >
                        Estimation
                        <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">Charge + reps</span>
                      </button>
                    </div>
                  </div>
                )}

                {(!modal.is1RM || inputMode === 'direct') && (
                  <section className="space-y-2.5 rounded-[20px] border border-white/10 bg-white/[0.03] p-3.5 sm:space-y-3 sm:p-4">
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                        Valeur ({modal.unit})
                      </label>
                      <p className="mt-1 text-xs text-white/35">
                        Entre ta mesure directement si tu as déjà le résultat.
                      </p>
                    </div>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={modal.unit === 's' ? '1.75' : modal.unit === 'cm' ? '42' : '1200'}
                      className="w-full rounded-[16px] border border-white/10 bg-[#1a100c] px-4 py-3 text-lg font-black text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/15 [color-scheme:dark] sm:text-xl"
                    />
                  </section>
                )}

                {modal.is1RM && inputMode === 'oneRM' && (
                  <section className="space-y-3.5 rounded-[20px] border border-white/10 bg-white/[0.03] p-3.5 sm:space-y-4 sm:p-4">
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                        Estimation du 1RM
                      </label>
                      <p className="mt-1 text-[11px] text-white/35 sm:text-xs">
                        Charge + reps pour estimer ton niveau du moment.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                          Poids (kg)
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={inputLoad}
                          onChange={(e) => setInputLoad(e.target.value)}
                          placeholder="100"
                          className="w-full rounded-[16px] border border-white/10 bg-[#1a100c] px-3.5 py-2.5 text-base font-black text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/15 [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                          Reps
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={inputReps}
                          onChange={(e) => setInputReps(e.target.value)}
                          placeholder="5"
                          className="w-full rounded-[16px] border border-white/10 bg-[#1a100c] px-3.5 py-2.5 text-base font-black text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/15 [color-scheme:dark]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                        Formule
                      </label>
                      <div className="relative">
                        <select
                          value={inputFormula}
                          onChange={(e) => setInputFormula(e.target.value as OneRMFormula)}
                          className="w-full appearance-none rounded-[16px] border border-white/10 bg-[#1a100c] px-3.5 py-2.5 pr-10 text-sm font-bold text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/15 [color-scheme:dark]"
                        >
                          <option value="brzycki">Brzycki — recommandé pour 3 à 6 reps</option>
                          <option value="epley">Epley — utile sur des reps plus hautes</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35 pointer-events-none" />
                      </div>
                    </div>

                    {estimatedLive !== null && (
                      <div className="rounded-[18px] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-300/75">
                          Estimation instantanée
                        </p>
                        <div className="mt-2 flex items-end justify-between gap-3">
                          <span className="text-xs text-emerald-100/80">1RM estimé avec {inputFormula}</span>
                          <span className="text-xl font-black text-emerald-300 sm:text-2xl">{estimatedLive} kg</span>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                <section className="space-y-2.5 rounded-[20px] border border-white/10 bg-white/[0.03] p-3.5 sm:space-y-3 sm:p-4">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                      Notes
                    </label>
                    <p className="mt-1 text-xs text-white/35">
                      Optionnel. Exemple : fatigue, surface, contexte match, sensation.
                    </p>
                  </div>
                  <input
                    type="text"
                    value={inputNotes}
                    onChange={(e) => setInputNotes(e.target.value)}
                    placeholder="Ex : après entraînement, jambes lourdes, terrain humide..."
                    className="w-full rounded-[16px] border border-white/10 bg-[#1a100c] px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/15 [color-scheme:dark]"
                  />
                </section>
              </div>
            </div>

            <div className="border-t border-white/10 bg-[#1f120d]/90 px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 rounded-[16px] border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black text-white/65 transition-colors hover:border-white/20 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 rounded-[16px] bg-[#ff6b35] px-4 py-2.5 text-sm font-black uppercase tracking-wider text-white transition-all hover:bg-[#e55a2b] active:scale-[0.98] shadow-lg shadow-[#ff6b35]/20"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
