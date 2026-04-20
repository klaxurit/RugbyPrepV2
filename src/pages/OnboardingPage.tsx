import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, CheckCircle2, Check,
} from 'lucide-react'
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
  PopulationSegment,
} from '../types/training'
import { computeSCSchedule } from '../services/program/scheduleOptimizer'
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
    label: 'Fondation',
    sub: 'Je découvre la muscu',
    details: 'Exercices guidés : haltères et machines. Variantes sécurisées pour les mouvements à risque.',
    legacyLevel: 'beginner',
  },
  {
    value: 'performance',
    label: 'Avancée',
    sub: 'Je suis à l\'aise avec la barre',
    details: 'Programme complet : barres libres, haltères et travail d\'explosivité.',
    legacyLevel: 'intermediate',
  },
]

// Tous les profils démarrent avec un équipement "salle complète" — le moteur
// adapte silencieusement les exercices via les variantes accessibles. Pas de
// sélection d'équipement à l'onboarding.
const GYM_PRESET: Equipment[] = [
  'barbell', 'dumbbell', 'bench', 'pullup_bar', 'band', 'box',
  'machine', 'cable', 'landmine', 'tbar_row', 'ghd', 'med_ball', 'ab_wheel', 'sprint_track',
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

  const [step, setStep] = useState(0)
  const [position, setPosition] = useState<PositionValue | null>(null)
  const [trainingLevel, setTrainingLevel] = useState<TrainingLevel | null>(null)
  const ageBand = 'adult' as const
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [sessions, setSessions] = useState<2 | 3 | null>(null)
  const [clubDays, setClubDays] = useState<Set<DayOfWeek>>(new Set())
  const [matchDay, setMatchDay] = useState<DayOfWeek | null | undefined>(undefined)
  const [scSchedule, setScSchedule] = useState<SCSchedule | undefined>(undefined)
  const [heightCm, setHeightCm] = useState<string>('')
  const [weightKg, setWeightKg] = useState<string>('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const STEPS = ['Position', 'Profil', 'Planning', 'Morphologie', 'Résumé']
  const progress = (step / (STEPS.length - 1)) * 100

  const parsedHeight = parseInt(heightCm, 10)
  const parsedWeight = parseFloat(weightKg.replace(',', '.'))
  const validHeight = !isNaN(parsedHeight) && parsedHeight >= 140 && parsedHeight <= 230
  const validWeight = !isNaN(parsedWeight) && parsedWeight >= 40 && parsedWeight <= 200
  const bmi = validHeight && validWeight ? calcBmi(parsedHeight, parsedWeight) : null

  const canNext = () => {
    if (step === 0) return position !== null
    if (step === 1) return Boolean(trainingLevel) && sessions !== null
    // Planning (2) et Morphologie (3) optionnels
    return true
  }

  const buildClubSchedule = (): ClubSchedule | undefined => {
    if (clubDays.size === 0) return undefined
    return {
      clubDays: Array.from(clubDays).map((d) => ({ day: d })),
      matchDay: matchDay ?? undefined,
    }
  }

  const handleClubScheduleNext = () => {
    if (clubDays.size > 0 && sessions !== null) {
      const cs = buildClubSchedule()!
      setScSchedule(computeSCSchedule(cs, sessions))
    }
    setStep((s) => s + 1)
  }

  const handleFinish = async () => {
    try {
      const clubSchedule = buildClubSchedule()
      const levelDef = TRAINING_LEVELS.find((l) => l.value === trainingLevel)!
      const derivedPopulationSegment: PopulationSegment =
        gender === 'female' ? 'female_senior' : 'male_senior'
      const profilePayload = {
        position: position!,
        rugbyPosition: position!,
        level: levelDef.legacyLevel,
        trainingLevel: trainingLevel!,
        planningAnchors: { ...(existingProfile?.planningAnchors ?? {}) },
        performanceFocus: 'balanced' as const,
        weeklySessions: sessions!,
        equipment: GYM_PRESET,
        heightCm: validHeight ? parsedHeight : undefined,
        weightKg: validWeight ? parsedWeight : undefined,
        clubSchedule,
        scSchedule,
        ageBand,
        populationSegment: derivedPopulationSegment,
      }
      updateProfile(profilePayload, { source: 'onboarding' })

      // Pas de seasonMode saisi : le moteur annuel déduira la phase depuis le
      // calendrier de matchs (off-season synthétique par défaut).
      window.localStorage.setItem('rugbyprep.week.v1', 'W1')

      if (userId) markOnboardingComplete(userId)
      posthog.capture('onboarding_completed', {
        position, trainingLevel, ageBand, gender,
        populationSegment: derivedPopulationSegment,
        performanceFocus: 'balanced',
        sessions,
        eligible: true,
      })

      const destination = resolvePostOnboardingDestination(intendedPath)
      navigate(destination, { replace: true })
    } catch (err) {
      console.error('[Onboarding] handleFinish error:', err)
      setSubmitError('Une erreur est survenue. Vérifie ta connexion et réessaie.')
    }
  }

  // Moteur annuel gère tous les profils — pas de guard beta/eligibility

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

            <div className="space-y-3">
              <SectionLabel>Tu es</SectionLabel>
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

          </div>
        )}

        {/* ── Step 2 : Planning club ── */}
        {step === 2 && (
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
              {/* Horaires ajustables dans le profil après onboarding */}
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
                <SectionLabel>Tes séances muscu</SectionLabel>
                <div className="p-3.5 rounded-2xl bg-ok-bg-muted border border-ok-bd">
                  <p className="text-[10px] font-black text-ok-strong uppercase tracking-wide mb-1">
                    Jours suggérés
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
                    Placées automatiquement autour de ton club et de tes matchs
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3 : Morphologie ── */}
        {step === 3 && (
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

        {/* ── Step 4 : Résumé ── */}
        {step === 4 && (
          <div className="space-y-6">
            <StepTitle
              title="C'est parti !"
              sub="Voici ton profil. Tu pourras le modifier à tout moment dans les réglages."
            />

            <div className="bg-layer-5 border border-border-app rounded-[1.75rem] overflow-hidden divide-y divide-border-app">
              <SummaryRow label="Poste" value={POSITIONS.find((p) => p.value === position)?.label ?? '–'} />
              <SummaryRow label="Niveau" value={TRAINING_LEVELS.find((l) => l.value === trainingLevel)?.label ?? '–'} />
              <SummaryRow label="Séances" value={`${sessions} / semaine`} />
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

            {submitError && (
              <div className="p-3 bg-danger-bg border border-danger-bd rounded-2xl">
                <p className="text-xs text-danger font-medium">{submitError}</p>
              </div>
            )}

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

      {/* ── CTA flottant principal (steps 0, 1, 3) ── */}
      {step !== 2 && step !== 4 && (
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

      {/* ── CTA step 2 : Planning ── */}
      {step === 2 && (
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
