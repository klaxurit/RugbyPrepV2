import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { useProfile, markOnboardingComplete } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import type { UserProfile, Equipment, Contra, DayOfWeek, ClubSchedule, SCSchedule, TrainingLevel, SeasonMode } from '../types/training'
import { computeSCSchedule, buildManualSCSchedule } from '../services/program/scheduleOptimizer'
import { GymDaySelector } from '../components/GymDaySelector'

// ─── Types ────────────────────────────────────────────────────

type PositionValue = NonNullable<UserProfile['position']>

// ─── Constants ────────────────────────────────────────────────

const POSITIONS: { value: PositionValue; label: string; sub: string; emoji: string }[] = [
  { value: 'FRONT_ROW',   label: 'Première ligne',  sub: 'Pilier, Talonneur',       emoji: '🐂' },
  { value: 'SECOND_ROW',  label: 'Deuxième ligne',  sub: 'Verrouilleur',             emoji: '🗼' },
  { value: 'BACK_ROW',    label: 'Troisième ligne', sub: 'Flanker, Numéro 8',        emoji: '⚡' },
  { value: 'HALF_BACKS',  label: 'Demi',            sub: 'Demi de mêlée / d\'ouv.', emoji: '🎯' },
  { value: 'CENTERS',     label: 'Centre',          sub: '12 / 13',                  emoji: '🛡️' },
  { value: 'BACK_THREE',  label: 'Arrière / Ailier',sub: '11, 14, 15',              emoji: '🚀' },
]

const EQUIPMENT_OPTIONS: { value: Exclude<Equipment, 'none'>; label: string; emoji: string }[] = [
  { value: 'barbell',      label: 'Barre olympique',           emoji: '🏋️' },
  { value: 'dumbbell',     label: 'Haltères',                  emoji: '💪' },
  { value: 'bench',        label: 'Banc de musculation',       emoji: '🪑' },
  { value: 'pullup_bar',   label: 'Barre de traction',         emoji: '🔝' },
  { value: 'band',         label: 'Élastiques',                emoji: '🔴' },
  { value: 'box',          label: 'Box pliométrique',          emoji: '📦' },
  { value: 'med_ball',     label: 'Médecine Ball',             emoji: '🔵' },
  { value: 'landmine',     label: 'Landmine',                  emoji: '📐' },
  { value: 'machine',      label: 'Machines guidées',          emoji: '⚙️' },
  { value: 'ghd',          label: 'GHD',                       emoji: '🔩' },
  { value: 'tbar_row',     label: 'T-Bar Row',                 emoji: '🔧' },
  { value: 'sprint_track', label: 'Piste / Gazon synthétique', emoji: '🏃' },
  { value: 'ab_wheel',     label: 'Ab Wheel',                  emoji: '⭕' },
]

const INJURY_OPTIONS: { value: Contra; label: string; emoji: string }[] = [
  { value: 'shoulder_pain', label: 'Épaule',       emoji: '🦾' },
  { value: 'knee_pain',     label: 'Genou',         emoji: '🦵' },
  { value: 'low_back_pain', label: 'Bas du dos',    emoji: '🔙' },
  { value: 'neck_pain',     label: 'Nuque',         emoji: '🏈' },
  { value: 'elbow_pain',    label: 'Coude',         emoji: '💥' },
  { value: 'wrist_pain',    label: 'Poignet',       emoji: '🤜' },
  { value: 'groin_pain',    label: 'Aine',          emoji: '⚠️' },
  { value: 'ankle_pain',    label: 'Cheville',      emoji: '🦶' },
]

// ─── Club Schedule constants ──────────────────────────────────

const CLUB_DAYS_OPTIONS: { day: DayOfWeek; label: string; short: string }[] = [
  { day: 1, label: 'Lundi',    short: 'L' },
  { day: 2, label: 'Mardi',    short: 'M' },
  { day: 3, label: 'Mercredi', short: 'M' },
  { day: 4, label: 'Jeudi',    short: 'J' },
  { day: 5, label: 'Vendredi', short: 'V' },
  { day: 6, label: 'Samedi',   short: 'S' },
  { day: 0, label: 'Dimanche', short: 'D' },
]

const MATCH_DAY_OPTIONS: { day: DayOfWeek | null; label: string }[] = [
  { day: 6,    label: 'Samedi' },
  { day: 0,    label: 'Dimanche' },
  { day: null, label: 'Pas de jour fixe' },
]

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

// 3 niveaux d'entraînement
const TRAINING_LEVELS: {
  value: TrainingLevel
  label: string
  sub: string
  emoji: string
  details: string
  legacyLevel: UserProfile['level']
}[] = [
  {
    value: 'starter',
    label: 'Débutant',
    sub: 'Je découvre la musculation',
    emoji: '🌱',
    details: 'Poids du corps & élastiques — progression simple',
    legacyLevel: 'beginner',
  },
  {
    value: 'builder',
    label: 'Intermédiaire',
    sub: "J'ai une base, je veux progresser",
    emoji: '💪',
    details: 'Haltères & supersets — séances optimisées',
    legacyLevel: 'intermediate',
  },
  {
    value: 'performance',
    label: 'Avancé',
    sub: 'Je cherche la performance maximale',
    emoji: '🏆',
    details: 'Barre + blocs de contraste — transfert rugby direct',
    legacyLevel: 'intermediate',
  },
]

// Modes saison
const SEASON_MODES: { value: SeasonMode; label: string; sub: string; emoji: string }[] = [
  { value: 'in_season',  label: 'Saison',        sub: 'Programme Force → Puissance',        emoji: '⚡' },
  { value: 'off_season', label: 'Inter-saison',   sub: 'Hypertrophie & reconstruction',      emoji: '🌿' },
  { value: 'pre_season', label: 'Pré-saison',     sub: 'Force-Puissance & réathlétisation', emoji: '🔥' },
]

// ─── BMI helper ───────────────────────────────────────────────

function calcBmi(heightCm: number, weightKg: number): number {
  const h = heightCm / 100
  return weightKg / (h * h)
}

function bmiLabel(bmi: number, position: PositionValue | null): string {
  // Seuils adaptés rugby (IMC élevé normal chez avants)
  const isForward = position === 'FRONT_ROW' || position === 'SECOND_ROW' || position === 'BACK_ROW'
  if (bmi < 20) return 'Sous le poids de forme'
  if (bmi < 24) return isForward ? 'Plutôt léger pour ton poste' : 'Morphologie optimale'
  if (bmi < 27) return isForward ? 'Morphologie adéquate' : 'Légèrement au-dessus'
  if (bmi < 31) return isForward ? 'Morphologie optimale pour un avant' : 'Au-dessus de la norme'
  return isForward ? 'Gabarit de gros avant' : 'Surcharge à surveiller'
}

// ─── Component ────────────────────────────────────────────────

export function OnboardingPage() {
  const { updateProfile } = useProfile()
  const { authState } = useAuth()
  const navigate = useNavigate()

  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [step, setStep] = useState(0)
  const [position, setPosition] = useState<PositionValue | null>(null)
  const [trainingLevel, setTrainingLevel] = useState<TrainingLevel | null>(null)
  const [seasonMode, setSeasonMode] = useState<SeasonMode>('in_season')
  const [sessions, setSessions] = useState<2 | 3 | null>(null)
  const [equipment, setEquipment] = useState<Set<Equipment>>(new Set())
  const [clubDays, setClubDays] = useState<Set<DayOfWeek>>(new Set())
  const [clubDayTimes, setClubDayTimes] = useState<Record<number, string>>({})
  const [matchDay, setMatchDay] = useState<DayOfWeek | null | undefined>(undefined) // undefined = not set yet
  const [gymMode, setGymMode] = useState<'auto' | 'manual'>('auto')
  const [manualGymDays, setManualGymDays] = useState<Set<DayOfWeek>>(new Set())
  const [scSchedule, setScSchedule] = useState<SCSchedule | undefined>(undefined)
  const [injuries, setInjuries] = useState<Set<Contra>>(new Set())
  const [heightCm, setHeightCm] = useState<string>('')
  const [weightKg, setWeightKg] = useState<string>('')

  const STEPS = ['Position', 'Profil', 'Équipement', 'Planning', 'Inconforts', 'Morphologie', 'Résumé']
  const progress = (step / (STEPS.length - 1)) * 100

  const toggleEquipment = (eq: Equipment) => {
    setEquipment((prev) => {
      const next = new Set(prev)
      next.has(eq) ? next.delete(eq) : next.add(eq)
      return next
    })
  }

  const toggleInjury = (inj: Contra) => {
    setInjuries((prev) => {
      const next = new Set(prev)
      next.has(inj) ? next.delete(inj) : next.add(inj)
      return next
    })
  }

  const parsedHeight = parseInt(heightCm, 10)
  const parsedWeight = parseFloat(weightKg.replace(',', '.'))
  const validHeight = !isNaN(parsedHeight) && parsedHeight >= 140 && parsedHeight <= 230
  const validWeight = !isNaN(parsedWeight) && parsedWeight >= 40 && parsedWeight <= 200
  const bmi = validHeight && validWeight ? calcBmi(parsedHeight, parsedWeight) : null

  const canNext = () => {
    if (step === 0) return position !== null
    if (step === 1) return trainingLevel !== null && sessions !== null
    if (step === 2) return equipment.size > 0
    // Step 3 (Planning): always allow — "Passer" button handles skip
    if (step === 3) return true
    if (step === 5) return validHeight && validWeight
    return true
  }

  const buildClubSchedule = (): ClubSchedule | undefined => {
    if (clubDays.size === 0) return undefined
    return {
      clubDays: Array.from(clubDays).map((d) => ({
        day: d,
        time: clubDayTimes[d] ?? undefined,
      })),
      matchDay: matchDay ?? undefined,
    }
  }

  const handleClubScheduleNext = () => {
    if (clubDays.size > 0 && sessions !== null) {
      const cs = buildClubSchedule()!
      if (gymMode === 'manual' && manualGymDays.size > 0) {
        setScSchedule(buildManualSCSchedule(Array.from(manualGymDays)))
      } else {
        setScSchedule(computeSCSchedule(cs, sessions))
      }
    }
    setStep((s) => s + 1)
  }

  const handleFinish = () => {
    const clubSchedule = buildClubSchedule()

    const levelDef = TRAINING_LEVELS.find((l) => l.value === trainingLevel)!
    updateProfile({
      position: position!,
      rugbyPosition: position!,
      level: levelDef.legacyLevel,
      trainingLevel: trainingLevel!,
      seasonMode,
      weeklySessions: sessions!,
      equipment: Array.from(equipment),
      injuries: Array.from(injuries),
      heightCm: validHeight ? parsedHeight : undefined,
      weightKg: validWeight ? parsedWeight : undefined,
      clubSchedule,
      scSchedule,
    })
    if (userId) markOnboardingComplete(userId)
    navigate('/week', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 flex flex-col">

      {/* Progress bar */}
      <div className="h-1 bg-gray-100 w-full">
        <div
          className="h-full bg-rose-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <header className="px-6 py-4 flex items-center gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
        )}
        <div className="flex-1">
          <p className="text-xs font-bold tracking-widest text-rose-600 uppercase italic">RugbyPrep</p>
          <p className="text-xs text-slate-400">{step + 1} / {STEPS.length}</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 pt-2 pb-32 max-w-md mx-auto w-full space-y-6">

        {/* ─── Step 0 : Position ─── */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Tu joues où ?</h1>
              <p className="text-sm text-slate-400 mt-1">Ton programme est adapté à ton poste.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  type="button"
                  onClick={() => setPosition(pos.value)}
                  className={`flex flex-col items-start gap-1 p-4 rounded-2xl border-2 text-left transition-all ${
                    position === pos.value
                      ? 'border-rose-500 bg-rose-50'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <span className="text-2xl">{pos.emoji}</span>
                  <span className="text-sm font-black text-slate-900 leading-tight">{pos.label}</span>
                  <span className="text-[10px] text-slate-400 leading-tight">{pos.sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Step 1 : Niveau + Séances ─── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Ton profil</h1>
              <p className="text-sm text-slate-400 mt-1">Pour calibrer les charges et volumes.</p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wide">Niveau en salle</p>
              <div className="flex flex-col gap-3">
                {TRAINING_LEVELS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTrainingLevel(opt.value)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                      trainingLevel === opt.value
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <span className="text-2xl flex-shrink-0">{opt.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900">{opt.label}</p>
                      <p className="text-[10px] text-slate-400 leading-tight">{opt.sub}</p>
                      <p className={`text-[10px] mt-0.5 leading-tight ${trainingLevel === opt.value ? 'text-rose-600' : 'text-slate-300'}`}>
                        {opt.details}
                      </p>
                    </div>
                    {trainingLevel === opt.value && (
                      <CheckCircle2 className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {trainingLevel !== 'starter' && (
              <div className="space-y-3">
                <p className="text-xs font-black text-slate-500 uppercase tracking-wide">Période de saison</p>
                <div className="flex gap-2">
                  {SEASON_MODES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSeasonMode(opt.value)}
                      className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border-2 text-center transition-all ${
                        seasonMode === opt.value
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <span className="text-lg">{opt.emoji}</span>
                      <span className={`text-[9px] font-black leading-tight ${seasonMode === opt.value ? 'text-rose-700' : 'text-slate-500'}`}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wide">Séances par semaine</p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 2 as const, label: '2 séances', sub: 'Lundi + Jeudi' },
                  { value: 3 as const, label: '3 séances', sub: 'Lun + Mer + Ven' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSessions(opt.value)}
                    className={`flex flex-col items-start gap-1 p-4 rounded-2xl border-2 text-left transition-all ${
                      sessions === opt.value
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <span className="text-sm font-black text-slate-900">{opt.label}</span>
                    <span className="text-[10px] text-slate-400">{opt.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Step 2 : Équipement ─── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Ton équipement</h1>
              <p className="text-sm text-slate-400 mt-1">Sélectionne tout ce que tu as accès en salle.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {EQUIPMENT_OPTIONS.map((eq) => {
                const selected = equipment.has(eq.value)
                return (
                  <button
                    key={eq.value}
                    type="button"
                    onClick={() => toggleEquipment(eq.value)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                      selected
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{eq.emoji}</span>
                    <span className={`text-sm font-bold leading-tight ${selected ? 'text-rose-700' : 'text-slate-700'}`}>
                      {eq.label}
                    </span>
                  </button>
                )
              })}
            </div>
            {equipment.size === 0 && (
              <p className="text-xs text-amber-600 text-center">Sélectionne au moins un équipement</p>
            )}
          </div>
        )}

        {/* ─── Step 3 : Planning club ─── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Ton planning club</h1>
              <p className="text-sm text-slate-400 mt-1">On va adapter tes séances muscu à ton agenda.</p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wide">Jours d'entraînement club</p>
              <div className="grid grid-cols-4 gap-2">
                {CLUB_DAYS_OPTIONS.map((opt) => {
                  const selected = clubDays.has(opt.day)
                  return (
                    <div key={opt.day} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setClubDays((prev) => {
                            const next = new Set(prev)
                            next.has(opt.day) ? next.delete(opt.day) : next.add(opt.day)
                            return next
                          })
                        }}
                        className={`w-full py-3 rounded-2xl border-2 text-xs font-black transition-all ${
                          selected
                            ? 'border-rose-500 bg-rose-50 text-rose-700'
                            : 'border-gray-100 bg-white text-slate-500 hover:border-gray-200'
                        }`}
                      >
                        {opt.short}
                        <span className="block text-[9px] font-bold mt-0.5 opacity-70">{opt.label.slice(0, 3)}</span>
                      </button>
                      {selected && (
                        <input
                          type="time"
                          value={clubDayTimes[opt.day] ?? ''}
                          onChange={(e) => setClubDayTimes((prev) => ({ ...prev, [opt.day]: e.target.value }))}
                          className="w-full text-[10px] rounded-xl border border-gray-100 px-1.5 py-1 text-slate-500 bg-white focus:outline-none focus:border-rose-300"
                          placeholder="HH:MM"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wide">Jour de match habituel</p>
              <div className="flex gap-2 flex-wrap">
                {MATCH_DAY_OPTIONS.map((opt) => (
                  <button
                    key={String(opt.day)}
                    type="button"
                    onClick={() => setMatchDay(opt.day)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black border-2 transition-all ${
                      matchDay === opt.day
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-gray-100 bg-white text-slate-500 hover:border-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Séances muscu : suggestion + sélecteur manuel ─── */}
            {clubDays.size > 0 && sessions !== null && (
              <div className="space-y-3 pt-1 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wide">Séances muscu</p>
                  <div className="flex gap-1 bg-gray-100 rounded-2xl p-0.5">
                    <button
                      type="button"
                      onClick={() => setGymMode('auto')}
                      className={`px-3 py-1 rounded-xl text-[10px] font-black transition-all ${
                        gymMode === 'auto' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      Auto
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGymMode('manual')
                        if (manualGymDays.size === 0) {
                          const cs: ClubSchedule = {
                            clubDays: Array.from(clubDays).map((d) => ({ day: d })),
                            matchDay: matchDay ?? undefined,
                          }
                          const auto = computeSCSchedule(cs, sessions)
                          setManualGymDays(new Set(auto.sessions.map((s) => s.day)))
                        }
                      }}
                      className={`px-3 py-1 rounded-xl text-[10px] font-black transition-all ${
                        gymMode === 'manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      Manuel
                    </button>
                  </div>
                </div>

                {gymMode === 'auto' && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wide mb-1">
                      Suggestion calculée
                    </p>
                    <p className="text-sm font-black text-emerald-800">
                      {(() => {
                        const cs: ClubSchedule = {
                          clubDays: Array.from(clubDays).map((d) => ({ day: d })),
                          matchDay: matchDay ?? undefined,
                        }
                        return computeSCSchedule(cs, sessions).sessions
                          .map((s) => DAY_LABELS[s.day])
                          .join(' · ')
                      })()}
                    </p>
                    <p className="text-[10px] text-emerald-600 mt-1">
                      Basé sur ton planning et les bonnes pratiques de récupération
                    </p>
                  </div>
                )}

                {gymMode === 'manual' && (
                  <GymDaySelector
                    clubSchedule={{
                      clubDays: Array.from(clubDays).map((d) => ({ day: d })),
                      matchDay: matchDay ?? undefined,
                    }}
                    selectedDays={manualGymDays}
                    weeklySessions={sessions}
                    onChange={setManualGymDays}
                  />
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="w-full py-3 rounded-2xl border border-gray-200 text-sm font-bold text-slate-400 hover:border-gray-300 transition-colors"
            >
              Pas d'entraînement club — passer
            </button>
          </div>
        )}

        {/* ─── Step 4 : Inconforts ─── */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Zones sensibles ?</h1>
              <p className="text-sm text-slate-400 mt-1">
                Optionnel. L'app adapte les exercices et ajoute un prehab ciblé.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {INJURY_OPTIONS.map((inj) => {
                const selected = injuries.has(inj.value)
                return (
                  <button
                    key={inj.value}
                    type="button"
                    onClick={() => toggleInjury(inj.value)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                      selected
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{inj.emoji}</span>
                    <span className={`text-sm font-bold ${selected ? 'text-amber-700' : 'text-slate-700'}`}>
                      {inj.label}
                    </span>
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="w-full py-3 rounded-2xl border border-gray-200 text-sm font-bold text-slate-400 hover:border-gray-300 transition-colors"
            >
              Aucun inconfort — passer
            </button>
          </div>
        )}

        {/* ─── Step 5 : Morphologie ─── */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Ta morphologie</h1>
              <p className="text-sm text-slate-400 mt-1">
                Permet de personnaliser les charges relatives et le suivi de composition.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Taille (cm)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={140}
                  max={230}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="182"
                  className="w-full h-14 rounded-2xl border-2 border-gray-100 bg-white px-4 text-lg font-black text-slate-900 focus:outline-none focus:border-rose-400 transition-colors"
                />
                {heightCm && !validHeight && (
                  <p className="text-[11px] text-rose-500">Entre 140 et 230 cm</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wide">Poids (kg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={40}
                  max={200}
                  step={0.5}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="95"
                  className="w-full h-14 rounded-2xl border-2 border-gray-100 bg-white px-4 text-lg font-black text-slate-900 focus:outline-none focus:border-rose-400 transition-colors"
                />
                {weightKg && !validWeight && (
                  <p className="text-[11px] text-rose-500">Entre 40 et 200 kg</p>
                )}
              </div>
            </div>

            {bmi && (
              <div className="p-5 rounded-2xl bg-white border border-gray-100 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">{bmi.toFixed(1)}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">IMC</span>
                </div>
                <p className="text-sm font-bold text-slate-600">{bmiLabel(bmi, position)}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  L'IMC seul ne reflète pas la masse musculaire — il est utilisé uniquement comme indicateur de gabarit.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── Step 6 : Résumé ─── */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">C'est parti !</h1>
              <p className="text-sm text-slate-400 mt-1">Voici ton profil. Tu pourras le modifier à tout moment.</p>
            </div>

            <div className="bg-white border border-gray-100 rounded-[2rem] divide-y divide-gray-50 overflow-hidden">
              <SummaryRow label="Poste" value={POSITIONS.find((p) => p.value === position)?.label ?? '–'} />
              <SummaryRow label="Niveau" value={TRAINING_LEVELS.find((l) => l.value === trainingLevel)?.label ?? '–'} />
              <SummaryRow label="Période" value={SEASON_MODES.find((m) => m.value === seasonMode)?.label ?? '–'} />
              <SummaryRow label="Séances / semaine" value={`${sessions} séances`} />
              <SummaryRow
                label="Équipement"
                value={
                  Array.from(equipment)
                    .map((eq) => EQUIPMENT_OPTIONS.find((o) => o.value === eq)?.label ?? eq)
                    .join(', ')
                }
              />
              {injuries.size > 0 && (
                <SummaryRow
                  label="Zones sensibles"
                  value={
                    Array.from(injuries)
                      .map((inj) => INJURY_OPTIONS.find((o) => o.value === inj)?.label ?? inj)
                      .join(', ')
                  }
                />
              )}
              {validHeight && validWeight && bmi && (
                <SummaryRow
                  label="Morphologie"
                  value={`${parsedHeight} cm · ${parsedWeight} kg · IMC ${bmi.toFixed(1)}`}
                />
              )}
              {scSchedule && scSchedule.sessions.length > 0 && (
                <SummaryRow
                  label="Séances muscu"
                  value={scSchedule.sessions.map((s) => DAY_LABELS[s.day]).join(' · ') + ' — basé sur ton planning'}
                />
              )}
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rose-900/20"
            >
              <CheckCircle2 className="w-5 h-5" />
              Voir mon programme
            </button>
          </div>
        )}

      </main>

      {/* CTA flottant — masqué sur étapes avec leurs propres boutons */}
      {step !== 3 && step !== 4 && step !== 6 && (
        <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent">
          <div className="max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* CTA step 3 : Planning — bouton principal "Suivant" + "Passer" inline */}
      {step === 3 && (
        <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent">
          <div className="max-w-md mx-auto">
            <button
              type="button"
              onClick={handleClubScheduleNext}
              className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Helper ───────────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-4 flex items-start gap-3">
      <span className="text-xs font-black text-slate-400 uppercase tracking-wide w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm font-bold text-slate-800 leading-relaxed">{value}</span>
    </div>
  )
}
