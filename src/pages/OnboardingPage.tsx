import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, CheckCircle2,
  TrendingUp, Bot, Calendar, Check,
} from 'lucide-react'
import { RugbyForgeLogo } from '../components/RugbyForgeLogo'
import { useProfile, markOnboardingComplete } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { posthog } from '../services/analytics/posthog'
import { supabase } from '../services/supabase/client'
import type {
  UserProfile,
  Equipment,
  Contra,
  DayOfWeek,
  ClubSchedule,
  SCSchedule,
  TrainingLevel,
  SeasonMode,
  PopulationSegment,
  AgeBand,
  PerformanceFocus,
} from '../types/training'
import { computeSCSchedule, buildManualSCSchedule } from '../services/program/scheduleOptimizer'
import { GymDaySelector } from '../components/GymDaySelector'
import { checkBetaEligibility, BETA_ELIGIBILITY_MESSAGES } from '../services/betaEligibility'

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

const ALL_EQUIPMENT_VALUES: Equipment[] = EQUIPMENT_OPTIONS.map((o) => o.value)

const INJURY_OPTIONS: { value: Contra; label: string }[] = [
  { value: 'shoulder_pain', label: 'Épaule' },
  { value: 'knee_pain',     label: 'Genou' },
  { value: 'low_back_pain', label: 'Bas du dos' },
  { value: 'neck_pain',     label: 'Nuque' },
  { value: 'elbow_pain',    label: 'Coude' },
  { value: 'wrist_pain',    label: 'Poignet' },
  { value: 'groin_pain',    label: 'Aine' },
  { value: 'ankle_pain',    label: 'Cheville' },
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
    label: 'Débutant',
    sub: 'Je découvre la musculation',
    details: 'Poids du corps & élastiques — progression simple',
    legacyLevel: 'beginner',
  },
  {
    value: 'builder',
    label: 'Intermédiaire',
    sub: "J'ai une base, je veux progresser",
    details: 'Haltères & supersets — séances optimisées',
    legacyLevel: 'intermediate',
  },
  {
    value: 'performance',
    label: 'Avancé',
    sub: 'Je cherche la performance maximale',
    details: 'Barre + blocs de contraste — transfert rugby direct',
    legacyLevel: 'intermediate',
  },
]

const SEASON_MODES: { value: SeasonMode; label: string; sub: string; emoji: string }[] = [
  { value: 'in_season',  label: 'Saison',       sub: 'Force → Puissance',           emoji: '⚡' },
  { value: 'off_season', label: 'Inter-saison',  sub: 'Hypertrophie',                emoji: '🌿' },
  { value: 'pre_season', label: 'Pré-saison',    sub: 'Réathlétisation',             emoji: '🔥' },
]

const PERFORMANCE_FOCUS_OPTIONS: { value: PerformanceFocus; label: string; sub: string }[] = [
  { value: 'balanced', label: 'Équilibré', sub: 'Force + puissance + conditionnement' },
  { value: 'speed', label: 'Vitesse', sub: 'Pré-saison: priorité sprint / accélération' },
  { value: 'strength', label: 'Force', sub: 'Priorité charges et robustesse contact' },
]

const AGE_BAND_OPTIONS: { value: AgeBand; label: string; sub: string }[] = [
  { value: 'adult', label: 'Senior (18+)', sub: 'Autonomie complète' },
  { value: 'u18', label: 'U18', sub: 'Garde-fous mineurs activés' },
]

const POPULATION_OPTIONS: { value: PopulationSegment; label: string; sub: string; ageBand: AgeBand }[] = [
  { value: 'male_senior', label: 'Homme senior', sub: '18+ masculin', ageBand: 'adult' },
  { value: 'female_senior', label: 'Femme senior', sub: '18+ féminin', ageBand: 'adult' },
  { value: 'u18_male', label: 'Garçon U18', sub: 'Mineur masculin', ageBand: 'u18' },
  { value: 'u18_female', label: 'Fille U18', sub: 'Mineure féminine', ageBand: 'u18' },
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
      <h1 className="text-2xl font-black tracking-tight text-white">{title}</h1>
      <p className="text-sm text-white/50 leading-relaxed">{sub}</p>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black text-white/40 uppercase tracking-widest">{children}</p>
  )
}

// ─── Component ────────────────────────────────────────────────

export function OnboardingPage() {
  const { updateProfile } = useProfile()
  const { authState } = useAuth()
  const navigate = useNavigate()

  const userId = authState.status === 'authenticated' ? authState.user?.id ?? null : null

  const [showWelcome, setShowWelcome] = useState(true)
  const [step, setStep] = useState(0)
  const [position, setPosition] = useState<PositionValue | null>(null)
  const [trainingLevel, setTrainingLevel] = useState<TrainingLevel | null>(null)
  const [performanceFocus, setPerformanceFocus] = useState<PerformanceFocus>('balanced')
  const [ageBand, setAgeBand] = useState<AgeBand>('adult')
  const [populationSegment, setPopulationSegment] = useState<PopulationSegment>('male_senior')
  const [parentalConsentHealthData, setParentalConsentHealthData] = useState<boolean | null>(null)
  const [seasonMode, setSeasonMode] = useState<SeasonMode>('in_season')
  const [sessions, setSessions] = useState<2 | 3 | null>(null)
  const [equipment, setEquipment] = useState<Set<Equipment>>(new Set())
  const [clubDays, setClubDays] = useState<Set<DayOfWeek>>(new Set())
  const [clubDayTimes, setClubDayTimes] = useState<Record<number, string>>({})
  const [matchDay, setMatchDay] = useState<DayOfWeek | null | undefined>(undefined)
  const [gymMode, setGymMode] = useState<'auto' | 'manual'>('auto')
  const [manualGymDays, setManualGymDays] = useState<Set<DayOfWeek>>(new Set())
  const [scSchedule, setScSchedule] = useState<SCSchedule | undefined>(undefined)
  const [injuries, setInjuries] = useState<Set<Contra>>(new Set())
  const [heightCm, setHeightCm] = useState<string>('')
  const [weightKg, setWeightKg] = useState<string>('')
  const [betaCapReached, setBetaCapReached] = useState(false)

  const STEPS = ['Position', 'Profil', 'Équipement', 'Planning', 'Inconforts', 'Morphologie', 'Résumé']
  const progress = (step / (STEPS.length - 1)) * 100

  const toggleEquipment = (eq: Equipment) => {
    setEquipment((prev) => {
      const next = new Set(prev)
      if (next.has(eq)) { next.delete(eq) } else { next.add(eq) }
      return next
    })
  }

  const toggleInjury = (inj: Contra) => {
    setInjuries((prev) => {
      const next = new Set(prev)
      if (next.has(inj)) { next.delete(inj) } else { next.add(inj) }
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
      if (ageBand === 'u18' && parentalConsentHealthData === null) return false
      return true
    }
    // Équipement et morphologie sont optionnels
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
    const clubSchedule = buildClubSchedule()
    const levelDef = TRAINING_LEVELS.find((l) => l.value === trainingLevel)!
    const finalEquipment = equipment.size > 0 ? Array.from(equipment) : ['none' as Equipment]
    const profilePayload = {
      position: position!,
      rugbyPosition: position!,
      level: levelDef.legacyLevel,
      trainingLevel: trainingLevel!,
      seasonMode,
      performanceFocus: trainingLevel === 'performance' ? performanceFocus : 'balanced',
      weeklySessions: sessions!,
      equipment: finalEquipment,
      injuries: Array.from(injuries),
      heightCm: validHeight ? parsedHeight : undefined,
      weightKg: validWeight ? parsedWeight : undefined,
      clubSchedule,
      scSchedule,
      ageBand,
      populationSegment,
      parentalConsentHealthData: ageBand === 'u18' ? parentalConsentHealthData === true : false,
    }
    updateProfile(profilePayload, { source: 'onboarding' })

    // Semaine initiale selon le mode saison : off_season → H1, sinon W1
    const initialWeek = seasonMode === 'off_season' ? 'H1' : 'W1'
    window.localStorage.setItem('rugbyprep.week.v1', initialWeek)

    // ── Profil inéligible : on sauve le profil mais on ne consomme PAS de slot beta ──
    // L'utilisateur peut accéder à son espace mais le guard bloquera l'accès programme.
    if (!onboardingEligibility.isEligible) {
      posthog.capture('onboarding_completed', {
        position, trainingLevel, seasonMode, ageBand, populationSegment,
        performanceFocus: trainingLevel === 'performance' ? performanceFocus : 'balanced',
        sessions, eligible: false,
        parentalConsentHealthData: ageBand === 'u18' ? parentalConsentHealthData === true : false,
      })
      navigate('/week', { replace: true })
      return
    }

    // ── Cap technique beta : vérifier qu'il reste des places ──────────────
    const BETA_CAP = 100
    try {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('onboarding_complete', true)
      if (count != null && count >= BETA_CAP) {
        setBetaCapReached(true)
        posthog.capture('beta_cap_reached', { count })
        return
      }
    } catch {
      // Fail-open : en cas d'erreur réseau, on laisse passer. Le PO surveille le dashboard.
    }

    if (userId) markOnboardingComplete(userId)
    posthog.capture('onboarding_completed', {
      position, trainingLevel, seasonMode, ageBand, populationSegment,
      performanceFocus: trainingLevel === 'performance' ? performanceFocus : 'balanced',
      sessions, eligible: true,
      parentalConsentHealthData: ageBand === 'u18' ? parentalConsentHealthData === true : false,
    })
    navigate('/week', { replace: true })
  }

  // ─── Éligibilité beta self-serve (calculée dans le corps du composant) ───────
  // ⚠️ Ces const DOIVENT être ici (corps composant), jamais dans une expression JSX {}.
  // Résultat utilisé uniquement au step 6 — calcul cheap, pas besoin de useMemo.
  const onboardingProfileSnap: UserProfile = {
    // `level` n'est pas utilisé par checkBetaEligibility — valeur arbitraire pour satisfaire le type.
    level: 'beginner',
    weeklySessions: sessions ?? 2,
    equipment: equipment.size > 0 ? Array.from(equipment) : ['none' as Equipment],
    injuries: Array.from(injuries),
    // seasonMode du snap onboarding. Règle conservative : seul 'in_season' passe le guard.
    // En onboarding, ageBand defaults à 'adult' et seasonMode defaults à 'in_season' (L192/L193).
    // seasonMode absent dans le snap = 'off_season' traitée comme hors périmètre par checkBetaEligibility.
    seasonMode,
    ageBand,
    // parentalConsentHealthData null (défaut) → false via `=== true`. Consentement non donné = non-consentant.
    parentalConsentHealthData: parentalConsentHealthData === true,
    // `rehabInjury` intentionnellement absent : l'onboarding n'a pas de step rehab.
    // REHAB_ACTIVE ne peut pas se déclencher ici. Si un step rehab est ajouté, mettre à jour ce snap.
  }
  const onboardingEligibility = checkBetaEligibility(onboardingProfileSnap)

  // ─── Écran de bienvenue ───────────────────────────────────────

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-[#1a100c] flex flex-col justify-center px-6 relative overflow-hidden">
        {/* Dot grid déco */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#ff6b35_1px,transparent_1px)] [background-size:20px_20px]" />
        {/* Orbe déco */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#1a5f3f] opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#ff6b35] opacity-10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

        <div className="max-w-sm mx-auto w-full space-y-10 py-12 relative">

          {/* Wordmark */}
          <div className="space-y-4">
            <RugbyForgeLogo size="hero" />
            <p className="text-2xl font-black text-white leading-tight tracking-tight">
              Ton coach physique rugby
            </p>
            <p className="text-white/50 text-sm leading-relaxed">
              Programme personnalisé, suivi de charge, coach IA — tout ce qu'il faut pour performer sur le terrain.
            </p>
          </div>

          {/* 3 bénéfices */}
          <div className="space-y-4">
            {[
              {
                icon: <TrendingUp className="w-5 h-5 text-[#ff6b35]" />,
                bg: 'bg-white/5 border border-white/10',
                title: 'Programme adapté à ton poste',
                desc: 'Pilier, flanker, arrière — chaque position a ses exigences physiques.',
              },
              {
                icon: <Calendar className="w-5 h-5 text-[#ff6b35]" />,
                bg: 'bg-white/5 border border-white/10',
                title: 'Synchronisé avec ton club',
                desc: 'Séances S&C placées intelligemment entre entraînements et matchs.',
              },
              {
                icon: <Bot className="w-5 h-5 text-[#ff6b35]" />,
                bg: 'bg-white/5 border border-white/10',
                title: 'Coach IA disponible 24/7',
                desc: 'Nutrition, récupération, gestion de la fatigue.',
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/8">
                <div className="w-9 h-9 rounded-xl bg-white/8 flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-snug">{item.title}</p>
                  <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => setShowWelcome(false)}
              className="w-full h-14 rounded-full bg-[#ff6b35] hover:bg-[#e55a2b] text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#ff6b35]/20 active:scale-[.98]"
            >
              Créer mon programme
              <ChevronRight className="w-4 h-4" />
            </button>
            <p className="text-center text-white/35 text-xs">Prend 2 minutes · Gratuit</p>
          </div>

        </div>
      </div>
    )
  }

  // ─── Formulaire multi-étapes ──────────────────────────────────

  return (
    <div className="min-h-screen bg-[#1a100c] font-sans flex flex-col relative overflow-hidden">
      {/* Dot grid déco */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(#ff6b35_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* Barre de progression */}
      <div className="h-0.5 bg-white/10 w-full relative">
        <div
          className="h-full bg-[#ff6b35] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <header className="px-5 py-3 flex items-center gap-2 bg-[#1a100c]/95 backdrop-blur sticky top-0 z-10 relative">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="w-9 h-9 -ml-1 rounded-xl flex items-center justify-center text-white/50 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}
        <div className="flex-1 text-center">
          <p className="text-[10px] font-black tracking-widest text-[#ff6b35] uppercase italic">RugbyForge</p>
        </div>
        <div className="w-9 text-right">
          <span className="text-[11px] font-bold text-white/40">{step + 1}/{STEPS.length}</span>
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
                        ? 'border-[#ff6b35] bg-[#ff6b35]/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    {selected && (
                      <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#ff6b35] flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </span>
                    )}
                    <span className="text-2xl leading-none">{pos.emoji}</span>
                    <div>
                      <p className={`text-sm font-black leading-tight ${selected ? 'text-[#ff6b35]' : 'text-white'}`}>
                        {pos.label}
                      </p>
                      <p className="text-[10px] text-white/40 mt-0.5 leading-tight">{pos.sub}</p>
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
                      onClick={() => {
                        setTrainingLevel(opt.value)
                        if (opt.value === 'starter') {
                          setSeasonMode('in_season')
                          setSessions(2)
                          setPerformanceFocus('balanced')
                        }
                      }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all active:scale-[.98] ${
                        selected
                          ? 'border-[#ff6b35] bg-[#ff6b35]/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-black ${selected ? 'text-[#ff6b35]' : 'text-white'}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-white/40 mt-0.5">{opt.sub}</p>
                        {selected && (
                          <p className="text-[10px] text-[#ff6b35]/70 mt-1 font-bold">{opt.details}</p>
                        )}
                      </div>
                      {selected && (
                        <CheckCircle2 className="w-5 h-5 text-[#ff6b35] flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Période de saison — masquée pour les starters */}
            {trainingLevel !== 'starter' && (
              <div className="space-y-3">
                <div>
                  <SectionLabel>Période de saison</SectionLabel>
                  <p className="text-[10px] text-white/30 mt-0.5">Impacte le type de programme généré</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {SEASON_MODES.map((opt) => {
                    const selected = seasonMode === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSeasonMode(opt.value)}
                        className={`flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-2xl border-2 text-center transition-all active:scale-[.97] ${
                          selected
                            ? 'border-[#ff6b35] bg-[#ff6b35]/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <span className="text-xl leading-none">{opt.emoji}</span>
                        <span className={`text-[10px] font-black leading-tight ${selected ? 'text-[#ff6b35]' : 'text-white/60'}`}>
                          {opt.label}
                        </span>
                        <span className={`text-[9px] leading-tight ${selected ? 'text-[#ff6b35]/60' : 'text-white/30'}`}>
                          {opt.sub}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {trainingLevel === 'performance' && (
              <div className="space-y-3">
                <div>
                  <SectionLabel>Orientation performance</SectionLabel>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    La séance vitesse dédiée est activée en pré-saison avec focus vitesse.
                  </p>
                </div>
                <div className="space-y-2">
                  {PERFORMANCE_FOCUS_OPTIONS.map((opt) => {
                    const selected = performanceFocus === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPerformanceFocus(opt.value)}
                        className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl border-2 text-left transition-all active:scale-[.98] ${
                          selected
                            ? 'border-[#ff6b35] bg-[#ff6b35]/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div>
                          <p className={`text-xs font-black ${selected ? 'text-[#ff6b35]' : 'text-white/70'}`}>
                            {opt.label}
                          </p>
                          <p className="text-[10px] text-white/35 mt-0.5">{opt.sub}</p>
                        </div>
                        {selected && <CheckCircle2 className="w-4 h-4 text-[#ff6b35] flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Séances par semaine */}
            <div className="space-y-3">
              <SectionLabel>Séances par semaine</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { value: 2 as const, label: '2 séances', sub: 'Lundi + Jeudi' },
                  { value: 3 as const, label: '3 séances', sub: 'Lun + Mer + Ven' },
                ] as const).map((opt) => {
                  const selected = sessions === opt.value
                  const isStarter = trainingLevel === 'starter'
                  const disabled = isStarter && opt.value === 3
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSessions(opt.value)}
                      className={`flex flex-col items-start gap-1 p-4 rounded-2xl border-2 text-left transition-all active:scale-[.97] ${
                        selected
                          ? 'border-[#ff6b35] bg-[#ff6b35]/10'
                          : disabled
                            ? 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <p className={`text-sm font-black ${selected ? 'text-[#ff6b35]' : 'text-white'}`}>
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-white/40">{opt.sub}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <SectionLabel>Catégorie d'âge</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {AGE_BAND_OPTIONS.map((opt) => {
                  const selected = ageBand === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setAgeBand(opt.value)
                        if (opt.value === 'u18') {
                          if (populationSegment !== 'u18_female' && populationSegment !== 'u18_male') {
                            setPopulationSegment('u18_male')
                          }
                          setParentalConsentHealthData(null)
                        } else {
                          if (populationSegment !== 'male_senior' && populationSegment !== 'female_senior') {
                            setPopulationSegment('male_senior')
                          }
                          setParentalConsentHealthData(false)
                        }
                      }}
                      className={`flex flex-col items-start gap-1 p-4 rounded-2xl border-2 text-left transition-all active:scale-[.97] ${
                        selected
                          ? 'border-[#ff6b35] bg-[#ff6b35]/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <p className={`text-sm font-black ${selected ? 'text-[#ff6b35]' : 'text-white'}`}>
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-white/40">{opt.sub}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <SectionLabel>Population ciblée</SectionLabel>
              <div className="grid grid-cols-1 gap-2.5">
                {POPULATION_OPTIONS.filter((opt) => opt.ageBand === ageBand).map((opt) => {
                  const selected = populationSegment === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPopulationSegment(opt.value)}
                      className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl border-2 text-left transition-all active:scale-[.98] ${
                        selected
                          ? 'border-[#ff6b35] bg-[#ff6b35]/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div>
                        <p className={`text-sm font-black ${selected ? 'text-[#ff6b35]' : 'text-white'}`}>
                          {opt.label}
                        </p>
                        <p className="text-[10px] text-white/40 mt-0.5">{opt.sub}</p>
                      </div>
                      {selected && <CheckCircle2 className="w-5 h-5 text-[#ff6b35] flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {ageBand === 'u18' && (
              <div className="space-y-3">
                <SectionLabel>Consentement parental données santé</SectionLabel>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setParentalConsentHealthData(true)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all ${
                      parentalConsentHealthData === true
                        ? 'border-[#1a5f3f] bg-[#1a5f3f]/15'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <p className={`text-xs font-black ${parentalConsentHealthData === true ? 'text-[#1a5f3f]' : 'text-white/70'}`}>
                      Consentement obtenu
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      Active les adaptations santé U18 et le suivi contextualisé.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setParentalConsentHealthData(false)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all ${
                      parentalConsentHealthData === false
                        ? 'border-amber-500/40 bg-amber-900/20'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <p className={`text-xs font-black ${parentalConsentHealthData === false ? 'text-amber-400' : 'text-white/70'}`}>
                      Pas de consentement pour le moment
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5">
                      Le moteur passera en mode sécurité minimal (mobilité/récupération).
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2 : Équipement ── */}
        {step === 2 && (
          <div className="space-y-5">
            <StepTitle
              title="Ton équipement"
              sub="Sélectionne ce à quoi tu as accès. Rien = poids du corps."
            />

            {/* Barre compteur + toggle all */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/40">
                {equipment.size === 0
                  ? 'Aucun sélectionné'
                  : `${equipment.size} sélectionné${equipment.size > 1 ? 's' : ''}`}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (equipment.size === ALL_EQUIPMENT_VALUES.length) {
                    setEquipment(new Set())
                  } else {
                    setEquipment(new Set(ALL_EQUIPMENT_VALUES))
                  }
                }}
                className="text-xs font-black text-[#ff6b35] hover:text-[#ff6b35]/80 transition-colors"
              >
                {equipment.size === ALL_EQUIPMENT_VALUES.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {EQUIPMENT_OPTIONS.map((eq) => {
                const selected = equipment.has(eq.value)
                return (
                  <button
                    key={eq.value}
                    type="button"
                    onClick={() => toggleEquipment(eq.value)}
                    className={`relative flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all active:scale-[.97] ${
                      selected
                        ? 'border-[#ff6b35] bg-[#ff6b35]/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <span className="text-lg flex-shrink-0 leading-none">{eq.emoji}</span>
                    <span className={`text-sm font-bold leading-tight flex-1 ${selected ? 'text-[#ff6b35]' : 'text-white/80'}`}>
                      {eq.label}
                    </span>
                    {selected && (
                      <span className="w-4 h-4 rounded-full bg-[#ff6b35] flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
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
                          ? 'border-[#ff6b35] bg-[#ff6b35]/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <span className={`text-[11px] font-black ${selected ? 'text-[#ff6b35]' : 'text-white/60'}`}>
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
                      <span className="text-xs font-bold text-white/50 w-8 flex-shrink-0">{opt.label.slice(0, 3)}</span>
                      <input
                        type="time"
                        value={clubDayTimes[opt.day] ?? ''}
                        onChange={(e) => setClubDayTimes((prev) => ({ ...prev, [opt.day]: e.target.value }))}
                        className="flex-1 text-xs rounded-xl border-2 border-white/10 bg-white/5 px-2 py-1.5 text-white/80 focus:outline-none focus:border-[#ff6b35] transition-colors [color-scheme:dark]"
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
                        ? 'border-[#ff6b35] bg-[#ff6b35]/10 text-[#ff6b35]'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Séances muscu — si jours club sélectionnés */}
            {clubDays.size > 0 && sessions !== null && (
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <SectionLabel>Séances muscu</SectionLabel>
                  <div className="flex gap-1 bg-white/10 rounded-xl p-0.5">
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
                          gymMode === mode ? 'bg-white/20 text-white shadow-sm' : 'text-white/40'
                        }`}
                      >
                        {mode === 'auto' ? 'Auto' : 'Manuel'}
                      </button>
                    ))}
                  </div>
                </div>

                {gymMode === 'auto' && (
                  <div className="p-3.5 rounded-2xl bg-[#1a5f3f]/15 border border-[#1a5f3f]/30">
                    <p className="text-[10px] font-black text-[#1a5f3f] uppercase tracking-wide mb-1">
                      Suggestion calculée
                    </p>
                    <p className="text-sm font-black text-white">
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
                    <p className="text-[10px] text-white/40 mt-1">
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

        {/* ── Step 4 : Inconforts ── */}
        {step === 4 && (
          <div className="space-y-6">
            <StepTitle
              title="Zones sensibles ?"
              sub="Optionnel — l'app adapte les exercices et ajoute un prehab ciblé."
            />
            <div className="grid grid-cols-2 gap-2.5">
              {INJURY_OPTIONS.map((inj) => {
                const selected = injuries.has(inj.value)
                return (
                  <button
                    key={inj.value}
                    type="button"
                    onClick={() => toggleInjury(inj.value)}
                    className={`flex items-center justify-between gap-3 p-4 rounded-2xl border-2 text-left transition-all active:scale-[.97] ${
                      selected
                        ? 'border-[#ff6b35] bg-[#ff6b35]/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <span className={`text-sm font-bold ${selected ? 'text-[#ff6b35]' : 'text-white/80'}`}>
                      {inj.label}
                    </span>
                    {selected && (
                      <span className="w-4 h-4 rounded-full bg-[#ff6b35] flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {injuries.size === 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="w-full py-3 rounded-2xl border border-white/20 text-sm font-bold text-white/40 hover:border-white/30 hover:text-white/60 transition-all"
              >
                Aucun inconfort — passer
              </button>
            )}
          </div>
        )}

        {/* ── Step 5 : Morphologie ── */}
        {step === 5 && (
          <div className="space-y-6">
            <StepTitle
              title="Ta morphologie"
              sub="Optionnel — utilisé pour les baselines 1RM et l'IMC rugby."
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-white/40 uppercase tracking-wide">
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
                  className="w-full h-14 rounded-2xl border-2 border-white/10 bg-white/5 px-4 text-xl font-black text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff6b35] transition-colors [color-scheme:dark]"
                />
                {heightCm && !validHeight && (
                  <p className="text-[11px] text-rose-400">Entre 140 et 230 cm</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-white/40 uppercase tracking-wide">
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
                  className="w-full h-14 rounded-2xl border-2 border-white/10 bg-white/5 px-4 text-xl font-black text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff6b35] transition-colors [color-scheme:dark]"
                />
                {weightKg && !validWeight && (
                  <p className="text-[11px] text-rose-400">Entre 40 et 200 kg</p>
                )}
              </div>
            </div>

            {bmi && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white leading-none">{bmi.toFixed(1)}</span>
                  <span className="text-xs font-bold text-white/40 uppercase tracking-wide">IMC</span>
                </div>
                <p className="text-sm font-bold text-white/70">{bmiLabel(bmi, position)}</p>
                <p className="text-[11px] text-white/40 mt-1 leading-relaxed">
                  L'IMC seul ne reflète pas la masse musculaire — indicateur de gabarit uniquement.
                </p>
              </div>
            )}

            {(!validHeight || !validWeight) && (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="w-full py-3 rounded-2xl border border-white/20 text-sm font-bold text-white/40 hover:border-white/30 hover:text-white/60 transition-all"
              >
                Passer cette étape
              </button>
            )}
          </div>
        )}

        {/* ── Step 6 : Résumé ── */}
        {step === 6 && (
          <div className="space-y-6">
            <StepTitle
              title="C'est parti !"
              sub="Voici ton profil. Tu pourras le modifier à tout moment dans les réglages."
            />

            <div className="bg-white/5 border border-white/10 rounded-[1.75rem] overflow-hidden divide-y divide-white/10">
              <SummaryRow label="Poste" value={POSITIONS.find((p) => p.value === position)?.label ?? '–'} />
              <SummaryRow label="Niveau" value={TRAINING_LEVELS.find((l) => l.value === trainingLevel)?.label ?? '–'} />
              {trainingLevel === 'performance' && (
                <SummaryRow
                  label="Orientation"
                  value={PERFORMANCE_FOCUS_OPTIONS.find((o) => o.value === performanceFocus)?.label ?? 'Équilibré'}
                />
              )}
              <SummaryRow label="Population" value={POPULATION_OPTIONS.find((p) => p.value === populationSegment)?.label ?? '–'} />
              <SummaryRow label="Période" value={SEASON_MODES.find((m) => m.value === seasonMode)?.label ?? '–'} />
              <SummaryRow label="Séances" value={`${sessions} / semaine`} />
              {ageBand === 'u18' && (
                <SummaryRow
                  label="Consentement santé"
                  value={parentalConsentHealthData ? 'Parental validé' : 'Non validé (mode sécurité)'}
                />
              )}
              <SummaryRow
                label="Équipement"
                value={
                  equipment.size > 0
                    ? Array.from(equipment)
                        .map((eq) => EQUIPMENT_OPTIONS.find((o) => o.value === eq)?.label ?? eq)
                        .join(', ')
                    : 'Poids du corps'
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
                  label="Muscu"
                  value={scSchedule.sessions.map((s) => DAY_LABELS[s.day]).join(' · ')}
                />
              )}
            </div>

            {!onboardingEligibility.isEligible && (
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-4 space-y-2">
                <p className="text-sm font-bold text-amber-400">Profil non encore supporté en bêta self-serve</p>
                <ul className="space-y-1">
                  {onboardingEligibility.reasons.map((r) => (
                    <li key={r} className="text-xs text-amber-300/80">
                      · {BETA_ELIGIBILITY_MESSAGES[r].reason} — {BETA_ELIGIBILITY_MESSAGES[r].detail}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-white/40">Tu peux quand même créer ton compte. Le programme sera disponible quand le support sera en place.</p>
              </div>
            )}

            {betaCapReached && (
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-2xl p-4 space-y-2">
                <p className="text-sm font-bold text-amber-400">Places bêta complètes</p>
                <p className="text-xs text-amber-300/80">
                  Les 100 places de la bêta sont actuellement prises. Ton profil est enregistré — reviens bientôt ou contacte-nous pour être prévenu quand de nouvelles places seront disponibles.
                </p>
                <a
                  href="mailto:feedback@rugbyforge.fr?subject=Liste%20d'attente%20bêta"
                  className="inline-block text-sm font-bold text-[#ff6b35] hover:text-[#e55a2b]"
                >
                  Nous contacter →
                </a>
              </div>
            )}

            <button
              type="button"
              onClick={handleFinish}
              disabled={betaCapReached}
              className="w-full h-14 rounded-full bg-[#ff6b35] hover:bg-[#e55a2b] disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#ff6b35]/20 active:scale-[.98]"
            >
              <CheckCircle2 className="w-5 h-5" />
              {betaCapReached ? 'Places complètes' : onboardingEligibility.isEligible ? 'Voir mon programme' : 'Terminer et accéder à mon espace'}
            </button>
          </div>
        )}

      </main>

      {/* ── CTA flottant principal (steps 0, 1, 2, 5) ── */}
      {step !== 3 && step !== 4 && step !== 6 && (
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-5 bg-gradient-to-t from-[#1a100c] via-[#1a100c]/95 to-transparent pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="w-full h-14 rounded-full bg-[#ff6b35] hover:bg-[#e55a2b] disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#ff6b35]/20 active:scale-[.98]"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── CTA step 3 : Planning ── */}
      {step === 3 && (
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-5 bg-gradient-to-t from-[#1a100c] via-[#1a100c]/95 to-transparent pointer-events-none">
          <div className="max-w-md mx-auto space-y-2 pointer-events-auto">
            <button
              type="button"
              onClick={handleClubScheduleNext}
              className="w-full h-14 rounded-full bg-[#ff6b35] hover:bg-[#e55a2b] text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#ff6b35]/20 active:scale-[.98]"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="w-full py-2.5 rounded-2xl text-sm font-bold text-white/40 hover:text-white/60 transition-colors text-center"
            >
              Pas d'entraînement club — passer
            </button>
          </div>
        </div>
      )}

      {/* ── CTA step 4 : Inconforts ── */}
      {step === 4 && injuries.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-5 bg-gradient-to-t from-[#1a100c] via-[#1a100c]/95 to-transparent pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="w-full h-14 rounded-full bg-[#ff6b35] hover:bg-[#e55a2b] text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#ff6b35]/20 active:scale-[.98]"
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

// ─── SummaryRow ───────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-4 flex items-start gap-4">
      <span className="text-xs font-black text-white/40 uppercase tracking-wide w-24 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm font-bold text-white/80 leading-relaxed flex-1">{value}</span>
    </div>
  )
}
