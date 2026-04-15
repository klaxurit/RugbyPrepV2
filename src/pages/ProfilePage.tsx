import { Link } from 'react-router-dom'
import { useMemo, useRef, useState, useEffect } from 'react'
import { posthog } from '../services/analytics/posthog'
import type { ChangeEvent } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Dumbbell, RefreshCw, User, Camera, Bell, BellOff, BellRing, Ruler, Calendar, RotateCcw, ChevronDown, LogOut } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { PremiumUpsellCard } from '../components/PremiumUpsellCard'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { useFeatureAccess } from '../hooks/useFeatureAccess'
import { usePremiumCheckout } from '../hooks/usePremiumCheckout'
import { useUpsellTiming, isDismissed, dismissUpsell } from '../hooks/useUpsellTiming'
import { useNotifications } from '../hooks/useNotifications'
import { BottomNav } from '../components/BottomNav'
import { useCalendar } from '../hooks/useCalendar'
import { getToday } from '../services/ui/debugDateOverride'
import { detectAnnualPlanningContext } from '../services/season/detectAnnualPlanningContext'
import type { AnnualCycle } from '../types/annualPlanning'
import type { TransitionEntry } from '../types/training'
import { appendTransitionEntry, restoreLastTransition, cycleToSeasonMode } from '../services/season/transitionJournal'
import type { AuthError } from '../types/auth'
import type {
  Equipment,
  TrainingLevel,
} from '../types/training'
import { getCroppedImageFile } from '../services/ui/imageCrop'

/** Équipements "rares" qu'une salle peut ne pas avoir — l'utilisateur décoche ce qui manque. */
const RARE_EQUIPMENT_OPTIONS: { value: Exclude<Equipment, 'none'>; label: string }[] = [
  { value: 'cable',        label: 'Poulie / Câble' },
  { value: 'machine',      label: 'Machines guidées' },
  { value: 'landmine',     label: 'Landmine' },
  { value: 'tbar_row',     label: 'T-Bar Row' },
  { value: 'ghd',          label: 'GHD (Glute-Ham)' },
  { value: 'med_ball',     label: 'Médecine Ball' },
  { value: 'ab_wheel',     label: 'Ab Wheel' },
  { value: 'sprint_track', label: 'Piste / Gazon' },
]

const POSITION_OPTIONS = [
  { value: 'FRONT_ROW', label: 'Première ligne' },
  { value: 'SECOND_ROW', label: 'Deuxième ligne' },
  { value: 'BACK_ROW', label: 'Troisième ligne' },
  { value: 'HALF_BACKS', label: 'Demi (9/10)' },
  { value: 'CENTERS', label: 'Centre' },
  { value: 'BACK_THREE', label: 'Ailier / Arrière' },
] as const

const TRAINING_LEVELS: {
  value: TrainingLevel
  label: string
  sub: string
  emoji: string
  legacyLevel: 'beginner' | 'intermediate'
}[] = [
  { value: 'starter',     label: 'Fondations',    sub: 'Machines guidées & bases techniques', emoji: '🌱', legacyLevel: 'beginner' },
  { value: 'performance', label: 'Avancé',         sub: 'Barre + blocs de contraste',       emoji: '🏆', legacyLevel: 'intermediate' },
]

const LANGUAGE_OPTIONS = [
  { value: 'fr' as const, label: 'Français', sub: 'Programme affiché en français' },
  { value: 'en' as const, label: 'English', sub: 'Program and exercises in english' },
]

function getVisibleTrainingLevel(level: TrainingLevel | undefined): Exclude<TrainingLevel, 'builder'> {
  if (level === 'starter') return 'starter'
  return 'performance'
}

const toggleValue = <T,>(list: T[], value: T): T[] =>
  list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value]

const avatarErrorLabel: Record<AuthError, string> = {
  EMAIL_EXISTS: 'Impossible de mettre à jour la photo.',
  INVALID_CREDENTIALS: 'Session invalide. Reconnecte-toi.',
  WEAK_PASSWORD: 'Impossible de mettre à jour la photo.',
  INVALID_EMAIL: 'Impossible de mettre à jour la photo.',
  RATE_LIMIT: 'Trop de tentatives. Réessaie dans 1 à 2 minutes.',
  EMAIL_CONFIRMATION_REQUIRED: 'Confirme ton email pour continuer.',
  INVALID_FILE_TYPE: 'Format invalide. Utilise une image JPG, PNG ou WEBP.',
  FILE_TOO_LARGE: 'Image trop lourde. Taille max: 5 MB.',
  UPLOAD_FAILED: 'Upload impossible pour le moment.',
}

export function ProfilePage() {
  const { profile, updateProfile, resetProfile } = useProfile()
  const { authState, updateAvatar, signOut } = useAuth()
  const { features, isPremium, refresh: refreshEntitlements } = useFeatureAccess()
  const { visibleEvents, structuralEvents } = useCalendar()
  const { canShowUpsell } = useUpsellTiming()
  const {
    loading: billingLoading,
    error: billingError,
    message: billingMessage,
    startCheckout,
    restorePurchases,
    isPlayStore,
  } = usePremiumCheckout()
  const [profileUpsellDismissed, setProfileUpsellDismissed] = useState(() => isDismissed('profile_premium'))
  const {
    status: notifStatus,
    errorMessage: notifErrorMessage,
    subscribe: notifSubscribe,
    unsubscribe: notifUnsubscribe,
  } = useNotifications(profile)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [isAvatarUploading, setIsAvatarUploading] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [cropImageMimeType, setCropImageMimeType] = useState('image/jpeg')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [heightInput, setHeightInput] = useState(profile.heightCm?.toString() ?? '')
  const [weightInput, setWeightInput] = useState(profile.weightKg?.toString() ?? '')
  const [equipmentOpen, setEquipmentOpen] = useState(false)

  // Sync inputs quand le profil charge depuis Supabase
  useEffect(() => {
    setHeightInput(profile.heightCm?.toString() ?? '')
    setWeightInput(profile.weightKg?.toString() ?? '')
  }, [profile.heightCm, profile.weightKg])

  // ── "Ma situation" derived data ──────────────────────────────────────
  const today = useMemo(() => getToday(), [])
  const situationData = useMemo(() => {
    const CYCLE_LABELS: Record<AnnualCycle, string> = {
      in_season: 'En saison',
      off_season: 'Inter-saison',
      pre_season: 'Pré-saison',
      playoffs: 'Phase finale',
    }

    // Derive cycle from real annual context detection (lightweight call)
    let detectedCycle: AnnualCycle = profile.seasonMode ?? 'in_season'
    try {
      const ctx = detectAnnualPlanningContext({
        events: structuralEvents.map((e) => ({ date: e.date, type: e.type })),
        today,
        weeklyFrequency: (profile.weeklySessions ?? 3) as 2 | 3 | 4,
        positionGroup: 'back_three',
        planningAnchors: profile.planningAnchors,
      })
      detectedCycle = ctx.cycle
    } catch {
      // Fallback to profile.seasonMode if detection fails
    }
    const cycleLabel = CYCLE_LABELS[detectedCycle] ?? 'En saison'

    // Next match
    const futureMatches = visibleEvents
      .filter((e) => e.type === 'match' && e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
    const nextMatch = futureMatches.length > 0 ? futureMatches[0] : null
    const nextMatchLabel = nextMatch
      ? new Date(nextMatch.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
      : 'Aucun match prévu'

    // Last known match date (for "La saison est finie")
    const pastMatches = visibleEvents
      .filter((e) => e.type === 'match' && e.date < today)
      .sort((a, b) => b.date.localeCompare(a.date))
    const lastMatchDate = pastMatches.length > 0 ? pastMatches[0].date : null

    return { cycleLabel, nextMatchLabel, lastMatchDate, nextMatch, detectedCycle }
  }, [profile.seasonMode, profile.weeklySessions, profile.planningAnchors, visibleEvents, structuralEvents, today])

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setAvatarError(null)
    const previewUrl = URL.createObjectURL(file)
    setCropImageSrc(previewUrl)
    setCropImageMimeType(file.type || 'image/jpeg')
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    event.target.value = ''
  }

  const handleCropCancel = () => {
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc)
    }
    setCropImageSrc(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }

  const handleCropComplete = (_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }

  const handleCropConfirm = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return

    setIsAvatarUploading(true)
    setAvatarError(null)

    try {
      const croppedFile = await getCroppedImageFile(cropImageSrc, croppedAreaPixels, cropImageMimeType)
      const result = await updateAvatar(croppedFile)

      if (!result.ok) {
        setAvatarError(avatarErrorLabel[result.error])
      }
    } catch {
      setAvatarError('Impossible de recadrer l’image.')
    } finally {
      setIsAvatarUploading(false)
      handleCropCancel()
    }
  }

  const handleRestorePlayPurchases = async () => {
    const restored = await restorePurchases()
    if (restored) {
      await refreshEntitlements()
    }
  }
  const resolvedAvatarUrl = authState.user?.avatarUrl ?? profile.avatarUrl

  return (
    <div className="min-h-screen bg-app font-sans text-fg pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(var(--color-grid-dot)_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader
        title="Mon Profil"
        backTo="/home"
        right={
          <button
            type="button"
            onClick={resetProfile}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-white/20 bg-white/15 text-xs font-bold text-shell-text-muted hover:bg-white/30 hover:text-shell-text transition-colors rf-focus-ring"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
        }
      />

      <main className="relative px-6 pt-6 space-y-5 max-w-md mx-auto">
        <section className="bg-layer-5 border border-border-app rounded-[24px] p-6 space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isAvatarUploading}
              className="relative w-24 h-24 rounded-3xl border border-border-app bg-layer-10 flex items-center justify-center overflow-hidden disabled:opacity-60"
              aria-label="Changer la photo de profil"
            >
              {resolvedAvatarUrl ? (
                <img
                  src={resolvedAvatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-fg-faint" />
              )}
              <span className="absolute right-1 bottom-1 w-6 h-6 rounded-xl bg-success-app text-on-success flex items-center justify-center">
                <Camera className="w-3.5 h-3.5" />
              </span>
            </button>
            <div>
              <h2 className="text-sm font-black text-fg">Photo de profil</h2>
              <p className="text-xs text-fg-muted">
                {isAvatarUploading ? 'Upload en cours...' : 'Ajoute ta photo pour personnaliser ton compte.'}
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          {avatarError && (
            <div className="p-3 bg-danger-bg border border-danger-bd rounded-2xl">
              <p className="text-xs text-danger font-medium">{avatarError}</p>
            </div>
          )}
        </section>

        {/* Infos de jeu */}
        <section className="bg-layer-5 border border-border-app rounded-[24px] p-6 space-y-5">
          <h2 className="text-sm font-black uppercase tracking-wider text-fg-muted">Infos de jeu</h2>

          {/* Poste */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">Poste</label>
            <div className="grid grid-cols-2 gap-2">
              {POSITION_OPTIONS.map((opt) => {
                const active = (profile.rugbyPosition ?? profile.position) === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateProfile({ rugbyPosition: opt.value })}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold text-left transition-all ${
                      active
                        ? 'bg-brand text-on-brand shadow-sm'
                        : 'bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Niveau d'entraînement */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">Niveau d'entraînement</label>
            <div className="flex flex-col gap-2">
              {TRAINING_LEVELS.map((opt) => {
                const active = getVisibleTrainingLevel(profile.trainingLevel) === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      updateProfile({
                        trainingLevel: opt.value,
                        level: opt.legacyLevel,
                      })
                    }
                    className={`flex items-center gap-3 py-2.5 px-3 rounded-2xl text-xs font-bold text-left transition-all ${
                      active
                        ? 'bg-brand text-on-brand shadow-sm'
                        : 'bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20'
                    }`}
                  >
                    <span className="text-base flex-shrink-0">{opt.emoji}</span>
                    <div>
                      <p className="font-black">{opt.label}</p>
                      <p className={`text-[10px] font-normal ${active ? 'text-on-brand/80' : 'text-fg-muted'}`}>{opt.sub}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Ma situation */}
          <div className="space-y-3" data-testid="ma-situation">
            <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">Ma situation</label>

            <div className="rounded-2xl border border-border-app bg-layer-5 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-fg-muted">Saison détectée</span>
                <span className="text-xs font-black text-fg" data-testid="situation-cycle">{situationData.cycleLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-fg-muted">Prochain match</span>
                <span className="text-xs font-bold text-fg-emphasis" data-testid="situation-next-match">{situationData.nextMatchLabel}</span>
              </div>
            </div>

            {profile.planningAnchors?.seasonEndedAt ? (
              <div className="space-y-2" id="reprise">
                <div className="flex items-center gap-2 py-2.5 px-3 rounded-2xl bg-ok-bg-muted border border-ok-bd" data-testid="situation-confirmed">
                  <span className="text-xs font-bold text-ok-strong">Saison terminée — programme inter-saison actif</span>
                </div>

                {/* Pre-season return date */}
                {profile.planningAnchors?.returnToTeamTrainingAt ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-brand-soft border border-brand-border" data-testid="situation-return-set">
                      <span className="text-xs font-bold text-brand-tint">
                        Reprise le {new Date(profile.planningAnchors.returnToTeamTrainingAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                      </span>
                      <button
                        type="button"
                        data-testid="situation-clear-return"
                        onClick={() => {
                          const cleanAnchors = { ...profile.planningAnchors }
                          delete cleanAnchors.returnToTeamTrainingAt
                          updateProfile({ planningAnchors: cleanAnchors })
                        }}
                        className="text-[10px] font-bold text-brand-muted hover:text-brand-tint"
                      >
                        Modifier
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-fg-faint">Tu connais ta date de reprise au club ?</p>
                    <input
                      type="date"
                      data-testid="situation-return-date"
                      min={today}
                      onChange={(e) => {
                        if (!e.target.value) return
                        updateProfile({
                          planningAnchors: {
                            ...profile.planningAnchors,
                            returnToTeamTrainingAt: e.target.value,
                          },
                          seasonMode: 'pre_season',
                        })
                      }}
                      style={{ colorScheme: 'dark' }}
                      className="w-full py-2.5 px-3 rounded-2xl text-xs font-bold bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20 transition-all [&::-webkit-calendar-picker-indicator]:brightness-[0.7] [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>
                )}

                <button
                  type="button"
                  data-testid="situation-resume-season"
                  onClick={() => {
                    const restored = restoreLastTransition(profile.seasonTransitionState)
                    if (restored) {
                      // Restore via journal — derive seasonMode from the cycle before transition
                      updateProfile({
                        planningAnchors: restored.restoredAnchors,
                        seasonMode: cycleToSeasonMode(restored.restoredCycle),
                        seasonTransitionState: restored.updatedTransitionState,
                      })
                    } else {
                      // Fallback: simple clear (no journal entry to restore)
                      const cleanAnchors = { ...profile.planningAnchors }
                      delete cleanAnchors.seasonEndedAt
                      delete cleanAnchors.seasonEndedSource
                      delete cleanAnchors.returnToTeamTrainingAt
                      updateProfile({
                        planningAnchors: cleanAnchors,
                        seasonMode: 'in_season',
                      })
                    }
                  }}
                  className="py-2.5 px-3 rounded-2xl text-xs font-bold text-left bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20 transition-all"
                >
                  En fait, la saison reprend
                </button>
              </div>
            ) : (
              <>
                <p className="text-[10px] text-fg-faint">Quelque chose a changé ?</p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    data-testid="situation-season-ended"
                    onClick={() => {
                      const anchor = situationData.lastMatchDate ?? today
                      const prevAnchors = { ...profile.planningAnchors }
                      const entry: TransitionEntry = {
                        id: `t-${Date.now()}`,
                        at: today,
                        trigger: 'user_manual',
                        from: {
                          cycle: situationData.detectedCycle ?? 'in_season',
                          weekNumber: 1,
                          schedulingMode: 'calendar',
                        },
                        anchorsSnapshot: prevAnchors,
                        to: 'off_season',
                      }
                      const cleanAnchors = { ...prevAnchors }
                      delete cleanAnchors.manualPlayoffs
                      updateProfile({
                        planningAnchors: { ...cleanAnchors, seasonEndedAt: anchor, seasonEndedSource: 'manual' },
                        seasonMode: 'off_season',
                        seasonTransitionState: appendTransitionEntry(profile.seasonTransitionState, entry),
                      })
                    }}
                    className="py-2.5 px-3 rounded-2xl text-xs font-bold text-left bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20 transition-all"
                  >
                    La saison est finie
                  </button>
                  <button
                    type="button"
                    data-testid="situation-no-match"
                    onClick={() => {
                      const prevAnchors = { ...profile.planningAnchors }
                      const entry: TransitionEntry = {
                        id: `t-${Date.now()}`,
                        at: today,
                        trigger: 'user_manual',
                        from: {
                          cycle: situationData.detectedCycle ?? 'in_season',
                          weekNumber: 1,
                          schedulingMode: 'calendar',
                        },
                        anchorsSnapshot: prevAnchors,
                        to: 'off_season',
                      }
                      const cleanAnchors = { ...prevAnchors }
                      delete cleanAnchors.manualPlayoffs
                      updateProfile({
                        planningAnchors: { ...cleanAnchors, seasonEndedAt: today, seasonEndedSource: 'manual' },
                        seasonMode: 'off_season',
                        seasonTransitionState: appendTransitionEntry(profile.seasonTransitionState, entry),
                      })
                    }}
                    className="py-2.5 px-3 rounded-2xl text-xs font-bold text-left bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20 transition-all"
                  >
                    Je n'ai plus de match pour l'instant
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">Langue du programme</label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGE_OPTIONS.map((opt) => {
                const active = (profile.preferredLanguage ?? 'fr') === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateProfile({ preferredLanguage: opt.value })}
                    className={`py-2.5 px-3 rounded-2xl text-left transition-all ${
                      active
                        ? 'bg-brand text-on-brand shadow-sm'
                        : 'bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20'
                    }`}
                  >
                    <p className="text-xs font-black">{opt.label}</p>
                    <p className={`mt-0.5 text-[10px] ${active ? 'text-on-brand/80' : 'text-fg-muted'}`}>{opt.sub}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Séances / semaine */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">Séances / semaine</label>
            <div className="grid grid-cols-2 gap-2">
              {[2, 3].map((n) => {
                const active = profile.weeklySessions === n
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => updateProfile({ weeklySessions: n as 2 | 3 })}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-brand text-on-brand shadow-sm'
                        : 'bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20'
                    }`}
                  >
                    {n} séances
                  </button>
                )
              })}
            </div>
          </div>

        </section>

        {/* Morphologie */}
        <section className="bg-layer-5 border border-border-app rounded-[2rem] p-6 space-y-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-violet-50 text-violet-600 border border-violet-200">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-fg">Morphologie</h2>
              <p className="text-xs text-fg-muted">Taille, poids et IMC</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">Taille (cm)</label>
              <input
                type="number"
                inputMode="numeric"
                min={140}
                max={230}
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value)}
                onBlur={() => {
                  const v = parseInt(heightInput, 10)
                  if (!isNaN(v) && v >= 140 && v <= 230) updateProfile({ heightCm: v })
                }}
                placeholder="182"
                className="w-full h-11 rounded-2xl border border-border-app bg-layer-5 px-3 text-sm font-black text-fg placeholder:text-fg-ghost focus:outline-none focus:border-brand rf-focus-ring"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">Poids (kg)</label>
              <input
                type="number"
                inputMode="decimal"
                min={40}
                max={200}
                step={0.5}
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                onBlur={() => {
                  const v = parseFloat(weightInput.replace(',', '.'))
                  if (!isNaN(v) && v >= 40 && v <= 200) updateProfile({ weightKg: v })
                }}
                placeholder="95"
                className="w-full h-11 rounded-2xl border border-border-app bg-layer-5 px-3 text-sm font-black text-fg placeholder:text-fg-ghost focus:outline-none focus:border-brand rf-focus-ring"
              />
            </div>
          </div>

          {profile.heightCm && profile.weightKg && (() => {
            const h = profile.heightCm / 100
            const bmi = profile.weightKg / (h * h)
            const isForward = profile.rugbyPosition === 'FRONT_ROW' || profile.rugbyPosition === 'SECOND_ROW' || profile.rugbyPosition === 'BACK_ROW'
            const label =
              bmi < 20 ? 'Sous le poids de forme' :
              bmi < 24 ? (isForward ? 'Plutôt léger pour un avant' : 'Morphologie optimale') :
              bmi < 27 ? (isForward ? 'Morphologie adéquate' : 'Légèrement au-dessus') :
              bmi < 31 ? (isForward ? 'Morphologie optimale pour un avant' : 'Au-dessus de la norme') :
              (isForward ? 'Gabarit de gros avant' : 'Surcharge à surveiller')
            return (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-violet-50 border border-violet-200">
                <div>
                  <p className="text-xs font-bold text-violet-600 uppercase tracking-wide">IMC</p>
                  <p className="text-sm font-bold text-fg-emphasis mt-0.5">{label}</p>
                </div>
                <span className="text-2xl font-black text-violet-600">{bmi.toFixed(1)}</span>
              </div>
            )
          })()}
        </section>

        {/* Équipement manquant — collapsible, visible pour tous les niveaux */}
        <section className="bg-layer-5 border border-border-app rounded-[24px] overflow-hidden">
          <button
            type="button"
            onClick={() => setEquipmentOpen((o) => !o)}
            className="w-full p-6 flex items-center gap-3 text-left"
          >
            <div className="p-2 rounded-2xl bg-info-bg text-info border border-info-bd flex-shrink-0">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-black text-fg">Équipement manquant dans ta salle ?</h2>
              <p className="text-xs text-fg-muted">Décoche ce que ta salle n&apos;a pas</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-fg-muted transition-transform ${equipmentOpen ? 'rotate-180' : ''}`} />
          </button>
          {equipmentOpen && (
            <div className="px-6 pb-6 space-y-3">
              <p className="text-xs text-fg-soft leading-relaxed">
                Tout est coché par défaut. Décoche uniquement le matériel que ta salle ne possède pas.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {RARE_EQUIPMENT_OPTIONS.map(({ value, label }) => {
                  const active = profile.equipment.includes(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateProfile({ equipment: toggleValue(profile.equipment, value) })}
                      className={`py-2.5 px-3 rounded-xl text-left transition-all flex items-center gap-2 ${
                        active
                          ? 'bg-info-bg border border-info-bd text-fg'
                          : 'bg-layer-5 text-fg-soft border border-border-app line-through opacity-60'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-info' : 'bg-layer-20'}`} />
                      <span className="text-[11px] font-bold leading-tight">{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        <section className="bg-layer-5 border border-border-app rounded-[2rem] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-ok-bg-muted text-ok border border-ok-bd">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-fg">Club & calendrier</h2>
              <p className="text-xs text-fg-muted">Le club, la sync FFR, les matchs et le planning collectif se gèrent désormais depuis Calendrier.</p>
            </div>
          </div>
          <Link
            to="/calendar"
            className="flex items-center justify-between rounded-2xl border border-border-app bg-layer-6 px-4 py-3 text-sm font-semibold text-fg transition-colors hover:border-brand-border rf-focus-ring"
          >
            <span>Ouvrir le calendrier</span>
            <span className="text-xs text-fg-muted">Gérer</span>
          </Link>
        </section>

        {/* ─── Notifications ───────────────────────────────────────────── */}
        <section className="bg-layer-5 border border-border-app rounded-[2rem] p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-fg">Abonnement & accès</p>
              <p className="text-xs text-fg-muted mt-0.5">
                La sécurité et le programme de base restent inclus, quel que soit le plan.
              </p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide ${
              isPremium
                ? 'bg-brand-medium text-brand-tint'
                : 'bg-layer-10 text-fg-soft'
            }`}>
              {isPremium ? 'PREMIUM' : 'FREE'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`rounded-2xl border p-3 ${features.programBasic ? 'border-ok-bd bg-ok-bg-muted text-ok' : 'border-border-app bg-layer-5 text-fg-muted'}`}>
              Programme de base
            </div>
            <div className={`rounded-2xl border p-3 ${features.notificationsBasic ? 'border-ok-bd bg-ok-bg-muted text-ok' : 'border-border-app bg-layer-5 text-fg-muted'}`}>
              Rappels standards
            </div>
            <div className={`rounded-2xl border p-3 ${features.athleticTestsBasic ? 'border-ok-bd bg-ok-bg-muted text-ok' : 'border-border-app bg-layer-5 text-fg-muted'}`}>
              Tests basiques
            </div>
            <div className={`rounded-2xl border p-3 ${features.calendarBasic ? 'border-ok-bd bg-ok-bg-muted text-ok' : 'border-border-app bg-layer-5 text-fg-muted'}`}>
              Planning & matchs
            </div>
            <div className={`rounded-2xl border p-3 ${features.premiumProgramAdaptations ? 'border-brand-border bg-brand-soft text-brand-tint' : 'border-border-app bg-layer-5 text-fg-muted'}`}>
              Suggestions de charge
            </div>
            <div className={`rounded-2xl border p-3 ${features.premiumAnalytics ? 'border-brand-border bg-brand-soft text-brand-tint' : 'border-border-app bg-layer-5 text-fg-muted'}`}>
              Analytics détaillées
            </div>
            <div className={`rounded-2xl border p-3 ${features.premiumAnalytics ? 'border-brand-border bg-brand-soft text-brand-tint' : 'border-border-app bg-layer-5 text-fg-muted'}`}>
              Score de forme
            </div>
            <div className={`rounded-2xl border p-3 ${features.premiumAnalytics ? 'border-brand-border bg-brand-soft text-brand-tint' : 'border-border-app bg-layer-5 text-fg-muted'}`}>
              Bilan de semaine
            </div>
            <div className={`rounded-2xl border p-3 ${features.premiumAnalytics ? 'border-brand-border bg-brand-soft text-brand-tint' : 'border-border-app bg-layer-5 text-fg-muted'}`}>
              Records personnels
            </div>
            <div className={`rounded-2xl border p-3 ${features.premiumAnalytics ? 'border-brand-border bg-brand-soft text-brand-tint' : 'border-border-app bg-layer-5 text-fg-muted'}`}>
              Chat IA illimité
            </div>
          </div>


          {!isPremium && canShowUpsell && !profileUpsellDismissed && (
            <PremiumUpsellCard
              title="Débloque les fonctionnalités avancées"
              body="Score de forme, bilan de semaine, records personnels, suggestions de charge, analytics détaillées et chat IA illimité."
              onDismiss={() => {
                dismissUpsell('profile_premium')
                setProfileUpsellDismissed(true)
              }}
            />
          )}

          {!isPremium && (
            <div className="rounded-[24px] border border-border-app bg-layer-6 p-4 space-y-3">
              <div>
                <p className="text-sm font-black text-fg">Gestion de l’abonnement</p>
                <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                  Active Premium depuis l’app, puis restaure ton achat Google Play ici si tu changes d’appareil ou si l’accès n’apparaît pas encore.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void startCheckout('premium_monthly')
                  }}
                  disabled={billingLoading}
                  className="inline-flex items-center justify-center rounded-2xl bg-brand px-4 py-2 text-xs font-black text-on-brand transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 rf-focus-ring"
                >
                  {billingLoading ? 'Chargement...' : 'Activer Premium'}
                </button>
                {isPlayStore && (
                  <button
                    type="button"
                    onClick={() => {
                      void handleRestorePlayPurchases()
                    }}
                    disabled={billingLoading}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-border-app px-4 py-2 text-xs font-bold text-fg-muted transition-colors hover:border-brand-border hover:text-fg disabled:cursor-not-allowed disabled:opacity-50 rf-focus-ring"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restaurer mes achats
                  </button>
                )}
              </div>
              {billingMessage && (
                <p className="text-[11px] leading-relaxed text-brand-tint">{billingMessage}</p>
              )}
              {billingError && (
                <div className="p-3 bg-danger-bg border border-danger-bd rounded-2xl">
                  <p className="text-xs text-danger font-medium">{billingError}</p>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="bg-layer-5 border border-border-app rounded-[2rem] p-5 space-y-4">
          <div>
            <p className="text-sm font-black text-fg">Compte & données</p>
            <p className="text-xs text-fg-muted mt-0.5">
              Gère tes informations légales, la confidentialité et la suppression de compte.
            </p>
          </div>

          <div className="grid gap-2">
            <Link
              to="/legal"
              className="flex items-center justify-between rounded-2xl border border-border-app bg-layer-6 px-4 py-3 text-sm font-semibold text-fg transition-colors hover:border-brand-border rf-focus-ring"
            >
              <span>Mentions légales et confidentialité</span>
              <span className="text-xs text-fg-muted">Ouvrir</span>
            </Link>
            <Link
              to="/delete-account"
              className="flex items-center justify-between rounded-2xl border border-warn-bd bg-warn-bg-muted px-4 py-3 text-sm font-semibold text-warn-body transition-colors hover:border-warn-strong rf-focus-ring"
            >
              <span>Demander la suppression du compte</span>
              <span className="text-xs text-warn-strong">Ouvrir</span>
            </Link>
          </div>
        </section>

        <section className="bg-layer-5 border border-border-app rounded-[2rem] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${notifStatus === 'subscribed' ? 'bg-ok-bg-muted text-ok border border-ok-bd' : 'bg-layer-10 text-fg-muted'}`}>
                {notifStatus === 'subscribed' ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-black text-fg">Rappels d'entraînement</p>
                <p className="text-xs text-fg-muted mt-0.5">
                  {notifStatus === 'subscribed' && 'Activés — notification chaque jour de séance'}
                  {notifStatus === 'denied' && 'Bloqués — autorise les notifs dans les réglages'}
                  {notifStatus === 'unsupported' && 'Non supporté par ce navigateur'}
                  {notifStatus === 'no_vapid' && 'Configuration manquante (VAPID)'}
                  {(notifStatus === 'idle' || notifStatus === 'loading') && 'Reçois un push chaque jour de séance'}
                </p>
                {notifErrorMessage && (
                  <p className="mt-1 text-[11px] text-danger-soft">
                    {notifErrorMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {notifStatus === 'subscribed' ? (
                <button
                  type="button"
                  onClick={notifUnsubscribe}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-border-app text-xs font-bold text-fg-muted hover:border-danger-bd hover:text-danger transition-colors rf-focus-ring"
                >
                  <BellOff className="w-3 h-3" />
                  Désactiver
                </button>
              ) : notifStatus === 'idle' ? (
                <button
                  type="button"
                  onClick={notifSubscribe}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-brand text-on-brand text-xs font-black hover:bg-brand-hover transition-colors shadow-brand-float rf-focus-ring"
                >
                  <Bell className="w-3 h-3" />
                  Activer
                </button>
              ) : notifStatus === 'loading' ? (
                <span className="text-xs text-fg-muted animate-pulse">...</span>
              ) : null}
            </div>
          </div>
        </section>

      </main>

      {cropImageSrc && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <section className="w-full sm:max-w-md bg-app border border-border-app rounded-t-[24px] sm:rounded-[24px] p-5 space-y-4">
            <div>
              <h3 className="text-sm font-black text-fg">Recadrer la photo</h3>
              <p className="text-xs text-fg-muted">Centre ton visage puis ajuste le zoom.</p>
            </div>

            <div className="relative h-72 bg-layer-10 rounded-2xl overflow-hidden">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="avatar-zoom" className="text-xs font-bold text-fg-muted uppercase tracking-wider">
                Zoom
              </label>
              <input
                id="avatar-zoom"
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-brand"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCropCancel}
                className="py-3 rounded-2xl border border-border-app bg-layer-5 text-xs font-bold text-fg-soft hover:border-layer-20 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                disabled={isAvatarUploading}
                className="py-3 rounded-2xl bg-brand text-on-brand text-xs font-black uppercase tracking-wide opacity-95 hover:opacity-100 transition-opacity disabled:opacity-60 rf-focus-ring"
              >
                {isAvatarUploading ? 'Upload...' : 'Valider'}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Footer */}
      <footer className="px-4 py-6 flex flex-col items-center gap-3 text-center relative">
        <a
          href="mailto:support@rugbyforge.fr?subject=Feedback%20RugbyForge"
          onClick={() => posthog.capture('feedback_clicked')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand text-on-brand text-xs font-black uppercase tracking-wide opacity-95 hover:opacity-100 transition-opacity shadow-elevated rf-focus-ring"
        >
          Envoyer un feedback
        </a>
        <Link
          to="/legal"
          className="text-xs text-fg-muted hover:text-brand-tint transition-colors"
        >
          Mentions légales & Confidentialité
        </Link>
        {authState.status === 'authenticated' && (
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-danger-bd bg-danger-bg text-xs font-bold text-danger hover:bg-danger-bg-hover transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Se déconnecter
          </button>
        )}
        <p className="text-[10px] text-fg-ghost">RugbyForge v1.0</p>
      </footer>

      <BottomNav />
    </div>
  )
}
