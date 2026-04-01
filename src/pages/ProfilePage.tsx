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
import type { AuthError } from '../types/auth'
import type {
  Contra,
  Equipment,
  DayOfWeek,
  ClubSchedule,
  TrainingLevel,
  SeasonMode,
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

const SEASON_MODES: { value: SeasonMode; label: string; sub: string; emoji: string }[] = [
  { value: 'in_season',  label: 'Saison',          sub: 'Programme Force → Puissance',         emoji: '⚡' },
  { value: 'off_season', label: 'Inter-saison',     sub: 'Hypertrophie & reconstruction',       emoji: '🌿' },
  { value: 'pre_season', label: 'Pré-saison',       sub: 'Force-Puissance & réathlétisation',  emoji: '🔥' },
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
    <div className="min-h-screen bg-[#1a100c] font-sans text-white pb-24 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(#ff6b35_1px,transparent_1px)] [background-size:20px_20px]" />

      <PageHeader
        title="Mon Profil"
        backTo="/home"
        right={
          <button
            type="button"
            onClick={resetProfile}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-white/10 bg-white/5 text-xs font-bold text-white/40 hover:border-[#ff6b35]/30 hover:text-[#ff6b35] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
        }
      />

      <main className="relative px-6 pt-6 space-y-5 max-w-md mx-auto">
        <section className="bg-white/5 border border-white/10 rounded-[24px] p-6 space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isAvatarUploading}
              className="relative w-20 h-20 rounded-3xl border border-white/10 bg-white/10 flex items-center justify-center overflow-hidden disabled:opacity-60"
              aria-label="Changer la photo de profil"
            >
              {resolvedAvatarUrl ? (
                <img
                  src={resolvedAvatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-white/30" />
              )}
              <span className="absolute right-1 bottom-1 w-6 h-6 rounded-xl bg-[#1a5f3f] text-white flex items-center justify-center">
                <Camera className="w-3.5 h-3.5" />
              </span>
            </button>
            <div>
              <h2 className="text-sm font-black text-white">Photo de profil</h2>
              <p className="text-xs text-white/40">
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
            <div className="p-3 bg-[#ff6b35]/10 border border-[#ff6b35]/20 rounded-2xl">
              <p className="text-xs text-[#ff6b35] font-medium">{avatarError}</p>
            </div>
          )}
        </section>

        {/* Infos de jeu */}
        <section className="bg-white/5 border border-white/10 rounded-[24px] p-6 space-y-5">
          <h2 className="text-sm font-black uppercase tracking-wider text-white/40">Infos de jeu</h2>

          {/* Poste */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Poste</label>
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
                        ? 'bg-[#1a5f3f] text-white shadow-sm'
                        : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/25'
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
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Niveau d'entraînement</label>
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
                        ? 'bg-[#1a5f3f] text-white shadow-sm'
                        : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/25'
                    }`}
                  >
                    <span className="text-base flex-shrink-0">{opt.emoji}</span>
                    <div>
                      <p className="font-black">{opt.label}</p>
                      <p className={`text-[10px] font-normal ${active ? 'text-emerald-200' : 'text-white/40'}`}>{opt.sub}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mode saison */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Mode saison</label>
            <div className="flex flex-col gap-2">
              {SEASON_MODES.map((opt) => {
                const active = (profile.seasonMode ?? 'in_season') === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateProfile({ seasonMode: opt.value })}
                    className={`flex items-center gap-3 py-2.5 px-3 rounded-2xl text-xs font-bold text-left transition-all ${
                      active
                        ? 'bg-[#ff6b35] text-white shadow-sm'
                        : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/25'
                    }`}
                  >
                    <span className="text-base flex-shrink-0">{opt.emoji}</span>
                    <div>
                      <p className="font-black">{opt.label}</p>
                      <p className={`text-[10px] font-normal ${active ? 'text-orange-100' : 'text-white/40'}`}>{opt.sub}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Langue du programme</label>
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
                        ? 'bg-[#1a5f3f] text-white shadow-sm'
                        : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/25'
                    }`}
                  >
                    <p className="text-xs font-black">{opt.label}</p>
                    <p className={`mt-0.5 text-[10px] ${active ? 'text-emerald-200' : 'text-white/40'}`}>{opt.sub}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Séances / semaine */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Séances / semaine</label>
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
                        ? 'bg-[#1a5f3f] text-white shadow-sm'
                        : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/25'
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
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider">
              Club <span className="text-white/20 font-normal normal-case">(optionnel)</span>
            </label>

            <input
              type="text"
              value={clubQuery}
              onChange={(event) => setClubQuery(event.target.value)}
              placeholder="Recherche nom, code ou ligue"
              className="w-full h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff6b35] [color-scheme:dark]"
            />

            {profile.clubName && (
              <div className="p-3 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
                    {selectedClubLogoUrl ? (
                      <img src={selectedClubLogoUrl} alt={profile.clubName} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xs font-black text-white/50">{selectedClubMonogram}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{profile.clubName}</p>
                    <p className="text-xs text-white/40">
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
                  className="text-[11px] font-bold text-white/40 hover:text-[#ff6b35] transition-colors"
                >
                  Retirer
                </button>
              </div>
            )}

            {clubQuery.trim().length > 0 && (
              <div className="max-h-56 overflow-auto rounded-2xl border border-white/10 bg-[#23140f]">
                {filteredClubs.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-white/40">Aucun club trouvé.</p>
                ) : (
                  filteredClubs.map((club) => (
                    <button
                      key={club.code}
                      type="button"
                      onClick={() => handleSelectClub(club)}
                      className="w-full px-3 py-2 text-left hover:bg-white/10 border-b border-white/10 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {getClubLogoUrl(club.code) ? (
                            <img src={getClubLogoUrl(club.code) ?? ''} alt={club.name} className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-[10px] font-black text-white/50">{getClubMonogram(club.name)}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{club.name}</p>
                          <p className="text-[11px] text-white/40">{club.code} · {club.ligue} · CD {club.departmentCode}</p>
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
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider">
                Compétition <span className="text-white/20 font-normal normal-case">(calendrier auto)</span>
              </label>

              {ffrCompLoading && (
                <div className="h-11 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-white/30 animate-spin" />
                </div>
              )}

              {!ffrCompLoading && ffrCompetitions.length === 0 && !profile.ffrCompetitionId && !ffrSyncMessage && (
                <p className="text-xs text-white/30 italic">Import auto non disponible pour ce club</p>
              )}

              {!ffrCompLoading && ffrSyncMessage && !profile.ffrCompetitionId && (
                <p className={`text-xs italic ${ffrSyncMessage.startsWith('Erreur') ? 'text-red-400' : 'text-white/30'}`}>
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
                              ? 'border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white">{comp.name}</p>
                            {isRecommended && idx === 0 && (
                              <span className="text-[9px] font-black text-blue-400 bg-blue-900/20 px-1.5 py-0.5 rounded-full">Recommandé</span>
                            )}
                          </div>
                          <p className="text-xs text-white/40">{comp.level}{comp.pool ? ` · ${comp.pool}` : ''} · {comp.season}</p>
                        </button>
                      )
                    })}
                </div>
              )}

              {profile.ffrCompetitionName && (
                <div className="p-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{profile.ffrCompetitionName}</p>
                      <p className="text-xs text-white/40">
                        {profile.ffrLastSyncAt
                          ? `Dernière sync : ${new Date(profile.ffrLastSyncAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                          : 'Jamais synchronisé'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleManualSync}
                      disabled={ffrSyncLoading}
                      className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                    >
                      {ffrSyncLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Sync'}
                    </button>
                  </div>
                  {ffrSyncMessage && (
                    <p className={`text-xs ${ffrSyncMessage.startsWith('Erreur') ? 'text-red-400' : 'text-green-400'}`}>
                      {ffrSyncMessage}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      updateProfile({ ffrCompetitionId: undefined, ffrCompetitionName: undefined })
                      setFfrSyncMessage(null)
                    }}
                    className="text-[11px] font-bold text-white/30 hover:text-white/50 transition-colors"
                  >
                    Changer de compétition
                  </button>
                </div>
              )}
            </div>
          )}

        </section>

        {/* Morphologie */}
        <section className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-violet-900/20 text-violet-400">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Morphologie</h2>
              <p className="text-xs text-white/40">Taille, poids et IMC</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Taille (cm)</label>
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
                className="w-full h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-black text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff6b35] [color-scheme:dark]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider">Poids (kg)</label>
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
                className="w-full h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-black text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff6b35] [color-scheme:dark]"
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
                  <p className="text-sm font-bold text-white/70 mt-0.5">{label}</p>
                </div>
                <span className="text-2xl font-black text-violet-400">{bmi.toFixed(1)}</span>
              </div>
            )
          })()}
        </section>

        {/* Équipement — visible uniquement en Fondation */}
        {profile.trainingLevel === 'starter' && (
        <section className="bg-white/5 border border-white/10 rounded-[24px] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-blue-900/20 text-blue-400">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Matériel à disposition</h2>
              <p className="text-xs text-white/40">On adapte tes exercices selon ce que tu as en salle</p>
            </div>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">
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
                      ? 'bg-blue-500/15 border border-blue-500/40 text-white'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/25'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-blue-400' : 'bg-white/20'}`} />
                  <div className="min-w-0">
                    <span className="text-xs font-bold">{label}</span>
                    <span className="block text-[10px] text-white/40 mt-0.5">{hint}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>
        )}

        {/* Planning club */}
        <section className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-emerald-900/20 text-emerald-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white">Planning club</h2>
                <p className="text-xs text-white/40">Entraînements club & séances muscu adaptées</p>
              </div>
            </div>
            <button
              type="button"
              onClick={openPlanningEditor}
              className="text-xs font-bold text-[#ff6b35] hover:text-[#e55a2b] transition-colors"
            >
              Modifier
            </button>
          </div>

          {profile.clubSchedule ? (
            <div className="space-y-2">
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-wide mb-1">Entraînements club</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.clubSchedule.clubDays.map((d) => (
                    <span key={d.day} className="px-2.5 py-1 rounded-full bg-emerald-900/20 text-emerald-400 text-xs font-bold">
                      {DAY_LABELS[d.day]}{d.time ? ` ${d.time}` : ''}
                    </span>
                  ))}
                </div>
              </div>
              {profile.clubSchedule.matchDay !== undefined && (
                <p className="text-xs text-white/40">
                  Match habituel : <span className="font-bold text-white/60">{DAY_LABELS[profile.clubSchedule.matchDay]}</span>
                </p>
              )}
              {profile.scSchedule && profile.scSchedule.sessions.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-wide mb-1">Séances muscu suggérées</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.scSchedule.sessions.map((s) => (
                      <span key={s.day} className="px-2.5 py-1 rounded-full bg-rose-900/20 text-rose-400 text-xs font-bold">
                        {DAY_LABELS[s.day]}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">Calculé automatiquement selon ton planning</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!profile.clubSchedule) return
                  const sc = computeSCSchedule(profile.clubSchedule, profile.weeklySessions)
                  updateProfile({ scSchedule: sc })
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-[#ff6b35] transition-colors mt-1"
              >
                <RotateCcw className="w-3 h-3" />
                Recalculer les séances muscu
              </button>
            </div>
          ) : (
            <p className="text-xs text-white/40">Non configuré — clique sur "Modifier" pour ajouter ton planning.</p>
          )}
        </section>

        {/* Population & conformité supprimés — app réservée aux adultes (V2 pour U18) */}

        {/* Zones sensibles */}
        <section className="bg-white/5 border border-white/10 rounded-[24px] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-orange-900/20 text-orange-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Zones sensibles</h2>
              <p className="text-xs text-white/40">On adapte les exercices pour éviter ces zones</p>
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
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/25'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-white' : 'bg-white/20'}`} />
                  {label}
                </button>
              )
            })}
          </div>
          {profile.injuries.length > 0 && (
            <p className="text-xs text-orange-400 font-medium">
              {profile.injuries.length} zone{profile.injuries.length > 1 ? 's' : ''} — les exercices sollicitant ces zones seront remplacés par des alternatives.
            </p>
          )}
        </section>

        {/* Programme Réhab supprimé — hors périmètre prépa physique (V2 avec partenariat kiné) */}

        {/* ─── Notifications ───────────────────────────────────────────── */}
        <section className="bg-white/5 border border-white/10 rounded-[2rem] p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-white">Abonnement & accès</p>
              <p className="text-xs text-white/40 mt-0.5">
                La sécurité et le programme de base restent inclus, quel que soit le plan.
              </p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide ${
              isPremium
                ? 'bg-[#ff6b35]/15 text-[#ff6b35]'
                : 'bg-white/10 text-white/45'
            }`}>
              {isPremium ? 'PREMIUM' : 'FREE'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`rounded-2xl border p-3 ${features.programBasic ? 'border-emerald-500/20 bg-emerald-900/10 text-emerald-300' : 'border-white/10 bg-white/5 text-white/40'}`}>
              Programme de base
            </div>
            <div className={`rounded-2xl border p-3 ${features.notificationsBasic ? 'border-emerald-500/20 bg-emerald-900/10 text-emerald-300' : 'border-white/10 bg-white/5 text-white/40'}`}>
              Rappels standards
            </div>
            <div className={`rounded-2xl border p-3 ${features.athleticTestsBasic ? 'border-emerald-500/20 bg-emerald-900/10 text-emerald-300' : 'border-white/10 bg-white/5 text-white/40'}`}>
              Tests basiques
            </div>
            <div className={`rounded-2xl border p-3 ${features.calendarBasic ? 'border-emerald-500/20 bg-emerald-900/10 text-emerald-300' : 'border-white/10 bg-white/5 text-white/40'}`}>
              Planning & matchs
            </div>
            <div className={`rounded-2xl border p-3 ${features.premiumProgramAdaptations ? 'border-[#ff6b35]/20 bg-[#ff6b35]/10 text-[#ffb08f]' : 'border-white/10 bg-white/5 text-white/40'}`}>
              Suggestions de charge
            </div>
            <div className={`rounded-2xl border p-3 ${features.premiumAnalytics ? 'border-[#ff6b35]/20 bg-[#ff6b35]/10 text-[#ffb08f]' : 'border-white/10 bg-white/5 text-white/40'}`}>
              Analytics détaillées
            </div>
            <div className={`rounded-2xl border p-3 ${features.premiumAnalytics ? 'border-[#ff6b35]/20 bg-[#ff6b35]/10 text-[#ffb08f]' : 'border-white/10 bg-white/5 text-white/40'}`}>
              Score de forme
            </div>
            <div className={`rounded-2xl border p-3 ${features.premiumAnalytics ? 'border-[#ff6b35]/20 bg-[#ff6b35]/10 text-[#ffb08f]' : 'border-white/10 bg-white/5 text-white/40'}`}>
              Bilan de semaine
            </div>
            <div className={`rounded-2xl border p-3 ${features.premiumAnalytics ? 'border-[#ff6b35]/20 bg-[#ff6b35]/10 text-[#ffb08f]' : 'border-white/10 bg-white/5 text-white/40'}`}>
              Records personnels
            </div>
            <div className={`rounded-2xl border p-3 ${features.premiumAnalytics ? 'border-[#ff6b35]/20 bg-[#ff6b35]/10 text-[#ffb08f]' : 'border-white/10 bg-white/5 text-white/40'}`}>
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

        <section className="bg-white/5 border border-white/10 rounded-[2rem] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${notifStatus === 'subscribed' ? 'bg-emerald-900/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                {notifStatus === 'subscribed' ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-black text-white">Rappels d'entraînement</p>
                <p className="text-xs text-white/40 mt-0.5">
                  {notifStatus === 'subscribed' && 'Activés — notification chaque jour de séance'}
                  {notifStatus === 'denied' && 'Bloqués — autorise les notifs dans les réglages'}
                  {notifStatus === 'unsupported' && 'Non supporté par ce navigateur'}
                  {notifStatus === 'no_vapid' && 'Configuration manquante (VAPID)'}
                  {(notifStatus === 'idle' || notifStatus === 'loading') && 'Reçois un push chaque jour de séance'}
                </p>
                {notifErrorMessage && (
                  <p className="mt-1 text-[11px] text-rose-300/85">
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
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-white/10 text-xs font-bold text-white/40 hover:border-rose-500/30 hover:text-rose-400 transition-colors"
                >
                  <BellOff className="w-3 h-3" />
                  Désactiver
                </button>
              ) : notifStatus === 'idle' ? (
                <button
                  type="button"
                  onClick={notifSubscribe}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#ff6b35] text-white text-xs font-black hover:bg-[#e55a2b] transition-colors"
                >
                  <Bell className="w-3 h-3" />
                  Activer
                </button>
              ) : notifStatus === 'loading' ? (
                <span className="text-xs text-white/40 animate-pulse">...</span>
              ) : null}
            </div>
          </div>
        </section>

      </main>

      {cropImageSrc && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <section className="w-full sm:max-w-md bg-[#1a100c] border border-white/10 rounded-t-[24px] sm:rounded-[24px] p-5 space-y-4">
            <div>
              <h3 className="text-sm font-black text-white">Recadrer la photo</h3>
              <p className="text-xs text-white/40">Centre ton visage puis ajuste le zoom.</p>
            </div>

            <div className="relative h-72 bg-white/10 rounded-2xl overflow-hidden">
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
              <label htmlFor="avatar-zoom" className="text-xs font-bold text-white/40 uppercase tracking-wider">
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
                className="w-full accent-[#ff6b35]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCropCancel}
                className="py-3 rounded-2xl border border-white/10 bg-white/5 text-xs font-bold text-white/50 hover:border-white/25 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                disabled={isAvatarUploading}
                className="py-3 rounded-2xl bg-[#1a5f3f] text-white text-xs font-black uppercase tracking-wide hover:bg-[#1a5f3f]/90 transition-colors disabled:opacity-60"
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
          <section className="w-full sm:max-w-md bg-[#1a100c] border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white">Planning club</h3>
              <button
                type="button"
                onClick={() => setShowPlanningEditor(false)}
                className="text-xs font-bold text-white/40 hover:text-white transition-colors"
              >
                Annuler
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black text-white/40 uppercase tracking-wide">Jours d'entraînement club</p>
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
                            ? 'border-[#ff6b35] bg-[#ff6b35]/10 text-[#ff6b35]'
                            : 'border-white/10 bg-white/5 text-white/50 hover:border-white/25'
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
                          className="w-full text-[10px] rounded-xl border border-white/10 bg-white/5 px-1.5 py-1 text-white/50 focus:outline-none focus:border-[#ff6b35] [color-scheme:dark]"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black text-white/40 uppercase tracking-wide">Jour de match habituel</p>
              <div className="flex gap-2 flex-wrap">
                {MATCH_DAY_OPTIONS.map((opt) => (
                  <button
                    key={String(opt.day)}
                    type="button"
                    onClick={() => setEditMatchDay(opt.day)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black border-2 transition-all ${
                      editMatchDay === opt.day
                        ? 'border-[#ff6b35] bg-[#ff6b35]/10 text-[#ff6b35]'
                        : 'border-white/10 bg-white/5 text-white/50 hover:border-white/25'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Séances muscu ─── */}
            <div className="space-y-3 pt-1 border-t border-white/10">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-white/40 uppercase tracking-wide">Séances muscu</p>
                <div className="flex gap-1 bg-white/5 border border-white/10 rounded-2xl p-0.5">
                  <button
                    type="button"
                    onClick={() => setGymMode('auto')}
                    className={`px-3 py-1 rounded-xl text-[10px] font-black transition-all ${
                      gymMode === 'auto' ? 'bg-white/15 text-white shadow-sm' : 'text-white/40'
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
                      gymMode === 'manual' ? 'bg-white/15 text-white shadow-sm' : 'text-white/40'
                    }`}
                  >
                    Manuel
                  </button>
                </div>
              </div>

              {gymMode === 'auto' && editClubDays.size > 0 && (
                <div className="p-3 rounded-2xl bg-emerald-900/20 border border-emerald-500/20">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wide mb-1">
                    Suggestion calculée
                  </p>
                  <p className="text-sm font-black text-emerald-300">
                    {computeSCSchedule(
                      {
                        clubDays: Array.from(editClubDays).map((d) => ({ day: d })),
                        matchDay: editMatchDay ?? undefined,
                      },
                      profile.weeklySessions
                    ).sessions.map((s) => DAY_LABELS[s.day]).join(' · ')}
                  </p>
                  <p className="text-[10px] text-emerald-500 mt-1">
                    Basé sur ton planning club et les bonnes pratiques de récupération
                  </p>
                </div>
              )}

              {gymMode === 'auto' && editClubDays.size === 0 && (
                <p className="text-xs text-white/40">
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
              className="w-full py-4 rounded-2xl bg-[#ff6b35] hover:bg-[#e55a2b] disabled:opacity-40 text-white font-black uppercase tracking-wide transition-colors shadow-lg shadow-[#ff6b35]/20"
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
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#1a5f3f] text-white text-xs font-black uppercase tracking-wide hover:bg-[#1a5f3f]/90 transition-colors shadow-lg shadow-[#1a5f3f]/20"
        >
          Envoyer un feedback
        </a>
        <Link
          to="/legal"
          className="text-xs text-white/40 hover:text-[#ff6b35] transition-colors"
        >
          Mentions légales & Confidentialité
        </Link>
        <p className="text-[10px] text-white/20">RugbyForge v1.0</p>
      </footer>

      <BottomNav />
    </div>
  )
}
