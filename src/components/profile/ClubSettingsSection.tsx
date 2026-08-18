import { useCallback, useEffect, useMemo, useState } from 'react'
import { Dumbbell, RefreshCw, Trophy } from 'lucide-react'
import { useProfile, type UpdateProfileOptions } from '../../hooks/useProfile'
import { useCalendar } from '../../hooks/useCalendar'
import { fetchCompetitions } from '../../services/calendar/ffrSyncService'
import { getClubLogoUrl, getClubMonogram } from '../../services/ui/clubLogos'
import { ClubSearchInput } from '../match/ClubSearchInput'
import { GymDaySelector } from '../GymDaySelector'
import { buildManualSCSchedule, computeSCSchedule, TRAINING_DAYS_DEFAULT } from '../../services/program/scheduleOptimizer'
import { syncMyClubMembership } from '../../services/club/syncClubMembership'
import type { ClubSchedule, DayOfWeek, FfrCompetition, SeasonMode, UserProfile } from '../../types/training'

const CLUB_DAYS_OPTIONS: { day: DayOfWeek; label: string; short: string }[] = [
  { day: 1, label: 'Lundi', short: 'L' },
  { day: 2, label: 'Mardi', short: 'M' },
  { day: 3, label: 'Mercredi', short: 'M' },
  { day: 4, label: 'Jeudi', short: 'J' },
  { day: 5, label: 'Vendredi', short: 'V' },
  { day: 6, label: 'Samedi', short: 'S' },
  { day: 0, label: 'Dimanche', short: 'D' },
]

const MATCH_DAY_OPTIONS: { day: DayOfWeek | null; label: string }[] = [
  { day: 0, label: 'Dimanche' },
  { day: 6, label: 'Samedi' },
  { day: null, label: 'Pas de jour fixe' },
]

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function humanizeFfrSyncError(raw: string): string {
  const code = raw.toLowerCase()
  if (code === 'club_not_mapped' || code === 'club_not_found') return 'Club non reconnu FFR.'
  if (code === 'competition_not_found') return 'Compétition introuvable.'
  if (code.startsWith('ffr_http_') || code === 'ffr_unavailable' || code.startsWith('ffr_graphql')) {
    return 'La FFR ne répond pas. Réessaie plus tard.'
  }
  if (code === 'unauthorized') return 'Session expirée. Reconnecte-toi.'
  if (code.includes('failed to send') || code.includes('failed to fetch') || code.includes('network')) {
    return 'Synchronisation indisponible. Vérifie ta connexion.'
  }
  return 'Synchronisation impossible. Réessaie.'
}

interface ClubSettingsSectionProps {
  profile?: UserProfile
  updateProfile?: (patch: Partial<UserProfile>, options?: UpdateProfileOptions) => void
  effectiveSeasonMode?: SeasonMode
}

/**
 * Section "Mon club" — sélection du club FFR, compétition, resync, jours
 * d'entraînement club, jour de match habituel, sélecteur jours muscu.
 * Extrait de l'ancienne page `/calendar` (qui est dissoute).
 */
export function ClubSettingsSection({
  profile: profileProp,
  updateProfile: updateProfileProp,
  effectiveSeasonMode,
}: ClubSettingsSectionProps = {}) {
  const profileState = useProfile()
  const profile = profileProp ?? profileState.profile
  const updateProfile = updateProfileProp ?? profileState.updateProfile
  const seasonMode = effectiveSeasonMode ?? profile.seasonMode
  const { refreshFromFFR, clearFfrImportedEvents } = useCalendar()

  const seasonSyncPatch = useCallback((): Partial<UserProfile> => (
    effectiveSeasonMode && effectiveSeasonMode !== profile.seasonMode
      ? { seasonMode: effectiveSeasonMode }
      : {}
  ), [effectiveSeasonMode, profile.seasonMode])

  const [clubQuery, setClubQuery] = useState(profile.clubName ?? '')
  const [ffrCompetitions, setFfrCompetitions] = useState<FfrCompetition[]>([])
  const [ffrCompLoading, setFfrCompLoading] = useState(false)
  const [ffrSyncLoading, setFfrSyncLoading] = useState(false)
  const [ffrSyncMessage, setFfrSyncMessage] = useState<string | null>(null)
  const [ffrSyncIsError, setFfrSyncIsError] = useState(false)
  const isManualGymSchedule = profile.scSchedule?.source === 'manual'

  const suggestedScSchedule = useMemo(() => {
    if (!profile.clubSchedule || profile.clubSchedule.clubDays.length === 0) return null
    return computeSCSchedule(profile.clubSchedule, profile.weeklySessions)
  }, [profile.clubSchedule, profile.weeklySessions])

  const gymSelectedDays = useMemo(
    () =>
      new Set<DayOfWeek>(
        profile.scSchedule?.sessions.map((s) => s.day) ??
          suggestedScSchedule?.sessions.map((s) => s.day) ??
          TRAINING_DAYS_DEFAULT[profile.weeklySessions],
      ),
    [profile.scSchedule?.sessions, suggestedScSchedule, profile.weeklySessions],
  )

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync champ local sur source externe (profil async)
    setClubQuery(profile.clubName ?? '')
  }, [profile.clubName])

  // Lie club_athlete_memberships (requis pour la vue coach staff).
  useEffect(() => {
    if (!profile.clubCode?.trim()) return
    void syncMyClubMembership(profile.clubCode)
  }, [profile.clubCode])

  // Fetch competitions when a club is set but none is picked yet.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- setState synchrone avant la promesse, pattern fetch classique */
    if (!profile.clubCode) {
      setFfrCompetitions([])
      return
    }
    if (profile.ffrCompetitionId) return
    let cancelled = false
    setFfrCompLoading(true)
    fetchCompetitions(profile.clubCode).then((r) => {
      if (cancelled) return
      setFfrCompLoading(false)
      if (r.error) {
        if (r.error !== 'club_not_mapped') {
          setFfrSyncMessage(humanizeFfrSyncError(r.error))
          setFfrSyncIsError(true)
        }
        return
      }
      setFfrCompetitions(r.competitions)
    })
    return () => { cancelled = true }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [profile.clubCode, profile.ffrCompetitionId])

  const handleClubSearchChange = useCallback((name: string, code?: string) => {
    setClubQuery(name)
    if (code) {
      updateProfile({ clubCode: code, clubName: name })
      void syncMyClubMembership(code)
    }
  }, [updateProfile])

  const handleRemoveClub = useCallback(() => {
    updateProfile({
      clubCode: undefined,
      clubName: undefined,
      clubLigue: undefined,
      clubDepartmentCode: undefined,
      ffrCompetitionId: undefined,
      ffrCompetitionName: undefined,
      ffrLastSyncAt: undefined,
    })
    void syncMyClubMembership(null)
    void clearFfrImportedEvents()
    setClubQuery('')
    setFfrCompetitions([])
    setFfrSyncMessage(null)
    setFfrSyncIsError(false)
  }, [updateProfile, clearFfrImportedEvents])

  const handlePickCompetition = useCallback(async (competition: FfrCompetition) => {
    if (!profile.clubCode) return
    updateProfile({ ffrCompetitionId: competition.id, ffrCompetitionName: competition.name })
    setFfrSyncLoading(true)
    setFfrSyncMessage(null)
    setFfrSyncIsError(false)
    const result = await refreshFromFFR(competition.id, profile.clubCode)
    setFfrSyncLoading(false)
    if (result.error) {
      setFfrSyncMessage(humanizeFfrSyncError(result.error))
      setFfrSyncIsError(true)
      return
    }
    setFfrSyncMessage(`${result.imported} match${result.imported > 1 ? 's' : ''} importé${result.imported > 1 ? 's' : ''}`)
    updateProfile({ ffrLastSyncAt: new Date().toISOString() })
  }, [profile.clubCode, refreshFromFFR, updateProfile])

  const handleManualSync = useCallback(async () => {
    if (!profile.ffrCompetitionId || !profile.clubCode) return
    setFfrSyncLoading(true)
    setFfrSyncMessage(null)
    setFfrSyncIsError(false)
    const result = await refreshFromFFR(profile.ffrCompetitionId, profile.clubCode)
    setFfrSyncLoading(false)
    if (result.error) {
      setFfrSyncMessage(humanizeFfrSyncError(result.error))
      setFfrSyncIsError(true)
      return
    }
    setFfrSyncMessage(`${result.imported} match${result.imported > 1 ? 's' : ''} mis à jour`)
    updateProfile({ ffrLastSyncAt: new Date().toISOString() })
  }, [profile.ffrCompetitionId, profile.clubCode, refreshFromFFR, updateProfile])

  // Club schedule (days + match day)
  const clubDaysSet = new Set<DayOfWeek>(profile.clubSchedule?.clubDays.map((d) => d.day) ?? [])
  const matchDay = profile.clubSchedule?.matchDay

  const toggleClubDay = (day: DayOfWeek) => {
    const next = new Set(clubDaysSet)
    if (next.has(day)) next.delete(day)
    else next.add(day)
    const clubSchedule: ClubSchedule = {
      clubDays: Array.from(next).sort().map((d) => ({ day: d })),
      matchDay,
    }
    // Recompute scSchedule in auto mode
    const scSchedule = isManualGymSchedule
      ? profile.scSchedule
      : computeSCSchedule(clubSchedule, profile.weeklySessions)
    updateProfile({ clubSchedule, scSchedule, ...seasonSyncPatch() })
  }

  const setMatchDay = (day: DayOfWeek | null) => {
    const clubSchedule: ClubSchedule = {
      clubDays: profile.clubSchedule?.clubDays ?? [],
      matchDay: day ?? undefined,
    }
    const scSchedule = isManualGymSchedule
      ? profile.scSchedule
      : computeSCSchedule(clubSchedule, profile.weeklySessions)
    updateProfile({ clubSchedule, scSchedule, ...seasonSyncPatch() })
  }

  const resetGymToSuggested = () => {
    if (!profile.clubSchedule) return
    updateProfile({
      scSchedule: computeSCSchedule(profile.clubSchedule, profile.weeklySessions),
      ...seasonSyncPatch(),
    })
  }

  const clubLogoUrl = getClubLogoUrl(profile.clubCode)
  const clubMonogram = getClubMonogram(profile.clubName)

  // ── Off-season: club selector (kept) + gym days. FFR competition / club
  // days / match day are skipped — pas de matchs ni d'entraînement club hors
  // saison. Le club lui-même reste éditable car il fait partie de l'identité
  // du joueur et sera réutilisé dès le retour en saison.
  if (seasonMode === 'off_season') {
    const gymDays = new Set<DayOfWeek>(
      profile.scSchedule?.sessions.map((s) => s.day) ??
      TRAINING_DAYS_DEFAULT[profile.weeklySessions],
    )

    const toggleGymDay = (day: DayOfWeek) => {
      const next = new Set(gymDays)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      // Ne pas effacer clubSchedule : conservé pour le retour en saison.
      updateProfile({
        scSchedule: buildManualSCSchedule(Array.from(next)),
        ...seasonSyncPatch(),
      })
    }

    return (
      <div className="space-y-5">
        {/* Club (toujours éditable) */}
        <div className="space-y-2">
          <p className="text-xs font-black text-fg-muted uppercase tracking-wide">Club</p>
          {profile.clubName ? (
            <div className="p-3 rounded-2xl border border-border-app bg-layer-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-layer-10 border border-border-app flex items-center justify-center overflow-hidden flex-shrink-0">
                  {clubLogoUrl ? (
                    <img src={clubLogoUrl} alt={profile.clubName} className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xs font-black text-fg-soft">{clubMonogram}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-fg truncate">{profile.clubName}</p>
                  <p className="text-xs text-fg-muted truncate">
                    {profile.clubCode}
                    {profile.clubLigue ? ` · ${profile.clubLigue}` : ''}
                    {profile.clubDepartmentCode ? ` · CD ${profile.clubDepartmentCode}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveClub}
                className="text-[11px] font-bold text-fg-muted hover:text-brand transition-colors"
              >
                Retirer
              </button>
            </div>
          ) : (
            <ClubSearchInput value={clubQuery} clubCode={profile.clubCode} onChange={handleClubSearchChange} />
          )}
          <p className="text-[10px] text-fg-faint">
            Pas de matchs ni de planning club en inter-saison — ces réglages reviendront à la reprise.
          </p>
        </div>

        {/* Jours muscu */}
        <div className="space-y-3 pt-1 border-t border-border-app">
          <p className="text-xs font-black text-fg-muted uppercase tracking-wide">
            Jours muscu — {profile.weeklySessions === 3 ? '3 seances par semaine' : '2 seances par semaine'}
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {CLUB_DAYS_OPTIONS.map((opt) => {
              const selected = gymDays.has(opt.day)
              return (
                <button
                  key={opt.day}
                  type="button"
                  onClick={() => toggleGymDay(opt.day)}
                  className={`aspect-square rounded-xl text-xs font-black border-2 transition-all flex flex-col items-center justify-center relative ${
                    selected
                      ? 'border-brand bg-brand-soft text-brand-tint'
                      : 'border-border-app bg-layer-5 text-fg-muted hover:border-layer-15'
                  }`}
                >
                  {opt.short}
                  {selected && (
                    <Dumbbell
                      className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 text-brand"
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Club */}
      <div className="space-y-2">
        <p className="text-xs font-black text-fg-muted uppercase tracking-wide">Club</p>
        {profile.clubName ? (
          <div className="p-3 rounded-2xl border border-border-app bg-layer-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-layer-10 border border-border-app flex items-center justify-center overflow-hidden flex-shrink-0">
                {clubLogoUrl ? (
                  <img src={clubLogoUrl} alt={profile.clubName} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-xs font-black text-fg-soft">{clubMonogram}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-fg truncate">{profile.clubName}</p>
                <p className="text-xs text-fg-muted truncate">
                  {profile.clubCode}
                  {profile.clubLigue ? ` · ${profile.clubLigue}` : ''}
                  {profile.clubDepartmentCode ? ` · CD ${profile.clubDepartmentCode}` : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveClub}
              className="text-[11px] font-bold text-fg-muted hover:text-brand transition-colors"
            >
              Retirer
            </button>
          </div>
        ) : (
          <ClubSearchInput value={clubQuery} clubCode={profile.clubCode} onChange={handleClubSearchChange} />
        )}
      </div>

      {/* Compétition FFR */}
      {profile.clubCode && (
        <div className="space-y-2 pt-1 border-t border-border-app">
          <p className="text-xs font-black text-fg-muted uppercase tracking-wide">Compétition FFR</p>

          {ffrCompLoading && (
            <div className="h-11 rounded-2xl border border-border-app bg-layer-5 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-fg-faint animate-spin" />
            </div>
          )}

          {!profile.ffrCompetitionId && !ffrCompLoading && ffrCompetitions.length === 0 && !ffrSyncMessage && (
            <p className="text-xs text-fg-faint italic">Import auto non disponible pour ce club.</p>
          )}

          {!profile.ffrCompetitionId && !ffrCompLoading && ffrSyncMessage && (
            <p className={`text-xs italic ${ffrSyncIsError ? 'text-danger' : 'text-fg-faint'}`}>
              {ffrSyncMessage}
            </p>
          )}

          {!profile.ffrCompetitionId && !ffrCompLoading && ffrCompetitions.length > 0 && (
            <div className="space-y-1">
              {ffrCompetitions.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { void handlePickCompetition(c) }}
                  className="w-full px-3 py-2.5 text-left rounded-2xl border border-border-app bg-layer-5 hover:bg-layer-10 transition-colors"
                >
                  <p className="text-sm font-bold text-fg">{c.name}</p>
                  <p className="text-xs text-fg-muted">
                    {c.level ?? ''}{c.pool ? ` · ${c.pool}` : ''}
                    {c.season ? ` · ${c.season}` : ''}
                  </p>
                </button>
              ))}
            </div>
          )}

          {profile.ffrCompetitionName && (
            <div className="p-3 rounded-2xl border border-info-bd bg-info-bg space-y-2">
              <div>
                <p className="text-sm font-bold text-fg">{profile.ffrCompetitionName}</p>
                <p className="text-[10px] text-fg-muted mt-0.5">
                  {profile.ffrLastSyncAt
                    ? `Synchronisé ${new Date(profile.ffrLastSyncAt).toLocaleDateString('fr-FR')} · auto-sync quotidien`
                    : 'Synchronisation automatique activée'}
                </p>
              </div>
              {ffrSyncMessage && (
                <p className={`text-xs ${ffrSyncIsError ? 'text-danger' : 'text-ok-strong'}`}>
                  {ffrSyncMessage}
                </p>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => { void handleManualSync() }}
                  disabled={ffrSyncLoading}
                  data-testid="club-settings-resync"
                  className="text-[11px] font-bold text-info hover:text-info/80 transition-colors disabled:opacity-50 flex items-center gap-1 rf-focus-ring"
                >
                  <RefreshCw className={`w-3 h-3 ${ffrSyncLoading ? 'animate-spin' : ''}`} />
                  Actualiser FFR
                </button>
                <span className="text-fg-faint">·</span>
                <button
                  type="button"
                  onClick={() => {
                    updateProfile({ ffrCompetitionId: undefined, ffrCompetitionName: undefined, ffrLastSyncAt: undefined })
                    void clearFfrImportedEvents()
                    setFfrSyncMessage(null)
                    setFfrSyncIsError(false)
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

      {/* Planning hebdo */}
      <div className="space-y-2 pt-1 border-t border-border-app">
        <p className="text-xs font-black text-fg-muted uppercase tracking-wide">Jours d'entraînement club</p>
        <div className="grid grid-cols-7 gap-1">
          {CLUB_DAYS_OPTIONS.map((opt) => {
            const selected = clubDaysSet.has(opt.day)
            return (
              <button
                key={opt.day}
                type="button"
                onClick={() => toggleClubDay(opt.day)}
                aria-pressed={selected}
                className={`aspect-square rounded-xl text-xs font-black border-2 transition-all ${
                  selected
                    ? 'border-brand bg-brand-soft text-brand-tint'
                    : 'border-border-app bg-layer-5 text-fg-muted hover:border-layer-15'
                }`}
              >
                {opt.short}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-black text-fg-muted uppercase tracking-wide">Jour de match habituel</p>
        <div className="flex gap-2 flex-wrap">
          {MATCH_DAY_OPTIONS.map((opt) => (
            <button
              key={String(opt.day)}
              type="button"
              onClick={() => setMatchDay(opt.day)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black border-2 transition-all flex items-center gap-1.5 ${
                matchDay === opt.day
                  ? 'border-brand bg-brand-soft text-brand-tint'
                  : 'border-border-app bg-layer-5 text-fg-soft hover:border-layer-15'
              }`}
            >
              <Trophy className="w-3 h-3" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Jours muscu — suggestion calée sur club + match, ajustement optionnel */}
      <div className="space-y-3 pt-1 border-t border-border-app">
        <div className="space-y-1">
          <p className="text-xs font-black text-fg-muted uppercase tracking-wide">
            Séances muscu · {profile.weeklySessions}×/semaine
          </p>
          <p className="text-[11px] text-fg-muted leading-snug">
            Proposition selon ton match et tes entraînements club. Tu peux toucher un jour pour l&apos;ajuster — le
            programme gère l&apos;activation légère avant le match.
          </p>
        </div>

        {!profile.clubSchedule || profile.clubSchedule.clubDays.length === 0 ? (
          <p className="text-xs text-fg-muted">Indique d&apos;abord tes jours d&apos;entraînement club pour caler la muscu.</p>
        ) : (
          <>
            <GymDaySelector
              clubSchedule={profile.clubSchedule}
              selectedDays={gymSelectedDays}
              weeklySessions={profile.weeklySessions}
              onChange={(days) => {
                updateProfile({
                  scSchedule: buildManualSCSchedule(Array.from(days)),
                  ...seasonSyncPatch(),
                })
              }}
            />
            {isManualGymSchedule && suggestedScSchedule && (
              <button
                type="button"
                onClick={resetGymToSuggested}
                className="text-[11px] font-bold text-brand-tint hover:text-brand transition-colors"
              >
                Réaligner sur {suggestedScSchedule.sessions.map((s) => DAY_LABELS[s.day]).join(' · ')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
