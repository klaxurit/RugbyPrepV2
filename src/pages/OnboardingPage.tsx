import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, CheckCircle2, Check,
  Dumbbell, Trophy, Ruler, Flame,
  Leaf, Sparkles, RefreshCw, Activity,
  Home, Building2, StretchHorizontal,
} from 'lucide-react'

// Illustrations abstraites des groupes de poste (bordeaux / crème)
import frontRowImg from '../assets/positions/front-row.webp'
import secondRowImg from '../assets/positions/second-row.webp'
import backRowImg from '../assets/positions/back-row.webp'
import halfBacksImg from '../assets/positions/half-backs.webp'
import centersImg from '../assets/positions/centers.webp'
import backThreeImg from '../assets/positions/back-three.webp'
import rugbyforgeRedLogo from '../assets/rugbyforge-red-full.png'
import { useProfile, markOnboardingComplete } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { weekStorageKey } from '../contexts/weekStorage'
import { userScopedKey } from '../services/storage/userScopedStorage'
import { posthog } from '../services/analytics/posthog'
import { resolvePostOnboardingDestination } from '../services/navigation/resolveAppEntryDestination'
import { NotificationOptInSheet } from '../components/notifications/NotificationOptInSheet'
import { useNotifications } from '../hooks/useNotifications'
import { DEFAULT_PROFILE } from '../hooks/useProfile'
import {
  canShowNotificationPrompt,
  dismissNotificationPrompt,
} from '../services/notifications/notificationPromptStorage'
import { canOfferTrainingReminderOptIn } from '../services/notifications/notificationOptInEligibility'
import type {
  UserProfile,
  Equipment,
  DayOfWeek,
  ClubSchedule,
  SCSchedule,
  TrainingLevel,
  PopulationSegment,
  SeasonMode,
  TrainingBaseline,
} from '../types/training'
import type { AnnualCycle } from '../types/annualPlanning'
import { computeSCSchedule, TRAINING_DAYS_DEFAULT } from '../services/program/scheduleOptimizer'
import { startOfIsoWeek } from '../services/weeklyBilan/computeWeeklyBilan'
import { tr, dayAbbrArray, type Lang } from '../i18n/appLabels'
// betaEligibility import removed — all profiles eligible since V2 launch

// ─── Types ────────────────────────────────────────────────────

type PositionValue = NonNullable<UserProfile['position']>

// ─── Constants ────────────────────────────────────────────────

type PositionDef = { value: PositionValue; label: string; sub: string; illustration: string }
function getPositions(lang: Lang): PositionDef[] {
  return [
    { value: 'FRONT_ROW',   label: tr('pos_front_row', lang),    sub: tr('pos_front_row_sub', lang),    illustration: frontRowImg  },
    { value: 'SECOND_ROW',  label: tr('pos_second_row', lang),   sub: tr('pos_second_row_sub', lang),   illustration: secondRowImg },
    { value: 'BACK_ROW',    label: tr('pos_back_row', lang),     sub: tr('pos_back_row_sub', lang),     illustration: backRowImg   },
    { value: 'HALF_BACKS',  label: tr('pos_half_backs', lang),   sub: tr('pos_half_backs_sub', lang),   illustration: halfBacksImg },
    { value: 'CENTERS',     label: tr('pos_centers', lang),      sub: tr('pos_centers_sub', lang),      illustration: centersImg   },
    { value: 'BACK_THREE',  label: tr('pos_back_three', lang),   sub: tr('pos_back_three_sub', lang),   illustration: backThreeImg },
  ]
}

type DayOption = { day: DayOfWeek; label: string; short: string }
function getClubDayOptions(lang: Lang): DayOption[] {
  return [1, 2, 3, 4, 5, 6, 0].map((d) => ({
    day: d as DayOfWeek,
    label: tr((['day_sunday','day_monday','day_tuesday','day_wednesday','day_thursday','day_friday','day_saturday'] as const)[d], lang),
    short: tr((['day_sunday_short','day_monday_short','day_tuesday_short','day_wednesday_short','day_thursday_short','day_friday_short','day_saturday_short'] as const)[d], lang),
  }))
}

type MatchDayOption = { day: DayOfWeek | null; label: string }
function getMatchDayOptions(lang: Lang): MatchDayOption[] {
  return [
    { day: 6,    label: tr('day_saturday', lang) },
    { day: 0,    label: tr('day_sunday', lang) },
    { day: null, label: tr('match_day_variable', lang) },
  ]
}

/**
 * Choix de situation saison à l'onboarding.
 * `value` alimente `planningAnchors.onboardingCycleHint` + `seasonMode` (playoffs → in_season + manualPlayoffs).
 */
type SeasonPhaseDef = {
  value: AnnualCycle
  label: string
  sub: string
  icon: typeof Leaf
}
function getSeasonPhases(lang: Lang): SeasonPhaseDef[] {
  return [
    { value: 'in_season',  label: tr('cycle_in_season', lang),  sub: tr('cycle_in_season_sub', lang),  icon: Trophy },
    { value: 'playoffs',   label: tr('cycle_playoffs', lang),   sub: tr('cycle_playoffs_sub', lang),   icon: Sparkles },
    { value: 'off_season', label: tr('cycle_off_season', lang), sub: tr('cycle_off_season_sub', lang), icon: Leaf },
    { value: 'pre_season', label: tr('cycle_pre_season', lang), sub: tr('cycle_pre_season_sub', lang), icon: Flame },
  ]
}

/**
 * État de forme à l'onboarding — KB: population-specific.md §3.
 * Module la rampe de reprise (skip deload si 'peak', protocole retour si 'restart').
 */
type TrainingBaselineDef = {
  value: TrainingBaseline
  label: string
  sub: string
  icon: typeof RefreshCw
}
function getTrainingBaselines(lang: Lang): TrainingBaselineDef[] {
  return [
    { value: 'restart', label: tr('baseline_restart', lang), sub: tr('baseline_restart_sub', lang), icon: RefreshCw },
    { value: 'active',  label: tr('baseline_active', lang),  sub: tr('baseline_active_sub', lang),  icon: Activity },
    { value: 'peak',    label: tr('baseline_peak', lang),    sub: tr('baseline_peak_sub', lang),    icon: Flame },
  ]
}

type TrainingLevelDef = {
  value: TrainingLevel
  label: string
  sub: string
  details: string
  legacyLevel: UserProfile['level']
}
function getTrainingLevels(lang: Lang): TrainingLevelDef[] {
  return [
    {
      value: 'starter',
      label: tr('level_starter', lang),
      sub: tr('level_starter_sub', lang),
      details: tr('level_starter_details', lang),
      legacyLevel: 'beginner',
    },
    {
      value: 'performance',
      label: tr('level_performance', lang),
      sub: tr('level_performance_sub', lang),
      details: tr('level_performance_details', lang),
      legacyLevel: 'intermediate',
    },
  ]
}

import {
  EQUIPMENT_PRESET_DEFS,
  asksGymTrainingLevelForPreset,
  resolveEquipmentFromPreset,
  type EquipmentPreset,
} from '../services/equipment/equipmentPresets'

type EquipmentPresetDef = {
  value: EquipmentPreset
  label: string
  sub: string
  icon: typeof Home
}

function getEquipmentPresets(lang: Lang): EquipmentPresetDef[] {
  const icons = {
    bodyweight: Home,
    bands: StretchHorizontal,
    home_gym: Dumbbell,
    full_gym: Building2,
  } as const
  return EQUIPMENT_PRESET_DEFS.map((def) => ({
    value: def.value,
    label: tr(def.labelKey, lang),
    sub: tr(def.subKey, lang),
    icon: icons[def.value],
  }))
}

/** Hors salle complète : niveau starter (volume foundations) sans question dédiée. */
function resolveOnboardingTrainingLevel(
  preset: EquipmentPreset | null,
  selected: TrainingLevel | null,
): TrainingLevel {
  if (asksGymTrainingLevelForPreset(preset ?? 'bodyweight')) return selected ?? 'starter'
  return 'starter'
}

function calcBmi(heightCm: number, weightKg: number): number {
  const h = heightCm / 100
  return weightKg / (h * h)
}

function bmiLabel(bmi: number, position: PositionValue | null, lang: Lang): string {
  const isForward = position === 'FRONT_ROW' || position === 'SECOND_ROW' || position === 'BACK_ROW'
  if (bmi < 20) return tr('bmi_underweight', lang)
  if (bmi < 24) return tr(isForward ? 'bmi_light_forward' : 'bmi_optimal_back', lang)
  if (bmi < 27) return tr(isForward ? 'bmi_adequate_forward' : 'bmi_above_back', lang)
  if (bmi < 31) return tr(isForward ? 'bmi_optimal_forward' : 'bmi_above_norm', lang)
  return tr(isForward ? 'bmi_big_forward' : 'bmi_surcharge_back', lang)
}

/** Position 0→1 du curseur IMC sur l'échelle rugby [18 → 35]. */
function bmiGaugePosition(bmi: number): number {
  const min = 18
  const max = 35
  return Math.max(0, Math.min(1, (bmi - min) / (max - min)))
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

/** Mini-week visualizer — 7 segments, bordeaux sur les jours actifs. */
function WeekDots({
  highlightedDays,
  tone = 'brand',
}: {
  highlightedDays: Set<DayOfWeek>
  tone?: 'brand' | 'muted'
}) {
  const days: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0]
  const labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  return (
    <div className="flex gap-1">
      {days.map((d, i) => {
        const on = highlightedDays.has(d)
        return (
          <div
            key={d}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              on
                ? tone === 'brand'
                  ? 'bg-brand'
                  : 'bg-fg-muted'
                : 'bg-layer-10'
            }`}
            aria-label={`${labels[i]}${on ? ' actif' : ''}`}
          />
        )
      })}
    </div>
  )
}

/** 3 points, remplis selon le niveau. */
function IntensityDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <div className="flex gap-1" aria-label={`Intensité ${level}/3`}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`w-2 h-2 rounded-full ${n <= level ? 'bg-brand' : 'bg-layer-15'}`}
        />
      ))}
    </div>
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
  const [equipmentPreset, setEquipmentPreset] = useState<EquipmentPreset | null>(null)
  const [trainingLevel, setTrainingLevel] = useState<TrainingLevel | null>(null)
  const ageBand = 'adult' as const
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [sessions, setSessions] = useState<2 | 3 | null>(null)
  const [seasonPhase, setSeasonPhase] = useState<AnnualCycle | null>(null)
  const [trainingBaseline, setTrainingBaseline] = useState<TrainingBaseline | null>(null)
  const [clubDays, setClubDays] = useState<Set<DayOfWeek>>(new Set())
  const [matchDay, setMatchDay] = useState<DayOfWeek | null | undefined>(undefined)
  const [scSchedule, setScSchedule] = useState<SCSchedule | undefined>(undefined)
  const [offSeasonGymDays, setOffSeasonGymDays] = useState<Set<DayOfWeek> | null>(null)
  const [heightCm, setHeightCm] = useState<string>('')
  const [weightKg, setWeightKg] = useState<string>('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [notifPromptOpen, setNotifPromptOpen] = useState(false)
  const [notifPromptLoading, setNotifPromptLoading] = useState(false)
  const [pendingDestination, setPendingDestination] = useState<string | null>(null)
  const [savedProfileForNotifs, setSavedProfileForNotifs] = useState<UserProfile | null>(null)

  const notifProfile = savedProfileForNotifs ?? existingProfile ?? DEFAULT_PROFILE
  const { subscribe: notifSubscribe } = useNotifications(notifProfile)

  const isOffSeason = seasonPhase === 'off_season'
  const showGymTrainingLevel = asksGymTrainingLevelForPreset(equipmentPreset ?? 'bodyweight')

  // Derive default gym days for off-season (no setState in effect needed)
  const effectiveOffSeasonGymDays: Set<DayOfWeek> = offSeasonGymDays
    ?? (sessions ? new Set(TRAINING_DAYS_DEFAULT[sessions]) : new Set())

  const lang: Lang = ((existingProfile?.preferredLanguage as Lang | undefined) ?? 'fr')
  const POSITIONS = getPositions(lang)
  const CLUB_DAYS_OPTIONS = getClubDayOptions(lang)
  const MATCH_DAY_OPTIONS = getMatchDayOptions(lang)
  const SEASON_PHASES = getSeasonPhases(lang)
  const TRAINING_BASELINES = getTrainingBaselines(lang)
  const TRAINING_LEVELS = getTrainingLevels(lang)
  const EQUIPMENT_PRESETS = getEquipmentPresets(lang)
  const DAY_LABELS = dayAbbrArray(lang)

  const STEPS = [
    tr('step_position', lang),
    tr('step_equipment', lang),
    tr('step_profile', lang),
    tr('step_situation', lang),
    tr('step_planning', lang),
    tr('step_morphology', lang),
    tr('step_summary', lang),
  ]
  const progress = (step / (STEPS.length - 1)) * 100

  const parsedHeight = parseInt(heightCm, 10)
  const parsedWeight = parseFloat(weightKg.replace(',', '.'))
  const validHeight = !isNaN(parsedHeight) && parsedHeight >= 140 && parsedHeight <= 230
  const validWeight = !isNaN(parsedWeight) && parsedWeight >= 40 && parsedWeight <= 200
  const bmi = validHeight && validWeight ? calcBmi(parsedHeight, parsedWeight) : null

  const canNext = () => {
    if (step === 0) return position !== null
    if (step === 1) return equipmentPreset !== null
    if (step === 2) {
      const levelOk = showGymTrainingLevel ? Boolean(trainingLevel) : true
      return levelOk && sessions !== null
    }
    if (step === 3) return seasonPhase !== null && trainingBaseline !== null
    // Planning (4) et Morphologie (5) optionnels
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
    if (isOffSeason && sessions !== null) {
      // Off-season: use freely chosen gym days, no club schedule
      const gymDays = effectiveOffSeasonGymDays.size > 0
        ? [...effectiveOffSeasonGymDays]
        : TRAINING_DAYS_DEFAULT[sessions]
      setScSchedule({
        sessions: gymDays.sort((a, b) => a - b).map((day, i) => ({
          sessionIndex: i as 0 | 1 | 2,
          day,
        })),
        source: 'manual',
      })
    } else if (clubDays.size > 0 && sessions !== null) {
      const cs = buildClubSchedule()!
      setScSchedule(computeSCSchedule(cs, sessions))
    }
    setStep((s) => s + 1)
  }

  const completeOnboardingNavigation = (destination: string) => {
    navigate(destination, { replace: true })
  }

  const handleFinish = async () => {
    try {
      const clubSchedule = isOffSeason ? undefined : buildClubSchedule()
      const resolvedTrainingLevel = resolveOnboardingTrainingLevel(equipmentPreset, trainingLevel)
      const levelDef = TRAINING_LEVELS.find((l) => l.value === resolvedTrainingLevel)!
      const derivedPopulationSegment: PopulationSegment =
        gender === 'female' ? 'female_senior' : 'male_senior'

      // seasonPhase → seasonMode + onboardingCycleHint + manualPlayoffs
      // 'playoffs' n'existe pas en SeasonMode : on écrit in_season + manualPlayoffs.
      const derivedSeasonMode: SeasonMode =
        seasonPhase === 'playoffs' ? 'in_season'
        : (seasonPhase ?? 'in_season')
      const nextAnchors: NonNullable<UserProfile['planningAnchors']> = {
        ...(existingProfile?.planningAnchors ?? {}),
        onboardingCycleHint: seasonPhase ?? undefined,
      }
      if (seasonPhase === 'playoffs') nextAnchors.manualPlayoffs = true
      else delete nextAnchors.manualPlayoffs
      if (seasonPhase === 'off_season') {
        const todayIso = new Date().toISOString().slice(0, 10)
        nextAnchors.offSeasonStartAt = startOfIsoWeek(todayIso)
      }

      const profilePayload = {
        position: position!,
        rugbyPosition: position!,
        level: levelDef.legacyLevel,
        trainingLevel: resolvedTrainingLevel,
        seasonMode: derivedSeasonMode,
        trainingBaseline: trainingBaseline ?? undefined,
        planningAnchors: nextAnchors,
        performanceFocus: 'balanced' as const,
        weeklySessions: sessions!,
        equipment: resolveEquipmentFromPreset(equipmentPreset!),
        heightCm: validHeight ? parsedHeight : undefined,
        weightKg: validWeight ? parsedWeight : undefined,
        clubSchedule,
        scSchedule,
        ageBand,
        populationSegment: derivedPopulationSegment,
      }
      updateProfile(profilePayload, { source: 'onboarding' })

      window.localStorage.setItem(weekStorageKey(userId), 'W1')
      window.localStorage.setItem(
        userScopedKey('rugbyprep.onboarding.completedAt', userId),
        new Date().toISOString().slice(0, 10),
      )

      if (userId) markOnboardingComplete(userId)
      posthog.capture('onboarding_completed', {
        position, trainingLevel: resolvedTrainingLevel, ageBand, gender,
        populationSegment: derivedPopulationSegment,
        performanceFocus: 'balanced',
        sessions,
        eligible: true,
      })

      const destination = resolvePostOnboardingDestination(intendedPath)
      const profileForNotifs: UserProfile = {
        ...(existingProfile ?? DEFAULT_PROFILE),
        ...profilePayload,
      }

      const offerNotifPrompt =
        canOfferTrainingReminderOptIn() &&
        canShowNotificationPrompt(userId, 'onboarding')

      if (offerNotifPrompt) {
        setSavedProfileForNotifs(profileForNotifs)
        setPendingDestination(destination)
        setNotifPromptOpen(true)
        posthog.capture('notification_prompt_shown', { kind: 'onboarding' })
        return
      }

      completeOnboardingNavigation(destination)
    } catch (err) {
      console.error('[Onboarding] handleFinish error:', err)
      setSubmitError(tr('onboarding_error', lang))
    }
  }

  const finishAfterNotifPrompt = () => {
    if (pendingDestination) completeOnboardingNavigation(pendingDestination)
    setNotifPromptOpen(false)
    setPendingDestination(null)
    setSavedProfileForNotifs(null)
  }

  const handleNotifPromptLater = () => {
    dismissNotificationPrompt(userId, 'onboarding')
    posthog.capture('notification_prompt_dismissed', { kind: 'onboarding' })
    finishAfterNotifPrompt()
  }

  const handleNotifPromptEnable = async () => {
    if (!savedProfileForNotifs) {
      finishAfterNotifPrompt()
      return
    }
    setNotifPromptLoading(true)
    try {
      await notifSubscribe({ profileOverride: savedProfileForNotifs })
      posthog.capture('notification_prompt_enabled', { kind: 'onboarding' })
    } catch {
      posthog.capture('notification_prompt_denied', { kind: 'onboarding' })
    } finally {
      setNotifPromptLoading(false)
      finishAfterNotifPrompt()
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
        <div className="flex-1 flex items-center justify-center">
          <img
            src={rugbyforgeRedLogo}
            alt="RugbyForge"
            className="h-8 w-auto"
            draggable={false}
          />
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
            <StepTitle title={tr('step0_title', lang)} sub={tr('step0_sub', lang)} />
            <div className="grid grid-cols-2 gap-2.5">
              {POSITIONS.map((pos) => {
                const selected = position === pos.value
                return (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={() => setPosition(pos.value)}
                    className={`relative flex flex-col overflow-hidden rounded-2xl border-2 text-left transition-all active:scale-[.97] rf-focus-ring ${
                      selected
                        ? 'border-brand bg-brand-soft shadow-[0_0_0_4px_var(--color-accent-glow)]'
                        : 'border-border-app bg-layer-5 hover:border-border-dashed-app'
                    }`}
                  >
                    <div className="relative w-full aspect-square bg-brand overflow-hidden">
                      <img
                        src={pos.illustration}
                        alt=""
                        aria-hidden="true"
                        draggable={false}
                        className={`w-full h-full object-cover transition-[filter,transform] duration-200 ease-out ${
                          selected ? 'saturate-100 scale-[1.05]' : 'saturate-[.92]'
                        }`}
                      />
                      {selected && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand flex items-center justify-center shadow-md">
                          <Check className="w-3 h-3 text-on-brand" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="px-3 pt-2.5 pb-3">
                      <p className={`text-[13px] font-black leading-tight ${selected ? 'text-brand-tint' : 'text-fg'}`}>
                        {pos.label}
                      </p>
                      <p className="text-[10.5px] text-fg-muted mt-0.5 leading-tight">{pos.sub}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Step 1 : Matériel ── */}
        {step === 1 && (
          <div className="space-y-3">
            <StepTitle title={tr('step_equipment_title', lang)} sub={tr('step_equipment_sub', lang)} />
            <div className="space-y-2.5">
              {EQUIPMENT_PRESETS.map((opt) => {
                const selected = equipmentPreset === opt.value
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    type="button"
                    data-testid={`onboarding-equipment-${opt.value}`}
                    onClick={() => {
                      setEquipmentPreset(opt.value)
                      if (!asksGymTrainingLevelForPreset(opt.value)) setTrainingLevel(null)
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all active:scale-[.98] rf-focus-ring ${
                      selected
                        ? 'border-brand bg-brand-soft shadow-[0_0_0_4px_var(--color-accent-glow)]'
                        : 'border-border-app bg-layer-5 hover:border-border-dashed-app'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${selected ? 'text-brand' : 'text-fg-muted'}`}
                      strokeWidth={2.25}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-black ${selected ? 'text-brand-tint' : 'text-fg'}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-fg-muted mt-0.5">{opt.sub}</p>
                    </div>
                    {selected && (
                      <CheckCircle2 className="w-5 h-5 text-brand-tint flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Step 2 : Niveau + Séances + Genre ── */}
        {step === 2 && (
          <div className="space-y-7">
            <StepTitle
              title={tr(showGymTrainingLevel ? 'step1_title' : 'step1_title_home', lang)}
              sub={tr(showGymTrainingLevel ? 'step1_sub' : 'step1_sub_home', lang)}
            />

            {showGymTrainingLevel && (
            <div className="space-y-3">
              <SectionLabel>{tr('step1_section_level', lang)}</SectionLabel>
              <div className="space-y-2.5">
                {TRAINING_LEVELS.map((opt) => {
                  const selected = trainingLevel === opt.value
                  const intensity: 1 | 3 = opt.value === 'starter' ? 1 : 3
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTrainingLevel(opt.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all active:scale-[.98] rf-focus-ring ${
                        selected
                          ? 'border-brand bg-brand-soft shadow-[0_0_0_4px_var(--color-accent-glow)]'
                          : 'border-border-app bg-layer-5 hover:border-border-dashed-app'
                      }`}
                    >
                      <div className="flex-shrink-0 flex flex-col items-center gap-2">
                        <Dumbbell
                          className={`w-5 h-5 ${selected ? 'text-brand' : 'text-fg-muted'}`}
                          strokeWidth={2.25}
                        />
                        <IntensityDots level={intensity} />
                      </div>
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
            )}

            {/* Séances par semaine */}
            <div className="space-y-3">
              <SectionLabel>{tr('step1_section_sessions', lang)}</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { value: 2 as const, label: tr('sessions_2_label', lang), sub: tr('sessions_2_sub', lang), days: new Set<DayOfWeek>([1, 4]) },
                  { value: 3 as const, label: tr('sessions_3_label', lang), sub: tr('sessions_3_sub', lang), days: new Set<DayOfWeek>([1, 3, 5]) },
                ]).map((opt) => {
                  const selected = sessions === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSessions(opt.value)}
                      className={`flex flex-col gap-3 p-4 rounded-2xl border-2 text-left transition-all active:scale-[.97] rf-focus-ring ${
                        selected
                          ? 'border-brand bg-brand-soft shadow-[0_0_0_4px_var(--color-accent-glow)]'
                          : 'border-border-app bg-layer-5 hover:border-border-dashed-app'
                      }`}
                    >
                      <WeekDots highlightedDays={opt.days} />
                      <div>
                        <p className={`text-sm font-black ${selected ? 'text-brand-tint' : 'text-fg'}`}>
                          {opt.label}
                        </p>
                        <p className="text-[10.5px] text-fg-muted mt-0.5">{opt.sub}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Genre */}
            <div className="space-y-3">
              <SectionLabel>{tr('step1_section_gender', lang)}</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  { value: 'male' as const, label: tr('gender_male', lang) },
                  { value: 'female' as const, label: tr('gender_female', lang) },
                ]).map((opt) => {
                  const selected = gender === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGender(opt.value)}
                      className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 text-center transition-all active:scale-[.97] rf-focus-ring ${
                        selected
                          ? 'border-brand bg-brand-soft shadow-[0_0_0_4px_var(--color-accent-glow)]'
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

        {/* ── Step 3 : Situation saison + état de forme ── */}
        {step === 3 && (
          <div className="space-y-7">
            <StepTitle
              title={tr('step2_title', lang)}
              sub={tr('step2_sub', lang)}
            />

            <div className="space-y-3">
              <SectionLabel>{tr('step2_section_season', lang)}</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {SEASON_PHASES.map((opt) => {
                  const selected = seasonPhase === opt.value
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      data-testid={`onboarding-season-${opt.value}`}
                      onClick={() => setSeasonPhase(opt.value)}
                      className={`flex flex-col gap-2 p-4 rounded-2xl border-2 text-left transition-all active:scale-[.97] rf-focus-ring ${
                        selected
                          ? 'border-brand bg-brand-soft shadow-[0_0_0_4px_var(--color-accent-glow)]'
                          : 'border-border-app bg-layer-5 hover:border-border-dashed-app'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${selected ? 'text-brand' : 'text-fg-muted'}`}
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      <div>
                        <p className={`text-sm font-black leading-tight ${selected ? 'text-brand-tint' : 'text-fg'}`}>
                          {opt.label}
                        </p>
                        <p className="text-[10.5px] text-fg-muted mt-0.5 leading-tight">{opt.sub}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <SectionLabel>{tr('step2_section_baseline', lang)}</SectionLabel>
              <div className="space-y-2.5">
                {TRAINING_BASELINES.map((opt) => {
                  const selected = trainingBaseline === opt.value
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      data-testid={`onboarding-baseline-${opt.value}`}
                      onClick={() => setTrainingBaseline(opt.value)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all active:scale-[.98] rf-focus-ring ${
                        selected
                          ? 'border-brand bg-brand-soft shadow-[0_0_0_4px_var(--color-accent-glow)]'
                          : 'border-border-app bg-layer-5 hover:border-border-dashed-app'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 ${selected ? 'text-brand' : 'text-fg-muted'}`}
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-black ${selected ? 'text-brand-tint' : 'text-fg'}`}>
                          {opt.label}
                        </p>
                        <p className="text-[11px] text-fg-muted mt-0.5">{opt.sub}</p>
                      </div>
                      {selected && <CheckCircle2 className="w-5 h-5 text-brand-tint flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3 : Planning ── */}
        {step === 4 && isOffSeason && (
          <div className="space-y-6">
            <StepTitle
              title={tr('step3_offseason_title', lang)}
              sub={tr('step3_offseason_sub', lang)}
            />

            <div className="space-y-3">
              <SectionLabel>{sessions === 3 ? `3 ${tr('step3_sessions_per_week', lang)}` : `2 ${tr('step3_sessions_per_week', lang)}`}</SectionLabel>
              <div className="grid grid-cols-7 gap-1.5">
                {CLUB_DAYS_OPTIONS.map((opt) => {
                  const selected = effectiveOffSeasonGymDays.has(opt.day)
                  return (
                    <button
                      key={opt.day}
                      type="button"
                      onClick={() => {
                        setOffSeasonGymDays((prev) => {
                          const next = new Set(prev ?? effectiveOffSeasonGymDays)
                          if (next.has(opt.day)) { next.delete(opt.day) } else { next.add(opt.day) }
                          return next
                        })
                      }}
                      className={`relative aspect-square flex flex-col items-center justify-center rounded-xl border-2 transition-all text-center active:scale-[.94] rf-focus-ring ${
                        selected
                          ? 'border-brand bg-brand-soft'
                          : 'border-border-app bg-layer-5 hover:border-border-dashed-app'
                      }`}
                    >
                      <span className={`text-[12px] font-black ${selected ? 'text-brand-tint' : 'text-fg-soft'}`}>
                        {opt.short}
                      </span>
                      {selected && (
                        <Dumbbell
                          className="absolute bottom-1 right-1 w-2.5 h-2.5 text-brand"
                          strokeWidth={2.5}
                          aria-hidden
                        />
                      )}
                    </button>
                  )
                })}
              </div>
              <p className="text-[11px] text-fg-muted leading-relaxed">
                {tr('step3_offseason_sub_note', lang)}
              </p>
            </div>
          </div>
        )}

        {step === 4 && !isOffSeason && (
          <div className="space-y-6">
            <StepTitle
              title={tr('step3_club_title', lang)}
              sub={tr('step3_club_sub', lang)}
            />

            {/* Jours club */}
            <div className="space-y-3">
              <SectionLabel>{tr('step3_section_club_days', lang)}</SectionLabel>
              <div className="grid grid-cols-7 gap-1.5">
                {CLUB_DAYS_OPTIONS.map((opt) => {
                  const selected = clubDays.has(opt.day)
                  const isMatch = matchDay === opt.day
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
                      className={`relative aspect-square flex flex-col items-center justify-center rounded-xl border-2 transition-all text-center active:scale-[.94] rf-focus-ring ${
                        selected
                          ? 'border-brand bg-brand-soft'
                          : 'border-border-app bg-layer-5 hover:border-border-dashed-app'
                      }`}
                    >
                      <span className={`text-[12px] font-black ${selected ? 'text-brand-tint' : 'text-fg-soft'}`}>
                        {opt.short}
                      </span>
                      {isMatch && (
                        <Trophy
                          className="absolute bottom-1 right-1 w-2.5 h-2.5 text-brand"
                          strokeWidth={2.5}
                          aria-hidden
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Jour de match */}
            <div className="space-y-3">
              <SectionLabel>{tr('step3_section_match_day', lang)}</SectionLabel>
              <div className="flex gap-2">
                {MATCH_DAY_OPTIONS.map((opt) => (
                  <button
                    key={String(opt.day)}
                    type="button"
                    onClick={() => setMatchDay(opt.day)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black border-2 transition-all active:scale-[.97] flex items-center justify-center gap-1.5 rf-focus-ring ${
                      matchDay === opt.day
                        ? 'border-brand bg-brand-soft text-brand-tint'
                        : 'border-border-app bg-layer-5 text-fg-soft hover:border-border-dashed-app'
                    }`}
                  >
                    <Trophy className="w-3 h-3" strokeWidth={2.5} aria-hidden />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Suggestion muscu — visualisée sur la même semaine */}
            {clubDays.size > 0 && sessions !== null && (() => {
              const cs: ClubSchedule = {
                clubDays: Array.from(clubDays).map((d) => ({ day: d })),
                matchDay: matchDay ?? undefined,
              }
              const muscuDays = new Set<DayOfWeek>(
                computeSCSchedule(cs, sessions).sessions.map((s) => s.day),
              )
              return (
                <div className="space-y-3 pt-4 border-t border-border-app">
                  <SectionLabel>{tr('step3_section_suggested', lang)}</SectionLabel>
                  <div className="p-4 rounded-2xl bg-layer-5 border border-border-app space-y-3">
                    <div className="grid grid-cols-7 gap-1.5">
                      {CLUB_DAYS_OPTIONS.map((opt) => {
                        const isClub = clubDays.has(opt.day)
                        const isMatch = matchDay === opt.day
                        const isMuscu = muscuDays.has(opt.day)
                        let bg = 'bg-layer-5'
                        let text = 'text-fg-muted'
                        let tag = ''
                        if (isMatch) { bg = 'bg-brand'; text = 'text-on-brand'; tag = 'M' }
                        else if (isClub) { bg = 'bg-brand-soft'; text = 'text-brand-tint'; tag = 'C' }
                        else if (isMuscu) { bg = 'bg-brand/60'; text = 'text-on-brand'; tag = '💪' }
                        return (
                          <div
                            key={opt.day}
                            className={`aspect-square rounded-lg flex flex-col items-center justify-center ${bg}`}
                          >
                            <span className={`text-[10px] font-black ${text}`}>{opt.short}</span>
                            {tag && <span className={`text-[9px] ${text}`}>{tag}</span>}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex flex-wrap gap-3 text-[10px] text-fg-muted">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand" aria-hidden />{tr('step3_legend_match', lang)}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-soft border border-brand/25" aria-hidden />{tr('step3_legend_club', lang)}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand/60" aria-hidden />{tr('step3_legend_muscu', lang)}</span>
                    </div>
                    <p className="text-[11px] text-fg-muted leading-relaxed">
                      {tr('step3_auto_placed', lang)}
                    </p>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* ── Step 5 : Morphologie ── */}
        {step === 5 && (
          <div className="space-y-6">
            <StepTitle
              title={tr('step4_title', lang)}
              sub={tr('step4_sub', lang)}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-fg-muted uppercase tracking-wide flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
                  {tr('step4_height', lang)}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={140}
                    max={230}
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="182"
                    className="w-full h-16 rounded-2xl border-2 border-border-app bg-layer-5 px-4 pr-12 text-2xl font-black text-fg placeholder:text-fg-ghost focus:outline-none focus:border-brand transition-colors rf-focus-ring"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-fg-muted uppercase">cm</span>
                </div>
                {heightCm && !validHeight && (
                  <p className="text-[11px] text-danger">{tr('step4_height_range_error', lang)}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-fg-muted uppercase tracking-wide flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
                  {tr('step4_weight', lang)}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={40}
                    max={200}
                    step={0.5}
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="95"
                    className="w-full h-16 rounded-2xl border-2 border-border-app bg-layer-5 px-4 pr-12 text-2xl font-black text-fg placeholder:text-fg-ghost focus:outline-none focus:border-brand transition-colors rf-focus-ring"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-fg-muted uppercase">kg</span>
                </div>
                {weightKg && !validWeight && (
                  <p className="text-[11px] text-danger">{tr('step4_weight_range_error', lang)}</p>
                )}
              </div>
            </div>

            {bmi && (
              <div className="bg-layer-5 border border-border-app rounded-2xl p-5 space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-brand leading-none">{bmi.toFixed(1)}</span>
                  <span className="text-xs font-bold text-fg-muted uppercase tracking-wide">{tr('bmi_imc_rugby', lang)}</span>
                </div>

                {/* Jauge horizontale : sous-poids → optimal → solide → avant → gros avant */}
                <div className="space-y-1.5">
                  <div className="relative h-2.5 rounded-full overflow-hidden bg-layer-10">
                    <div className="absolute inset-0 flex">
                      <div className="flex-[2] bg-layer-15" title={tr('bmi_tick_underweight', lang)} />
                      <div className="flex-[4] bg-ok-bg-muted" title={tr('bmi_tick_optimal', lang)} />
                      <div className="flex-[3] bg-warn-bg-muted" title={tr('bmi_tick_solid', lang)} />
                      <div className="flex-[4] bg-danger-bg" title={tr('bmi_tick_forward', lang)} />
                      <div className="flex-[4] bg-brand-soft" title={tr('bmi_tick_big_forward', lang)} />
                    </div>
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-brand border-2 border-on-brand shadow-md transition-[left] duration-300"
                      style={{ left: `calc(${bmiGaugePosition(bmi) * 100}% - 7px)` }}
                      aria-hidden
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-fg-muted font-bold">
                    <span>18</span><span>22</span><span>26</span><span>30</span><span>35</span>
                  </div>
                </div>

                <p className="text-sm font-bold text-fg-emphasis">{bmiLabel(bmi, position, lang)}</p>
                <p className="text-[11px] text-fg-muted leading-relaxed">
                  {tr('bmi_disclaimer', lang)}
                </p>
              </div>
            )}

            {(!validHeight || !validWeight) && (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="w-full py-3 rounded-2xl border border-border-dashed-app text-sm font-bold text-fg-muted hover:border-layer-20 hover:text-fg-soft transition-all"
              >
                {tr('step4_skip', lang)}
              </button>
            )}
          </div>
        )}

        {/* ── Step 6 : Résumé ── */}
        {step === 6 && (
          <div className="space-y-6">
            {/* Hero : illustration du poste choisi */}
            {position && (() => {
              const posData = POSITIONS.find((p) => p.value === position)
              if (!posData) return null
              return (
                <div className="flex flex-col items-center pt-4 pb-4">
                  <div
                    className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-brand bg-brand flex items-center justify-center"
                    style={{ filter: 'drop-shadow(0 8px 24px var(--color-accent-glow))' }}
                  >
                    <img
                      src={posData.illustration}
                      alt={posData.label}
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  </div>
                  <p className="mt-4 text-[10px] font-black tracking-widest text-brand-tint uppercase italic">
                    {posData.label}
                  </p>
                </div>
              )
            })()}

            <StepTitle
              title={tr('step5_title', lang)}
              sub={tr('step5_sub', lang)}
            />

            <div className="bg-layer-5 border border-border-app rounded-[1.75rem] overflow-hidden divide-y divide-border-app">
              <SummaryRow label={tr('step5_row_position', lang)} value={POSITIONS.find((p) => p.value === position)?.label ?? '–'} />
              <SummaryRow
                label={tr('step5_row_equipment', lang)}
                value={EQUIPMENT_PRESETS.find((p) => p.value === equipmentPreset)?.label ?? '–'}
              />
              {showGymTrainingLevel && (
                <SummaryRow label={tr('step5_row_level', lang)} value={TRAINING_LEVELS.find((l) => l.value === trainingLevel)?.label ?? '–'} />
              )}
              <SummaryRow label={tr('step5_row_sessions', lang)} value={`${sessions} ${tr('step5_sessions_per_week', lang)}`} />
              <SummaryRow
                label={tr('step5_row_season', lang)}
                value={[
                  SEASON_PHASES.find((p) => p.value === seasonPhase)?.label ?? '–',
                  TRAINING_BASELINES.find((b) => b.value === trainingBaseline)?.label ?? '',
                ].filter(Boolean).join(' · ')}
              />
              {scSchedule && scSchedule.sessions.length > 0 && (
                <SummaryRow
                  label={tr('step5_row_gym', lang)}
                  value={scSchedule.sessions.map((s) => DAY_LABELS[s.day]).join(' · ')}
                />
              )}
              {validHeight && validWeight && bmi && (
                <SummaryRow
                  label={tr('step5_row_morpho', lang)}
                  value={`${parsedHeight} cm · ${parsedWeight} kg · ${tr('bmi_imc_rugby', lang)} ${bmi.toFixed(1)}`}
                />
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
              {tr('step5_cta', lang)}
            </button>
          </div>
        )}

      </main>

      {/* ── CTA flottant principal (steps 0–3, 5) ── */}
      {step !== 4 && step !== 6 && (
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-5 bg-gradient-to-t from-app via-app/95 to-transparent pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="w-full h-14 rounded-full bg-brand hover:bg-brand-hover disabled:opacity-30 disabled:cursor-not-allowed text-on-brand font-bold flex items-center justify-center gap-2 transition-all shadow-brand-float active:scale-[.98] rf-focus-ring"
            >
              {tr('onboarding_next', lang)}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── CTA step 4 : Planning ── */}
      {step === 4 && (
        <div className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-5 bg-gradient-to-t from-app via-app/95 to-transparent pointer-events-none">
          <div className="max-w-md mx-auto space-y-2 pointer-events-auto">
            <button
              type="button"
              onClick={handleClubScheduleNext}
              className="w-full h-14 rounded-full bg-brand hover:bg-brand-hover text-on-brand font-bold flex items-center justify-center gap-2 transition-all shadow-brand-float active:scale-[.98] rf-focus-ring"
            >
              {tr('onboarding_next', lang)}
              <ChevronRight className="w-4 h-4" />
            </button>
            {!isOffSeason && (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="w-full py-2.5 rounded-2xl text-sm font-bold text-fg-muted hover:text-fg-soft transition-colors text-center"
              >
                {tr('step3_skip_club', lang)}
              </button>
            )}
          </div>
        </div>
      )}

      <NotificationOptInSheet
        open={notifPromptOpen}
        variant="onboarding"
        lang={lang}
        isLoading={notifPromptLoading}
        onEnable={handleNotifPromptEnable}
        onLater={handleNotifPromptLater}
      />

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
