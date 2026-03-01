import { Link } from 'react-router-dom'
import { useMemo, useRef, useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { ChevronLeft, Dumbbell, Shield, RefreshCw, User, Camera, Bell, BellOff, BellRing, Ruler, Calendar, RotateCcw } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { BottomNav } from '../components/BottomNav'
import type { AuthError } from '../types/auth'
import type { Contra, Equipment, DayOfWeek, ClubSchedule, TrainingLevel, SeasonMode } from '../types/training'
import ffrClubsData from '../data/ffrClubs.v2021.json'
import { getCroppedImageFile } from '../services/ui/imageCrop'
import { getClubLogoUrl, getClubMonogram } from '../services/ui/clubLogos'
import { computeSCSchedule, buildManualSCSchedule } from '../services/program/scheduleOptimizer'
import { GymDaySelector } from '../components/GymDaySelector'

const EQUIPMENT_OPTIONS: { value: Exclude<Equipment, 'none'>; label: string }[] = [
  { value: 'barbell',      label: 'Barre' },
  { value: 'dumbbell',     label: 'Haltères' },
  { value: 'bench',        label: 'Banc' },
  { value: 'band',         label: 'Élastique' },
  { value: 'box',          label: 'Box' },
  { value: 'pullup_bar',   label: 'Barre traction' },
  { value: 'med_ball',     label: 'Médecine Ball' },
  { value: 'landmine',     label: 'Landmine' },
  { value: 'tbar_row',     label: 'T-Bar Row' },
  { value: 'ghd',          label: 'GHD' },
  { value: 'machine',      label: 'Machine' },
  { value: 'sprint_track', label: 'Piste / Gazon synthétique' },
  { value: 'ab_wheel',     label: 'Ab Wheel' },
]

const INJURY_OPTIONS: { value: Contra; label: string }[] = [
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

const LEAGUE_OPTIONS = ['R1', 'R2', 'F3', 'F2', 'F1', 'N1'] as const

const TRAINING_LEVELS: {
  value: TrainingLevel
  label: string
  sub: string
  emoji: string
  legacyLevel: 'beginner' | 'intermediate'
}[] = [
  { value: 'starter',     label: 'Débutant',      sub: 'Poids du corps & élastiques',      emoji: '🌱', legacyLevel: 'beginner' },
  { value: 'builder',     label: 'Intermédiaire',  sub: 'Haltères & supersets',             emoji: '💪', legacyLevel: 'intermediate' },
  { value: 'performance', label: 'Avancé',         sub: 'Barre + blocs de contraste',       emoji: '🏆', legacyLevel: 'intermediate' },
]

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
  const { status: notifStatus, subscribe: notifSubscribe, unsubscribe: notifUnsubscribe } = useNotifications(profile)
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

  // Sync inputs quand le profil charge depuis Supabase
  useEffect(() => {
    setHeightInput(profile.heightCm?.toString() ?? '')
    setWeightInput(profile.weightKg?.toString() ?? '')
  }, [profile.heightCm, profile.weightKg])
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
    setShowPlanningEditor(false)
  }

  const handleSelectClub = (club: FfrClub) => {
    updateProfile({
      clubCode: club.code,
      clubName: club.name,
      clubLigue: club.ligue,
      clubDepartmentCode: club.departmentCode,
    })
    setClubQuery('')
  }

  const selectedClubLogoUrl = getClubLogoUrl(profile.clubCode)
  const selectedClubMonogram = getClubMonogram(profile.clubName)

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900 pb-24">

      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 -ml-2 rounded-xl hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <p className="text-xs font-bold tracking-widest text-rose-600 uppercase italic">RugbyPrep</p>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Mon Profil</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={resetProfile}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-slate-400 hover:border-rose-200 hover:text-rose-500 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Réinitialiser
        </button>
      </header>

      <main className="px-6 pt-6 space-y-5 max-w-md mx-auto">
        <section className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isAvatarUploading}
              className="relative w-20 h-20 rounded-3xl border border-gray-100 bg-slate-50 flex items-center justify-center overflow-hidden disabled:opacity-60"
              aria-label="Changer la photo de profil"
            >
              {authState.user?.avatarUrl ? (
                <img
                  src={authState.user.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-slate-300" />
              )}
              <span className="absolute right-1 bottom-1 w-6 h-6 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                <Camera className="w-3.5 h-3.5" />
              </span>
            </button>
            <div>
              <h2 className="text-sm font-black text-slate-900">Photo de profil</h2>
              <p className="text-xs text-slate-400">
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
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl">
              <p className="text-xs text-rose-700 font-medium">{avatarError}</p>
            </div>
          )}
        </section>

        {/* Infos de jeu */}
        <section className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">Infos de jeu</h2>

          {/* Poste */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Poste</label>
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
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-gray-50 text-slate-600 border border-gray-100 hover:border-rose-200'
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
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Niveau d'entraînement</label>
            <div className="flex flex-col gap-2">
              {TRAINING_LEVELS.map((opt) => {
                const active = (profile.trainingLevel ?? 'performance') === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateProfile({ trainingLevel: opt.value, level: opt.legacyLevel })}
                    className={`flex items-center gap-3 py-2.5 px-3 rounded-2xl text-xs font-bold text-left transition-all ${
                      active
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-gray-50 text-slate-600 border border-gray-100 hover:border-rose-200'
                    }`}
                  >
                    <span className="text-base flex-shrink-0">{opt.emoji}</span>
                    <div>
                      <p className="font-black">{opt.label}</p>
                      <p className={`text-[10px] font-normal ${active ? 'text-rose-200' : 'text-slate-400'}`}>{opt.sub}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mode saison */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mode saison</label>
            {(profile.trainingLevel ?? 'performance') === 'starter' ? (
              <p className="text-[11px] text-slate-400 bg-slate-50 rounded-2xl px-3 py-2.5">
                Le mode saison s'active à partir du niveau Intermédiaire. Continue ton programme débutant — le passage à l'Intermédiaire débloquera ce réglage.
              </p>
            ) : (
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
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-gray-50 text-slate-600 border border-gray-100 hover:border-rose-200'
                      }`}
                    >
                      <span className="text-base flex-shrink-0">{opt.emoji}</span>
                      <div>
                        <p className="font-black">{opt.label}</p>
                        <p className={`text-[10px] font-normal ${active ? 'text-rose-200' : 'text-slate-400'}`}>{opt.sub}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Séances / semaine */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Séances / semaine</label>
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
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-gray-50 text-slate-600 border border-gray-100 hover:border-rose-200'
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
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Club <span className="text-slate-300 font-normal normal-case">(optionnel)</span>
            </label>

            <input
              type="text"
              value={clubQuery}
              onChange={(event) => setClubQuery(event.target.value)}
              placeholder="Recherche nom, code ou ligue"
              className="w-full h-11 rounded-2xl border border-gray-200 px-3 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-300"
            />

            {profile.clubName && (
              <div className="p-3 rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden">
                    {selectedClubLogoUrl ? (
                      <img src={selectedClubLogoUrl} alt={profile.clubName} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xs font-black text-slate-500">{selectedClubMonogram}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{profile.clubName}</p>
                    <p className="text-xs text-slate-500">
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
                  className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors"
                >
                  Retirer
                </button>
              </div>
            )}

            {clubQuery.trim().length > 0 && (
              <div className="max-h-56 overflow-auto rounded-2xl border border-gray-100 bg-white">
                {filteredClubs.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-400">Aucun club trouvé.</p>
                ) : (
                  filteredClubs.map((club) => (
                    <button
                      key={club.code}
                      type="button"
                      onClick={() => handleSelectClub(club)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {getClubLogoUrl(club.code) ? (
                            <img src={getClubLogoUrl(club.code) ?? ''} alt={club.name} className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-[10px] font-black text-slate-500">{getClubMonogram(club.name)}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{club.name}</p>
                          <p className="text-[11px] text-slate-400">{club.code} · {club.ligue} · CD {club.departmentCode}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Niveau championnat */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Championnat <span className="text-slate-300 font-normal normal-case">(optionnel)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateProfile({ leagueLevel: undefined })}
                className={`py-2 px-3.5 rounded-2xl text-xs font-bold transition-all ${
                  !profile.leagueLevel
                    ? 'bg-slate-900 text-white'
                    : 'bg-gray-50 text-slate-600 border border-gray-100 hover:border-slate-300'
                }`}
              >
                Non renseigné
              </button>
              {LEAGUE_OPTIONS.map((opt) => {
                const active = profile.leagueLevel === opt
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateProfile({ leagueLevel: opt })}
                    className={`py-2 px-3.5 rounded-2xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'bg-gray-50 text-slate-600 border border-gray-100 hover:border-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Morphologie */}
        <section className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-violet-50 text-violet-500">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Morphologie</h2>
              <p className="text-xs text-slate-400">Taille, poids et IMC</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taille (cm)</label>
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
                className="w-full h-11 rounded-2xl border border-gray-200 px-3 text-sm font-black text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Poids (kg)</label>
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
                className="w-full h-11 rounded-2xl border border-gray-200 px-3 text-sm font-black text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-300"
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
              <div className="flex items-center justify-between p-4 rounded-2xl bg-violet-50 border border-violet-100">
                <div>
                  <p className="text-xs font-bold text-violet-500 uppercase tracking-wide">IMC</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">{label}</p>
                </div>
                <span className="text-2xl font-black text-violet-600">{bmi.toFixed(1)}</span>
              </div>
            )
          })()}
        </section>

        {/* Équipement */}
        <section className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-blue-50 text-blue-500">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Équipement disponible</h2>
              <p className="text-xs text-slate-400">Sélectionne ce que tu as</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {EQUIPMENT_OPTIONS.map(({ value, label }) => {
              const active = profile.equipment.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateProfile({ equipment: toggleValue(profile.equipment, value) })}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold text-left transition-all flex items-center gap-2 ${
                    active
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-50 text-slate-600 border border-gray-100 hover:border-blue-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-white' : 'bg-gray-300'}`} />
                  {label}
                </button>
              )
            })}
          </div>
        </section>

        {/* Planning club */}
        <section className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-500">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">Planning club</h2>
                <p className="text-xs text-slate-400">Entraînements club & séances muscu adaptées</p>
              </div>
            </div>
            <button
              type="button"
              onClick={openPlanningEditor}
              className="text-xs font-bold text-rose-600 hover:text-rose-500 transition-colors"
            >
              Modifier
            </button>
          </div>

          {profile.clubSchedule ? (
            <div className="space-y-2">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Entraînements club</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.clubSchedule.clubDays.map((d) => (
                    <span key={d.day} className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                      {DAY_LABELS[d.day]}{d.time ? ` ${d.time}` : ''}
                    </span>
                  ))}
                </div>
              </div>
              {profile.clubSchedule.matchDay !== undefined && (
                <p className="text-xs text-slate-400">
                  Match habituel : <span className="font-bold text-slate-600">{DAY_LABELS[profile.clubSchedule.matchDay]}</span>
                </p>
              )}
              {profile.scSchedule && profile.scSchedule.sessions.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Séances muscu suggérées</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.scSchedule.sessions.map((s) => (
                      <span key={s.day} className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold">
                        {DAY_LABELS[s.day]}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Calculé automatiquement selon ton planning</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!profile.clubSchedule) return
                  const sc = computeSCSchedule(profile.clubSchedule, profile.weeklySessions)
                  updateProfile({ scSchedule: sc })
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors mt-1"
              >
                <RotateCcw className="w-3 h-3" />
                Recalculer les séances muscu
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Non configuré — clique sur "Modifier" pour ajouter ton planning.</p>
          )}
        </section>

        {/* Blessures */}
        <section className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-orange-50 text-orange-500">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Douleurs / Blessures</h2>
              <p className="text-xs text-slate-400">Laisse vide si aucune</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {INJURY_OPTIONS.map(({ value, label }) => {
              const active = profile.injuries.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateProfile({ injuries: toggleValue(profile.injuries, value) })}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold text-left transition-all flex items-center gap-2 ${
                    active
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-gray-50 text-slate-600 border border-gray-100 hover:border-orange-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-white' : 'bg-gray-300'}`} />
                  {label}
                </button>
              )
            })}
          </div>
          {profile.injuries.length > 0 && (
            <p className="text-xs text-orange-500 font-medium">
              {profile.injuries.length} zone{profile.injuries.length > 1 ? 's' : ''} à protéger — les exercices contra-indiqués seront exclus.
            </p>
          )}
        </section>

        {/* ─── Notifications ───────────────────────────────────────────── */}
        <section className="bg-white border border-gray-100 rounded-[2rem] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${notifStatus === 'subscribed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                {notifStatus === 'subscribed' ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Rappels d'entraînement</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {notifStatus === 'subscribed' && 'Activés — notification chaque jour de séance'}
                  {notifStatus === 'denied' && 'Bloqués — autorise les notifs dans les réglages'}
                  {notifStatus === 'unsupported' && 'Non supporté par ce navigateur'}
                  {notifStatus === 'no_vapid' && 'Configuration manquante (VAPID)'}
                  {(notifStatus === 'idle' || notifStatus === 'loading') && 'Reçois un push chaque jour de séance'}
                </p>
              </div>
            </div>

            {notifStatus === 'subscribed' ? (
              <button
                type="button"
                onClick={notifUnsubscribe}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-gray-200 text-xs font-bold text-slate-400 hover:border-rose-200 hover:text-rose-500 transition-colors"
              >
                <BellOff className="w-3 h-3" />
                Désactiver
              </button>
            ) : notifStatus === 'idle' ? (
              <button
                type="button"
                onClick={notifSubscribe}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-rose-600 text-white text-xs font-black hover:bg-rose-500 transition-colors"
              >
                <Bell className="w-3 h-3" />
                Activer
              </button>
            ) : notifStatus === 'loading' ? (
              <span className="text-xs text-slate-400 animate-pulse">...</span>
            ) : null}
          </div>
        </section>

      </main>

      {cropImageSrc && (
        <div className="fixed inset-0 z-[70] bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <section className="w-full sm:max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] p-5 space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">Recadrer la photo</h3>
              <p className="text-xs text-slate-400">Centre ton visage puis ajuste le zoom.</p>
            </div>

            <div className="relative h-72 bg-slate-100 rounded-2xl overflow-hidden">
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
              <label htmlFor="avatar-zoom" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
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
                className="w-full accent-rose-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCropCancel}
                className="py-3 rounded-2xl border border-gray-200 bg-white text-xs font-bold text-slate-500 hover:border-slate-300 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                disabled={isAvatarUploading}
                className="py-3 rounded-2xl bg-rose-600 text-white text-xs font-black uppercase tracking-wide hover:bg-rose-500 transition-colors disabled:opacity-60"
              >
                {isAvatarUploading ? 'Upload...' : 'Valider'}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Planning editor modal */}
      {showPlanningEditor && (
        <div className="fixed inset-0 z-[70] bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <section className="w-full sm:max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Planning club</h3>
              <button
                type="button"
                onClick={() => setShowPlanningEditor(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
              >
                Annuler
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wide">Jours d'entraînement club</p>
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
                          value={editClubDayTimes[opt.day] ?? ''}
                          onChange={(e) => setEditClubDayTimes((prev) => ({ ...prev, [opt.day]: e.target.value }))}
                          className="w-full text-[10px] rounded-xl border border-gray-100 px-1.5 py-1 text-slate-500 bg-white focus:outline-none focus:border-rose-300"
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
                    onClick={() => setEditMatchDay(opt.day)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black border-2 transition-all ${
                      editMatchDay === opt.day
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-gray-100 bg-white text-slate-500 hover:border-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Séances muscu ─── */}
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
                      gymMode === 'manual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Manuel
                  </button>
                </div>
              </div>

              {gymMode === 'auto' && editClubDays.size > 0 && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wide mb-1">
                    Suggestion calculée
                  </p>
                  <p className="text-sm font-black text-emerald-800">
                    {computeSCSchedule(
                      {
                        clubDays: Array.from(editClubDays).map((d) => ({ day: d })),
                        matchDay: editMatchDay ?? undefined,
                      },
                      profile.weeklySessions
                    ).sessions.map((s) => DAY_LABELS[s.day]).join(' · ')}
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-1">
                    Basé sur ton planning club et les bonnes pratiques de récupération
                  </p>
                </div>
              )}

              {gymMode === 'auto' && editClubDays.size === 0 && (
                <p className="text-xs text-slate-400">
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
              className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-black uppercase tracking-wide transition-colors"
            >
              Appliquer
            </button>
          </section>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
