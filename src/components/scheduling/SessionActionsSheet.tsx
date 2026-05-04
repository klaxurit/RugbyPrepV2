import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, CalendarOff, ChevronRight, SkipForward, X } from 'lucide-react'
import type { DayOfWeek } from '../../types/scheduling'

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const DAY_ORDER: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0]

export interface SessionActionsSheetProps {
  /** Open/close state — driven by the parent. */
  open: boolean
  onClose: () => void
  /** Session title shown in the sheet header for context. */
  sessionTitle: string
  /** The day this session is currently scheduled on (excluded from picker). */
  currentDay: DayOfWeek
  /** Days the user has marked unavailable (excluded from reschedule picker). */
  unavailableDays: DayOfWeek[]
  /** Action callbacks — wired by the parent. */
  onReschedule?: (toDay: DayOfWeek) => void
  onSkip?: () => void
  onMarkDayUnavailable?: () => void
}

type SheetView = 'menu' | 'reschedule' | 'skip-confirm' | 'unavailable-confirm'

/**
 * Bottom sheet d'actions secondaires sur une séance — pattern mobile
 * standard (Hevy/Strong/Caliber). Remplace les anciens boutons icônes
 * collés à la card session : un seul kebab à droite ouvre ce sheet,
 * et les 3 actions (Replanifier / Passer / Indispo) sont affichées en
 * gros boutons faciles à toucher.
 *
 * Structure :
 *   - Vue `menu` : 3 grandes lignes d'action.
 *   - Vue `reschedule` : picker des jours dispos en grille.
 *   - Vue `skip-confirm` / `unavailable-confirm` : confirmation rouge/jaune.
 *
 * Dismiss : tap sur le backdrop, bouton X header, ou swipe-down (drag
 * gesture sur la handle).
 */
export function SessionActionsSheet({
  open,
  onClose,
  sessionTitle,
  currentDay,
  unavailableDays,
  onReschedule,
  onSkip,
  onMarkDayUnavailable,
}: SessionActionsSheetProps) {
  const [view, setView] = useState<SheetView>('menu')

  const closeAndReset = () => {
    setView('menu')
    onClose()
  }

  const eligibleRescheduleDays = (DAY_ORDER as DayOfWeek[]).filter(
    (d) => d !== currentDay && !unavailableDays.includes(d),
  )

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop : tap à l'extérieur dismiss. */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeAndReset}
            aria-hidden
            className="fixed inset-0 z-[55] bg-black/40"
          />

          {/* Sheet panel. */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) closeAndReset()
            }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            role="dialog"
            aria-modal="true"
            aria-label={`Actions pour ${sessionTitle}`}
            className="fixed bottom-0 left-0 right-0 z-[60] mx-auto max-w-md rounded-t-3xl border-t border-x border-border-app bg-panel pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 shadow-elevated"
          >
            {/* Drag handle. */}
            <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-layer-15" />

            {/* Header. */}
            <div className="flex items-center gap-2 px-4 pb-2">
              {view !== 'menu' && (
                <button
                  type="button"
                  onClick={() => setView('menu')}
                  aria-label="Retour"
                  className="rounded-xl p-2 text-fg-muted hover:bg-layer-7 rf-focus-ring"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-fg-muted leading-none">
                  {view === 'menu'
                    ? 'Actions'
                    : view === 'reschedule'
                      ? 'Replanifier'
                      : view === 'skip-confirm'
                        ? 'Passer la séance'
                        : 'Indisponible'}
                </p>
                <p className="mt-1 truncate text-sm font-black text-fg leading-tight">
                  {sessionTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAndReset}
                aria-label="Fermer"
                className="rounded-xl p-2 text-fg-muted hover:bg-layer-7 rf-focus-ring"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content. */}
            <div className="px-4 pb-3">
              {view === 'menu' && (
                <div className="space-y-1.5">
                  {onReschedule && (
                    <ActionRow
                      icon={<ArrowRight className="h-5 w-5" strokeWidth={2.25} />}
                      label="Replanifier"
                      hint="Déplacer cette séance sur un autre jour de la semaine."
                      onClick={() => setView('reschedule')}
                      data-testid="sheet-action-reschedule"
                    />
                  )}
                  {onSkip && (
                    <ActionRow
                      icon={<SkipForward className="h-5 w-5" strokeWidth={2.25} />}
                      label="Passer"
                      hint="Marquer la séance comme non faite, sans rattrapage."
                      onClick={() => setView('skip-confirm')}
                      data-testid="sheet-action-skip"
                    />
                  )}
                  {onMarkDayUnavailable && (
                    <ActionRow
                      icon={<CalendarOff className="h-5 w-5" strokeWidth={2.25} />}
                      label="Marquer ce jour indisponible"
                      hint="Toutes les séances du jour seront retirées."
                      onClick={() => setView('unavailable-confirm')}
                      data-testid="sheet-action-unavailable"
                    />
                  )}
                </div>
              )}

              {view === 'reschedule' && onReschedule && (
                <>
                  <p className="mb-3 text-xs text-fg-muted">
                    Choisis un autre jour. Les jours marqués indisponibles ne sont pas listés.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {eligibleRescheduleDays.length === 0 ? (
                      <p className="col-span-3 text-xs text-fg-muted text-center py-4">
                        Aucun jour disponible cette semaine.
                      </p>
                    ) : (
                      eligibleRescheduleDays.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            onReschedule(d)
                            closeAndReset()
                          }}
                          className="rounded-xl border border-border-app bg-layer-5 py-3 text-sm font-bold text-fg hover:border-brand-border-strong hover:bg-brand-soft hover:text-brand-tint transition-colors rf-focus-ring"
                          data-testid={`sheet-reschedule-day-${d}`}
                        >
                          {DAY_LABELS[d]}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}

              {view === 'skip-confirm' && onSkip && (
                <>
                  <p className="mb-4 text-sm text-fg-muted">
                    Cette séance ne sera pas rattrapée. Tu pourras la dé-passer
                    via l'historique si tu changes d'avis.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setView('menu')}
                      data-testid="sheet-skip-cancel"
                      className="flex-1 rounded-xl border border-border-app bg-layer-5 py-3 text-sm font-bold text-fg-muted hover:bg-layer-7 transition-colors rf-focus-ring"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSkip()
                        closeAndReset()
                      }}
                      data-testid="sheet-skip-confirm"
                      className="flex-1 rounded-xl bg-danger-bg-cta py-3 text-sm font-black text-danger-soft hover:bg-danger-bg-hover transition-colors rf-focus-ring"
                    >
                      Confirmer
                    </button>
                  </div>
                </>
              )}

              {view === 'unavailable-confirm' && onMarkDayUnavailable && (
                <>
                  <p className="mb-4 text-sm text-fg-muted">
                    Toutes les séances de ce jour seront retirées de la
                    semaine. Le moteur tentera de les replanifier sur les jours
                    restants quand c'est possible.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setView('menu')}
                      data-testid="sheet-unavailable-cancel"
                      className="flex-1 rounded-xl border border-border-app bg-layer-5 py-3 text-sm font-bold text-fg-muted hover:bg-layer-7 transition-colors rf-focus-ring"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onMarkDayUnavailable()
                        closeAndReset()
                      }}
                      data-testid="sheet-unavailable-confirm"
                      className="flex-1 rounded-xl bg-warn-bg-strong py-3 text-sm font-black text-warn hover:bg-warn-bg transition-colors rf-focus-ring"
                    >
                      Confirmer
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function ActionRow({
  icon,
  label,
  hint,
  onClick,
  'data-testid': dataTestId,
}: {
  icon: React.ReactNode
  label: string
  hint: string
  onClick: () => void
  'data-testid'?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={dataTestId}
      className="flex w-full items-center gap-3 rounded-2xl border border-border-app bg-layer-5 px-3 py-3 text-left transition-colors hover:bg-layer-7 hover:border-brand-border-strong rf-focus-ring"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-layer-10 text-fg-secondary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-fg leading-tight">{label}</span>
        <span className="mt-0.5 block text-[11px] text-fg-muted leading-snug">
          {hint}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-fg-faint" />
    </button>
  )
}
