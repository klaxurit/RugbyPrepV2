import { Link } from 'react-router-dom'
import { useMemo, useRef, useState, useEffect } from 'react'
import { posthog } from '../services/analytics/posthog'
import type { ChangeEvent } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Dumbbell, Shield, RefreshCw, User, Camera, Bell, BellOff, BellRing, Ruler, Calendar, RotateCcw } from 'lucide-react'
import { PageHeader } from '../components/PageHeader'
import { PremiumUpsellCard } from '../components/PremiumUpsellCard'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { useFeatureAccess } from '../hooks/useFeatureAccess'
import { useUpsellTiming, isDismissed, dismissUpsell } from '../hooks/useUpsellTiming'
import { useNotifications } from '../hooks/useNotifications'
import { BottomNav } from '../components/BottomNav'
import { useCalendar } from '../hooks/useCalendar'
import { getToday } from '../services/ui/debugDateOverride'
import { detectAnnualPlanningContext } from '../services/season/detectAnnualPlanningContext'
import type { AnnualCycle } from '../types/annualPlanning'
import type { AuthError } from '../types/auth'
import type {
  Contra,
  Equipment,
  DayOfWeek,
  ClubSchedule,
  TrainingLevel,
  FfrCompetition,
} from '../types/training'
import { fetchCompetitions, syncCalendar } from '../services/calendar/ffrSyncService'
import { supabase } from '../services/supabase/client'
import ffrClubsData from '../data/ffrClubs.v2021.json'
import { getCroppedImageFile } from '../services/ui/imageCrop'
import { getClubLogoUrl, getClubMonogram } from '../services/ui/clubLogos'
import { computeSCSchedule, buildManualSCSchedule } from '../services/program/scheduleOptimizer'
import { GymDaySelector } from '../components/GymDaySelector'

/** Équipements qui déclenchent des substitutions en mode Fondation. */
const FOUNDATIONS_EQUIPMENT_OPTIONS: { value: Exclude<Equipment, 'none'>; label: string; hint: string }[] = [
  { value: 'dumbbell',  label: 'Haltères / Kettlebell', hint: 'Goblet squat, DB RDL, DB press' },
  { value: 'machine',   label: 'Machines guidées',      hint: 'Leg press, leg curl, shoulder press' },
  { value: 'cable',     label: 'Poulie / Câble',        hint: 'Cable row, cable chop' },
  { value: 'bench',     label: 'Banc',                  hint: 'Chest supported row' },
  { value: 'landmine',  label: 'Landmine',              hint: 'Landmine press' },
]

const SENSITIVE_ZONE_OPTIONS: { value: Contra; label: string }[] = [
  { value: 'shoulder_pain', label: 'Épaule' },
  { value: 'elbow_pain', label: 'Coude' },
  { value: 'wrist_pain', label: 'Poignet' },
  { value: 'low_back_pain', label: 'Bas du dos' },
  { value: 'knee_pain', label: 'Genou' },
  { value: 'groin_pain', label: 'Aine' },
  { value: 'neck_pain', label: 'Nuque' },
  { value: 'ankle_pain', label: 'Cheville' },
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
  { value: 'en' as const, label: 'English', sub: 'Program and exercises in English' },
]

function getVisibleTrainingLevel(level: TrainingLevel | undefined): Exclude<TrainingLevel, 'builder'> {
  if (level === 'starter') return 'starter'
  return 'performance'
}

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'hier'
  return `il y a ${days} jours`
}

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



interface FfrClub {
  ligue: string
  departmentCode: string
  code: string
  name: string
}

const FFR_CLUBS: FfrClub[] = ffrClubsData as FfrClub[]

const normalizeSearch = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

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
  const { authState, updateAvatar } = useAuth()
  const { features, isPremium } = useFeatureAccess()
  const { visibleEvents } = useCalendar()
  const { canShowUpsell } = useUpsellTiming()
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
  const [clubQuery, setClubQuery] = useState('')
  const [heightInput, setHeightInput] = useState(profile.heightCm?.toString() ?? '')
  const [weightInput, setWeightInput] = useState(profile.weightKg?.toString() ?? '')
  const [showPlanningEditor, setShowPlanningEditor] = useState(false)
  const [editClubDays, setEditClubDays] = useState<Set<DayOfWeek>>(new Set())
  const [editClubDayTimes, setEditClubDayTimes] = useState<Record<number, string>>({})
  const [editMatchDay, setEditMatchDay] = useState<DayOfWeek | null | undefined>(undefined)
  const [gymMode, setGymMode] = useState<'auto' | 'manual'>('auto')
  const [editGymDays, setEditGymDays] = useState<Set<DayOfWeek>>(new Set())
  const [ffrCompetitions, setFfrCompetitions] = useState<FfrCompetition[]>([])
  const [ffrCompLoading, setFfrCompLoading] = useState(false)
  const [ffrSyncLoading, setFfrSyncLoading] = useState(false)
  const [ffrSyncMessage, setFfrSyncMessage] = useState<string | null>(null)

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
        events: visibleEvents.map((e) => ({ date: e.date, type: e.type })),
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

    return { cycleLabel, nextMatchLabel, lastMatchDate, nextMatch }
  }, [profile.seasonMode, profile.weeklySessions, profile.planningAnchors, visibleEvents, today])

  // Load competitions when club is set (only on initial profile load, not on manual selection)
  const isAuthenticated = authState.status === 'authenticated'
  const [clubCompsFetched, setClubCompsFetched] = useState<string | null>(null)
  useEffect(() => {
    if (!isAuthenticated) return
    if (!profile.clubCode) return
    if (profile.ffrCompetitionId) return
    // Skip if already fetched for this club (handleSelectClub handles its own fetch)
    if (clubCompsFetched === profile.clubCode) return
    setClubCompsFetched(profile.clubCode)
    setFfrCompLoading(true)
    setFfrSyncMessage(null)
    fetchCompetitions(profile.clubCode).then((result) => {
      setFfrCompLoading(false)
      if (result.error) {
        if (result.error !== 'club_not_mapped') {
          setFfrSyncMessage(`Erreur FFR : ${result.error}`)
        }
        return
      }
      setFfrCompetitions(result.competitions)
    })
  }, [isAuthenticated, profile.clubCode, profile.ffrCompetitionId, clubCompsFetched])

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const filteredClubs = useMemo(() => {
    const query = normalizeSearch(clubQuery.trim())
    if (!query) return []

    return FFR_CLUBS.filter((club) => {
      const searchable = normalizeSearch(`${club.name} ${club.code} ${club.ligue}`)
      return searchable.includes(query)
    }).slice(0, 10)
  }, [clubQuery])

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

  const openPlanningEditor = () => {
    const cs = profile.clubSchedule
    setEditClubDays(new Set((cs?.clubDays ?? []).map((d) => d.day)))
    setEditClubDayTimes(
      Object.fromEntries((cs?.clubDays ?? []).filter((d) => d.time).map((d) => [d.day, d.time!]))
    )
    setEditMatchDay(cs?.matchDay ?? null)
    // Pré-remplir les jours muscu manuels depuis scSchedule existant
    setEditGymDays(new Set(profile.scSchedule?.sessions.map((s) => s.day) ?? []))
    setGymMode('auto')
    setShowPlanningEditor(true)
  }

  const applyPlanningSchedule = () => {
    const clubSchedule: ClubSchedule | undefined =
      editClubDays.size > 0
        ? {
            clubDays: Array.from(editClubDays).map((d) => ({
              day: d,
              time: editClubDayTimes[d] ?? undefined,
            })),
            matchDay: editMatchDay ?? undefined,
          }
        : undefined

    let scSchedule
    if (gymMode === 'manual' && editGymDays.size > 0) {
      scSchedule = buildManualSCSchedule(Array.from(editGymDays))
    } else if (clubSchedule) {
      scSchedule = computeSCSchedule(clubSchedule, profile.weeklySessions)
    }

    updateProfile({ clubSchedule, scSchedule })
    posthog.capture('profile_updated', { field: 'schedule' })
    setShowPlanningEditor(false)
  }

  const handleSelectClub = async (club: FfrClub) => {
    // If changing club, clear previous competition and delete old FFR matches
    if (profile.clubCode && profile.clubCode !== club.code) {
      await supabase
        .from('match_calendar')
        .delete()
        .eq('source', 'ffr_import')
      updateProfile({
        clubCode: club.code,
        clubName: club.name,
        clubLigue: club.ligue,
        clubDepartmentCode: club.departmentCode,
        ffrCompetitionId: undefined,
        ffrCompetitionName: undefined,
      })
    } else {
      updateProfile({
        clubCode: club.code,
        clubName: club.name,
        clubLigue: club.ligue,
        clubDepartmentCode: club.departmentCode,
      })
    }
    setClubQuery('')

    // Fetch competitions for the new club (mark as fetched to prevent useEffect double-call)
    setClubCompsFetched(club.code)
    setFfrCompLoading(true)
    setFfrCompetitions([])
    setFfrSyncMessage(null)
    const result = await fetchCompetitions(club.code)
    setFfrCompLoading(false)

    if (result.error) {
      setFfrCompetitions([])
      if (result.error === 'club_not_mapped') {
        setFfrSyncMessage(null) // pas de message, juste "non disponible"
      } else {
        setFfrSyncMessage(`Erreur FFR : ${result.error}`)
      }
      return
    }

    setFfrCompetitions(result.competitions)

    if (result.competitions.length === 0) {
      setFfrSyncMessage(null) // aucune compétition senior trouvée
      return
    }

    // Auto-select if only 1 competition
    if (result.competitions.length === 1) {
      await handleSelectCompetition(result.competitions[0])
    }
  }

  const handleSelectCompetition = async (comp: FfrCompetition) => {
    updateProfile({
      ffrCompetitionId: comp.id,
      ffrCompetitionName: comp.name,
    })

    // Trigger initial sync
    setFfrSyncLoading(true)
    setFfrSyncMessage(null)
    const result = await syncCalendar(comp.id, profile.clubCode!)
    setFfrSyncLoading(false)

    if (result.error) {
      setFfrSyncMessage(`Erreur sync : ${result.error}`)
    } else {
      setFfrSyncMessage(`${result.imported} match${result.imported > 1 ? 's' : ''} importé${result.imported > 1 ? 's' : ''}`)
      updateProfile({ ffrLastSyncAt: new Date().toISOString() })
    }
  }

  const handleManualSync = async () => {
    if (!profile.ffrCompetitionId || !profile.clubCode) return
    setFfrSyncLoading(true)
    setFfrSyncMessage(null)
    const result = await syncCalendar(profile.ffrCompetitionId, profile.clubCode)
    setFfrSyncLoading(false)
    if (result.error) {
      setFfrSyncMessage(`Erreur sync : ${result.error}`)
    } else {
      setFfrSyncMessage(`${result.imported} match${result.imported > 1 ? 's' : ''} importé${result.imported > 1 ? 's' : ''}`)
      updateProfile({ ffrLastSyncAt: new Date().toISOString() })
    }
  }

  const selectedClubLogoUrl = getClubLogoUrl(profile.clubCode)
  const selectedClubMonogram = getClubMonogram(profile.clubName)
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-border-app bg-layer-5 text-xs font-bold text-fg-muted hover:border-brand-border-strong hover:text-brand transition-colors rf-focus-ring"
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
              className="relative w-20 h-20 rounded-3xl border border-border-app bg-layer-10 flex items-center justify-center overflow-hidden disabled:opacity-60"
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
                        ? 'bg-success-app text-on-success shadow-sm'
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
                        ? 'bg-success-app text-on-success shadow-sm'
                        : 'bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20'
                    }`}
                  >
                    <span className="text-base flex-shrink-0">{opt.emoji}</span>
                    <div>
                      <p className="font-black">{opt.label}</p>
                      <p className={`text-[10px] font-normal ${active ? 'text-ok' : 'text-fg-muted'}`}>{opt.sub}</p>
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
                      <span className="text-xs font-bold text-brand">
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
                        className="text-[10px] font-bold text-brand-muted hover:text-brand"
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
                    const cleanAnchors = { ...profile.planningAnchors }
                    delete cleanAnchors.seasonEndedAt
                    delete cleanAnchors.returnToTeamTrainingAt
                    updateProfile({
                      planningAnchors: cleanAnchors,
                      seasonMode: 'in_season',
                    })
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
                      const cleanAnchors = { ...profile.planningAnchors }
                      delete cleanAnchors.manualPlayoffs
                      updateProfile({
                        // Primary: factual anchor
                        planningAnchors: { ...cleanAnchors, seasonEndedAt: anchor },
                        // Transitional compatibility
                        seasonMode: 'off_season',
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
                      const cleanAnchors = { ...profile.planningAnchors }
                      delete cleanAnchors.manualPlayoffs
                      updateProfile({
                        // Primary: factual anchor
                        planningAnchors: { ...cleanAnchors, seasonEndedAt: today },
                        // Transitional compatibility
                        seasonMode: 'off_season',
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
                        ? 'bg-success-app text-on-success shadow-sm'
                        : 'bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20'
                    }`}
                  >
                    <p className="text-xs font-black">{opt.label}</p>
                    <p className={`mt-0.5 text-[10px] ${active ? 'text-ok' : 'text-fg-muted'}`}>{opt.sub}</p>
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
                        ? 'bg-success-app text-on-success shadow-sm'
                        : 'bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20'
                    }`}
                  >
                    {n} séances
                  </button>
                )
              })}
            </div>
          </div>

          {/* Club */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">
              Club <span className="text-fg-ghost font-normal normal-case">(optionnel)</span>
            </label>

            <input
              type="text"
              value={clubQuery}
              onChange={(event) => setClubQuery(event.target.value)}
              placeholder="Recherche nom, code ou ligue"
              className="w-full h-11 rounded-2xl border border-border-app bg-layer-5 px-3 text-sm text-fg placeholder:text-fg-ghost focus:outline-none focus:border-brand rf-focus-ring"
            />

            {profile.clubName && (
              <div className="p-3 rounded-2xl border border-border-app bg-layer-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-layer-10 border border-border-app flex items-center justify-center overflow-hidden">
                    {selectedClubLogoUrl ? (
                      <img src={selectedClubLogoUrl} alt={profile.clubName} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xs font-black text-fg-soft">{selectedClubMonogram}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-fg">{profile.clubName}</p>
                    <p className="text-xs text-fg-muted">
                      {profile.clubCode} · {profile.clubLigue} · CD {profile.clubDepartmentCode}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateProfile({
                      clubCode: undefined,
                      clubName: undefined,
                      clubLigue: undefined,
                      clubDepartmentCode: undefined,
                    })
                  }
                  className="text-[11px] font-bold text-fg-muted hover:text-brand transition-colors"
                >
                  Retirer
                </button>
              </div>
            )}

            {clubQuery.trim().length > 0 && (
              <div className="max-h-56 overflow-auto rounded-2xl border border-border-app bg-panel">
                {filteredClubs.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-fg-muted">Aucun club trouvé.</p>
                ) : (
                  filteredClubs.map((club) => (
                    <button
                      key={club.code}
                      type="button"
                      onClick={() => handleSelectClub(club)}
                      className="w-full px-3 py-2 text-left hover:bg-layer-10 border-b border-border-app last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-layer-10 border border-border-app flex items-center justify-center overflow-hidden flex-shrink-0">
                          {getClubLogoUrl(club.code) ? (
                            <img src={getClubLogoUrl(club.code) ?? ''} alt={club.name} className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-[10px] font-black text-fg-soft">{getClubMonogram(club.name)}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-fg">{club.name}</p>
                          <p className="text-[11px] text-fg-muted">{club.code} · {club.ligue} · CD {club.departmentCode}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Compétition FFR (calendrier auto) */}
          {profile.clubCode && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-fg-muted uppercase tracking-wider">
                Compétition <span className="text-fg-ghost font-normal normal-case">(calendrier auto)</span>
              </label>

              {ffrCompLoading && (
                <div className="h-11 rounded-2xl border border-border-app bg-layer-5 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-fg-faint animate-spin" />
                </div>
              )}

              {!ffrCompLoading && ffrCompetitions.length === 0 && !profile.ffrCompetitionId && !ffrSyncMessage && (
                <p className="text-xs text-fg-faint italic">Import auto non disponible pour ce club</p>
              )}

              {!ffrCompLoading && ffrSyncMessage && !profile.ffrCompetitionId && (
                <p className={`text-xs italic ${ffrSyncMessage.startsWith('Erreur') ? 'text-danger' : 'text-fg-faint'}`}>
                  {ffrSyncMessage}
                </p>
              )}

              {!ffrCompLoading && ffrCompetitions.length > 1 && !profile.ffrCompetitionId && (
                <div className="space-y-1">
                  {ffrCompetitions
                    .slice()
                    .sort((a, b) => {
                      // Pre-select: match leagueLevel to competition level
                      const ll = (profile.leagueLevel ?? '').toLowerCase()
                      const aMatch = (a.level ?? '').toLowerCase().includes(ll) && ll.length > 0 ? 1 : 0
                      const bMatch = (b.level ?? '').toLowerCase().includes(ll) && ll.length > 0 ? 1 : 0
                      return bMatch - aMatch
                    })
                    .map((comp, idx) => {
                      const ll = (profile.leagueLevel ?? '').toLowerCase()
                      const isRecommended = ll.length > 0 && (comp.level ?? '').toLowerCase().includes(ll)
                      return (
                        <button
                          key={comp.id}
                          type="button"
                          onClick={() => handleSelectCompetition(comp)}
                          className={`w-full px-3 py-2.5 text-left rounded-2xl border transition-colors ${
                            isRecommended && idx === 0
                              ? 'border-info-bd bg-info-bg hover:bg-info-bg/80'
                              : 'border-border-app bg-layer-5 hover:bg-layer-10'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-fg">{comp.name}</p>
                            {isRecommended && idx === 0 && (
                              <span className="text-[9px] font-black text-info bg-info-bg px-1.5 py-0.5 rounded-full border border-info-bd">Recommandé</span>
                            )}
                          </div>
                          <p className="text-xs text-fg-muted">{comp.level}{comp.pool ? ` · ${comp.pool}` : ''} · {comp.season}</p>
                        </button>
                      )
                    })}
                </div>
              )}

              {profile.ffrCompetitionName && (
                <div className="p-3 rounded-2xl border border-info-bd bg-info-bg space-y-2.5">
                  <div>
                    <p className="text-sm font-bold text-fg">{profile.ffrCompetitionName}</p>
                    <p className="text-[10px] text-fg-muted mt-0.5">
                      {profile.ffrLastSyncAt
                        ? `Synchronisé ${formatRelativeTime(profile.ffrLastSyncAt)} · auto-sync quotidien`
                        : 'Synchronisation automatique activée'}
                    </p>
                  </div>
                  {ffrSyncMessage && (
                    <p className={`text-xs ${ffrSyncMessage.startsWith('Erreur') ? 'text-danger' : 'text-ok-strong'}`}>
                      {ffrSyncMessage}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleManualSync}
                      disabled={ffrSyncLoading}
                      className="text-[11px] font-bold text-info hover:text-info/80 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {ffrSyncLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Forcer la sync
                    </button>
                    <span className="text-fg-faint">·</span>
                    <button
                      type="button"
                      onClick={() => {
                        updateProfile({ ffrCompetitionId: undefined, ffrCompetitionName: undefined })
                        setFfrSyncMessage(null)
                      }}
                      className="text-[11px] font-bold text-fg-faint hover:text-fg-soft transition-colors"
                    >
                      Changer de compétition
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </section>

        {/* Morphologie */}
        <section className="bg-layer-5 border border-border-app rounded-[2rem] p-6 space-y-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-violet-900/20 text-violet-400">
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
              <div className="flex items-center justify-between p-4 rounded-2xl bg-violet-900/20 border border-violet-500/20">
                <div>
                  <p className="text-xs font-bold text-violet-400 uppercase tracking-wide">IMC</p>
                  <p className="text-sm font-bold text-fg-emphasis mt-0.5">{label}</p>
                </div>
                <span className="text-2xl font-black text-violet-400">{bmi.toFixed(1)}</span>
              </div>
            )
          })()}
        </section>

        {/* Équipement — visible uniquement en Fondation */}
        {profile.trainingLevel === 'starter' && (
        <section className="bg-layer-5 border border-border-app rounded-[24px] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-info-bg text-info border border-info-bd">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-fg">Matériel à disposition</h2>
              <p className="text-xs text-fg-muted">On adapte tes exercices selon ce que tu as en salle</p>
            </div>
          </div>
          <p className="text-xs text-fg-soft leading-relaxed">
            Si tu ne coches rien, tu garderas les exercices par défaut (barre, poids de corps). Coche ce que tu as pour débloquer des variantes plus guidées.
          </p>
          <div className="space-y-2">
            {FOUNDATIONS_EQUIPMENT_OPTIONS.map(({ value, label, hint }) => {
              const active = profile.equipment.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateProfile({ equipment: toggleValue(profile.equipment, value) })}
                  className={`w-full py-3 px-4 rounded-2xl text-left transition-all flex items-center gap-3 ${
                    active
                      ? 'bg-info-bg border border-info-bd text-fg'
                      : 'bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-info' : 'bg-layer-20'}`} />
                  <div className="min-w-0">
                    <span className="text-xs font-bold">{label}</span>
                    <span className="block text-[10px] text-fg-muted mt-0.5">{hint}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
        )}

        {/* Planning club */}
        <section className="bg-layer-5 border border-border-app rounded-[2rem] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-ok-bg-muted text-ok border border-ok-bd">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-fg">Planning club</h2>
                <p className="text-xs text-fg-muted">Entraînements club & séances muscu adaptées</p>
              </div>
            </div>
            <button
              type="button"
              onClick={openPlanningEditor}
              className="text-xs font-bold text-brand hover:text-brand-hover transition-colors"
            >
              Modifier
            </button>
          </div>

          {profile.clubSchedule ? (
            <div className="space-y-2">
              <div>
                <p className="text-[10px] font-black text-fg-muted uppercase tracking-wide mb-1">Entraînements club</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.clubSchedule.clubDays.map((d) => (
                    <span key={d.day} className="px-2.5 py-1 rounded-full bg-ok-bg-muted text-ok text-xs font-bold border border-ok-bd">
                      {DAY_LABELS[d.day]}{d.time ? ` ${d.time}` : ''}
                    </span>
                  ))}
                </div>
              </div>
              {profile.clubSchedule.matchDay !== undefined && (
                <p className="text-xs text-fg-muted">
                  Match habituel : <span className="font-bold text-fg-soft">{DAY_LABELS[profile.clubSchedule.matchDay]}</span>
                </p>
              )}
              {profile.scSchedule && profile.scSchedule.sessions.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-fg-muted uppercase tracking-wide mb-1">Séances muscu suggérées</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.scSchedule.sessions.map((s) => (
                      <span key={s.day} className="px-2.5 py-1 rounded-full bg-danger-bg text-danger text-xs font-bold border border-danger-bd">
                        {DAY_LABELS[s.day]}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-fg-faint mt-1">Calculé automatiquement selon ton planning</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!profile.clubSchedule) return
                  const sc = computeSCSchedule(profile.clubSchedule, profile.weeklySessions)
                  updateProfile({ scSchedule: sc })
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-fg-muted hover:text-brand transition-colors mt-1"
              >
                <RotateCcw className="w-3 h-3" />
                Recalculer les séances muscu
              </button>
            </div>
          ) : (
            <p className="text-xs text-fg-muted">Non configuré — clique sur "Modifier" pour ajouter ton planning.</p>
          )}
        </section>

        {/* Population & conformité supprimés — app réservée aux adultes (V2 pour U18) */}

        {/* Zones sensibles */}
        <section className="bg-layer-5 border border-border-app rounded-[24px] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-warn-bg-muted text-warn border border-warn-bd">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-fg">Zones sensibles</h2>
              <p className="text-xs text-fg-muted">On adapte les exercices pour éviter ces zones</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SENSITIVE_ZONE_OPTIONS.map(({ value, label }) => {
              const active = profile.injuries.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateProfile({ injuries: toggleValue(profile.injuries, value) })}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold text-left transition-all flex items-center gap-2 ${
                    active
                      ? 'bg-warn-button text-fg shadow-sm hover:bg-warn-button-hover'
                      : 'bg-layer-5 text-fg-soft border border-border-app hover:border-layer-20'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-fg' : 'bg-layer-20'}`} />
                  {label}
                </button>
              )
            })}
          </div>
          {profile.injuries.length > 0 && (
            <p className="text-xs text-warn font-medium">
              {profile.injuries.length} zone{profile.injuries.length > 1 ? 's' : ''} — les exercices sollicitant ces zones seront remplacés par des alternatives.
            </p>
          )}
        </section>

        {/* Programme Réhab supprimé — hors périmètre prépa physique (V2 avec partenariat kiné) */}

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
                ? 'bg-brand-medium text-brand'
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
                className="py-3 rounded-2xl bg-success-app text-on-success text-xs font-black uppercase tracking-wide opacity-95 hover:opacity-100 transition-opacity disabled:opacity-60 rf-focus-ring"
              >
                {isAvatarUploading ? 'Upload...' : 'Valider'}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Planning editor modal */}
      {showPlanningEditor && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <section className="w-full sm:max-w-md bg-app border border-border-app rounded-t-[2rem] sm:rounded-[2rem] p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-fg">Planning club</h3>
              <button
                type="button"
                onClick={() => setShowPlanningEditor(false)}
                className="text-xs font-bold text-fg-muted hover:text-fg transition-colors rf-focus-ring"
              >
                Annuler
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black text-fg-muted uppercase tracking-wide">Jours d'entraînement club</p>
              <div className="grid grid-cols-4 gap-2">
                {CLUB_DAYS_OPTIONS.map((opt) => {
                  const selected = editClubDays.has(opt.day)
                  return (
                    <div key={opt.day} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditClubDays((prev) => {
                            const next = new Set(prev)
                            if (next.has(opt.day)) { next.delete(opt.day) } else { next.add(opt.day) }
                            return next
                          })
                        }}
                        className={`w-full py-3 rounded-2xl border-2 text-xs font-black transition-all ${
                          selected
                            ? 'border-brand bg-brand-soft text-brand'
                            : 'border-border-app bg-layer-5 text-fg-soft hover:border-layer-20'
                        }`}
                      >
                        {opt.short}
                        <span className="block text-[9px] font-bold mt-0.5 opacity-70">{opt.label.slice(0, 3)}</span>
                      </button>
                      {selected && (
                        <input
                          type="time"
                          value={editClubDayTimes[opt.day] ?? ''}
                          onChange={(e) => setEditClubDayTimes((prev) => ({ ...prev, [opt.day]: e.target.value }))}
                          className="w-full text-[10px] rounded-xl border border-border-app bg-layer-5 px-1.5 py-1 text-fg-soft focus:outline-none focus:border-brand rf-focus-ring"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black text-fg-muted uppercase tracking-wide">Jour de match habituel</p>
              <div className="flex gap-2 flex-wrap">
                {MATCH_DAY_OPTIONS.map((opt) => (
                  <button
                    key={String(opt.day)}
                    type="button"
                    onClick={() => setEditMatchDay(opt.day)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black border-2 transition-all ${
                      editMatchDay === opt.day
                        ? 'border-brand bg-brand-soft text-brand'
                        : 'border-border-app bg-layer-5 text-fg-soft hover:border-layer-20'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Séances muscu ─── */}
            <div className="space-y-3 pt-1 border-t border-border-app">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-fg-muted uppercase tracking-wide">Séances muscu</p>
                <div className="flex gap-1 bg-layer-5 border border-border-app rounded-2xl p-0.5">
                  <button
                    type="button"
                    onClick={() => setGymMode('auto')}
                    className={`px-3 py-1 rounded-xl text-[10px] font-black transition-all ${
                      gymMode === 'auto' ? 'bg-layer-15 text-fg shadow-sm' : 'text-fg-muted'
                    }`}
                  >
                    Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGymMode('manual')
                      // pré-remplir depuis la suggestion auto si vide
                      if (editGymDays.size === 0 && editClubDays.size > 0) {
                        const cs = {
                          clubDays: Array.from(editClubDays).map((d) => ({ day: d })),
                          matchDay: editMatchDay ?? undefined,
                        }
                        const auto = computeSCSchedule(cs, profile.weeklySessions)
                        setEditGymDays(new Set(auto.sessions.map((s) => s.day)))
                      }
                    }}
                    className={`px-3 py-1 rounded-xl text-[10px] font-black transition-all ${
                      gymMode === 'manual' ? 'bg-layer-15 text-fg shadow-sm' : 'text-fg-muted'
                    }`}
                  >
                    Manuel
                  </button>
                </div>
              </div>

              {gymMode === 'auto' && editClubDays.size > 0 && (
                <div className="p-3 rounded-2xl bg-ok-bg-muted border border-ok-bd">
                  <p className="text-[10px] font-black text-ok uppercase tracking-wide mb-1">
                    Suggestion calculée
                  </p>
                  <p className="text-sm font-black text-ok-strong">
                    {computeSCSchedule(
                      {
                        clubDays: Array.from(editClubDays).map((d) => ({ day: d })),
                        matchDay: editMatchDay ?? undefined,
                      },
                      profile.weeklySessions
                    ).sessions.map((s) => DAY_LABELS[s.day]).join(' · ')}
                  </p>
                  <p className="text-[10px] text-ok opacity-90 mt-1">
                    Basé sur ton planning club et les bonnes pratiques de récupération
                  </p>
                </div>
              )}

              {gymMode === 'auto' && editClubDays.size === 0 && (
                <p className="text-xs text-fg-muted">
                  Sélectionne tes jours d'entraînement club pour obtenir une suggestion.
                </p>
              )}

              {gymMode === 'manual' && (
                <GymDaySelector
                  clubSchedule={{
                    clubDays: Array.from(editClubDays).map((d) => ({ day: d })),
                    matchDay: editMatchDay ?? undefined,
                  }}
                  selectedDays={editGymDays}
                  weeklySessions={profile.weeklySessions}
                  onChange={setEditGymDays}
                />
              )}
            </div>

            <button
              type="button"
              onClick={applyPlanningSchedule}
              disabled={gymMode === 'manual' && editGymDays.size === 0}
              className="w-full py-4 rounded-2xl bg-brand hover:bg-brand-hover disabled:opacity-40 text-on-brand font-black uppercase tracking-wide transition-colors shadow-brand-float rf-focus-ring"
            >
              Appliquer
            </button>
          </section>
        </div>
      )}

      {/* Footer */}
      <footer className="px-4 py-6 flex flex-col items-center gap-3 text-center relative">
        <a
          href="mailto:feedback@rugbyforge.fr?subject=Feedback%20RugbyForge"
          onClick={() => posthog.capture('feedback_clicked')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-success-app text-on-success text-xs font-black uppercase tracking-wide opacity-95 hover:opacity-100 transition-opacity shadow-elevated rf-focus-ring"
        >
          Envoyer un feedback
        </a>
        <Link
          to="/legal"
          className="text-xs text-fg-muted hover:text-brand transition-colors"
        >
          Mentions légales & Confidentialité
        </Link>
        <p className="text-[10px] text-fg-ghost">RugbyForge v1.0</p>
      </footer>

      <BottomNav />
    </div>
  )
}
