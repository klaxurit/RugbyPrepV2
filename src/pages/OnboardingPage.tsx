import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, CheckCircle2, Check,
  Dumbbell, Home, Building2, StretchHorizontal,
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
import { userScopedKey } from '../services/storage/userScopedStorage'
import { posthog } from '../services/analytics/posthog'
import { trackOnboardingStep } from '../services/analytics/activationEvents'
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
  DayOfWeek,
  TrainingLevel,
  PopulationSegment,
  SeasonMode,
} from '../types/training'
import {
  buildDefaultScSchedule,
  ONBOARDING_DEFAULT_TRAINING_BASELINE,
  resolveOnboardingSeasonPhase,
} from '../services/onboarding/onboardingDefaults'
import { TRAINING_DAYS_DEFAULT } from '../services/program/scheduleOptimizer'
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

  useEffect(() => {
    trackOnboardingStep(step)
  }, [step])

  const [position, setPosition] = useState<PositionValue | null>(null)
  const [equipmentPreset, setEquipmentPreset] = useState<EquipmentPreset | null>(null)
  const [trainingLevel, setTrainingLevel] = useState<TrainingLevel | null>(null)
  const ageBand = 'adult' as const
  const [sessions, setSessions] = useState<2 | 3 | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [notifPromptOpen, setNotifPromptOpen] = useState(false)
  const [notifPromptLoading, setNotifPromptLoading] = useState(false)
  const [pendingDestination, setPendingDestination] = useState<string | null>(null)
  const [savedProfileForNotifs, setSavedProfileForNotifs] = useState<UserProfile | null>(null)

  const notifProfile = savedProfileForNotifs ?? existingProfile ?? DEFAULT_PROFILE
  const { subscribe: notifSubscribe } = useNotifications(notifProfile)

  const showGymTrainingLevel = asksGymTrainingLevelForPreset(equipmentPreset ?? 'bodyweight')

  const lang: Lang = ((existingProfile?.preferredLanguage as Lang | undefined) ?? 'fr')
  const POSITIONS = getPositions(lang)
  const TRAINING_LEVELS = getTrainingLevels(lang)
  const EQUIPMENT_PRESETS = getEquipmentPresets(lang)
  const DAY_LABELS = dayAbbrArray(lang)

  const STEPS = [
    tr('step_position', lang),
    tr('step_equipment', lang),
    tr('step_profile', lang),
    tr('step_summary', lang),
  ]
  const progress = (step / (STEPS.length - 1)) * 100
  const isSummaryStep = step === STEPS.length - 1

  const canNext = () => {
    if (step === 0) return position !== null
    if (step === 1) return equipmentPreset !== null
    if (step === 2) {
      const levelOk = showGymTrainingLevel ? Boolean(trainingLevel) : true
      return levelOk && sessions !== null
    }
    return true
  }

  const completeOnboardingNavigation = (destination: string) => {
    navigate(destination, { replace: true })
  }

  const handleFinish = async () => {
    try {
      const resolvedTrainingLevel = resolveOnboardingTrainingLevel(equipmentPreset, trainingLevel)
      const levelDef = TRAINING_LEVELS.find((l) => l.value === resolvedTrainingLevel)!
      const existingSegment = existingProfile?.populationSegment
      const derivedPopulationSegment: PopulationSegment =
        existingSegment === 'female_senior' || existingSegment === 'u18_female'
          ? existingSegment
          : existingSegment && existingSegment !== 'unknown'
            ? existingSegment
            : 'unknown'

      const seasonPhase = resolveOnboardingSeasonPhase()
      const derivedSeasonMode: SeasonMode = seasonPhase
      const nextAnchors: NonNullable<UserProfile['planningAnchors']> = {
        ...(existingProfile?.planningAnchors ?? {}),
        onboardingCycleHint: seasonPhase,
      }
      if (seasonPhase === 'off_season') {
        const todayIso = new Date().toISOString().slice(0, 10)
        nextAnchors.offSeasonStartAt = startOfIsoWeek(todayIso)
      }

      const scSchedule = buildDefaultScSchedule(sessions!)

      const profilePayload = {
        position: position!,
        rugbyPosition: position!,
        level: levelDef.legacyLevel,
        trainingLevel: resolvedTrainingLevel,
        seasonMode: derivedSeasonMode,
        trainingBaseline: existingProfile?.trainingBaseline ?? ONBOARDING_DEFAULT_TRAINING_BASELINE,
        planningAnchors: nextAnchors,
        performanceFocus: 'balanced' as const,
        weeklySessions: sessions!,
        equipment: resolveEquipmentFromPreset(equipmentPreset!),
        scSchedule,
        ageBand,
        populationSegment: derivedPopulationSegment,
      }
      updateProfile(profilePayload, { source: 'onboarding' })

      window.localStorage.setItem(
        userScopedKey('rugbyprep.onboarding.completedAt', userId),
        new Date().toISOString().slice(0, 10),
      )

      if (userId) void markOnboardingComplete(userId)
      posthog.capture('onboarding_completed', {
        position, trainingLevel: resolvedTrainingLevel, ageBand,
        populationSegment: derivedPopulationSegment,
        performanceFocus: 'balanced',
        sessions,
        seasonPhase,
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

        {/* ── Step 2 : Niveau (salle) + Séances ── */}
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
                  { value: 2 as const, label: tr('sessions_2_label', lang), sub: tr('sessions_2_sub', lang), days: new Set<DayOfWeek>(TRAINING_DAYS_DEFAULT[2]) },
                  { value: 3 as const, label: tr('sessions_3_label', lang), sub: tr('sessions_3_sub', lang), days: new Set<DayOfWeek>(TRAINING_DAYS_DEFAULT[3]) },
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

          </div>
        )}

        {/* ── Résumé ── */}
        {isSummaryStep && (
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
              {sessions && (
                <SummaryRow
                  label={tr('step5_row_gym', lang)}
                  value={TRAINING_DAYS_DEFAULT[sessions].map((d) => DAY_LABELS[d]).join(' · ')}
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

      {!isSummaryStep && (
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
