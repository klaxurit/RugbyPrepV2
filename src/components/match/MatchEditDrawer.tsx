import { useEffect, useState } from 'react'
import {
  Calendar,
  Flag,
  Home,
  MapPin,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Undo2,
} from 'lucide-react'
import type { AnnualPlanningContext } from '../../types/annualPlanning'
import type { SchedulingMode } from '../../types/scheduling'
import type { CalendarEvent, MatchKind } from '../../types/training'
import { BottomSheet } from '../ui/BottomSheet'
import { ClubAvatar } from './ClubAvatar'
import { formatDateFR } from './matchDate'
import { useCalendar } from '../../hooks/useCalendar'
import { useProfile } from '../../hooks/useProfile'
import { buildProfileUpdatesForManualMatchKind } from '../../services/season/buildProfileUpdatesForManualMatchKind'
import { MatchKindPicker } from './MatchKindPicker'

const MATCH_KIND_UI: Record<'fr' | 'en', { section: string; hint: string }> = {
  fr: {
    section: 'Type de match',
    hint: 'Pour le programme et les transitions de saison.',
  },
  en: {
    section: 'Match type',
    hint: 'For your programme and season transitions.',
  },
}

interface MatchEditDrawerProps {
  event: CalendarEvent | null
  onClose: () => void
  /** Si présent, applique journal + ancres comme lors de l’ajout manuel (Home / Semaine). */
  matchKindProfileContext?: {
    planningContext: AnnualPlanningContext
    schedulingMode: SchedulingMode
    today: string
  }
}

/**
 * Édition d’un match — même coque {@link BottomSheet} que l’ajout de match
 * (handle, swipe, fond, safe-area) et en-tête aligné sur {@link AddMatchModal}.
 */
export function MatchEditDrawer({
  event,
  onClose,
  matchKindProfileContext,
}: MatchEditDrawerProps) {
  const { profile, updateProfile } = useProfile()
  const lang = (profile.preferredLanguage as 'fr' | 'en' | undefined) ?? 'fr'
  const ui = MATCH_KIND_UI[lang]
  const {
    setMatchNeutral,
    hideImportedEvent,
    unhideImportedEvent,
    updateMatchLoad,
    updateMatchKind,
    removeEvent,
  } = useCalendar()

  const match = event?.type === 'match' ? event : null
  const open = match !== null

  const [rpeInput, setRpeInput] = useState<number>(7)
  const [durationInput, setDurationInput] = useState<number>(80)
  const [saving, setSaving] = useState(false)
  const [asyncBusy, setAsyncBusy] = useState(false)
  const [savedRecently, setSavedRecently] = useState(false)

  useEffect(() => {
    if (match) {
      setRpeInput(match.rpe ?? 7)
      setDurationInput(match.duration_min ?? 80)
      setSavedRecently(false)
    }
  }, [match])

  const blocking = saving || asyncBusy

  const handleSheetClose = () => {
    if (blocking) return
    onClose()
  }

  const isFFR = match?.source === 'ffr_import'
  const isHidden = match?.user_hidden === true
  const daysDiff = match
    ? Math.round(
        (new Date(match.date + 'T12:00:00').getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000,
      )
    : 0
  const isPast = match ? daysDiff < 0 : false

  const handleToggleNeutral = async () => {
    if (!match || blocking) return
    setAsyncBusy(true)
    try {
      await setMatchNeutral(match.id, !match.is_neutral)
    } finally {
      setAsyncBusy(false)
    }
  }

  const handleToggleHidden = async () => {
    if (!match || blocking) return
    setAsyncBusy(true)
    try {
      if (isHidden) await unhideImportedEvent(match.id)
      else await hideImportedEvent(match.id)
    } finally {
      setAsyncBusy(false)
    }
  }

  const handleSaveLoad = async () => {
    if (!match) return
    setSaving(true)
    try {
      await updateMatchLoad(match.id, rpeInput, durationInput)
      setSavedRecently(true)
      window.setTimeout(() => setSavedRecently(false), 1500)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!match || blocking) return
    setAsyncBusy(true)
    try {
      await removeEvent(match.id)
      onClose()
    } finally {
      setAsyncBusy(false)
    }
  }

  const handleMatchKind = async (kind: MatchKind) => {
    if (!match || blocking) return
    if (match.match_kind === kind) return
    setAsyncBusy(true)
    try {
      await updateMatchKind(match.id, kind)
      if (matchKindProfileContext) {
        updateProfile(
          buildProfileUpdatesForManualMatchKind({
            kind,
            eventId: match.id,
            profile,
            today: matchKindProfileContext.today,
            planningContext: matchKindProfileContext.planningContext,
            schedulingMode: matchKindProfileContext.schedulingMode,
          }),
        )
      }
    } finally {
      setAsyncBusy(false)
    }
  }

  const ariaLabel = match
    ? `Édition du match${match.opponent ? ` vs ${match.opponent}` : ''}`
    : 'Édition du match'

  return (
    <BottomSheet
      open={open}
      onClose={handleSheetClose}
      ariaLabel={ariaLabel}
      hideDefaultHeader
      disableSwipeDismiss={blocking}
      disableBackdropDismiss={blocking}
      showClose={!blocking}
    >
      {match ? (
        <div className="px-5 pb-4 pt-1" data-testid="match-edit-drawer">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-tint">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand text-on-brand">
              <Calendar className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
            Calendrier
          </div>

          <h2
            className="mt-3 font-serif italic font-extrabold leading-[1.08] text-fg [text-wrap:balance]"
            style={{ fontSize: 28, letterSpacing: '-0.5px' }}
          >
            <span className="block">{match.opponent ? `vs ${match.opponent}` : 'Ton match'}</span>
            <span className="mt-1 block text-[0.58em] font-bold not-italic leading-tight text-fg-secondary">
              {formatDateFR(match.date)}
              {match.kickoff_time ? ` · ${match.kickoff_time.slice(0, 5)}` : ''}
            </span>
          </h2>

          <div className="mt-4">
            <ClubAvatar code={match.opponent_code} name={match.opponent} size="md" />
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <span className="text-xs font-black text-fg-muted uppercase tracking-wide mb-2 block">
                {ui.section}
              </span>
              <p className="text-[11px] font-semibold text-fg-muted mb-3">{ui.hint}</p>
              <MatchKindPicker
                lang={lang}
                selected={match.match_kind}
                disabled={blocking}
                testIdPrefix="drawer-match-kind"
                onSelect={(kind) => void handleMatchKind(kind)}
              />
              {!match.match_kind ? (
                <p className="mt-2 text-[10px] font-semibold text-fg-muted">
                  {lang === 'fr' ? 'Choisis un type pour synchroniser ton programme.' : 'Pick a type to sync your programme.'}
                </p>
              ) : null}
            </div>

            <div>
              <span className="text-xs font-black text-fg-muted uppercase tracking-wide mb-2 block">
                Lieu
              </span>
              <div className="rounded-2xl border border-border-app bg-layer-5 overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
                <div className="flex items-center gap-3 px-4 py-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      match.is_neutral
                        ? 'bg-brand-soft text-brand-tint ring-1 ring-brand-border'
                        : 'bg-app text-fg ring-1 ring-border-app'
                    }`}
                    aria-hidden
                  >
                    {match.is_neutral ? (
                      <Flag className="h-5 w-5" strokeWidth={2.25} />
                    ) : match.is_home ? (
                      <Home className="h-5 w-5" strokeWidth={2.25} />
                    ) : (
                      <MapPin className="h-5 w-5" strokeWidth={2.25} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-black leading-tight text-fg tracking-tight">
                      {match.is_neutral
                        ? 'Terrain neutre'
                        : match.is_home
                          ? 'Domicile'
                          : match.is_home === false
                            ? 'Extérieur'
                            : 'Lieu non précisé'}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold leading-snug text-fg-muted">
                      {match.is_neutral
                        ? 'Le match n’est ni à domicile ni à l’extérieur.'
                        : match.is_home === true || match.is_home === false
                          ? 'Tu peux passer en terrain neutre si besoin.'
                          : 'Indique un terrain neutre si le lieu est partagé.'}
                    </p>
                  </div>
                </div>
                <div className="border-t border-border-app bg-app/40">
                  <button
                    type="button"
                    onClick={handleToggleNeutral}
                    disabled={blocking}
                    data-testid="drawer-toggle-neutral"
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors rf-focus-ring disabled:opacity-50 hover:bg-layer-7 active:bg-layer-10"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-tint">
                      {match.is_neutral ? (
                        <Undo2 className="h-4 w-4" strokeWidth={2.25} />
                      ) : (
                        <Flag className="h-4 w-4" strokeWidth={2.25} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-black text-fg">
                        {match.is_neutral ? 'Revenir au lieu du match' : 'Marquer terrain neutre'}
                      </span>
                      <span className="mt-0.5 block text-[11px] font-semibold text-fg-muted">
                        {match.is_neutral
                          ? 'Rétablit domicile ou extérieur selon ta fiche.'
                          : 'Terrain neutre sans domicile ni déplacement.'}
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {isPast && (
              <div>
                <span className="text-xs font-black text-fg-muted uppercase tracking-wide mb-2 block">
                  Charge du match
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1.5 block">
                    <span className="text-[10px] font-bold text-fg-muted">RPE (1-10)</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={rpeInput}
                      onChange={(e) => setRpeInput(Number(e.target.value))}
                      className="w-full rounded-2xl border border-border-app bg-layer-5 px-4 py-3 text-lg font-black text-fg focus:outline-none focus:border-brand rf-focus-ring"
                    />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className="text-[10px] font-bold text-fg-muted">Durée (min)</span>
                    <input
                      type="number"
                      min={10}
                      max={240}
                      value={durationInput}
                      onChange={(e) => setDurationInput(Number(e.target.value))}
                      className="w-full rounded-2xl border border-border-app bg-layer-5 px-4 py-3 text-lg font-black text-fg focus:outline-none focus:border-brand rf-focus-ring"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleSaveLoad}
                  disabled={saving}
                  data-testid="drawer-save-load"
                  className="mt-4 w-full py-4 rounded-2xl bg-brand hover:bg-brand-hover text-on-brand font-black uppercase italic tracking-wide transition-colors shadow-lg shadow-brand-glow disabled:opacity-50 rf-focus-ring flex items-center justify-center gap-2"
                >
                  {savedRecently ? <CheckCircle2 className="w-4 h-4" /> : null}
                  {savedRecently ? 'Charge enregistrée' : saving ? 'Enregistrement…' : 'Enregistrer la charge'}
                </button>
              </div>
            )}

            <div className="space-y-3 border-t border-border-app pt-5">
              {isFFR ? (
                <button
                  type="button"
                  onClick={handleToggleHidden}
                  disabled={blocking}
                  data-testid="drawer-toggle-hidden"
                  className="flex w-full items-center gap-3 rounded-2xl border border-border-app bg-layer-5 px-4 py-4 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-colors hover:border-brand-border hover:bg-brand-soft/25 disabled:opacity-50 rf-focus-ring"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app text-fg-muted ring-1 ring-border-app">
                    {isHidden ? (
                      <Eye className="h-4 w-4" strokeWidth={2.25} />
                    ) : (
                      <EyeOff className="h-4 w-4" strokeWidth={2.25} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-black text-fg">
                      {isHidden ? 'Afficher ce match' : 'Masquer ce match'}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-semibold text-fg-muted">
                      {isHidden ? 'Il réapparaît dans ton calendrier.' : 'Import FFR — tu peux le retirer de la vue.'}
                    </span>
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={blocking}
                  data-testid="drawer-remove"
                  className="flex w-full items-center gap-3 rounded-2xl border border-danger-bd/35 bg-danger-bg/15 px-4 py-4 text-left transition-colors hover:border-danger-bd hover:bg-danger-bg/35 disabled:opacity-50 rf-focus-ring"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-bg/50 text-danger ring-1 ring-danger-bd/40">
                    <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-black text-danger">Supprimer ce match</span>
                    <span className="mt-0.5 block text-[11px] font-semibold text-fg-muted">
                      Action définitive pour un match ajouté à la main.
                    </span>
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </BottomSheet>
  )
}
