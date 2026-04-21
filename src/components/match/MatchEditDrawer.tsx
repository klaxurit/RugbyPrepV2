import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Flag, Home, MapPin, Trash2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import type { CalendarEvent } from '../../types/training'
import { ClubAvatar } from './ClubAvatar'
import { formatDateFR } from './matchDate'
import { useCalendar } from '../../hooks/useCalendar'

interface MatchEditDrawerProps {
  event: CalendarEvent | null
  onClose: () => void
}

/**
 * Bottom-sheet d'édition d'un match — remplace la section "Day detail" de
 * l'ancienne page `/calendar`. Actions : toggle terrain neutre, masquer un
 * match FFR, ajuster la charge (RPE + durée) pour un match passé, supprimer
 * un match ajouté manuellement.
 *
 * Consomme `useCalendar` directement — la page hôte n'a rien à plomber.
 */
export function MatchEditDrawer({ event, onClose }: MatchEditDrawerProps) {
  const {
    setMatchNeutral,
    hideImportedEvent,
    unhideImportedEvent,
    updateMatchLoad,
    removeEvent,
  } = useCalendar()

  const [rpeInput, setRpeInput] = useState<number>(event?.rpe ?? 7)
  const [durationInput, setDurationInput] = useState<number>(event?.duration_min ?? 80)
  const [saving, setSaving] = useState(false)
  const [savedRecently, setSavedRecently] = useState(false)

  useEffect(() => {
    if (event) {
      setRpeInput(event.rpe ?? 7)
      setDurationInput(event.duration_min ?? 80)
      setSavedRecently(false)
    }
  }, [event])

  if (!event || event.type !== 'match') return null

  const isFFR = event.source === 'ffr_import'
  const isHidden = event.user_hidden === true
  const daysDiff = Math.round(
    (new Date(event.date + 'T12:00:00').getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000,
  )
  const isPast = daysDiff < 0

  const handleToggleNeutral = async () => {
    await setMatchNeutral(event.id, !event.is_neutral)
  }

  const handleToggleHidden = async () => {
    if (isHidden) await unhideImportedEvent(event.id)
    else await hideImportedEvent(event.id)
  }

  const handleSaveLoad = async () => {
    setSaving(true)
    try {
      await updateMatchLoad(event.id, rpeInput, durationInput)
      setSavedRecently(true)
      window.setTimeout(() => setSavedRecently(false), 1500)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    await removeEvent(event.id)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          key="sheet"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label={`Édition du match${event.opponent ? ` vs ${event.opponent}` : ''}`}
          className="w-full max-w-md bg-app border border-border-app rounded-[2rem] p-6 space-y-5"
          data-testid="match-edit-drawer"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <ClubAvatar code={event.opponent_code} name={event.opponent} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-fg truncate">
                  Match{event.opponent ? ` vs ${event.opponent}` : ''}
                </p>
                <p className="text-xs text-fg-muted capitalize mt-0.5">
                  {formatDateFR(event.date)}
                  {event.kickoff_time ? ` · ${event.kickoff_time}` : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="w-9 h-9 rounded-2xl border border-border-app flex items-center justify-center text-fg-muted hover:text-fg hover:border-layer-15 rf-focus-ring flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Lieu */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-fg-muted">Lieu</p>
            <button
              type="button"
              onClick={handleToggleNeutral}
              data-testid="drawer-toggle-neutral"
              className={`w-full flex items-center justify-between rounded-2xl border-2 px-4 py-3 transition-colors rf-focus-ring ${
                event.is_neutral
                  ? 'bg-brand-soft border-brand-border text-brand-tint'
                  : 'bg-layer-5 border-border-app text-fg hover:border-brand-border'
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-bold">
                {event.is_neutral ? (
                  <>
                    <Flag className="w-4 h-4" />
                    Terrain neutre
                  </>
                ) : event.is_home ? (
                  <>
                    <Home className="w-4 h-4" />
                    Domicile
                  </>
                ) : event.is_home === false ? (
                  <>
                    <MapPin className="w-4 h-4" />
                    Extérieur
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    Lieu non précisé
                  </>
                )}
              </span>
              <span className="text-[10px] font-bold text-fg-muted">
                {event.is_neutral ? 'Toucher pour revenir' : 'Toucher pour marquer neutre'}
              </span>
            </button>
          </div>

          {/* Charge (passé uniquement) */}
          {isPast && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-fg-muted">Charge du match</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 block">
                  <span className="text-[10px] font-bold text-fg-muted">RPE (1-10)</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={rpeInput}
                    onChange={(e) => setRpeInput(Number(e.target.value))}
                    className="w-full h-12 rounded-2xl border border-border-app bg-layer-5 px-3 text-lg font-black text-fg focus:outline-none focus:border-brand rf-focus-ring"
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-[10px] font-bold text-fg-muted">Durée (min)</span>
                  <input
                    type="number"
                    min={10}
                    max={240}
                    value={durationInput}
                    onChange={(e) => setDurationInput(Number(e.target.value))}
                    className="w-full h-12 rounded-2xl border border-border-app bg-layer-5 px-3 text-lg font-black text-fg focus:outline-none focus:border-brand rf-focus-ring"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={handleSaveLoad}
                disabled={saving}
                data-testid="drawer-save-load"
                className="w-full py-3 rounded-2xl bg-brand text-on-brand text-sm font-bold hover:bg-brand-hover disabled:opacity-50 transition-colors rf-focus-ring flex items-center justify-center gap-2"
              >
                {savedRecently ? <CheckCircle2 className="w-4 h-4" /> : null}
                {savedRecently ? 'Charge enregistrée' : saving ? 'Enregistrement…' : 'Enregistrer la charge'}
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2 border-t border-border-app">
            {isFFR ? (
              <button
                type="button"
                onClick={handleToggleHidden}
                data-testid="drawer-toggle-hidden"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-border-app text-sm font-bold text-fg-soft hover:border-brand-border hover:text-brand-tint transition-colors rf-focus-ring"
              >
                {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {isHidden ? 'Afficher ce match' : 'Masquer ce match'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRemove}
                data-testid="drawer-remove"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-danger-bd text-sm font-bold text-danger hover:bg-danger-bg transition-colors rf-focus-ring"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer ce match
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
