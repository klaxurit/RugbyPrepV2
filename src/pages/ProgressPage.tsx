import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { posthog } from '../services/analytics/posthog'
import {
  TrendingUp, TrendingDown, Minus, AlertCircle, BarChart2,
  Plus, X, FlaskConical, Dumbbell, ChevronDown, Lock, Activity, Trophy, Zap
} from 'lucide-react'
import type { SessionType } from '../types/training'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getExerciseName } from '../data/exercises'
import { useBlockLogs } from '../hooks/useBlockLogs'
import { useExerciseSetLogs } from '../hooks/useExerciseSetLogs'
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
import { WeeklyBilanCard } from '../components/WeeklyBilanCard'
import { computeWeeklyBilan } from '../services/weeklyBilan/computeWeeklyBilan'
import { useACWR } from '../hooks/useACWR'
import { useCalendar } from '../hooks/useCalendar'
import { ProgressCurveSkeleton } from '../components/SkeletonCard'
import { PRBoard } from '../components/pr/PRBoard'
import { useFeatureAccess } from '../hooks/useFeatureAccess'
import { useUpsellTiming, isDismissed } from '../hooks/useUpsellTiming'
import { useRegisterCoachContext } from '../contexts/CoachContext'
import type { PhysicalTestType, PhysicalTest } from '../types/athleticTesting'
import { tr, positionShortLabel, trainingLevelLabel, type Lang, type AppLabelKey } from '../i18n/appLabels'

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

type StatusKey = 'up' | 'down' | 'same' | 'unknown'
interface StatusEntry {
  icon: React.ReactNode
  bg: string
  text: string
  badge: string
  labelKey: AppLabelKey
}
const statusConfig: Record<StatusKey, StatusEntry> = {
  up: {
    icon: <TrendingUp className="w-4 h-4" />,
    bg: 'bg-ok-bg',
    text: 'text-ok-strong',
    badge: 'bg-ok-bg text-ok-strong',
    labelKey: 'progress_trend_up',
  },
  down: {
    icon: <TrendingDown className="w-4 h-4" />,
    bg: 'bg-brand-soft',
    text: 'text-brand-tint',
    badge: 'bg-brand-soft text-brand-tint',
    labelKey: 'progress_trend_down',
  },
  same: {
    icon: <Minus className="w-4 h-4" />,
    bg: 'bg-layer-5',
    text: 'text-fg-soft',
    badge: 'bg-layer-10 text-fg-soft',
    labelKey: 'progress_trend_same',
  },
  unknown: {
    icon: <AlertCircle className="w-4 h-4" />,
    bg: 'bg-layer-5',
    text: 'text-fg-soft',
    badge: 'bg-layer-10 text-fg-soft',
    labelKey: 'progress_trend_unknown',
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

function getTestCards(lang: Lang): TestCardConfig[] {
  return [
    { type: 'cmj',              label: tr('progress_test_card_cmj', lang),       unit: 'cm', higherIsBetter: true,  color: 'var(--color-danger-fg)' },
    { type: 'sprint_10m',       label: tr('progress_test_card_sprint', lang),    unit: 's',  higherIsBetter: false, color: 'var(--color-orange-fg)' },
    { type: 'one_rm_squat',     label: tr('progress_test_card_squat', lang),     unit: 'kg', higherIsBetter: true,  color: 'var(--color-athletic-squat)',    is1RM: true },
    { type: 'one_rm_deadlift',  label: tr('progress_test_card_deadlift', lang),  unit: 'kg', higherIsBetter: true,  color: 'var(--color-athletic-deadlift)', is1RM: true },
    { type: 'yyir1',            label: tr('progress_test_card_yyir1', lang),     unit: 'm',  higherIsBetter: true,  color: 'var(--color-athletic-yoyo)' },
  ]
}

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
  const { logs, getLastEntryForExercise, allPRsWithDates: legacyPRs } = useBlockLogs()
  const { allPRsWithDates: setLogPRs } = useExerciseSetLogs()
  const { logs: sessionLogs } = useHistory()

  // Merge des records : nouveau pipeline mother sessions (per-set) prioritaire,
  // legacy block_logs en fallback pour les exercices non couverts.
  const allPRsWithDates = useMemo(() => {
    type PR = NonNullable<typeof legacyPRs>[number]
    const safeLegacy: PR[] = legacyPRs ?? []
    const safeSetLog: PR[] = setLogPRs ?? []
    const byExerciseId = new Map<string, PR>()
    for (const pr of safeLegacy) byExerciseId.set(pr.exerciseId, pr)
    for (const pr of safeSetLog) {
      const existing = byExerciseId.get(pr.exerciseId)
      if (!existing || pr.bestValue > existing.bestValue) {
        byExerciseId.set(pr.exerciseId, pr)
      }
    }
    return Array.from(byExerciseId.values()).sort((a, b) => b.dateISO.localeCompare(a.dateISO))
  }, [legacyPRs, setLogPRs])
  const { addTest, getHistoryFor, getBestFor } = useAthleteTests()
  const { profile } = useProfile()
  const lang: Lang = (profile.preferredLanguage as Lang | undefined) ?? 'fr'
  const TEST_CARDS = useMemo(() => getTestCards(lang), [lang])
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

  // ─── Bilan de la semaine (Premium) ──────────────────────────
  const { structuralEvents } = useCalendar()
  const acwr = useACWR(sessionLogs, structuralEvents)
  const weeklyBilan = useMemo(
    () => computeWeeklyBilan(sessionLogs, logs, today),
    [sessionLogs, logs, today],
  )
  // Objectif hebdo dérivé du niveau — donne du contexte au "3 / target".
  const weeklyTarget = profile.trainingLevel === 'starter' ? 2 : 3
  const target28d = weeklyTarget * 4

  // Contexte coach (lu par CoachCompanion global)
  useRegisterCoachContext({
    scopeKey: `progress-${today}`,
    phaseLabel: lang === 'fr' ? 'Progression · 4 dernières semaines' : 'Progress · last 4 weeks',
    infoMessages: [
      {
        id: 'progress:adherence_7d',
        text: lang === 'fr'
          ? (adherenceSummary.sessionsLast7d < weeklyTarget
              ? `Adhérence 7j : ${adherenceSummary.sessionsLast7d}/${weeklyTarget} séances — rattrapage possible cette semaine.`
              : `Adhérence 7j : ${adherenceSummary.sessionsLast7d}/${weeklyTarget} séances, sur cible.`)
          : (adherenceSummary.sessionsLast7d < weeklyTarget
              ? `7d adherence: ${adherenceSummary.sessionsLast7d}/${weeklyTarget} sessions — catch-up possible this week.`
              : `7d adherence: ${adherenceSummary.sessionsLast7d}/${weeklyTarget} sessions, on target.`),
      },
    ],
    companionMessages: [
      lang === 'fr'
        ? 'Un test 5RM ou CMJ en fin de phase sécurise ton suivi de progression.'
        : 'A 5RM or CMJ test at the end of the phase secures your progress tracking.',
    ],
    chatSeed: lang === 'fr' ? 'Analyse ma progression : ' : 'Analyze my progress: ',
  })
  const recentSessions = useMemo(() => getRecentProgramSessions(sessionLogs, 8), [sessionLogs])
  const [showAllSessions, setShowAllSessions] = useState(false)

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
    <div className="min-h-screen bg-app font-sans text-fg pb-bottom-nav relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader title={tr('progress_page_title', lang)} backTo="/profile" />

      <main className="relative px-6 pt-5 pb-12 sm:pb-16 space-y-6 max-w-md mx-auto">


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
            {tr('progress_tab_sessions', lang)}
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
            {tr('progress_tab_tests', lang)}
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
            {tr('progress_tab_records', lang)}
          </button>
        </div>

        {/* ─── SESSIONS TAB ─────────────────────────────────────── */}
        {tab === 'sessions' && (
          <>
            {/* Bilan de la semaine — Premium uniquement (valorisation du lien /home). */}
            {premiumResolved && isPremium && (
              <WeeklyBilanCard bilan={weeklyBilan} acwr={acwr} lang={lang} />
            )}

            {/* Adhérence programme — chiffres avec objectif + barre de progression */}
            {sessionLogs.length > 0 && (
              <section data-testid="adherence-section">
                <h2 className="text-sm font-black uppercase tracking-wider text-fg-muted mb-3">{tr('progress_adherence_section', lang)}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      value: adherenceSummary.sessionsLast7d,
                      target: weeklyTarget,
                      label: tr('progress_window_7d', lang),
                      testId: 'adherence-7d',
                    },
                    {
                      value: adherenceSummary.sessionsLast28d,
                      target: target28d,
                      label: tr('progress_window_28d', lang),
                      testId: 'adherence-28d',
                    },
                  ].map(({ value, target, label, testId }) => {
                    const pct = Math.max(0, Math.min(1, value / target))
                    const onTrack = value >= target
                    const barColor = onTrack ? 'bg-ok-strong' : pct >= 0.6 ? 'bg-warn-strong' : 'bg-alert'
                    return (
                      <div key={testId} className="bg-layer-5 border border-border-app p-4 rounded-[24px] flex flex-col gap-1.5">
                        <div className="flex items-baseline gap-1">
                          <div className="text-2xl font-black text-fg leading-none" data-testid={testId}>{value}</div>
                          <div className="text-sm font-bold text-fg-muted leading-none">/ {target}</div>
                        </div>
                        <div className="h-1.5 bg-layer-10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor} transition-all`}
                            style={{ width: `${pct * 100}%` }}
                          />
                        </div>
                        <div className="text-[11px] font-bold text-fg-muted tracking-tight">
                          {label}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-[11px] text-fg-muted mt-2">
                  {tr('progress_goal_basis_pre', lang)} ({trainingLevelLabel(profile.trainingLevel ?? 'builder', lang)}) — {weeklyTarget} {tr('progress_goal_basis_suffix', lang)}
                </p>
              </section>
            )}

            {/* Activité récente programme */}
            {recentSessions.length > 0 && (
              <section data-testid="recent-activity-section">
                <h2 className="text-sm font-black uppercase tracking-wider text-fg-muted mb-3">{tr('progress_recent_sessions', lang)}</h2>
                <div className="bg-layer-5 border border-border-app rounded-[24px] overflow-hidden divide-y divide-edge-hairline">
                  {(showAllSessions ? recentSessions : recentSessions.slice(0, 3)).map((log) => {
                    const title = getSessionLogDisplayTitle(log)
                    const cyclePart = getSessionLogCycleLabel(log)
                    const datePart = new Date(log.dateISO).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' })

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
                      {tr('progress_view_prev_pre', lang)} {recentSessions.length - 3} {recentSessions.length - 3 > 1 ? tr('progress_view_prev_suffix_plural', lang) : tr('progress_view_prev_suffix_single', lang)}
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
                  <div className="text-[10px] font-bold text-fg-muted uppercase tracking-tighter text-center">{tr('progress_stat_up', lang)}</div>
                </div>
                <div className="bg-layer-5 border border-border-app p-4 rounded-[24px] flex flex-col items-center gap-1.5">
                  <div className="p-2 rounded-2xl bg-brand-soft text-brand-tint">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div className="text-xl font-black text-brand-tint">{regressionCount}</div>
                  <div className="text-[10px] font-bold text-fg-muted uppercase tracking-tighter text-center">{tr('progress_stat_down', lang)}</div>
                </div>
                <div className="bg-layer-5 border border-border-app p-4 rounded-[24px] flex flex-col items-center gap-1.5">
                  <div className="p-2 rounded-2xl bg-layer-5 text-fg-soft">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div className="text-xl font-black text-fg">{progressRows.length}</div>
                  <div className="text-[10px] font-bold text-fg-muted uppercase tracking-tighter text-center">{tr('progress_stat_tracked', lang)}</div>
                </div>
              </div>
            )}

            <section>
              <h2 className="text-sm font-black uppercase tracking-wider text-fg-muted mb-3">{tr('progress_top_section', lang)}</h2>
              {progressRows.length === 0 ? (
                <div className="bg-layer-5 border border-border-app rounded-[24px] p-6 flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 bg-layer-5 rounded-2xl flex items-center justify-center text-fg-ghost">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-fg">{tr('progress_no_data', lang)}</p>
                    <p className="text-xs text-fg-muted mt-0.5">{tr('progress_no_data_sub', lang)}</p>
                  </div>
                  <Link to="/week" className="text-xs font-black text-brand-tint uppercase tracking-wide">
                    {tr('progress_go_train', lang)}
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
                  <h2 className="text-sm font-black uppercase tracking-wider text-fg-muted">
                    {tr('progress_season', lang)}
                  </h2>
                  <p className="text-[11px] text-fg-muted mb-3">
                    {tr('progress_season_sub', lang)}
                  </p>
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
                              <YAxis
                                domain={['auto', 'auto']}
                                tick={{ fontSize: 11, fill: 'var(--color-text-faint)' }}
                                width={42}
                                axisLine={false}
                                tickLine={false}
                                label={{ value: 'kg (volume)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 10, fill: 'var(--color-text-faint)', textAnchor: 'middle' } }}
                              />
                              <Tooltip
                                contentStyle={{ backgroundColor: 'var(--color-bg-app)', border: '1px solid var(--color-border)', borderRadius: 12, fontSize: 11, color: 'var(--color-text-primary)' }}
                                formatter={(value) => [`${value} kg`, tr('progress_tonnage', lang)]}
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
                <PremiumBlurredPreview label={tr('progress_curves_label', lang)}>
                  {curvesContent}
                </PremiumBlurredPreview>
              ) : null
            })()}

            <section>
              <div className="bg-ok-bg-muted border border-ok-bd rounded-[24px] p-5 space-y-2">
                <p className="text-xs font-black uppercase tracking-wider text-ok-strong">{tr('progress_method_title', lang)}</p>
                <p className="text-xs text-fg-soft leading-relaxed">
                  {tr('progress_method_body', lang)}
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
              {tr('progress_tests_intro', lang)}
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
                const positionLabel = positionShortLabel(profile?.position, lang)

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

                const chartData = [...history]
                  .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
                  .map((t) => ({
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
                              {tr('progress_regression_warn', lang)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => openModal(card)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-layer-10 transition-colors"
                        style={{ color: card.color }}
                        title={tr('progress_modal_title', lang)}
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
                              <> · {tr('progress_test_record', lang)} : <span className="font-bold text-fg-soft">{formatValue(best, card.type)} {card.unit}</span></>
                            )}
                          </p>
                        </div>
                        {baselineValue !== null && positionLabel && (
                          features.premiumAnalytics ? (
                            <div className="text-right flex-shrink-0">
                              <p className="text-[10px] text-fg-muted">{tr('progress_test_baseline', lang)} {positionLabel}</p>
                              <p className="text-xs font-bold text-fg-soft">
                                {formatValue(baselineValue, card.type)} {card.unit}
                                <span className="text-[9px] text-fg-faint ml-1">({baselineLabel})</span>
                              </p>
                            </div>
                          ) : (
                            <div className="text-right flex-shrink-0 blur-[4px] opacity-50" aria-hidden>
                              <p className="text-[10px] text-fg-muted">{tr('progress_test_baseline', lang)} {positionLabel}</p>
                              <p className="text-xs font-bold text-fg-soft">
                                {formatValue(baselineValue, card.type)} {card.unit}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="px-4 pb-3">
                        <p className="text-sm text-fg-muted italic">{tr('progress_test_none', lang)}</p>
                        {features.premiumAnalytics && baselineValue !== null && positionLabel && (
                          <p className="text-[10px] text-fg-muted mt-1">
                            {tr('progress_test_baseline', lang)} {positionLabel} ({baselineLabel}) : <span className="font-bold">{formatValue(baselineValue, card.type)} {card.unit}</span>
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
                            {tr('progress_rate_at_this', lang)} {nextTarget} kg {tr('progress_rate_in', lang)} ~{weeksToTarget} {weeksToTarget > 1 ? tr('progress_rate_week_plural', lang) : tr('progress_rate_week_single', lang)}
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
                <p className="text-xs font-black uppercase tracking-wider text-danger">{tr('progress_cmj_rule_title', lang)}</p>
                <p className="text-xs text-fg-soft leading-relaxed">
                  {tr('progress_cmj_rule_body', lang)}
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
                      {tr('progress_modal_new_test', lang)}
                    </p>
                    <h3 id="progress-test-modal-title" className="mt-1 text-base font-black tracking-tight text-fg sm:text-lg">
                      {modal.label}
                    </h3>
                    <p className="mt-1 text-[11px] text-fg-soft sm:text-xs">
                      {tr('progress_modal_sub', lang)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-2xl border border-border-app bg-layer-5 p-2 text-fg-soft transition-colors hover:border-border-dashed-app hover:text-fg rf-focus-ring"
                  aria-label={tr('progress_modal_close', lang)}
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
                        {tr('progress_modal_direct', lang)}
                        <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">{tr('progress_modal_direct_sub', lang)}</span>
                      </button>
                      <button
                        onClick={() => setInputMode('oneRM')}
                        className={`rounded-[16px] px-3 py-2 text-sm font-black transition-all ${
                          inputMode === 'oneRM'
                            ? 'bg-brand text-on-brand shadow-brand-float'
                            : 'bg-layer-5 text-fg-soft hover:text-fg'
                        }`}
                      >
                        {tr('progress_modal_estim', lang)}
                        <span className="block text-[10px] font-bold uppercase tracking-wider opacity-80">{tr('progress_modal_estim_sub', lang)}</span>
                      </button>
                    </div>
                  </div>
                )}

                {(!modal.is1RM || inputMode === 'direct') && (
                  <section className="space-y-2.5 rounded-[20px] border border-border-app bg-layer-2 p-3.5 sm:space-y-3 sm:p-4">
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-[0.18em] text-fg-soft">
                        {tr('progress_modal_value_pre', lang)} ({modal.unit})
                      </label>
                      <p className="mt-1 text-xs text-fg-faint">
                        {tr('progress_modal_value_help', lang)}
                      </p>
                    </div>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={
                        modal.unit === 's' ? '1.75'
                        : modal.unit === 'cm' ? '42'
                        : modal.unit === 'kg' ? '120'
                        : modal.unit === 'm' ? '1200'
                        : '0'
                      }
                      className="w-full rounded-[16px] border border-border-app bg-app px-4 py-3 text-lg font-black text-fg placeholder:text-fg-ghost focus:outline-none focus:border-brand rf-focus-ring sm:text-xl"
                    />
                  </section>
                )}

                {modal.is1RM && inputMode === 'oneRM' && (
                  <section className="space-y-3.5 rounded-[20px] border border-border-app bg-layer-2 p-3.5 sm:space-y-4 sm:p-4">
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-[0.18em] text-fg-soft">
                        {tr('progress_modal_estim_title', lang)}
                      </label>
                      <p className="mt-1 text-[11px] text-fg-faint sm:text-xs">
                        {tr('progress_modal_estim_help', lang)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-fg-soft">
                          {tr('progress_modal_weight', lang)}
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
                          {tr('progress_modal_reps', lang)}
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
                        {tr('progress_modal_formula', lang)}
                      </label>
                      <div className="relative">
                        <select
                          value={inputFormula}
                          onChange={(e) => setInputFormula(e.target.value as OneRMFormula)}
                          className="w-full appearance-none rounded-[16px] border border-border-app bg-app px-3.5 py-2.5 pr-10 text-sm font-bold text-fg focus:outline-none focus:border-brand rf-focus-ring"
                        >
                          <option value="brzycki">{tr('progress_modal_formula_brzycki', lang)}</option>
                          <option value="epley">{tr('progress_modal_formula_epley', lang)}</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-faint pointer-events-none" />
                      </div>
                    </div>

                    {estimatedLive !== null && (
                      <div className="rounded-[18px] border border-ok-bd bg-ok-bg px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-ok-strong">
                          {tr('progress_modal_instant_estim', lang)}
                        </p>
                        <div className="mt-2 flex items-end justify-between gap-3">
                          <span className="text-xs text-ok">{tr('progress_modal_estimated_with_pre', lang)} {inputFormula}</span>
                          <span className="text-xl font-black text-ok-strong sm:text-2xl">{estimatedLive} kg</span>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                <section className="space-y-2.5 rounded-[20px] border border-border-app bg-layer-2 p-3.5 sm:space-y-3 sm:p-4">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-fg-soft">
                      {tr('progress_modal_notes', lang)}
                    </label>
                    <p className="mt-1 text-xs text-fg-faint">
                      {tr('progress_modal_notes_help', lang)}
                    </p>
                  </div>
                  <input
                    type="text"
                    value={inputNotes}
                    onChange={(e) => setInputNotes(e.target.value)}
                    placeholder={tr('progress_modal_notes_placeholder', lang)}
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
                  {tr('progress_modal_cancel', lang)}
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 rounded-[16px] bg-brand px-4 py-2.5 text-sm font-black uppercase tracking-wider text-on-brand transition-all hover:bg-brand-hover active:scale-[0.98] shadow-brand-float rf-focus-ring"
                >
                  {tr('progress_modal_save', lang)}
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
