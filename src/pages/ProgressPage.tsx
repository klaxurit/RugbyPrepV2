import { useState } from 'react'
import { Link } from 'react-router-dom'
import { posthog } from '../services/analytics/posthog'
import {
  ChevronLeft, TrendingUp, TrendingDown, Minus, AlertCircle, BarChart2,
  Plus, X, FlaskConical, Dumbbell, ChevronDown
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import blocksData from '../data/blocks.v1.json'
import { getExerciseName } from '../data/exercises'
import { useBlockLogs } from '../hooks/useBlockLogs'
import { useAthleteTests } from '../hooks/useAthleteTests'
import { useProfile } from '../hooks/useProfile'
import { getExerciseDeltaW1W4, getExerciseRecentHistory } from '../services/ui/progression'
import { getExerciseSuggestion } from '../services/ui/suggestions'
import { getExerciseMetricType } from '../services/ui/exerciseMetrics'
import { estimateOneRM } from '../services/athleticTesting/estimateOneRM'
import {
  getPositionBaseline,
  getBaselineForLevel,
  getBaselineLevelLabel,
} from '../services/athleticTesting/getPositionBaseline'
import { BottomNav } from '../components/BottomNav'
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
  { type: 'cmj',          label: 'Counter-Movement Jump', unit: 'cm',  higherIsBetter: true,  color: '#e11d48' },
  { type: 'sprint_10m',   label: 'Sprint 10m',            unit: 's',   higherIsBetter: false, color: '#f97316' },
  { type: 'one_rm_squat', label: '1RM Squat',             unit: 'kg',  higherIsBetter: true,  color: '#6366f1', is1RM: true },
  { type: 'yyir1',        label: 'Yo-Yo IR1',             unit: 'm',   higherIsBetter: true,  color: '#0ea5e9' },
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
  const [tab, setTab] = useState<'sessions' | 'tests'>('sessions')
  const { logs, getLastEntryForExercise } = useBlockLogs()
  const { addTest, getHistoryFor, getBestFor } = useAthleteTests()
  const { profile } = useProfile()

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

      {/* Header */}
      <header className="relative px-6 py-4 bg-[#1a100c]/95 backdrop-blur border-b border-white/10 flex items-center gap-3 sticky top-0 z-50">
        <Link to="/" className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-5 h-5 text-white/50" />
        </Link>
        <div>
          <p className="text-xs font-bold tracking-widest text-[#ff6b35] uppercase italic">RugbyForge</p>
          <h1 className="text-xl font-extrabold tracking-tight text-white">Progression</h1>
        </div>
      </header>

      <main className="relative px-6 pt-5 space-y-6 max-w-md mx-auto">

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
            Tests Physiques
          </button>
        </div>

        {/* ─── SESSIONS TAB ─────────────────────────────────────── */}
        {tab === 'sessions' && (
          <>
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
                            <div className="text-sm font-bold text-white truncate">{getExerciseName(row.exerciseId)}</div>
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

            {nextTargetRows.length > 0 && (
              <section>
                <h2 className="text-sm font-black uppercase tracking-wider text-white/40 mb-3">
                  Objectifs prochaine séance
                </h2>
                <div className="bg-white/5 border border-white/10 rounded-[24px] overflow-hidden divide-y divide-white/10">
                  {nextTargetRows.map((row) => (
                    <div key={row.exerciseId} className="p-4 flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-white truncate">{getExerciseName(row.exerciseId)}</span>
                      <span className="text-xs font-black text-[#10b981] bg-[#10b981]/10 px-2.5 py-1 rounded-full flex-shrink-0">
                        ↑ {row.target}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {historyRows.length > 0 && (
              <section>
                <h2 className="text-sm font-black uppercase tracking-wider text-white/40 mb-3">
                  Progression saison
                </h2>
                <div className="space-y-4">
                  {historyRows.slice(0, 6).map(({ exerciseId, history }) => {
                    const maxProxy = Math.max(...history.map((h) => h.loadProxy), 1)
                    return (
                      <div key={exerciseId} className="bg-white/5 border border-white/10 rounded-[24px] p-4">
                        <p className="text-sm font-bold text-white mb-3">{getExerciseName(exerciseId)}</p>
                        <div className="flex items-end gap-1 h-10">
                          {history.map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                              <div
                                className="w-full rounded-sm bg-[#1a5f3f]/20 hover:bg-[#1a5f3f]/40 transition-colors"
                                style={{ height: `${Math.max(20, (h.loadProxy / maxProxy) * 40)}px` }}
                                title={`${h.week}: ${h.text}`}
                              />
                              <span className="text-[8px] text-white/30 font-mono">{h.week}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-white/40 mt-2 font-mono">
                          {history[0].text} → {history[history.length - 1].text}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {missingRows.length > 0 && (
              <section>
                <h2 className="text-sm font-black uppercase tracking-wider text-white/40 mb-3">À renseigner</h2>
                <div className="bg-white/5 border border-white/10 rounded-[24px] p-5 space-y-2">
                  {missingRows.map(([exerciseId, count]) => (
                    <div key={exerciseId} className="flex items-center justify-between py-1.5 border-b border-white/10 last:border-0">
                      <span className="text-sm font-medium text-white">{getExerciseName(exerciseId)}</span>
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
                          <div className="text-right flex-shrink-0">
                            <p className="text-[10px] text-white/40">Baseline {positionLabel}</p>
                            <p className="text-xs font-bold text-white/50">
                              {formatValue(baselineValue, card.type)} {card.unit}
                              <span className="text-[9px] text-white/30 ml-1">({baselineLabel})</span>
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="px-4 pb-3">
                        <p className="text-sm text-white/40 italic">Aucun test enregistré</p>
                        {baselineValue !== null && positionLabel && (
                          <p className="text-[10px] text-white/40 mt-1">
                            Baseline {positionLabel} ({baselineLabel}) : <span className="font-bold">{formatValue(baselineValue, card.type)} {card.unit}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* LineChart */}
                    {chartData.length > 0 && (
                      <div className="px-2 pb-3">
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
                            <Tooltip contentStyle={{ fontSize: 11 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Science card */}
            <section>
              <div className="bg-rose-900/20 border border-rose-500/20 rounded-[24px] p-5 space-y-2">
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

      </main>

      {/* ─── Modal saisie ─────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Drawer */}
          <div className="relative w-full max-w-md bg-[#1a100c] border-t border-white/10 rounded-t-[32px] px-6 pt-5 pb-8 shadow-xl">
            {/* Handle */}
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-extrabold text-white">Nouveau test</h3>
                <p className="text-xs text-white/40">{modal.label}</p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-white/10">
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            {/* 1RM toggle */}
            {modal.is1RM && (
              <div className="flex gap-2 mb-4 bg-white/5 border border-white/10 rounded-[14px] p-1">
                <button
                  onClick={() => setInputMode('direct')}
                  className={`flex-1 py-1.5 rounded-[10px] text-xs font-bold transition-all ${
                    inputMode === 'direct' ? 'bg-white/15 shadow-sm text-white' : 'text-white/40'
                  }`}
                >
                  Direct (kg)
                </button>
                <button
                  onClick={() => setInputMode('oneRM')}
                  className={`flex-1 py-1.5 rounded-[10px] text-xs font-bold transition-all ${
                    inputMode === 'oneRM' ? 'bg-white/15 shadow-sm text-white' : 'text-white/40'
                  }`}
                >
                  Estimation reps
                </button>
              </div>
            )}

            {/* Direct input */}
            {(!modal.is1RM || inputMode === 'direct') && (
              <div className="mb-4">
                <label className="text-xs font-bold text-white/40 mb-1 block uppercase tracking-wide">
                  Valeur ({modal.unit})
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={modal.unit === 's' ? '1.75' : modal.unit === 'cm' ? '42' : '1200'}
                  className="w-full px-4 py-3 border border-white/10 bg-white/5 rounded-[14px] text-lg font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff6b35] [color-scheme:dark]"
                />
              </div>
            )}

            {/* 1RM estimation inputs */}
            {modal.is1RM && inputMode === 'oneRM' && (
              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-white/40 mb-1 block uppercase tracking-wide">
                      Poids (kg)
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={inputLoad}
                      onChange={(e) => setInputLoad(e.target.value)}
                      placeholder="100"
                      className="w-full px-3 py-2.5 border border-white/10 bg-white/5 rounded-[14px] text-base font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff6b35] [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/40 mb-1 block uppercase tracking-wide">
                      Reps
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={inputReps}
                      onChange={(e) => setInputReps(e.target.value)}
                      placeholder="5"
                      className="w-full px-3 py-2.5 border border-white/10 bg-white/5 rounded-[14px] text-base font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff6b35] [color-scheme:dark]"
                    />
                  </div>
                </div>
                {/* Formula selector */}
                <div className="relative">
                  <label className="text-xs font-bold text-white/40 mb-1 block uppercase tracking-wide">
                    Formule
                  </label>
                  <div className="relative">
                    <select
                      value={inputFormula}
                      onChange={(e) => setInputFormula(e.target.value as OneRMFormula)}
                      className="w-full appearance-none px-3 py-2.5 border border-white/10 bg-white/5 rounded-[14px] text-sm font-bold text-white focus:outline-none focus:border-[#ff6b35] [color-scheme:dark] pr-8"
                    >
                      <option value="brzycki">Brzycki (recommandé 3–6 reps)</option>
                      <option value="epley">Epley (8–12 reps)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  </div>
                </div>
                {/* Live estimation */}
                {estimatedLive !== null && (
                  <div className="bg-[#1a5f3f]/10 border border-[#1a5f3f]/20 rounded-[14px] px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#10b981]">1RM estimé</span>
                    <span className="text-xl font-black text-[#10b981]">{estimatedLive} kg</span>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="mb-5">
              <label className="text-xs font-bold text-white/40 mb-1 block uppercase tracking-wide">
                Notes (optionnel)
              </label>
              <input
                type="text"
                value={inputNotes}
                onChange={(e) => setInputNotes(e.target.value)}
                placeholder="Ex: après entraînement, sol synthétique..."
                className="w-full px-4 py-2.5 border border-white/10 bg-white/5 rounded-[14px] text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff6b35] [color-scheme:dark]"
              />
            </div>

            <button
              onClick={handleSave}
              className="w-full py-3.5 bg-[#ff6b35] text-white font-extrabold text-sm uppercase tracking-wider rounded-[16px] hover:bg-[#e55a2b] active:scale-[0.98] transition-all shadow-lg shadow-[#ff6b35]/20"
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
