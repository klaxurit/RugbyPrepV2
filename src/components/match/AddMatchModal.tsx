import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Home, MapPin, Flag } from 'lucide-react'
import type { CalendarEvent } from '../../types/training'
import { ClubSearchInput } from './ClubSearchInput'
import { diffDays, formatDateFR } from './matchDate'

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

interface AddMatchModalProps {
  initialDate?: string
  existingEvents?: CalendarEvent[]
  onClose: () => void
  onSave: (payload: Omit<CalendarEvent, 'id' | 'created_at'>) => Promise<void>
}

/**
 * Modal focalisé sur l'ajout de match manuel — extrait de l'ancien
 * AddEventModal de /calendar. Pas de support pour rest/unavailable (si besoin
 * remonte plus tard, on réintroduira un sélecteur de type).
 */
export function AddMatchModal({ initialDate, existingEvents, onClose, onSave }: AddMatchModalProps) {
  const [date, setDate] = useState(initialDate ?? toDateStr(new Date()))
  const [kickoffTime, setKickoffTime] = useState('15:00')
  const [opponent, setOpponent] = useState('')
  const [opponentCode, setOpponentCode] = useState<string | undefined>()
  const [venueKind, setVenueKind] = useState<'home' | 'away' | 'neutral' | undefined>(undefined)
  const [venue, setVenue] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDuplicate, setConfirmDuplicate] = useState(false)

  const handleOpponentChange = (name: string, code?: string) => {
    setOpponent(name)
    setOpponentCode(code)
  }

  const duplicateFFR = useMemo(() => {
    if (!existingEvents || !opponentCode) return null
    return existingEvents.find((e) =>
      e.source === 'ffr_import' &&
      e.type === 'match' &&
      Math.abs(diffDays(e.date) - diffDays(date)) <= 1 &&
      e.opponent_code === opponentCode,
    ) ?? null
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
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Ajouter un match"
        className="w-full max-w-md bg-app border border-border-app rounded-[2rem] p-6 space-y-5"
        data-testid="add-match-modal"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-fg">Ajouter un match</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-9 h-9 rounded-2xl border border-border-app flex items-center justify-center text-fg-muted hover:text-fg hover:border-layer-15 rf-focus-ring"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-xs font-black text-fg-muted uppercase tracking-wide mb-2 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-border-app bg-layer-5 rounded-2xl px-4 py-3 text-sm font-bold text-fg focus:outline-none focus:border-brand rf-focus-ring"
          />
        </div>

        <div>
          <label className="text-xs font-black text-fg-muted uppercase tracking-wide mb-2 block">Coup d'envoi</label>
          <input
            type="time"
            value={kickoffTime}
            onChange={(e) => setKickoffTime(e.target.value)}
            className="w-full border border-border-app bg-layer-5 rounded-2xl px-4 py-3 text-sm font-bold text-fg focus:outline-none focus:border-brand rf-focus-ring"
          />
        </div>

        <div>
          <label className="text-xs font-black text-fg-muted uppercase tracking-wide mb-2 block">Adversaire (optionnel)</label>
          <ClubSearchInput value={opponent} clubCode={opponentCode} onChange={handleOpponentChange} />
        </div>

        <div>
          <label className="text-xs font-black text-fg-muted uppercase tracking-wide mb-2 block">Lieu</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'home' as const, label: 'Domicile', icon: Home },
              { value: 'away' as const, label: 'Extérieur', icon: MapPin },
              { value: 'neutral' as const, label: 'Neutre', icon: Flag },
            ]).map(({ value, label, icon: Icon }) => (
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
          <label className="text-xs font-black text-fg-muted uppercase tracking-wide mb-2 block">Stade / Ville (optionnel)</label>
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
            <p className="text-xs text-warn-strong font-bold">Un match similaire existe déjà (import FFR)</p>
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
          className="w-full py-4 rounded-2xl disabled:opacity-50 bg-brand hover:bg-brand-hover text-on-brand font-black uppercase tracking-wide transition-colors rf-focus-ring"
        >
          {confirmDuplicate ? 'Confirmer l\'ajout' : saving ? 'Enregistrement…' : 'Enregistrer le match'}
        </button>
      </motion.div>
    </div>
  )
}
