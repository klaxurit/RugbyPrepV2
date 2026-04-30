import { Link } from 'react-router-dom'
import { useMemo, useRef, useState, useEffect } from 'react'
import { posthog } from '../services/analytics/posthog'
import type { ChangeEvent } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { RefreshCw, User, Camera, Bell, BellOff, BellRing, Ruler, Calendar, RotateCcw, LogOut, TrendingUp, Flag, ShieldCheck, Activity, Flame } from 'lucide-react'
import { CollapsibleSection } from '../components/ui'
import { ClubSettingsSection } from '../components/profile/ClubSettingsSection'
import { getPositionIllustration } from '../assets/positions'
import { PageHeader } from '../components/PageHeader'
import { PremiumUpsellCard } from '../components/PremiumUpsellCard'
import { useProfile } from '../hooks/useProfile'
import { useHistory } from '../hooks/useHistory'
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
import type { TrainingLevel, TrainingBaseline } from '../types/training'
import { isRestartRampUpActive, RESTART_RAMP_UP_DAYS } from '../services/program/restartRampUp'
import { getCroppedImageFile } from '../services/ui/imageCrop'
import { supabase } from '../services/supabase/client'

const POSITION_OPTIONS = [
  { value: 'FRONT_ROW', label: 'Première ligne' },
  { value: 'SECOND_ROW', label: 'Deuxième ligne' },
  { value: 'BACK_ROW', label: 'Troisième ligne' },
  { value: 'HALF_BACKS', label: 'Demi (9/10)' },
  { value: 'CENTERS', label: 'Centre' },
  { value: 'BACK_THREE', label: 'Ailier / Arrière' },
] as const

const TRAINING_BASELINES: {
  value: TrainingBaseline
  label: string
  sub: string
  icon: typeof RefreshCw
}[] = [
  { value: 'restart', label: 'Je reprends',     sub: '≥6 sem sans entraînement — rampe douce 2 sem',  icon: RefreshCw },
  { value: 'active',  label: 'Je suis actif',   sub: '1-2 séances/sem, irrégulier',                   icon: Activity },
  { value: 'peak',    label: 'En pleine forme', sub: '3×/sem depuis ≥1 mois',                         icon: Flame },
]

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

const CANCEL_REASONS = [
  { value: 'too_expensive', label: 'Trop cher' },
  { value: 'not_useful', label: 'Je n\'utilise pas assez les fonctions premium' },
  { value: 'missing_features', label: 'Il manque des fonctionnalités' },
  { value: 'bugs', label: 'Trop de bugs ou problèmes techniques' },
  { value: 'season_over', label: 'Ma saison est terminée' },
  { value: 'other', label: 'Autre' },
] as const

function ManageSubscriptionCard() {
  const [step, setStep] = useState<'info' | 'reasons' | 'submitted'>('info')
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')

  const handleSubmitAndRedirect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('cancel_feedback').insert({
          user_id: user.id,
          reason,
          detail: detail.trim() || null,
        })
      }
    } catch { /* best-effort */ }

    setStep('submitted')

    setTimeout(() => {
      window.open(
        'https://play.google.com/store/account/subscriptions?package=fr.rugbyforge.app',
        '_blank',
      )
    }, 1500)
  }

  if (step === 'submitted') {
    return (
      <div className="rounded-[24px] border border-border-app bg-layer-6 p-4 space-y-2">
        <p className="text-xs text-fg">Merci pour ton retour.</p>
        <p className="text-xs text-fg-muted">
          Tu vas etre redirige vers Google Play. Appuie sur <span className="font-bold">Annuler l&apos;abonnement</span> pour finaliser.
          Tu garderas l&apos;acces Premium jusqu&apos;a la fin de ta periode en cours.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[24px] border border-border-app bg-layer-6 p-4 space-y-3">
      <div>
        <p className="text-sm font-black text-fg">Mon abonnement</p>
        <p className="text-xs text-fg-muted mt-0.5">
          Ton abonnement Premium est actif. Le renouvellement est automatique via Google Play.
        </p>
      </div>

      {step === 'info' && (
        <button
          type="button"
          onClick={() => setStep('reasons')}
          className="w-full rounded-2xl border border-border-app px-4 py-2.5 text-xs font-bold text-fg-muted transition-colors hover:border-danger-bd hover:text-danger rf-focus-ring"
        >
          Annuler mon abonnement
        </button>
      )}

      {step === 'reasons' && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-fg">
            On est triste de te voir partir. Dis-nous pourquoi :
          </p>
          <div className="grid gap-1.5">
            {CANCEL_REASONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setReason(r.value)}
                className={`text-left px-3 py-2 rounded-xl border text-xs transition-colors ${
                  reason === r.value
                    ? 'border-brand bg-brand-soft font-bold text-fg'
                    : 'border-border-app bg-layer-5 text-fg-muted hover:border-brand-border'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {reason && (
            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Un detail a partager ? (optionnel)"
              rows={2}
              className="w-full rounded-xl border border-border-app bg-layer-5 px-3 py-2 text-xs text-fg placeholder:text-fg-muted/50 focus:border-brand focus:outline-none"
            />
          )}

          <p className="text-[10px] text-fg-muted leading-relaxed">
            L&apos;annulation se fait via Google Play. Tu garderas l&apos;acces Premium jusqu&apos;a la fin de ta periode en cours.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setStep('info'); setReason(''); setDetail('') }}
              className="flex-1 rounded-2xl border border-border-app px-4 py-2.5 text-xs font-bold text-fg-muted transition-colors hover:border-brand-border rf-focus-ring"
            >
              Rester Premium
            </button>
            <button
              type="button"
              disabled={!reason}
              onClick={() => void handleSubmitAndRedirect()}
              className="flex-1 rounded-2xl bg-danger px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-danger/90 disabled:opacity-50 rf-focus-ring"
            >
              Aller sur Google Play
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function getVisibleTrainingLevel(level: TrainingLevel | undefined): Exclude<TrainingLevel, 'builder'> {
  if (level === 'starter') return 'starter'
  return 'performance'
}

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
  const { logs } = useHistory()
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
  const [selectedPlan, setSelectedPlan] = useState<'premium_monthly' | 'premium_yearly'>('premium_yearly')
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
  // Scroll to #premium anchor when navigating from CTA
  useEffect(() => {
    if (window.location.hash === '#premium') {
      setTimeout(() => {
        document.getElementById('premium')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [])

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
      setAvatarError('Impossible de recadrer l\'image.')
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
  const positionIllustration = getPositionIllustration(profile.rugbyPosition ?? profile.position)

  return (
    <div className="min-h-screen bg-app font-sans text-fg pb-bottom-nav relative overflow-x-hidden">
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
              ) : positionIllustration ? (
                <img
                  src={positionIllustration}
                  alt="Avatar poste"
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

        {/* Forme du moment — auto-masqué après 14j ou ≥3 séances loggées (sauf rampe restart active).
            Lien "Modifier ma forme actuelle" pour le révéler à la demande (cas blessure / coupure). */}
        <FormeDuMomentSection
          profile={profile}
          loggedSessions={logs.length}
          onUpdateBaseline={(value) => updateProfile({ trainingBaseline: value })}
        />

        {/* Infos de jeu */}
        <CollapsibleSection
          title="Infos de jeu"
          subtitle="Poste, niveau, saison, fréquence"
          icon={<Flag className="w-4 h-4" />}
          iconClassName="bg-brand-soft text-brand-tint border border-brand-border"
          testId="profile-section-playinfo"
        >
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

            {(() => {
              const mode = situationData.detectedCycle ?? profile.seasonMode ?? 'in_season'

              // ── OFF-SEASON ───────────────────────────────────────────────
              if (mode === 'off_season') {
                const goInSeason = () => {
                  const restored = restoreLastTransition(profile.seasonTransitionState)
                  if (restored) {
                    updateProfile({
                      planningAnchors: restored.restoredAnchors,
                      seasonMode: cycleToSeasonMode(restored.restoredCycle),
                      seasonTransitionState: restored.updatedTransitionState,
                    })
                  } else {
                    const cleanAnchors = { ...profile.planningAnchors }
                    delete cleanAnchors.seasonEndedAt
                    delete cleanAnchors.seasonEndedSource
                    delete cleanAnchors.returnToTeamTrainingAt
                    updateProfile({ planningAnchors: cleanAnchors, seasonMode: 'in_season' })
                  }
                }
                return (
                  <div className="space-y-2" id="reprise">
                    <div className="flex items-center gap-2 py-2.5 px-3 rounded-2xl bg-ok-bg-muted border border-ok-bd" data-testid="situation-confirmed">
                      <span className="text-xs font-bold text-ok-strong">Inter-saison active — programme adapté</span>
                    </div>

                    {profile.planningAnchors?.returnToTeamTrainingAt ? (
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
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-fg-faint">La saison reprend bientôt ? Indique ta date de reprise au club.</p>
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
                      onClick={goInSeason}
                      className="py-2.5 px-3 rounded-2xl text-xs font-bold text-left bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20 transition-all"
                    >
                      Je rejoue déjà
                    </button>
                  </div>
                )
              }

              // ── PRE-SEASON ───────────────────────────────────────────────
              if (mode === 'pre_season') {
                return (
                  <div className="space-y-2" id="reprise">
                    <div className="flex items-center gap-2 py-2.5 px-3 rounded-2xl bg-brand-soft border border-brand-border" data-testid="situation-confirmed">
                      <span className="text-xs font-bold text-brand-tint">Pré-saison active — programme de reprise</span>
                    </div>

                    {profile.planningAnchors?.returnToTeamTrainingAt && (
                      <div className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-layer-5 border border-border-app" data-testid="situation-return-set">
                        <span className="text-xs font-bold text-fg-soft">
                          Reprise prévue le {new Date(profile.planningAnchors.returnToTeamTrainingAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                        </span>
                        <button
                          type="button"
                          data-testid="situation-clear-return"
                          onClick={() => {
                            const cleanAnchors = { ...profile.planningAnchors }
                            delete cleanAnchors.returnToTeamTrainingAt
                            updateProfile({ planningAnchors: cleanAnchors })
                          }}
                          className="text-[10px] font-bold text-fg-muted hover:text-fg"
                        >
                          Modifier
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      data-testid="situation-season-started"
                      onClick={() => {
                        const cleanAnchors = { ...profile.planningAnchors }
                        delete cleanAnchors.seasonEndedAt
                        delete cleanAnchors.seasonEndedSource
                        delete cleanAnchors.returnToTeamTrainingAt
                        updateProfile({ planningAnchors: cleanAnchors, seasonMode: 'in_season' })
                      }}
                      className="py-2.5 px-3 rounded-2xl text-xs font-bold text-left bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20 transition-all"
                    >
                      La saison a commencé
                    </button>
                  </div>
                )
              }

              // ── IN-SEASON / PLAYOFFS (default) ────────────────────────────
              return (
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
              )
            })()}
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

        </CollapsibleSection>

        {/* Morphologie */}
        <CollapsibleSection
          title="Morphologie"
          subtitle="Taille, poids et IMC"
          icon={<Ruler className="w-4 h-4" />}
          iconClassName="bg-violet-50 text-violet-600 border border-violet-200"
          testId="profile-section-morphology"
        >

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
        </CollapsibleSection>


        <section className="bg-layer-5 border border-border-app rounded-[2rem] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-brand-soft text-brand-tint border border-brand-border">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-fg">Ma progression</h2>
              <p className="text-xs text-fg-muted">Adhérence, historique de séances, tests physiques et records.</p>
            </div>
          </div>
          <Link
            to="/progress"
            data-testid="profile-link-progress"
            className="flex items-center justify-between rounded-2xl border border-border-app bg-layer-6 px-4 py-3 text-sm font-semibold text-fg transition-colors hover:border-brand-border rf-focus-ring"
          >
            <span>Voir ma progression</span>
            <span className="text-xs text-fg-muted">Ouvrir</span>
          </Link>
        </section>

        <CollapsibleSection
          title={profile.seasonMode === 'off_season' ? 'Mes séances, mon club' : 'Mon club'}
          subtitle={profile.seasonMode === 'off_season'
            ? 'Ton club + jours de muscu librement choisis en inter-saison.'
            : 'Club FFR, competition, planning d\'entrainement et jour de match.'}
          icon={<Calendar className="w-4 h-4" />}
          iconClassName="bg-ok-bg-muted text-ok border border-ok-bd"
          testId="profile-section-club"
        >
          <ClubSettingsSection />
        </CollapsibleSection>

        {/* Abonnement & accès */}
        <CollapsibleSection
          title="Abonnement & accès"
          subtitle="La sécurité et le programme de base restent inclus, quel que soit le plan."
          icon={<ShieldCheck className="w-4 h-4" />}
          iconClassName="bg-brand-soft text-brand-tint border border-brand-border"
          trailing={
            <span
              className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide ${
                isPremium
                  ? 'bg-brand-medium text-brand-tint'
                  : 'bg-layer-10 text-fg-soft'
              }`}
            >
              {isPremium ? 'PREMIUM' : 'FREE'}
            </span>
          }
          defaultOpen={!isPremium}
          testId="profile-section-subscription"
        >

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


          {isPremium && (
            <ManageSubscriptionCard />
          )}

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
            <div id="premium" className="rounded-[24px] border border-border-app bg-layer-6 p-4 space-y-3">
              <div>
                <p className="text-sm font-black text-fg">Passer en Premium</p>
                <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                  Debloque le suivi des charges, l&apos;historique complet, les courbes de progression et le coach IA illimite.
                </p>
              </div>

              {/* Plan selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlan('premium_monthly')}
                  className={`p-3 rounded-2xl border-2 text-left transition-colors ${
                    selectedPlan === 'premium_monthly'
                      ? 'border-brand bg-brand-soft'
                      : 'border-border-app bg-layer-5'
                  }`}
                >
                  <p className="text-xs font-black text-fg">Mensuel</p>
                  <p className="text-lg font-black text-brand-tint">5,99&euro;<span className="text-[10px] text-fg-muted font-bold">/mois</span></p>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlan('premium_yearly')}
                  className={`p-3 rounded-2xl border-2 text-left transition-colors relative ${
                    selectedPlan === 'premium_yearly'
                      ? 'border-brand bg-brand-soft'
                      : 'border-border-app bg-layer-5'
                  }`}
                >
                  <div className="absolute -top-2 right-2 bg-brand text-on-brand text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">-33%</div>
                  <p className="text-xs font-black text-fg">Annuel</p>
                  <p className="text-lg font-black text-brand-tint">47,99&euro;<span className="text-[10px] text-fg-muted font-bold">/an</span></p>
                </button>
              </div>

              <p className="text-[10px] leading-relaxed text-fg-muted">
                {selectedPlan === 'premium_monthly'
                  ? 'Abonnement mensuel a 5,99 \u20AC/mois. Renouvellement automatique. Annulable a tout moment via Google Play.'
                  : 'Abonnement annuel a 47,99 \u20AC/an. Renouvellement automatique. Annulable a tout moment via Google Play.'}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const result = await startCheckout(selectedPlan)
                    if (result?.ok) {
                      await refreshEntitlements()
                    }
                  }}
                  disabled={billingLoading}
                  className="flex-1 inline-flex items-center justify-center rounded-2xl bg-brand px-4 py-3 text-xs font-black text-on-brand transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50 rf-focus-ring"
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
        </CollapsibleSection>

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

// ── Forme du moment — auto-hidden after settle ──────────────────────

const FORME_AUTO_HIDE_DAYS = 14
const FORME_AUTO_HIDE_SESSIONS = 3

function FormeDuMomentSection({
  profile,
  loggedSessions,
  onUpdateBaseline,
}: {
  profile: import('../types/training').UserProfile
  loggedSessions: number
  onUpdateBaseline: (value: TrainingBaseline) => void
}) {
  const [forceOpen, setForceOpen] = useState(false)
  // Date.now() capturé une fois au mount via useState init (autorisé impur).
  // Settled est une décision one-shot par session — pas besoin de re-évaluer en live.
  const [mountedAt] = useState(() => Date.now())
  const restartActive = isRestartRampUpActive(profile)

  let settled = false
  if (profile.trainingBaselineSetAt) {
    const ageDays = (mountedAt - new Date(profile.trainingBaselineSetAt).getTime()) / 86_400_000
    settled = ageDays >= FORME_AUTO_HIDE_DAYS || loggedSessions >= FORME_AUTO_HIDE_SESSIONS
  }

  // La rampe restart active doit rester visible — c'est sa raison d'être.
  const shouldShow = forceOpen || !settled || restartActive

  if (!shouldShow) {
    const currentLabel = TRAINING_BASELINES.find((o) => o.value === profile.trainingBaseline)?.label ?? '—'
    return (
      <button
        type="button"
        onClick={() => setForceOpen(true)}
        data-testid="profile-baseline-reveal"
        className="w-full flex items-center justify-between gap-3 py-2.5 px-4 rounded-2xl bg-layer-5 border border-border-app text-fg-soft hover:border-layer-20 transition-colors"
      >
        <span className="text-xs font-bold">
          Forme du moment — <span className="text-fg-muted font-normal">{currentLabel}</span>
        </span>
        <span className="text-[10px] font-black text-brand-tint uppercase tracking-wide">Modifier</span>
      </button>
    )
  }

  return (
    <section
      className="bg-layer-5 border border-border-app rounded-[24px] p-6 space-y-3"
      data-testid="profile-section-baseline"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-fg">Forme du moment</h2>
          <p className="text-xs text-fg-muted">Module la charge des 2 premières semaines selon ton état de reprise.</p>
        </div>
        {restartActive && (
          <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-brand-soft border border-brand-border text-[10px] font-black text-brand-tint">
            <RefreshCw className="w-3 h-3" />
            Rampe active
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {TRAINING_BASELINES.map((opt) => {
          const active = profile.trainingBaseline === opt.value
          const Icon = opt.icon
          return (
            <button
              key={opt.value}
              type="button"
              data-testid={`profile-baseline-${opt.value}`}
              onClick={() => onUpdateBaseline(opt.value)}
              className={`flex items-center gap-3 py-2.5 px-3 rounded-2xl text-xs font-bold text-left transition-all ${
                active
                  ? 'bg-brand text-on-brand shadow-sm'
                  : 'bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <div>
                <p className="font-black">{opt.label}</p>
                <p className={`text-[10px] font-normal ${active ? 'text-on-brand/80' : 'text-fg-muted'}`}>{opt.sub}</p>
              </div>
            </button>
          )
        })}
      </div>
      {profile.trainingBaseline === 'restart' && restartActive && profile.trainingBaselineSetAt && (
        <p className="text-[11px] text-fg-muted">
          Volume réduit jusqu'au{' '}
          <span className="font-black text-fg-soft">
            {new Date(new Date(profile.trainingBaselineSetAt).getTime() + RESTART_RAMP_UP_DAYS * 86_400_000)
              .toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
          </span>
          , puis retour automatique au programme normal.
        </p>
      )}
      {settled && forceOpen && (
        <button
          type="button"
          onClick={() => setForceOpen(false)}
          className="text-[10px] font-bold text-fg-faint hover:text-fg-soft transition-colors"
        >
          Replier
        </button>
      )}
    </section>
  )
}
