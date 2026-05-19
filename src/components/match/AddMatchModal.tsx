import { useMemo, useState } from 'react'
import { Calendar, Home, MapPin, Flag } from 'lucide-react'
import type { CalendarEvent } from '../../types/training'
import { BottomSheet } from '../ui/BottomSheet'
import { ClubSearchInput } from './ClubSearchInput'
import { diffDays, formatDateFR, suggestedMatchSaturdayISO } from './matchDate'

interface AddMatchModalProps {
  open: boolean
  /** Context calendrier (debug override / jour courant) pour le défaut samedi. */
  todayISO: string
  initialDate?: string
  existingEvents?: CalendarEvent[]
  onClose: () => void
  onSave: (payload: Omit<CalendarEvent, 'id' | 'created_at'>) => Promise<void>
}

interface AddMatchFormProps {
  todayISO: string
  initialDate?: string
  existingEvents?: CalendarEvent[]
  onClose: () => void
  onSave: (payload: Omit<CalendarEvent, 'id' | 'created_at'>) => Promise<void>
}

/** Remonté à chaque ouverture (key) — évite reset via useEffect. */
function AddMatchForm({
  todayISO,
  initialDate,
  existingEvents,
  onClose,
  onSave,
}: AddMatchFormProps) {
  const [date, setDate] = useState(initialDate ?? suggestedMatchSaturdayISO(todayISO))
  const [kickoffTime, setKickoffTime] = useState('15:00')
  const [opponent, setOpponent] = useState('')
  const [opponentCode, setOpponentCode] = useState<string | undefined>()
  const [venueKind, setVenueKind] = useState<'home' | 'away' | 'neutral' | undefined>('home')
  const [venue, setVenue] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDuplicate, setConfirmDuplicate] = useState(false)

  const handleOpponentChange = (name: string, code?: string) => {
    setOpponent(name)
    setOpponentCode(code)
  }

  const duplicateFFR = useMemo(() => {
    if (!existingEvents || !opponentCode) return null
    return (
      existingEvents.find(
        (e) =>
          e.source === 'ffr_import' &&
          e.type === 'match' &&
          Math.abs(diffDays(e.date) - diffDays(date)) <= 1 &&
          e.opponent_code === opponentCode,
      ) ?? null
    )
  }, [date, opponentCode, existingEvents])

  const handleSave = async () => {
    if (duplicateFFR && !confirmDuplicate) {
      setConfirmDuplicate(true)
      return
    }
    setSaving(true)
    await onSave({
      type: 'match',
      date,
      ...(kickoffTime ? { kickoff_time: kickoffTime } : {}),
      ...(opponent ? { opponent } : {}),
      ...(opponentCode ? { opponent_code: opponentCode } : {}),
      ...(venueKind === 'home' ? { is_home: true } : {}),
      ...(venueKind === 'away' ? { is_home: false } : {}),
      ...(venueKind === 'neutral' ? { is_neutral: true } : {}),
      ...(venue.trim() ? { venue: venue.trim() } : {}),
    })
    setSaving(false)
    onClose()
  }

  return (
      <div className="px-5 pb-4 pt-1" data-testid="add-match-modal">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-tint">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand text-on-brand">
            <Calendar className="h-2.5 w-2.5" strokeWidth={3} />
          </span>
          Calendrier
        </div>
        <h2
          className="mt-3 font-serif italic font-extrabold leading-[1.05] text-fg [text-wrap:balance]"
          style={{ fontSize: 28, letterSpacing: '-0.5px' }}
        >
          Ajouter un match
        </h2>
        <p className="mt-2 text-[13px] font-semibold leading-snug text-fg-secondary">
          Date, coup d&apos;envoi, adversaire et lieu — comme sur la vue mois.
        </p>

        <div className="mt-5 space-y-5">
          <div>
            <label className="text-xs font-black text-fg-muted uppercase tracking-wide mb-2 block">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-border-app bg-layer-5 rounded-2xl px-4 py-3 text-sm font-bold text-fg focus:outline-none focus:border-brand rf-focus-ring"
            />
          </div>

          <div>
            <label className="text-xs font-black text-fg-muted uppercase tracking-wide mb-2 block">
              Coup d&apos;envoi
            </label>
            <input
              type="time"
              value={kickoffTime}
              onChange={(e) => setKickoffTime(e.target.value)}
              className="w-full border border-border-app bg-layer-5 rounded-2xl px-4 py-3 text-sm font-bold text-fg focus:outline-none focus:border-brand rf-focus-ring"
            />
          </div>

          <div>
            <label className="text-xs font-black text-fg-muted uppercase tracking-wide mb-2 block">
              Adversaire (optionnel)
            </label>
            <ClubSearchInput value={opponent} clubCode={opponentCode} onChange={handleOpponentChange} />
          </div>

          <div>
            <label className="text-xs font-black text-fg-muted uppercase tracking-wide mb-2 block">
              Lieu
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: 'home' as const, label: 'Domicile', icon: Home },
                  { value: 'away' as const, label: 'Extérieur', icon: MapPin },
                  { value: 'neutral' as const, label: 'Neutre', icon: Flag },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setVenueKind(value)}
                  className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border-2 transition-all ${
                    venueKind === value
                      ? 'border-brand text-brand-tint bg-brand-soft'
                      : 'border-border-app text-fg-muted hover:border-layer-15'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-fg-muted uppercase tracking-wide mb-2 block">
              Stade / Ville (optionnel)
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Ex: Stade Marcel Michelin"
              className="w-full border border-border-app bg-layer-5 rounded-2xl px-4 py-3 text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-brand rf-focus-ring"
            />
          </div>

          {confirmDuplicate && duplicateFFR && (
            <div className="p-3 rounded-2xl border border-warn-bd-strong bg-warn-bg-muted space-y-2">
              <p className="text-xs text-warn-strong font-bold">
                Un match similaire existe déjà (import FFR)
              </p>
              <p className="text-[11px] text-fg-soft">
                vs {duplicateFFR.opponent} — {formatDateFR(duplicateFFR.date)}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            data-testid="add-match-save"
            className="w-full py-4 rounded-2xl disabled:opacity-50 bg-brand hover:bg-brand-hover text-on-brand font-black uppercase italic tracking-wide transition-colors shadow-lg shadow-brand-glow rf-focus-ring"
          >
            {confirmDuplicate ? "Confirmer l'ajout" : saving ? 'Enregistrement…' : 'Enregistrer le match'}
          </button>
        </div>
      </div>
  )
}

/**
 * Ajout de match manuel — même coque {@link BottomSheet} que fin de séance /
 * évolution programme (handle, swipe, fond, safe-area).
 */
export function AddMatchModal({
  open,
  todayISO,
  initialDate,
  existingEvents,
  onClose,
  onSave,
}: AddMatchModalProps) {
  const formKey = `${initialDate ?? ''}:${todayISO}`

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabel="Ajouter un match"
      hideDefaultHeader
      disableSwipeDismiss={false}
      disableBackdropDismiss={false}
      showClose
    >
      {open ? (
        <AddMatchForm
          key={formKey}
          todayISO={todayISO}
          initialDate={initialDate}
          existingEvents={existingEvents}
          onClose={onClose}
          onSave={onSave}
        />
      ) : null}
    </BottomSheet>
  )
}
