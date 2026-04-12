import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { posthog } from '../services/analytics/posthog'
import {
  TrendingUp, TrendingDown, Minus, AlertCircle, BarChart2,
  Plus, X, FlaskConical, Dumbbell, ChevronDown, Lock, Activity, Trophy, Zap
} from 'lucide-react'
import type { SessionType } from '../types/training'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import blocksData from '../data/blocks.v1.json'
import { getExerciseName } from '../data/exercises'
import { useBlockLogs } from '../hooks/useBlockLogs'
import { useHistory } from '../hooks/useHistory'
import { useAthleteTests } from '../hooks/useAthleteTests'
import { useProfile } from '../hooks/useProfile'
import { getProgramHistorySummary, getRecentProgramSessions } from '../services/program/programHistoryAnalytics'
import { getSessionLogDisplayTitle, getSessionLogCycleLabel } from '../services/program/sessionLogPresentation'
import { getExerciseDeltaW1W4, getExerciseRecentHistory } from '../services/ui/progression'
import { getExerciseSuggestion } from '../services/ui/suggestions'
import { getExerciseMetricType } from '../services/ui/exerciseMetrics'
import { estimateOneRM } from '../services/athleticTesting/estimateOneRM'
import {
  getPositionBaseline,
  getBaselineForLevel,
  getBaselineLevelLabel,
} from '../services/athleticTesting/getPositionBaseline'
import { PageHeader } from '../components/PageHeader'
import { BottomNav } from '../components/BottomNav'
import { PremiumBlurredPreview } from '../components/PremiumBlurredPreview'
import { ProgressCurveSkeleton } from '../components/SkeletonCard'
import { PRBoard } from '../components/pr/PRBoard'
import { useFeatureAccess } from '../hooks/useFeatureAccess'
import { useUpsellTiming, isDismissed } from '../hooks/useUpsellTiming'
import type { TrainingBlock } from '../types/training'
import type { PhysicalTestType, PhysicalTest } from '../types/athleticTesting'

// ─── Session type styles (aligned with HistoryPage) ────────────────────────

const recentSessionIcon: Record<SessionType, React.ReactNode> = {
  UPPER: <Dumbbell className="w-4 h-4" />,
  LOWER: <Activity className="w-4 h-4" />,
  FULL: <Zap className="w-4 h-4" />,
  CONDITIONING: <Activity className="w-4 h-4" />,
  RECOVERY: <Activity className="w-4 h-4" />,
  ACTIVE_RECOVERY: <Activity className="w-4 h-4" />,
}

const recentSessionStyles: Record<SessionType, string> = {
  UPPER: 'bg-blue-50 text-blue-600 border border-blue-200',
  LOWER: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  FULL: 'bg-amber-50 text-amber-600 border border-amber-200',
  CONDITIONING: 'bg-violet-50 text-violet-600 border border-violet-200',
  RECOVERY: 'bg-teal-50 text-teal-600 border border-teal-200',
  ACTIVE_RECOVERY: 'bg-sky-50 text-sky-600 border border-sky-200',
}

// ─── Sessions tab — existing config ─────────────────────────────────────────

const statusConfig = {
  up: {
    icon: <TrendingUp className="w-4 h-4" />,
    bg: 'bg-ok-bg',
    text: 'text-ok-strong',
    badge: 'bg-ok-bg text-ok-strong',
    label: 'Progression',
  },
  down: {
    icon: <TrendingDown className="w-4 h-4" />,
    bg: 'bg-brand-soft',
    text: 'text-brand-tint',
    badge: 'bg-brand-soft text-brand-tint',
    label: 'Régression',
  },
  same: {
    icon: <Minus className="w-4 h-4" />,
    bg: 'bg-layer-5',
    text: 'text-fg-soft',
    badge: 'bg-layer-10 text-fg-soft',
    label: 'Stable',
  },
  unknown: {
    icon: <AlertCircle className="w-4 h-4" />,
    bg: 'bg-layer-5',
    text: 'text-fg-soft',
    badge: 'bg-layer-10 text-fg-soft',
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
  { type: 'cmj',              label: 'Counter-Movement Jump', unit: 'cm',  higherIsBetter: true,  color: 'var(--color-danger-fg)' },
  { type: 'sprint_10m',       label: 'Sprint 10m',            unit: 's',   higherIsBetter: false, color: 'var(--color-orange-fg)' },
  { type: 'one_rm_squat',     label: '1RM Squat',             unit: 'kg',  higherIsBetter: true,  color: 'var(--color-athletic-squat)', is1RM: true },
  { type: 'one_rm_deadlift',  label: '1RM Soulevé de terre',  unit: 'kg',  higherIsBetter: true,  color: 'var(--color-athletic-deadlift)', is1RM: true },
  { type: 'yyir1',            label: 'Yo-Yo IR1',             unit: 'm',   higherIsBetter: true,  color: 'var(--color-athletic-yoyo)' },
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
  if (isPositive)  return { text: `+${pct}%`, color: 'text-ok-strong' }
  if (isNegative)  return { text: `-${pct}%`, color: 'text-brand-tint' }
  return { text: '0%', color: 'text-fg-muted' }
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
  const recentSessions = useMemo(() => getRecentProgramSessions(sessionLogs, 8), [sessionLogs])
  const [showAllSessions, setShowAllSessions] = useState(false)
  const [missingOpen, setMissingOpen] = useState(false)

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
    <div className="min-h-screen bg-app font-sans text-fg pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader title={lang === 'fr' ? 'Progression' : 'Progress'} backTo="/home" />

      <main className="relative px-6 pt-5 space-y-6 max-w-md mx-auto">


        {/* Tabs */}
        <div className="flex gap-2 bg-layer-5 border border-border-app rounded-[18px] p-1">
          <button
            onClick={() => setTab('sessions')}
            className={`flex-1 py-2 rounded-[14px] text-xs font-black uppercase tracking-wider transition-all ${
              tab === 'sessions'
                ? 'bg-brand text-on-brand shadow-sm'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            Séances
          </button>
          <button
            onClick={() => setTab('tests')}
            className={`flex-1 py-2 rounded-[14px] text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tab === 'tests'
                ? 'bg-brand text-on-brand shadow-sm'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Tests
            {!features.premiumAnalytics && <Lock className="w-3 h-3 text-fg-faint" />}
          </button>
          <button
            onClick={() => setTab('records')}
            className={`flex-1 py-2 rounded-[14px] text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              tab === 'records'
                ? 'bg-brand text-on-brand shadow-sm'
                : 'text-fg-muted hover:text-fg'
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
                <h2 className="text-sm font-black uppercase tracking-wider text-fg-muted mb-3">Adhérence programme</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-layer-5 border border-border-app p-4 rounded-[24px] flex flex-col gap-1">
                    <div className="text-2xl font-black text-fg" data-testid="adherence-7d">{adherenceSummary.sessionsLast7d}</div>
                    <div className="text-[10px] font-bold text-fg-muted uppercase tracking-tighter">Séances 7j</div>
                  </div>
                  <div className="bg-layer-5 border border-border-app p-4 rounded-[24px] flex flex-col gap-1">
                    <div className="text-2xl font-black text-fg" data-testid="adherence-28d">{adherenceSummary.sessionsLast28d}</div>
                    <div className="text-[10px] font-bold text-fg-muted uppercase tracking-tighter">Séances 28j</div>
                  </div>
                </div>
              </section>
            )}

            {/* Activité récente programme */}
            {recentSessions.length > 0 && (
              <section data-testid="recent-activity-section">
                <h2 className="text-sm font-black uppercase tracking-wider text-fg-muted mb-3">Dernières séances</h2>
                <div className="bg-layer-5 border border-border-app rounded-[24px] overflow-hidden divide-y divide-edge-hairline">
                  {(showAllSessions ? recentSessions : recentSessions.slice(0, 3)).map((log) => {
                    const title = getSessionLogDisplayTitle(log)
                    const cyclePart = getSessionLogCycleLabel(log)
                    const datePart = new Date(log.dateISO).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

                    return (
                      <div key={log.id} className="px-4 py-3 flex items-center justify-between gap-2" data-testid="recent-session-entry">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${recentSessionStyles[log.sessionType]}`}>
                            {recentSessionIcon[log.sessionType]}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-fg truncate block" data-testid="recent-title">{title}</span>
                            <div className="text-[10px] text-fg-muted">
                              {cyclePart && <>{cyclePart} · </>}
                              {datePart}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {!showAllSessions && recentSessions.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllSessions(true)}
                      className="w-full px-4 py-3 text-xs font-bold text-brand-tint hover:bg-layer-5 transition-colors text-center"
                    >
                      Voir {recentSessions.length - 3} séances précédentes
                    </button>
                  )}
                </div>
              </section>
            )}

            {progressRows.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-layer-5 border border-border-app p-4 rounded-[24px] flex flex-col items-center gap-1.5">
                  <div className="p-2 rounded-2xl bg-ok-bg text-ok-strong">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="text-xl font-black text-ok-strong">{progressCount}</div>
                  <div className="text-[10px] font-bold text-fg-muted uppercase tracking-tighter text-center">En hausse</div>
                </div>
                <div className="bg-layer-5 border border-border-app p-4 rounded-[24px] flex flex-col items-center gap-1.5">
                  <div className="p-2 rounded-2xl bg-brand-soft text-brand-tint">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div className="text-xl font-black text-brand-tint">{regressionCount}</div>
                  <div className="text-[10px] font-bold text-fg-muted uppercase tracking-tighter text-center">En baisse</div>
                </div>
                <div className="bg-layer-5 border border-border-app p-4 rounded-[24px] flex flex-col items-center gap-1.5">
                  <div className="p-2 rounded-2xl bg-layer-5 text-fg-soft">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div className="text-xl font-black text-fg">{progressRows.length}</div>
                  <div className="text-[10px] font-bold text-fg-muted uppercase tracking-tighter text-center">Suivis</div>
                </div>
              </div>
            )}

            <section>
              <h2 className="text-sm font-black uppercase tracking-wider text-fg-muted mb-3">Top progrès (W1 → W4)</h2>
              {progressRows.length === 0 ? (
                <div className="bg-layer-5 border border-border-app rounded-[24px] p-6 flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 bg-layer-5 rounded-2xl flex items-center justify-center text-fg-ghost">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-fg">Données insuffisantes</p>
                    <p className="text-xs text-fg-muted mt-0.5">Enregistre des séances en W1 et W4 pour voir ta progression.</p>
                  </div>
                  <Link to="/week" className="text-xs font-black text-brand-tint uppercase tracking-wide">
                    Aller s'entraîner →
                  </Link>
                </div>
              ) : (
                <div className="bg-layer-5 border border-border-app rounded-[24px] overflow-hidden divide-y divide-border-app">
                  {progressRows.map((row) => {
                    const cfg = statusConfig[row.delta.status]
                    return (
                      <div key={row.exerciseId} className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                            {cfg.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-fg truncate">{getExerciseName(row.exerciseId, lang)}</div>
                            <div className="text-xs text-fg-muted italic">
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
                  <h2 className="text-sm font-black uppercase tracking-wider text-fg-muted mb-3">
                    Progression saison
                  </h2>
                  <div className="space-y-4">
                    {rows.slice(0, 6).map(({ exerciseId, history }) => {
                      const chartData = history.map((h) => ({ w: h.week, v: h.loadProxy }))
                      return (
                        <div key={exerciseId} className="bg-layer-5 border border-border-app rounded-[24px] p-4">
                          <p className="text-sm font-bold text-fg mb-2">
                            {exerciseId.startsWith('ph_') ? (exerciseId === 'ph_squat' ? 'Back Squat' : 'Bench Press') : getExerciseName(exerciseId, lang)}
                          </p>
                          <ResponsiveContainer width="100%" height={80}>
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id={`grad-${exerciseId}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="var(--color-brand-tint)" stopOpacity={0.4} />
                                  <stop offset="100%" stopColor="var(--color-brand-tint)" stopOpacity={0.05} />
                                </linearGradient>
                              </defs>
                              <Area
                                type="monotone"
                                dataKey="v"
                                stroke="var(--color-brand-tint)"
                                strokeWidth={2}
                                fill={`url(#grad-${exerciseId})`}
                                dot={{ r: 3, fill: 'var(--color-brand-tint)', strokeWidth: 0 }}
                              />
                              <XAxis dataKey="w" tick={{ fontSize: 9, fill: 'var(--color-text-faint)' }} axisLine={false} tickLine={false} />
                              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: 'var(--color-text-faint)' }} width={30} axisLine={false} tickLine={false} />
                              <Tooltip
                                contentStyle={{ backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 11, color: 'var(--color-text-primary)' }}
                                formatter={(value) => [`${value} kg`, 'Charge']}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                          <p className="text-[10px] text-fg-muted mt-1 font-mono">
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
                <button
                  type="button"
                  onClick={() => setMissingOpen((o) => !o)}
                  className="flex items-center justify-between w-full mb-2"
                >
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-fg-muted text-left">Exercices non loggés ({missingRows.length})</h2>
                    <p className="text-[10px] text-fg-faint text-left mt-0.5">Logge-les pendant tes séances pour suivre ta progression</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-fg-muted transition-transform flex-shrink-0 ${missingOpen ? 'rotate-180' : ''}`} />
                </button>
                {missingOpen && (
                  <div className="bg-layer-5 border border-border-app rounded-[24px] p-5 space-y-2">
                    {missingRows.map(([exerciseId, count]) => (
                      <div key={exerciseId} className="flex items-center justify-between py-1.5 border-b border-border-app last:border-0">
                        <span className="text-sm font-medium text-fg">{getExerciseName(exerciseId, lang)}</span>
                        <span className="text-[10px] font-bold text-fg-muted bg-layer-10 px-2 py-1 rounded-full">
                          dans {count} séances
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section>
              <div className="bg-ok-bg-muted border border-ok-bd rounded-[24px] p-5 space-y-2">
                <p className="text-xs font-black uppercase tracking-wider text-ok-strong">Méthode double progression</p>
                <p className="text-xs text-fg-soft leading-relaxed">
                  Remplis d'abord ta plage de reps cible (ex: 4×8-12), puis ajoute +2.5kg.
                  La force max se maintient jusqu'à 25-35j sans stimulation — régularité &gt; intensité.
                </p>
                <p className="text-[10px] text-fg-faint italic">Rippetoe (2011), Issurin (2008)</p>
              </div>
            </section>
          </>
        )}

        {/* ─── TESTS PHYSIQUES TAB ─────────────────────────────────── */}
        {tab === 'tests' && (
          <>
            <p className="text-xs text-fg-muted -mt-2">
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
                  <div key={card.type} className="bg-layer-5 border border-border-app rounded-[24px] overflow-hidden">
                    {/* Card header */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-2xl flex items-center justify-center"
                          style={{ backgroundColor: `color-mix(in srgb, ${card.color} 22%, transparent)`, color: card.color }}>
                          {card.is1RM ? <Dumbbell className="w-4 h-4" /> : <FlaskConical className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-fg">{card.label}</p>
                          {isRegressing && (
                            <span className="text-[10px] font-bold text-warn bg-warn-bg-muted border border-warn-bd px-2 py-0.5 rounded-full">
                              ⚠️ Régression &gt;10%
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => openModal(card)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-layer-10 transition-colors"
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
                            <span className="text-xs font-bold text-fg-muted">{card.unit}</span>
                            {variation !== null && (() => {
                              const vari = formatVariation(variation, card.higherIsBetter)
                              return (
                                <span className={`text-[11px] font-black ${vari.color}`}>{vari.text}</span>
                              )
                            })()}
                          </div>
                          <p className="text-[10px] text-fg-muted mt-0.5">
                            {last.dateISO.split('-').reverse().join('/')}
                            {best !== null && best !== last.value && (
                              <> · Record : <span className="font-bold text-fg-soft">{formatValue(best, card.type)} {card.unit}</span></>
                            )}
                          </p>
                        </div>
                        {baselineValue !== null && positionLabel && (
                          features.premiumAnalytics ? (
                            <div className="text-right flex-shrink-0">
                              <p className="text-[10px] text-fg-muted">Baseline {positionLabel}</p>
                              <p className="text-xs font-bold text-fg-soft">
                                {formatValue(baselineValue, card.type)} {card.unit}
                                <span className="text-[9px] text-fg-faint ml-1">({baselineLabel})</span>
                              </p>
                            </div>
                          ) : (
                            <div className="text-right flex-shrink-0 blur-[4px] opacity-50" aria-hidden>
                              <p className="text-[10px] text-fg-muted">Baseline {positionLabel}</p>
                              <p className="text-xs font-bold text-fg-soft">
                                {formatValue(baselineValue, card.type)} {card.unit}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="px-4 pb-3">
                        <p className="text-sm text-fg-muted italic">Aucun test enregistré</p>
                        {features.premiumAnalytics && baselineValue !== null && positionLabel && (
                          <p className="text-[10px] text-fg-muted mt-1">
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
                          <p className="text-[10px] text-brand-muted">
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
              <div className={`${isPremium ? 'bg-danger-bg border-danger-bd' : 'bg-layer-5 border-border-app'} border rounded-[24px] p-5 space-y-2`}>
                <p className="text-xs font-black uppercase tracking-wider text-danger">Règle clinique CMJ</p>
                <p className="text-xs text-fg-soft leading-relaxed">
                  ↓ CMJ ≥ 10% vs baseline = fatigue neuromusculaire non résolue → ne pas augmenter la charge cette semaine.
                  Mesure idéalement le lundi matin à jeun.
                </p>
                <p className="text-[10px] text-fg-faint italic">Duthie et al. 2003, Cahill et al. 2013</p>
              </div>
            </section>
          </>
        )}

        {/* ─── RECORDS TAB ─────────────────────────────────────────── */}
        {tab === 'records' && (
          premiumResolved ? (
            <PRBoard
              prs={allPRsWithDates}
              isPremium={isPremium}
              lang={lang}
            />
          ) : (
            <ProgressCurveSkeleton />
          )
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
            className="relative z-10 flex max-h-[calc(100vh-11rem)] w-full max-w-[22rem] flex-col overflow-hidden rounded-[28px] border border-border-app bg-panel shadow-elevated sm:max-h-[min(620px,calc(100vh-3rem))] sm:max-w-md"
          >
            <div className="border-b border-border-app px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-soft text-brand-tint sm:h-10 sm:w-10">
                    {modal.is1RM ? <Dumbbell className="h-4.5 w-4.5" /> : <FlaskConical className="h-4.5 w-4.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-tint">
                      Nouveau test
                    </p>
                    <h3 id="progress-test-modal-title" className="mt-1 text-base font-black tracking-tight text-fg sm:text-lg">
                      {modal.label}
                    </h3>
                    <p className="mt-1 text-[11px] text-fg-soft sm:text-xs">
                      Enregistre une mesure propre pour suivre ta progression semaine après semaine.
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-2xl border border-border-app bg-layer-5 p-2 text-fg-soft transition-colors hover:border-border-dashed-app hover:text-fg rf-focus-ring"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">
              <div className="space-y-3.5 sm:space-y-4">
                {modal.is1RM && (
                  <div className="rounded-[20px] border border-border-app bg-layer-2 p-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setInputMode('direct')}
                        className={`rounded-[16px] px-3 py-2 text-sm font-black transition-all ${
                          inputMode === 'direct'
                            ? 'bg-brand text-on-brand shadow-brand-float'
                            : 'bg-layer-5 text-fg-soft hover:text-fg'
                        }`}
                      >
                        Direct
                        <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">Valeur testée</span>
                      </button>
                      <button
                        onClick={() => setInputMode('oneRM')}
                        className={`rounded-[16px] px-3 py-2 text-sm font-black transition-all ${
                          inputMode === 'oneRM'
                            ? 'bg-brand text-on-brand shadow-brand-float'
                            : 'bg-layer-5 text-fg-soft hover:text-fg'
                        }`}
                      >
                        Estimation
                        <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">Charge + reps</span>
                      </button>
                    </div>
                  </div>
                )}

                {(!modal.is1RM || inputMode === 'direct') && (
                  <section className="space-y-2.5 rounded-[20px] border border-border-app bg-layer-2 p-3.5 sm:space-y-3 sm:p-4">
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-[0.18em] text-fg-soft">
                        Valeur ({modal.unit})
                      </label>
                      <p className="mt-1 text-xs text-fg-faint">
                        Entre ta mesure directement si tu as déjà le résultat.
                      </p>
                    </div>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={modal.unit === 's' ? '1.75' : modal.unit === 'cm' ? '42' : '1200'}
                      className="w-full rounded-[16px] border border-border-app bg-app px-4 py-3 text-lg font-black text-fg placeholder:text-fg-ghost focus:outline-none focus:border-brand rf-focus-ring sm:text-xl"
                    />
                  </section>
                )}

                {modal.is1RM && inputMode === 'oneRM' && (
                  <section className="space-y-3.5 rounded-[20px] border border-border-app bg-layer-2 p-3.5 sm:space-y-4 sm:p-4">
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-[0.18em] text-fg-soft">
                        Estimation du 1RM
                      </label>
                      <p className="mt-1 text-[11px] text-fg-faint sm:text-xs">
                        Charge + reps pour estimer ton niveau du moment.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-fg-soft">
                          Poids (kg)
                        </label>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={inputLoad}
                          onChange={(e) => setInputLoad(e.target.value)}
                          placeholder="100"
                          className="w-full rounded-[16px] border border-border-app bg-app px-3.5 py-2.5 text-base font-black text-fg placeholder:text-fg-ghost focus:outline-none focus:border-brand rf-focus-ring"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-fg-soft">
                          Reps
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={inputReps}
                          onChange={(e) => setInputReps(e.target.value)}
                          placeholder="5"
                          className="w-full rounded-[16px] border border-border-app bg-app px-3.5 py-2.5 text-base font-black text-fg placeholder:text-fg-ghost focus:outline-none focus:border-brand rf-focus-ring"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-[0.18em] text-fg-soft">
                        Formule
                      </label>
                      <div className="relative">
                        <select
                          value={inputFormula}
                          onChange={(e) => setInputFormula(e.target.value as OneRMFormula)}
                          className="w-full appearance-none rounded-[16px] border border-border-app bg-app px-3.5 py-2.5 pr-10 text-sm font-bold text-fg focus:outline-none focus:border-brand rf-focus-ring"
                        >
                          <option value="brzycki">Brzycki — recommandé pour 3 à 6 reps</option>
                          <option value="epley">Epley — utile sur des reps plus hautes</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-faint pointer-events-none" />
                      </div>
                    </div>

                    {estimatedLive !== null && (
                      <div className="rounded-[18px] border border-ok-bd bg-ok-bg px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-ok-strong">
                          Estimation instantanée
                        </p>
                        <div className="mt-2 flex items-end justify-between gap-3">
                          <span className="text-xs text-ok">1RM estimé avec {inputFormula}</span>
                          <span className="text-xl font-black text-ok-strong sm:text-2xl">{estimatedLive} kg</span>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                <section className="space-y-2.5 rounded-[20px] border border-border-app bg-layer-2 p-3.5 sm:space-y-3 sm:p-4">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-fg-soft">
                      Notes
                    </label>
                    <p className="mt-1 text-xs text-fg-faint">
                      Optionnel. Exemple : fatigue, surface, contexte match, sensation.
                    </p>
                  </div>
                  <input
                    type="text"
                    value={inputNotes}
                    onChange={(e) => setInputNotes(e.target.value)}
                    placeholder="Ex : après entraînement, jambes lourdes, terrain humide..."
                    className="w-full rounded-[16px] border border-border-app bg-app px-4 py-2.5 text-sm text-fg placeholder:text-fg-ghost focus:outline-none focus:border-brand rf-focus-ring"
                  />
                </section>
              </div>
            </div>

            <div className="border-t border-border-app bg-app/90 px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 rounded-[16px] border border-border-app bg-layer-5 px-4 py-2.5 text-sm font-black text-fg-soft transition-colors hover:border-border-dashed-app hover:text-fg rf-focus-ring"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 rounded-[16px] bg-brand px-4 py-2.5 text-sm font-black uppercase tracking-wider text-on-brand transition-all hover:bg-brand-hover active:scale-[0.98] shadow-brand-float rf-focus-ring"
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
