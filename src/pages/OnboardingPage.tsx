import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, CheckCircle2,
  TrendingUp, Bot, Calendar, Check,
} from 'lucide-react'
import { RugbyForgeLogo } from '../components/RugbyForgeLogo'
import { useProfile, markOnboardingComplete } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { posthog } from '../services/analytics/posthog'
import { resolvePostOnboardingDestination } from '../services/navigation/resolveAppEntryDestination'
import type {
  UserProfile,
  Equipment,
  DayOfWeek,
  ClubSchedule,
  SCSchedule,
  TrainingLevel,
  SeasonMode,
  PopulationSegment,
} from '../types/training'
import { computeSCSchedule, buildManualSCSchedule } from '../services/program/scheduleOptimizer'
import { GymDaySelector } from '../components/GymDaySelector'
// betaEligibility import removed — all profiles eligible since V2 launch

// ─── Types ────────────────────────────────────────────────────

type PositionValue = NonNullable<UserProfile['position']>

// ─── Constants ────────────────────────────────────────────────

const POSITIONS: { value: PositionValue; label: string; sub: string; emoji: string }[] = [
  { value: 'FRONT_ROW',   label: 'Première ligne',   sub: 'Pilier · Talonneur',      emoji: '🐂' },
  { value: 'SECOND_ROW',  label: 'Deuxième ligne',   sub: 'Verrouilleur',             emoji: '🗼' },
  { value: 'BACK_ROW',    label: 'Troisième ligne',  sub: 'Flanker · Numéro 8',      emoji: '⚡' },
  { value: 'HALF_BACKS',  label: 'Demi',             sub: "Mêlée · Ouverture",       emoji: '🎯' },
  { value: 'CENTERS',     label: 'Centre',           sub: '12 / 13',                  emoji: '🛡️' },
  { value: 'BACK_THREE',  label: 'Arrière / Ailier', sub: '11 · 14 · 15',            emoji: '🚀' },
]

const EQUIPMENT_OPTIONS: { value: Equipment; label: string; emoji: string }[] = [
  { value: 'none',         label: 'Poids du corps',            emoji: '🤸' },
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
  { value: 'sprint_track', label: 'Piste / Gazon',             emoji: '🏃' },
  { value: 'ab_wheel',     label: 'Ab Wheel',                  emoji: '⭕' },
]

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
  { day: null, label: 'Variable' },
]

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

const TRAINING_LEVELS: {
  value: TrainingLevel
  label: string
  sub: string
  details: string
  legacyLevel: UserProfile['level']
}[] = [
  {
    value: 'starter',
    label: 'Fondations',
    sub: 'Je construis mes bases',
    details: 'Machines guidées, bases solides — progression simple',
    legacyLevel: 'beginner',
  },
  {
    value: 'performance',
    label: 'Avancé',
    sub: 'Je cherche la performance maximale',
    details: 'Barre + blocs de contraste — transfert rugby direct',
    legacyLevel: 'intermediate',
  },
]

const CYCLE_HINTS: { value: SeasonMode; label: string; sub: string; emoji: string }[] = [
  { value: 'in_season',  label: 'En saison',      sub: 'J\'ai des matchs à venir',     emoji: '⚡' },
  { value: 'off_season', label: 'Inter-saison',    sub: 'Pas de match pour l\'instant',  emoji: '🌿' },
  { value: 'pre_season', label: 'Pré-saison',      sub: 'Je prépare ma reprise',        emoji: '🔥' },
]
// This seeds the initial cycle for program bootstrap. Once matches are added,
// the annual context detector auto-detects the real cycle from the calendar.

// App réservée aux adultes — ageBand hardcodé à 'adult', pas de sélecteur U18.

const GYM_PRESET: Equipment[] = [
  'barbell', 'dumbbell', 'bench', 'pullup_bar', 'band', 'box',
  'machine', 'cable', 'landmine', 'tbar_row', 'ghd', 'med_ball', 'ab_wheel', 'sprint_track',
]

const HOME_EQUIPMENT_OPTIONS: { value: Equipment; label: string; emoji: string }[] = [
  { value: 'dumbbell',     label: 'Haltères',          emoji: '💪' },
  { value: 'bench',        label: 'Banc',              emoji: '🪑' },
  { value: 'pullup_bar',   label: 'Barre de traction', emoji: '🔝' },
  { value: 'band',         label: 'Élastiques',        emoji: '🔴' },
  { value: 'box',          label: 'Box pliométrique',   emoji: '📦' },
  { value: 'med_ball',     label: 'Médecine Ball',     emoji: '🔵' },
  { value: 'ab_wheel',     label: 'Ab Wheel',          emoji: '⭕' },
  { value: 'sprint_track', label: 'Piste / Gazon',     emoji: '🏃' },
]

// ─── BMI helper ───────────────────────────────────────────────

function calcBmi(heightCm: number, weightKg: number): number {
  const h = heightCm / 100
  return weightKg / (h * h)
}

function bmiLabel(bmi: number, position: PositionValue | null): string {
  const isForward = position === 'FRONT_ROW' || position === 'SECOND_ROW' || position === 'BACK_ROW'
  if (bmi < 20) return 'Sous le poids de forme'
  if (bmi < 24) return isForward ? 'Plutôt léger pour ton poste' : 'Morphologie optimale'
  if (bmi < 27) return isForward ? 'Morphologie adéquate' : 'Légèrement au-dessus'
  if (bmi < 31) return isForward ? 'Morphologie optimale pour un avant' : 'Au-dessus de la norme'
  return isForward ? 'Gabarit de gros avant' : 'Surcharge à surveiller'
}

// ─── Shared UI atoms ──────────────────────────────────────────

function StepTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="space-y-1 pb-1">
      <h1 className="text-2xl font-black tracking-tight text-fg">{title}</h1>
      <p className="text-sm text-fg-soft leading-relaxed">{sub}</p>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black text-fg-muted uppercase tracking-widest">{children}</p>
  )
}

// ─── Component ────────────────────────────────────────────────

export function OnboardingPage() {
  const { profile: existingProfile, updateProfile } = useProfile()
  const { authState } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const intendedPath = (location.state as { intendedPath?: string } | null)?.intendedPath ?? null

  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [showWelcome, setShowWelcome] = useState(true)
  const [step, setStep] = useState(0)
  const [position, setPosition] = useState<PositionValue | null>(null)
  const [trainingLevel, setTrainingLevel] = useState<TrainingLevel | null>(null)
  const ageBand = 'adult' as const
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [hasGymAccess, setHasGymAccess] = useState<boolean | null>(null)
  const [seasonMode, setSeasonMode] = useState<SeasonMode>('in_season')
  const [sessions, setSessions] = useState<2 | 3 | null>(null)
  const [equipment, setEquipment] = useState<Set<Equipment>>(new Set())
  const [clubDays, setClubDays] = useState<Set<DayOfWeek>>(new Set())
  const [clubDayTimes, setClubDayTimes] = useState<Record<number, string>>({})
  const [matchDay, setMatchDay] = useState<DayOfWeek | null | undefined>(undefined)
  const [gymMode, setGymMode] = useState<'auto' | 'manual'>('auto')
  const [manualGymDays, setManualGymDays] = useState<Set<DayOfWeek>>(new Set())
  const [scSchedule, setScSchedule] = useState<SCSchedule | undefined>(undefined)
  const [heightCm, setHeightCm] = useState<string>('')
  const [weightKg, setWeightKg] = useState<string>('')
  // betaCapReached removed — the annual engine supports all profiles now

  const STEPS = ['Position', 'Profil', 'Équipement', 'Planning', 'Morphologie', 'Résumé']
  const progress = (step / (STEPS.length - 1)) * 100

  const toggleEquipment = (eq: Equipment) => {
    setEquipment((prev) => {
      const next = new Set(prev)
      if (next.has(eq)) { next.delete(eq) } else { next.add(eq) }
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
    if (step === 1) {
      if (!trainingLevel || !sessions) return false
      return true
    }
    if (step === 2) return hasGymAccess !== null
    // Morphologie optionnelle
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

  const handleFinish = async () => {
    try {
      const clubSchedule = buildClubSchedule()
      const levelDef = TRAINING_LEVELS.find((l) => l.value === trainingLevel)!
      const finalEquipment = equipment.size > 0 ? Array.from(equipment) : ['none' as Equipment]
      const derivedPopulationSegment: PopulationSegment =
        gender === 'female' ? 'female_senior' : 'male_senior'
      const profilePayload = {
        position: position!,
        rugbyPosition: position!,
        level: levelDef.legacyLevel,
        trainingLevel: trainingLevel!,
        // Dual-write: seasonMode (compatibility) + onboardingCycleHint (source of truth)
        seasonMode,
        planningAnchors: { ...(existingProfile?.planningAnchors ?? {}), onboardingCycleHint: seasonMode },
        performanceFocus: 'balanced' as const,
        weeklySessions: sessions!,
        equipment: finalEquipment,
        heightCm: validHeight ? parsedHeight : undefined,
        weightKg: validWeight ? parsedWeight : undefined,
        clubSchedule,
        scSchedule,
        ageBand,
        populationSegment: derivedPopulationSegment,
      }
      updateProfile(profilePayload, { source: 'onboarding' })

      // Semaine initiale selon le mode saison : off_season → H1, sinon W1
      const initialWeek = seasonMode === 'off_season' ? 'H1' : 'W1'
      window.localStorage.setItem('rugbyprep.week.v1', initialWeek)

      // ── Tous les profils passent maintenant — le moteur annuel gère tout ──
      if (userId) markOnboardingComplete(userId)
      posthog.capture('onboarding_completed', {
        position, trainingLevel, seasonMode, ageBand, gender,
        populationSegment: derivedPopulationSegment,
        performanceFocus: 'balanced',
        sessions,
        eligible: true,
      })

      const destination = resolvePostOnboardingDestination(intendedPath)
      navigate(destination, { replace: true })
    } catch (err) {
      console.error('[Onboarding] handleFinish error:', err)
      alert('Une erreur est survenue. Vérifie ta connexion et réessaie.')
    }
  }

  // Moteur annuel gère tous les profils — pas de guard beta/eligibility

  // ─── Écran de bienvenue ───────────────────────────────────────

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-app flex flex-col justify-center px-6 relative overflow-hidden">
        {/* Dot grid déco */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />
        {/* Orbe déco */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand opacity-10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

        <div className="max-w-sm mx-auto w-full space-y-10 py-12 relative">

          {/* Wordmark */}
          <div className="space-y-4">
            <RugbyForgeLogo size="hero" />
            <p className="text-2xl font-black text-fg leading-tight tracking-tight">
              Ton coach physique rugby
            </p>
            <p className="text-fg-soft text-sm leading-relaxed">
              Programme personnalisé, suivi de charge, coach IA — tout ce qu'il faut pour performer sur le terrain.
            </p>
          </div>

          {/* 3 bénéfices */}
          <div className="space-y-4">
            {[
              {
                icon: <TrendingUp className="w-5 h-5 text-brand-tint" />,
                bg: 'bg-layer-5 border border-border-app',
                title: 'Programme adapté à ton poste',
                desc: 'Pilier, flanker, arrière — chaque position a ses exigences physiques.',
              },
              {
                icon: <Calendar className="w-5 h-5 text-brand-tint" />,
                bg: 'bg-layer-5 border border-border-app',
                title: 'Synchronisé avec ton club',
                desc: 'Séances S&C placées intelligemment entre entraînements et matchs.',
              },
              {
                icon: <Bot className="w-5 h-5 text-brand-tint" />,
                bg: 'bg-layer-5 border border-border-app',
                title: 'Coach IA disponible 24/7',
                desc: 'Nutrition, récupération, gestion de la fatigue.',
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-layer-5 border border-bd-muted">
                <div className="w-9 h-9 rounded-xl bg-layer-7 flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-fg leading-snug">{item.title}</p>
                  <p className="text-xs text-fg-soft mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => setShowWelcome(false)}
              className="w-full h-14 rounded-full bg-brand hover:bg-brand-hover text-on-brand font-bold flex items-center justify-center gap-2 transition-all shadow-brand-float active:scale-[.98] rf-focus-ring"
            >
              Créer mon programme
              <ChevronRight className="w-4 h-4" />
            </button>
            <p className="text-center text-fg-faint text-xs">Prend 2 minutes · Gratuit</p>
          </div>

        </div>
      </div>
    )
  }

  // ─── Formulaire multi-étapes ──────────────────────────────────

  return (
    <div className="min-h-screen bg-app font-sans flex flex-col relative overflow-hidden">
      {/* Dot grid déco */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* Barre de progression */}
      <div className="h-0.5 bg-layer-10 w-full relative">
        <div
          className="h-full bg-brand transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <header className="px-5 py-3 flex items-center gap-2 bg-app/95 backdrop-blur sticky top-0 z-10 relative">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="w-9 h-9 -ml-1 rounded-xl flex items-center justify-center text-fg-soft hover:bg-layer-10 transition-colors rf-focus-ring"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}
        <div className="flex-1 text-center">
          <p className="text-[10px] font-black tracking-widest text-brand-tint uppercase italic">RugbyForge</p>
        </div>
        <div className="w-9 text-right">
          <span className="text-[11px] font-bold text-fg-muted">{step + 1}/{STEPS.length}</span>
        </div>
      </header>

      {/* Contenu */}
      <main className="flex-1 px-5 pt-4 pb-36 max-w-md mx-auto w-full space-y-7 relative">

        {/* ── Step 0 : Position ── */}
        {step === 0 && (
          <div className="space-y-6">
            <StepTitle title="Tu joues où ?" sub="Ton programme est calibré selon ton poste." />
            <div className="grid grid-cols-2 gap-2.5">
              {POSITIONS.map((pos) => {
                const selected = position === pos.value
                return (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={() => setPosition(pos.value)}
                    className={`relative flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all active:scale-[.97] ${
                      selected
                        ? 'border-brand bg-brand-soft'
                        : 'border-border-app bg-layer-5 hover:border-border-dashed-app'
                    }`}
                  >
                    {selected && (
                      <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-brand flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-on-brand" strokeWidth={3} />
                      </span>
                    )}
                    <span className="text-2xl leading-none">{pos.emoji}</span>
                    <div>
                      <p className={`text-sm font-black leading-tight ${selected ? 'text-brand-tint' : 'text-fg'}`}>
                        {pos.label}
                      </p>
                      <p className="text-[10px] text-fg-muted mt-0.5 leading-tight">{pos.sub}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Step 1 : Niveau + Séances ── */}
        {step === 1 && (
          <div className="space-y-7">
            <StepTitle title="Ton profil" sub="Pour calibrer les charges et les volumes." />

            {/* Niveau */}
            <div className="space-y-3">
              <SectionLabel>Niveau en salle</SectionLabel>
              <div className="space-y-2.5">
                {TRAINING_LEVELS.map((opt) => {
                  const selected = trainingLevel === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTrainingLevel(opt.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all active:scale-[.98] ${
                        selected
                          ? 'border-brand bg-brand-soft'
                          : 'border-border-app bg-layer-5 hover:border-border-dashed-app'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-black ${selected ? 'text-brand-tint' : 'text-fg'}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-fg-muted mt-0.5">{opt.sub}</p>
                        {selected && (
                          <p className="text-[10px] text-brand-muted mt-1 font-bold">{opt.details}</p>
                        )}
                      </div>
                      {selected && (
                        <CheckCircle2 className="w-5 h-5 text-brand-tint flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <SectionLabel>Où en es-tu ?</SectionLabel>
                <p className="text-[10px] text-fg-faint mt-0.5">Ton programme s'adaptera ensuite automatiquement à ton calendrier</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {CYCLE_HINTS.map((opt) => {
                  const selected = seasonMode === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSeasonMode(opt.value)}
                      className={`flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-2xl border-2 text-center transition-all active:scale-[.97] ${
                        selected
                          ? 'border-brand bg-brand-soft'
                          : 'border-border-app bg-layer-5 hover:border-border-dashed-app'
                      }`}
                    >
                      <span className="text-xl leading-none">{opt.emoji}</span>
                      <span className={`text-[10px] font-black leading-tight ${selected ? 'text-brand-tint' : 'text-fg-soft'}`}>
                        {opt.label}
                      </span>
                      <span className={`text-[9px] leading-tight ${selected ? 'text-brand-muted' : 'text-fg-faint'}`}>
                        {opt.sub}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Séances par semaine */}
            <div className="space-y-3">
              <SectionLabel>Séances par semaine</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { value: 2 as const, label: '2 séances', sub: 'Lundi + Jeudi' },
                  { value: 3 as const, label: '3 séances', sub: 'Lun + Mer + Ven' },
                ] as const).map((opt) => {
                  const selected = sessions === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSessions(opt.value)}
                      className={`flex flex-col items-start gap-1 p-4 rounded-2xl border-2 text-left transition-all active:scale-[.97] ${
                        selected
                          ? 'border-brand bg-brand-soft'
                          : 'border-border-app bg-layer-5 hover:border-border-dashed-app'
                      }`}
                    >
                      <p className={`text-sm font-black ${selected ? 'text-brand-tint' : 'text-fg'}`}>
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-fg-muted">{opt.sub}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* App réservée aux adultes — pas de sélecteur d'âge */}

            <div className="space-y-3">
              <SectionLabel>Profil</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { value: 'male' as const, label: 'Joueur' },
                  { value: 'female' as const, label: 'Joueuse' },
                ]).map((opt) => {
                  const selected = gender === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGender(opt.value)}
                      className={`flex flex-col items-start gap-1 p-4 rounded-2xl border-2 text-left transition-all active:scale-[.97] ${
                        selected
                          ? 'border-brand bg-brand-soft'
                          : 'border-border-app bg-layer-5 hover:border-border-dashed-app'
                      }`}
                    >
                      <p className={`text-sm font-black ${selected ? 'text-brand-tint' : 'text-fg'}`}>
                        {opt.label}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Consentement parental supprimé — app réservée aux adultes */}
          </div>
        )}

        {/* ── Step 2 : Équipement ── */}
        {step === 2 && (
          <div className="space-y-5">
            <StepTitle
              title="Ton équipement"
              sub="On adapte ton programme à ce que tu as."
            />

            {/* Question binaire salle */}
            <div className="space-y-3">
              <SectionLabel>As-tu accès à une salle de sport ?</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { value: true, label: 'Oui' },
                  { value: false, label: 'Non' },
                ] as const).map((opt) => {
                  const selected = hasGymAccess === opt.value
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => {
                        setHasGymAccess(opt.value)
                        if (opt.value) {
                          setEquipment(new Set(GYM_PRESET))
                        } else {
                          setEquipment(new Set())
                        }
                      }}
                      className={`flex flex-col items-center gap-1 py-4 rounded-2xl border-2 text-center transition-all active:scale-[.97] ${
                        selected
                          ? 'border-brand bg-brand-soft'
                          : 'border-border-app bg-layer-5 hover:border-border-dashed-app'
                      }`}
                    >
                      <p className={`text-sm font-black ${selected ? 'text-brand-tint' : 'text-fg'}`}>
                        {opt.label}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Salle : confirmation preset */}
            {hasGymAccess === true && (
              <div className="p-4 rounded-2xl bg-ok-bg-muted border border-ok-bd space-y-1">
                <p className="text-xs font-black text-ok-strong">Tout l&apos;équipement salle activé</p>
                <p className="text-[10px] text-fg-soft leading-relaxed">
                  Barre, haltères, machines, câbles, banc, etc. Si ta salle manque de matériel, tu pourras ajuster dans ton profil.
                </p>
              </div>
            )}

            {/* Pas de salle : checklist maison */}
            {hasGymAccess === false && (
              <div className="space-y-3">
                <SectionLabel>Matériel disponible</SectionLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  {HOME_EQUIPMENT_OPTIONS.map((eq) => {
                    const selected = equipment.has(eq.value)
                    return (
                      <button
                        key={eq.value}
                        type="button"
                        onClick={() => toggleEquipment(eq.value)}
                        className={`relative flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all active:scale-[.97] ${
                          selected
                            ? 'border-brand bg-brand-soft'
                            : 'border-border-app bg-layer-5 hover:border-border-dashed-app'
                        }`}
                      >
                        <span className="text-lg flex-shrink-0 leading-none">{eq.emoji}</span>
                        <span className={`text-sm font-bold leading-tight flex-1 ${selected ? 'text-brand-tint' : 'text-fg-secondary'}`}>
                          {eq.label}
                        </span>
                        {selected && (
                          <span className="w-4 h-4 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-on-brand" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEquipment(new Set())
                    setStep((s) => s + 1)
                  }}
                  className="w-full py-3 rounded-2xl border border-border-dashed-app text-sm font-bold text-fg-muted hover:border-layer-20 hover:text-fg-soft transition-all"
                >
                  Aucun — poids du corps
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3 : Planning club ── */}
        {step === 3 && (
          <div className="space-y-6">
            <StepTitle
              title="Ton planning club"
              sub="On adapte tes séances muscu à ton agenda. Optionnel."
            />

            {/* Jours club */}
            <div className="space-y-3">
              <SectionLabel>Jours d'entraînement club</SectionLabel>
              <div className="grid grid-cols-7 gap-1.5">
                {CLUB_DAYS_OPTIONS.map((opt) => {
                  const selected = clubDays.has(opt.day)
                  return (
                    <button
                      key={opt.day}
                      type="button"
                      onClick={() => {
                        setClubDays((prev) => {
                          const next = new Set(prev)
                          if (next.has(opt.day)) { next.delete(opt.day) } else { next.add(opt.day) }
                          return next
                        })
                      }}
                      className={`aspect-square flex flex-col items-center justify-center rounded-xl border-2 transition-all text-center active:scale-[.94] ${
                        selected
                          ? 'border-brand bg-brand-soft'
                          : 'border-border-app bg-layer-5 hover:border-border-dashed-app'
                      }`}
                    >
                      <span className={`text-[11px] font-black ${selected ? 'text-brand-tint' : 'text-fg-soft'}`}>
                        {opt.short}
                      </span>
                    </button>
                  )
                })}
              </div>
              {/* Horaires sous les jours sélectionnés */}
              {clubDays.size > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {CLUB_DAYS_OPTIONS.filter((opt) => clubDays.has(opt.day)).map((opt) => (
                    <div key={opt.day} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-fg-soft w-8 flex-shrink-0">{opt.label.slice(0, 3)}</span>
                      <input
                        type="time"
                        value={clubDayTimes[opt.day] ?? ''}
                        onChange={(e) => setClubDayTimes((prev) => ({ ...prev, [opt.day]: e.target.value }))}
                        className="flex-1 text-xs rounded-xl border-2 border-border-app bg-layer-5 px-2 py-1.5 text-fg-secondary focus:outline-none focus:border-brand transition-colors rf-focus-ring"
                        placeholder="HH:MM"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Jour de match */}
            <div className="space-y-3">
              <SectionLabel>Jour de match habituel</SectionLabel>
              <div className="flex gap-2">
                {MATCH_DAY_OPTIONS.map((opt) => (
                  <button
                    key={String(opt.day)}
                    type="button"
                    onClick={() => setMatchDay(opt.day)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black border-2 transition-all active:scale-[.97] ${
                      matchDay === opt.day
                        ? 'border-brand bg-brand-soft text-brand-tint'
                        : 'border-border-app bg-layer-5 text-fg-soft hover:border-border-dashed-app'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Séances muscu — si jours club sélectionnés */}
            {clubDays.size > 0 && sessions !== null && (
              <div className="space-y-3 pt-4 border-t border-border-app">
                <div className="flex items-center justify-between">
                  <SectionLabel>Séances muscu</SectionLabel>
                  <div className="flex gap-1 bg-layer-10 rounded-xl p-0.5">
                    {(['auto', 'manual'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          if (mode === 'manual' && manualGymDays.size === 0) {
                            const cs: ClubSchedule = {
                              clubDays: Array.from(clubDays).map((d) => ({ day: d })),
                              matchDay: matchDay ?? undefined,
                            }
                            const auto = computeSCSchedule(cs, sessions)
                            setManualGymDays(new Set(auto.sessions.map((s) => s.day)))
                          }
                          setGymMode(mode)
                        }}
                        className={`px-3 py-1 rounded-[10px] text-[10px] font-black transition-all ${
                          gymMode === mode ? 'bg-layer-20 text-fg shadow-sm' : 'text-fg-muted'
                        }`}
                      >
                        {mode === 'auto' ? 'Auto' : 'Manuel'}
                      </button>
                    ))}
                  </div>
                </div>

                {gymMode === 'auto' && (
                  <div className="p-3.5 rounded-2xl bg-ok-bg-muted border border-ok-bd">
                    <p className="text-[10px] font-black text-ok-strong uppercase tracking-wide mb-1">
                      Suggestion calculée
                    </p>
                    <p className="text-sm font-black text-fg">
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
                    <p className="text-[10px] text-fg-muted mt-1">
                      Basé sur tes entraînements club et les règles de récupération
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
          </div>
        )}

        {/* ── Step 4 : Morphologie ── */}
        {step === 4 && (
          <div className="space-y-6">
            <StepTitle
              title="Ta morphologie"
              sub="Optionnel — utilisé pour les baselines 1RM et l'IMC rugby."
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-fg-muted uppercase tracking-wide">
                  Taille (cm)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={140}
                  max={230}
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="182"
                  className="w-full h-14 rounded-2xl border-2 border-border-app bg-layer-5 px-4 text-xl font-black text-fg placeholder:text-fg-ghost focus:outline-none focus:border-brand transition-colors rf-focus-ring"
                />
                {heightCm && !validHeight && (
                  <p className="text-[11px] text-danger">Entre 140 et 230 cm</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-fg-muted uppercase tracking-wide">
                  Poids (kg)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={40}
                  max={200}
                  step={0.5}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="95"
                  className="w-full h-14 rounded-2xl border-2 border-border-app bg-layer-5 px-4 text-xl font-black text-fg placeholder:text-fg-ghost focus:outline-none focus:border-brand transition-colors rf-focus-ring"
                />
                {weightKg && !validWeight && (
                  <p className="text-[11px] text-danger">Entre 40 et 200 kg</p>
                )}
              </div>
            </div>

            {bmi && (
              <div className="bg-layer-5 border border-border-app rounded-2xl p-5 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-fg leading-none">{bmi.toFixed(1)}</span>
                  <span className="text-xs font-bold text-fg-muted uppercase tracking-wide">IMC</span>
                </div>
                <p className="text-sm font-bold text-fg-emphasis">{bmiLabel(bmi, position)}</p>
                <p className="text-[11px] text-fg-muted mt-1 leading-relaxed">
                  L'IMC seul ne reflète pas la masse musculaire — indicateur de gabarit uniquement.
                </p>
              </div>
            )}

            {(!validHeight || !validWeight) && (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="w-full py-3 rounded-2xl border border-border-dashed-app text-sm font-bold text-fg-muted hover:border-layer-20 hover:text-fg-soft transition-all"
              >
                Passer cette étape
              </button>
            )}
          </div>
        )}

        {/* ── Step 5 : Résumé ── */}
        {step === 5 && (
          <div className="space-y-6">
            <StepTitle
              title="C'est parti !"
              sub="Voici ton profil. Tu pourras le modifier à tout moment dans les réglages."
            />

            <div className="bg-layer-5 border border-border-app rounded-[1.75rem] overflow-hidden divide-y divide-border-app">
              <SummaryRow label="Poste" value={POSITIONS.find((p) => p.value === position)?.label ?? '–'} />
              <SummaryRow label="Niveau" value={TRAINING_LEVELS.find((l) => l.value === trainingLevel)?.label ?? '–'} />
              <SummaryRow label="Période" value={CYCLE_HINTS.find((m) => m.value === seasonMode)?.label ?? '–'} />
              <SummaryRow label="Séances" value={`${sessions} / semaine`} />
              {/* Consentement U18 supprimé — app réservée aux adultes */}
              <SummaryRow
                label="Équipement"
                value={
                  hasGymAccess === true
                    ? 'Salle standard'
                    : equipment.size > 0
                      ? Array.from(equipment)
                          .map((eq) => [...HOME_EQUIPMENT_OPTIONS, ...EQUIPMENT_OPTIONS].find((o) => o.value === eq)?.label ?? eq)
                          .join(', ')
                      : 'Poids du corps'
                }
              />
              {scSchedule && scSchedule.sessions.length > 0 && (
                <SummaryRow
                  label="Muscu"
                  value={scSchedule.sessions.map((s) => DAY_LABELS[s.day]).join(' · ')}
                />
              )}
              {validHeight && validWeight && bmi && (
                <div className="px-5 py-4 flex items-start gap-4">
                  <span className="text-xs font-black text-fg-muted uppercase tracking-wide w-24 flex-shrink-0 pt-0.5">
                    Morpho
                  </span>
                  <span className="text-sm font-bold text-fg-muted leading-relaxed flex-1">
                    {parsedHeight} cm · {parsedWeight} kg · IMC {bmi.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleFinish}
              data-testid="onboarding-finish-btn"
              className="w-full h-14 rounded-full bg-brand hover:bg-brand-hover text-on-brand font-bold flex items-center justify-center gap-2 transition-all shadow-brand-float active:scale-[.98] rf-focus-ring"
            >
              <CheckCircle2 className="w-5 h-5" />
              Voir mon programme
            </button>
          </div>
        )}

      </main>

      {/* ── CTA flottant principal (steps 0, 1, 2, 4) ── */}
      {step !== 3 && step !== 5 && (
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-5 bg-gradient-to-t from-app via-app/95 to-transparent pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="w-full h-14 rounded-full bg-brand hover:bg-brand-hover disabled:opacity-30 disabled:cursor-not-allowed text-on-brand font-bold flex items-center justify-center gap-2 transition-all shadow-brand-float active:scale-[.98] rf-focus-ring"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── CTA step 3 : Planning ── */}
      {step === 3 && (
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-5 bg-gradient-to-t from-app via-app/95 to-transparent pointer-events-none">
          <div className="max-w-md mx-auto space-y-2 pointer-events-auto">
            <button
              type="button"
              onClick={handleClubScheduleNext}
              className="w-full h-14 rounded-full bg-brand hover:bg-brand-hover text-on-brand font-bold flex items-center justify-center gap-2 transition-all shadow-brand-float active:scale-[.98] rf-focus-ring"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="w-full py-2.5 rounded-2xl text-sm font-bold text-fg-muted hover:text-fg-soft transition-colors text-center"
            >
              Pas d'entraînement club — passer
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── SummaryRow ───────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-4 flex items-start gap-4">
      <span className="text-xs font-black text-fg-muted uppercase tracking-wide w-24 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm font-bold text-fg-secondary leading-relaxed flex-1">{value}</span>
    </div>
  )
}
